import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { PositionEval } from '@peakelo/engine/pass';
import { parseBestmove, parseUciInfoLine, sideToMove, whitePositiveScore } from './uci';

const EVAL_TIMEOUT_MS = 15_000;
const INIT_TIMEOUT_MS = 5_000;

export type EngineAdapter = {
  evaluate(fen: string): Promise<PositionEval>;
  close(): Promise<void>;
};

export function createFakeAdapter(script: (fen: string) => PositionEval): EngineAdapter {
  return {
    async evaluate(fen: string): Promise<PositionEval> {
      return script(fen);
    },
    async close(): Promise<void> {
      return undefined;
    },
  };
}

export function createStockfishAdapter(opts: {
  path: string;
  depth: number;
  threads: number;
  multiPv: number;
}): EngineAdapter {
  let child: ChildProcessWithoutNullStreams | null = null;
  let started = false;
  let closed = false;
  let lineHandler: ((line: string) => void) | null = null;
  let processError: ((error: Error) => void) | null = null;
  let queue: Promise<void> = Promise.resolve();

  function attachChild(next: ChildProcessWithoutNullStreams): void {
    let stdoutBuf = '';
    next.stdout.setEncoding('utf8');
    next.stdout.on('data', (chunk: string) => {
      stdoutBuf += chunk;
      let newline = stdoutBuf.indexOf('\n');
      while (newline >= 0) {
        const line = stdoutBuf.slice(0, newline).replace(/\r$/, '');
        stdoutBuf = stdoutBuf.slice(newline + 1);
        if (line.length > 0) lineHandler?.(line);
        newline = stdoutBuf.indexOf('\n');
      }
    });
    next.on('error', (error) => {
      const wrapped = error instanceof Error ? error : new Error(String(error));
      processError?.(wrapped);
    });
    next.on('exit', (code, signal) => {
      if (child === next) {
        child = null;
        started = false;
      }
      if (!closed) {
        processError?.(
          new Error(`Stockfish exited unexpectedly (code=${code ?? 'null'} signal=${signal ?? 'null'})`),
        );
      }
    });
  }

  function send(command: string): void {
    if (!child || child.killed || child.exitCode !== null) {
      throw new Error('Stockfish process is not running');
    }
    child.stdin.write(`${command}\n`);
  }

  function waitForLine(predicate: (line: string) => boolean, timeoutMs: number, label: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        lineHandler = null;
        processError = null;
        reject(new Error(`Stockfish timed out waiting for ${label}`));
      }, timeoutMs);
      const finish = (fn: () => void) => {
        clearTimeout(timer);
        lineHandler = null;
        processError = null;
        fn();
      };
      processError = (error) => finish(() => reject(error));
      lineHandler = (line) => {
        if (predicate(line)) finish(() => resolve(line));
      };
    });
  }

  async function killChild(): Promise<void> {
    const current = child;
    child = null;
    started = false;
    lineHandler = null;
    processError = null;
    if (!current || current.killed || current.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        current.kill('SIGKILL');
        resolve();
      }, 1000);
      current.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      try {
        current.stdin.write('quit\n');
      } catch {
        current.kill('SIGKILL');
      }
    });
  }

  async function ensureStarted(): Promise<void> {
    if (started && child) return;
    await killChild();
    const launch = opts.path.endsWith('.js')
      ? { command: process.execPath, args: [opts.path] }
      : { command: opts.path, args: [] as string[] };
    const next = spawn(launch.command, launch.args, { stdio: ['pipe', 'pipe', 'pipe'] });
    child = next;
    attachChild(next);
    const uciok = waitForLine((line) => line === 'uciok', INIT_TIMEOUT_MS, 'uciok');
    send('uci');
    await uciok;
    send(`setoption name Threads value ${opts.threads}`);
    send(`setoption name MultiPV value ${opts.multiPv}`);
    const ready = waitForLine((line) => line === 'readyok', INIT_TIMEOUT_MS, 'readyok');
    send('isready');
    await ready;
    started = true;
  }

  async function evaluateOnce(fen: string): Promise<PositionEval> {
    if (closed) throw new Error('Engine adapter is closed');
    await ensureStarted();
    send('ucinewgame');
    const ready = waitForLine((line) => line === 'readyok', INIT_TIMEOUT_MS, 'readyok');
    send('isready');
    await ready;
    const infos = new Map<number, NonNullable<ReturnType<typeof parseUciInfoLine>>>();
    const done = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        lineHandler = null;
        processError = null;
        void killChild().finally(() => {
          reject(new Error('Stockfish evaluation timed out'));
        });
      }, EVAL_TIMEOUT_MS);
      const finish = (fn: () => void) => {
        clearTimeout(timer);
        lineHandler = null;
        processError = null;
        fn();
      };
      processError = (error) => finish(() => reject(error));
      lineHandler = (line) => {
        const info = parseUciInfoLine(line);
        if (info) infos.set(info.multipv, info);
        const best = parseBestmove(line);
        if (best) finish(() => resolve(best));
      };
    });
    send(`position fen ${fen}`);
    send(`go depth ${opts.depth}`);
    const bestmove = await done;
    const side = sideToMove(fen);
    const lines = [...infos.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, info]) => ({
        uci: info.pvUci[0] ?? '',
        score: whitePositiveScore(info.score, side),
        pvUci: info.pvUci,
      }))
      .filter((line) => line.uci.length > 0);
    if (lines.length === 0 || bestmove === '(none)') {
      const fallback = infos.get(1);
      const score = fallback
        ? whitePositiveScore(fallback.score, side)
        : { kind: 'cp' as const, value: 0 };
      return {
        lines: [{ uci: bestmove === '(none)' ? '(none)' : (bestmove ?? '(none)'), score, pvUci: [] }],
      };
    }
    return { lines };
  }

  function evaluate(fen: string): Promise<PositionEval> {
    const run = queue.then(() => evaluateOnce(fen));
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function close(): Promise<void> {
    closed = true;
    await queue.catch(() => undefined);
    await killChild();
  }

  return { evaluate, close };
}
