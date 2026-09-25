import * as Button from '@/components/ui/button';

export function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-3">
      <Button.Root
        type="button"
        variant="neutral"
        mode="stroke"
        size="small"
        className="w-fit"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button.Root>
      <span className="font-mono text-sm">
        {page} / {totalPages}
      </span>
      <Button.Root
        type="button"
        variant="neutral"
        mode="stroke"
        size="small"
        className="w-fit"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button.Root>
    </div>
  );
}
