"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseDdMmYyyy, toDdMmYyyy } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  id,
  "aria-invalid": ariaInvalid,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDdMmYyyy(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            id={id}
            aria-invalid={ariaInvalid}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {selected ? toDdMmYyyy(selected) : placeholder}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(toDdMmYyyy(date));
              setOpen(false);
            }
          }}
          className="rounded-lg border"
        />
      </PopoverContent>
    </Popover>
  );
}
