import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function hrefFor(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function PaginationBar({
  page,
  pageCount,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border/80 px-1 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs tabular-nums text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled className="gap-1">
            <ChevronLeft className="size-3.5" /> Previous
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link href={hrefFor(basePath, params, page - 1)} rel="prev">
              <ChevronLeft className="size-3.5" /> Previous
            </Link>
          </Button>
        )}
        <span className="px-1 text-xs tabular-nums text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        {page >= pageCount ? (
          <Button variant="outline" size="sm" disabled className="gap-1">
            Next <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link href={hrefFor(basePath, params, page + 1)} rel="next">
              Next <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
