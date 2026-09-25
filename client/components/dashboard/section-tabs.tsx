import * as Button from '@/components/ui/button';

export type SectionTab = {
  id: string;
  label: string;
};

export function SectionTabs({
  label,
  sections,
  value,
  onChange,
}: {
  label: string;
  sections: readonly SectionTab[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {sections.map((section) => {
        const selected = section.id === value;
        return (
          <Button.Root
            key={section.id}
            type="button"
            role="tab"
            aria-selected={selected}
            size="small"
            variant={selected ? 'primary' : 'neutral'}
            mode={selected ? 'filled' : 'stroke'}
            className="w-fit"
            onClick={() => onChange(section.id)}
          >
            {section.label}
          </Button.Root>
        );
      })}
    </div>
  );
}
