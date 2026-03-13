"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { FIR } from "./schema";

export { type FIR };

export interface FirColumnsOptions {
  onEdit?: (fir: FIR) => void;
  onDelete?: (fir: FIR) => void;
}

export function createColumns(options: FirColumnsOptions = {}): ColumnDef<FIR>[] {
  const { onEdit, onDelete } = options;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "serialNumber",
      header: "سیریل نمبر",
      cell: ({ row }) => <div className="font-medium">{row.original.serialNumber}</div>,
    },
    {
      accessorKey: "fir",
      header: "ایف آئی آر",
      cell: ({ row }) => (
        <div className="max-w-[120px] truncate" title={row.original.fir}>
          {row.original.fir}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "dated",
      header: "مورخہ",
      cell: ({ row }) => row.original.dated,
    },
    {
      accessorKey: "policeStation",
      header: "تھانہ",
      cell: ({ row }) => row.original.policeStation,
    },
    {
      accessorKey: "complainantName",
      header: "شکایت کنندہ کا نام",
      cell: ({ row }) => row.original.complainantName,
    },
    {
      accessorKey: "idCardNumber",
      header: "شناختی کارڈ نمبر",
      cell: ({ row }) => row.original.idCardNumber,
    },
    {
      accessorKey: "mobileNumber",
      header: "موبائل نمبر",
      cell: ({ row }) => row.original.mobileNumber,
    },
    {
      accessorKey: "preparedAndDispatchedBy",
      header: "مرتب و مرسلہ",
      cell: ({ row }) => row.original.preparedAndDispatchedBy,
    },
    {
      accessorKey: "writer",
      header: "تحریر کنندہ",
      cell: ({ row }) => row.original.writer,
    },
    {
      accessorKey: "dateOfIncident",
      header: "تاریخ وقوعہ",
      cell: ({ row }) => row.original.dateOfIncident,
    },
    {
      accessorKey: "status",
      header: "اسٹیٹس",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "closed"
            ? "default"
            : status === "under_investigation"
              ? "secondary"
              : "outline";
        const label =
          status === "pending"
            ? "زیر التواء"
            : status === "registered"
              ? "رجسٹرڈ"
              : status === "under_investigation"
                ? "زیر تفتیش"
                : "نمٹا دیا گیا";
        return (
          <Badge variant={variant} className="capitalize">
            {label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">ایکشن</span>,
      cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} onDelete={onDelete} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export const columns = createColumns();

function DataTableRowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: Row<FIR>;
  onEdit?: (fir: FIR) => void;
  onDelete?: (fir: FIR) => void;
}) {
  const fir = row.original;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-open:bg-muted"
            size="icon"
            aria-label={`اس ایف آئی آر کے لیے ایکشن ${fir.fir}`}
          />
        }
      >
        <EllipsisVerticalIcon />
        <span className="sr-only">میمو کھولیں</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit?.(fir)}>
          <PencilIcon />
          ترمیم
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(fir)}>
          <Trash2Icon />
          حذف کریں
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
