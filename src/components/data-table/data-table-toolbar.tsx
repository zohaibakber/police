"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Columns3Icon, ChevronDownIcon, PlusIcon, Search } from "lucide-react";
import type { FIR } from "./schema";

interface DataTableToolbarProps {
  table: Table<FIR>;
  searchPlaceholder?: string;
  searchColumn?: string;
  onAdd?: () => void;
}

export function DataTableToolbar({
  table,
  searchPlaceholder = "Search...",
  searchColumn = "fir",
  onAdd,
}: DataTableToolbarProps) {
  const column = table.getColumn(searchColumn);
  const filterValue = (column?.getFilterValue() as string) ?? "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {column && (
          <InputGroup className="h-8 w-full max-w-sm" dir="rtl">
            <InputGroupAddon align="inline-start" className="pl-0 pr-3">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              id="table-search"
              placeholder={searchPlaceholder}
              value={filterValue}
              onChange={(event) => column.setFilterValue(event.target.value)}
            />
          </InputGroup>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Columns3Icon data-icon="inline-start" />
            کالمز
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table
              .getAllColumns()
              .filter(
                (col) =>
                  typeof col.accessorFn !== "undefined" && col.getCanHide(),
              )
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {typeof col.columnDef.header === "string"
                    ? col.columnDef.header
                    : col.id.replace(/([A-Z])/g, " $1").trim()}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <PlusIcon />
            نئی ایف آئی آر
          </Button>
        )}
      </div>
    </div>
  );
}
