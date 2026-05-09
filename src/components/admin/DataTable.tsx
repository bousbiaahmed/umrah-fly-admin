import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./Feedback";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
};

export function DataTable<T>({ rows, columns, emptyMessage = "Aucune donnée.", rowKey }: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.accessor) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = col.accessor!(a);
      const bv = col.accessor!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    if (dir === "desc") arr.reverse();
    return arr;
  }, [rows, sortKey, dir, columns]);

  const toggle = (key: string) => {
    if (sortKey === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setDir("asc");
    }
  };

  if (rows.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.sortable ? (
                  <button
                    onClick={() => toggle(col.key)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {col.header}
                    {sortKey === col.key ? (
                      dir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render
                    ? col.render(row)
                    : col.accessor
                      ? (col.accessor(row) ?? "—")
                      : "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
