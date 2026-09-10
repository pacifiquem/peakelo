export function PlannedList({
  adr,
  items,
}: {
  adr: string;
  items: { title: string; detail: string }[];
}) {
  return (
    <section className="border-2 border-ink bg-bg-white-0 shadow-regular-xs">
      <header className="border-b-2 border-ink bg-bg-weak-50 px-4 py-2">
        <p className="font-mono text-sm font-medium text-text-strong-950">
          Planned for this page · {adr}
        </p>
      </header>
      <ol className="divide-y-2 divide-ink">
        {items.map((item, index) => (
          <li
            key={item.title}
            className="grid gap-1 px-4 py-3 odd:bg-bg-white-0 even:bg-bg-weak-50 md:grid-cols-[2rem_10rem_1fr] md:items-baseline"
          >
            <span className="font-mono text-sm font-medium text-text-strong-950">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-display text-sm font-bold">{item.title}</span>
            <span className="text-sm leading-6 text-text-strong-950">{item.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
