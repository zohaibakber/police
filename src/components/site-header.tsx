"use client";

import * as React from "react";
import { MoonIcon, SearchIcon, SunIcon } from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(theme === "dark");
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    const dark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(dark);
  }, [theme]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="flex flex-1" />
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Search"
                  onClick={() => setCommandOpen(true)}
                >
                  <SearchIcon className="size-4" />
                </Button>
              }
            />
            <TooltipContent>Search commands (⌘K)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  size="sm"
                  variant="outline"
                  onPressedChange={() => setTheme(isDark ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                </Toggle>
              }
            />
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
}
