"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortAccessor?: (row: T) => string | number | null | undefined;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyTitle: string;
  emptyDescription?: string;
  pageSize?: number;
}

type SortState = { index: number; dir: "asc" | "desc" } | null;

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  isLoading,
  isError,
  errorMessage = "Failed to load data.",
  emptyTitle,
  emptyDescription,
  pageSize = 8,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const accessor = columns[sort.index]?.sortAccessor;
    if (!accessor) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      const an = av ?? "";
      const bn = bv ?? "";
      if (an < bn) return sort.dir === "asc" ? -1 : 1;
      if (an > bn) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  // Keep the current page in range when the filtered set shrinks.
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const pageRows = sortedRows.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(index: number) {
    setPage(0);
    setSort((prev) => {
      if (!prev || prev.index !== index) return { index, dir: "asc" };
      if (prev.dir === "asc") return { index, dir: "desc" };
      return null;
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-surface p-6 text-sm font-medium text-error shadow-sm">
        {errorMessage}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-surface shadow-sm">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-grey-200">
              {columns.map((col, i) => {
                const sortable = !!col.sortAccessor;
                const active = sort?.index === i;
                return (
                  <th
                    key={i}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-grey-500",
                      col.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(i)}
                        className="inline-flex items-center gap-1 hover:text-on-surface"
                      >
                        {col.header}
                        {!active && <ChevronsUpDown size={13} aria-hidden="true" />}
                        {active && sort?.dir === "asc" && <ChevronUp size={13} aria-hidden="true" />}
                        {active && sort?.dir === "desc" && <ChevronDown size={13} aria-hidden="true" />}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={getRowId(row)} className="border-b border-grey-100 last:border-0 hover:bg-grey-50">
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-4 py-3 align-middle text-on-surface", col.cellClassName)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageRows.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-grey-500">No results match your search.</p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-grey-200 px-4 py-3">
        <p className="text-xs text-grey-500">
          {sortedRows.length} {sortedRows.length === 1 ? "record" : "records"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-grey-300 text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-40"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="text-xs text-grey-500">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-grey-300 text-grey-500 transition-colors hover:bg-grey-100 disabled:opacity-40"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
