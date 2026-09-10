import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join } from 'node:path';

export type StockfishLaunch = {
  command: string;
  args: string[];
  source: 'env' | 'npm' | 'path';
};

export function resolveStockfishLaunch(preferredPath?: string): StockfishLaunch {
  const fromEnv = preferredPath?.trim();
  if (fromEnv && fromEnv !== 'stockfish') {
    const resolved = resolveExecutable(fromEnv);
    if (resolved) return toLaunch(resolved, 'env');
  }

  const onPath = resolveOnPath('stockfish');
  if (onPath) return toLaunch(onPath, 'path');

  const npmEngine = resolveNpmStockfish();
  if (npmEngine) return toLaunch(npmEngine, 'npm');

  return { command: fromEnv && fromEnv.length > 0 ? fromEnv : 'stockfish', args: [], source: 'path' };
}

function toLaunch(file: string, source: StockfishLaunch['source']): StockfishLaunch {
  if (file.endsWith('.js')) {
    return { command: process.execPath, args: [file], source };
  }
  return { command: file, args: [], source };
}

function resolveNpmStockfish(): string | null {
  const bases = [process.cwd(), join(process.cwd(), 'server')];
  for (const base of bases) {
    try {
      const req = createRequire(join(base, 'package.json'));
      const pkg = req.resolve('stockfish/package.json');
      const root = dirname(pkg);
      const candidates = [
        join(root, 'bin', 'stockfish-18-lite-single.js'),
        join(root, 'bin', 'stockfish-lite-single.js'),
        join(root, 'bin', 'stockfish.js'),
        join(root, 'src', 'stockfish.js'),
      ];
      const found = candidates.find((path) => existsSync(path));
      if (found) return found;
    } catch {
      continue;
    }
  }
  return null;
}

function resolveExecutable(value: string): string | null {
  if (isAbsolute(value) || value.startsWith('.')) {
    return existsSync(value) ? value : null;
  }
  return resolveOnPath(value);
}

function resolveOnPath(binary: string): string | null {
  const dirs = (process.env.PATH ?? '').split(delimiter);
  const names = process.platform === 'win32' ? [binary, `${binary}.exe`] : [binary];
  for (const dir of dirs) {
    for (const name of names) {
      const candidate = join(dir, name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
