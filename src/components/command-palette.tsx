"use client";

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CircleHelpIcon, PlusIcon, Settings2Icon } from "lucide-react";

const COMMAND_ADD_FIR = "command:add-fir";

export function dispatchAddFir() {
  window.dispatchEvent(new CustomEvent(COMMAND_ADD_FIR));
}

export function useCommandAddFir(onAdd: () => void) {
  React.useEffect(() => {
    const handler = () => onAdd();
    window.addEventListener(COMMAND_ADD_FIR, handler);
    return () => window.removeEventListener(COMMAND_ADD_FIR, handler);
  }, [onAdd]);
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const runCommand = React.useCallback(
    (fn: () => void) => {
      fn();
      onOpenChange(false);
    },
    [onOpenChange]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search for a command to run..."
      showCloseButton={false}
    >
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() =>
                runCommand(() => dispatchAddFir())
              }
            >
              <PlusIcon />
              Create FIR
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate({ to: "/settings" }))
              }
            >
              <Settings2Icon />
              Go to Settings
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate({ to: "/about" }))
              }
            >
              <CircleHelpIcon />
              Go to About
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
