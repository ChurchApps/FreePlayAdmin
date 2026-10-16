import React, { type ReactNode } from "react";
import { TableHead, TableRow, TableCell, TableSortLabel } from "@mui/material";

export type SortDirection = "asc" | "desc";

export interface SortableColumn {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  minWidth?: number | string;
  align?: "left" | "right" | "center";
}

interface SortableTableHeadProps {
  columns: SortableColumn[];
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  /** Cells rendered before the columns, e.g. a select-all checkbox cell. */
  leading?: ReactNode;
}

export const SortableTableHead: React.FC<SortableTableHeadProps> = ({ columns, sortBy, sortDirection = "asc", onSort, leading }) => (
  <TableHead sx={{ "& .MuiTableCell-root": { whiteSpace: "nowrap" } }}>
    <TableRow>
      {leading}
      {columns.map((c) => {
        const active = sortBy === c.key;
        const label = c.label;
        return (
          <TableCell key={c.key} align={c.align} sx={{ minWidth: c.minWidth }} sortDirection={active ? sortDirection : false}>
            {c.sortable && onSort ? (
              <TableSortLabel active={active} direction={active ? sortDirection : "asc"} onClick={() => onSort(c.key)}>
                {label}
              </TableSortLabel>
            ) : (
              label
            )}
          </TableCell>
        );
      })}
    </TableRow>
  </TableHead>
);
