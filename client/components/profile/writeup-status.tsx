import * as Button from '@/components/ui/button';
import type { PublicWriteup } from '@peakelo/shared';

export function WriteupStatus({
  writeup,
  busy,
  onGenerate,
}: {
  writeup: PublicWriteup;
  busy: boolean;
  onGenerate: () => void;
}) {
  if (writeup.status === 'queued' || writeup.status === 'running') {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">Writing who you are.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          The coach is reading your games. This stays honest until the document is ready.
        </p>
      </section>
    );
  }

  if (writeup.status === 'failed') {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">The writeup failed.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          {writeup.error ?? 'The coach could not finish the document.'}
        </p>
        <Button.Root type="button" className="mt-4 w-fit" disabled={busy} onClick={onGenerate}>
          Try again
        </Button.Root>
      </section>
    );
  }

  return (
    <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
      <p className="font-mono text-sm text-text-sub-600">Writeup</p>
      <h2 className="mt-2 font-display text-xl font-extrabold">The writeup is not written yet.</h2>
      <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
        The coach document is the voice — every claim tied to your games, in human language.
      </p>
      <Button.Root type="button" className="mt-4 w-fit" disabled={busy} onClick={onGenerate}>
        Write my profile
      </Button.Root>
    </section>
  );
}
