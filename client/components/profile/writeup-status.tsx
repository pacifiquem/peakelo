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
      <section className="border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">Writing you up.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          I’m reading your games. The writeup shows up here when it’s ready.
        </p>
      </section>
    );
  }

  if (writeup.status === 'failed') {
    return (
      <section className="border-2 border-t-4 border-ink border-t-gold bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Writeup</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">The writeup didn’t finish.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          {coachFailure(writeup.error)}
        </p>
        <Button.Root type="button" className="mt-4 w-fit" disabled={busy} onClick={onGenerate}>
          Try again
        </Button.Root>
      </section>
    );
  }

  return (
    <section className="border-2 border-t-4 border-ink border-t-magenta bg-bg-white-0 p-5 shadow-regular-xs">
      <p className="font-mono text-sm text-text-sub-600">Writeup</p>
      <h2 className="mt-2 font-display text-xl font-extrabold">I haven’t written you up yet.</h2>
      <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
        This is the letter about your games. Every claim is tied to something you played.
      </p>
      <Button.Root type="button" className="mt-4 w-fit" disabled={busy} onClick={onGenerate}>
        Write my profile
      </Button.Root>
    </section>
  );
}

function coachFailure(error: string | null) {
  if (!error || /snapshot|costume|document was removed/i.test(error)) {
    return 'The last writeup was cleared. I can write it again from your games.';
  }
  return error;
}
