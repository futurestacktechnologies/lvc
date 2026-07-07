"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";

import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminDataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headClassName?: string;
};

type BulkDeleteConfig = {
  actionUrl: string;
  hiddenFieldName?: string;
  title?: string;
  description?: (selectedCount: number) => string;
  confirmLabel?: string;
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
};

type AdminDataTableProps<T extends { id: string }> = {
  rows: T[];
  columns: AdminDataTableColumn<T>[];

  totalRows: number;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];

  controls?: React.ReactNode;

  emptyTitle?: string;
  emptyDescription?: string;

  enableSelection?: boolean;
  bulkDelete?: BulkDeleteConfig;

  actionsHeader?: string;
  renderActions?: (row: T, isSelected: boolean) => React.ReactNode;
};

export default function AdminDataTable<T extends { id: string }>({
  rows,
  columns,
  totalRows,
  currentPage,
  pageSize,
  pageSizeOptions = [5, 10, 20],
  controls,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters.",
  enableSelection = false,
  bulkDelete,
  actionsHeader = "Actions",
  renderActions,
}: AdminDataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1);
  const visibleRowIds = useMemo(() => rows.map((row) => row.id), [rows]);

  const visibleRowIdSet = useMemo(
    () => new Set(visibleRowIds),
    [visibleRowIds],
  );

  const selectedVisibleIds = useMemo(
    () => selectedIds.filter((id) => visibleRowIdSet.has(id)),
    [selectedIds, visibleRowIdSet],
  );

  const allVisibleSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every((id) => selectedVisibleIds.includes(id));

  const selectedCount = selectedVisibleIds.length;

  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalRows);

  function buildPageUrl(page: number, size = pageSize) {
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    if (size === pageSizeOptions[0]) {
      params.delete("pageSize");
    } else {
      params.set("pageSize", String(size));
    }

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function goToPage(page: number) {
    router.push(buildPageUrl(page), {
      scroll: false,
    });
  }

  function changePageSize(size: number) {
    router.push(buildPageUrl(1, size), {
      scroll: false,
    });
  }

  function toggleRow(rowId: string) {
    setSelectedIds((currentSelectedIds) => {
      if (currentSelectedIds.includes(rowId)) {
        return currentSelectedIds.filter((id) => id !== rowId);
      }

      return [...currentSelectedIds, rowId];
    });
  }

  function toggleAllVisibleRows() {
    setSelectedIds((currentSelectedIds) => {
      if (allVisibleSelected) {
        return currentSelectedIds.filter((id) => !visibleRowIdSet.has(id));
      }

      return Array.from(new Set([...currentSelectedIds, ...visibleRowIds]));
    });
  }
  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        {enableSelection && selectedCount > 0 ? (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedCount} record{selectedCount !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Choose an action for the selected records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="h-10 cursor-pointer rounded-2xl"
              >
                <X className="mr-1.5 h-4 w-4" />
                Clear selection
              </Button>

              {bulkDelete && (
                <ActionConfirmDialog
                  title={bulkDelete.title || "Delete selected records?"}
                  description={
                    bulkDelete.description
                      ? bulkDelete.description(selectedCount)
                      : `Are you sure you want to delete ${selectedCount} selected record${
                          selectedCount !== 1 ? "s" : ""
                        }? This action cannot be undone.`
                  }
                  confirmLabel={bulkDelete.confirmLabel || "Yes, Delete"}
                  confirmVariant="destructive"
                  actionUrl={bulkDelete.actionUrl}
                  hiddenFields={{
                    [bulkDelete.hiddenFieldName || "ids"]:
                      JSON.stringify(selectedVisibleIds),
                  }}
                  successTitle={bulkDelete.successTitle || "Records deleted"}
                  successDescription={
                    bulkDelete.successDescription ||
                    "Selected records have been deleted successfully."
                  }
                  errorTitle={bulkDelete.errorTitle || "Delete failed"}
                  icon={<Trash2 className="h-6 w-6" />}
                  trigger={
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-10 cursor-pointer rounded-2xl"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete selected
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        ) : (
          controls
        )}
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-semibold text-foreground">{emptyTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {enableSelection && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisibleRows}
                        className="h-4 w-4 cursor-pointer accent-primary"
                      />
                    </TableHead>
                  )}

                  {columns.map((column) => (
                    <TableHead key={column.id} className={column.headClassName}>
                      {column.header}
                    </TableHead>
                  ))}

                  {renderActions && (
                    <TableHead className="text-right">
                      {actionsHeader}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((row) => {
                  const isSelected = selectedIds.includes(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      className={isSelected ? "bg-muted/60" : undefined}
                    >
                      {enableSelection && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(row.id)}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                        </TableCell>
                      )}

                      {columns.map((column) => (
                        <TableCell key={column.id} className={column.className}>
                          {column.cell(row)}
                        </TableCell>
                      ))}

                      {renderActions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {renderActions(row, isSelected)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Rows per page</span>

            <select
              value={pageSize}
              onChange={(event) => changePageSize(Number(event.target.value))}
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none transition focus:border-brand"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <span className="text-sm text-muted-foreground">
              Showing {startRow}-{endRow} of {totalRows}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="h-9 rounded-xl"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold">
              Page {currentPage} of {totalPages}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="h-9 rounded-xl"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
