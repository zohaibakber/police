"use client";

import * as React from "react";

import { CommandPalette } from "@/components/command-palette";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { File02Icon, HomeIcon, Shield02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const navMain = [
  {
    title: "Home",
    url: "/",
    icon: <HugeiconsIcon icon={HomeIcon} />,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: <HugeiconsIcon icon={File02Icon} />,
  },
];

const sidebarUser = {
  name: "User",
  email: "user@police.local",
  avatar: "",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const [commandOpen, setCommandOpen] = React.useState(false);

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

  const isCollapsed = state === "collapsed";

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              {isCollapsed ? (
                <SidebarTrigger className="size-8" />
              ) : (
                <div className="flex items-center gap-2">
                  <SidebarMenuButton
                    className="min-w-0 flex-1 data-[slot=sidebar-menu-button]:p-1.5!"
                    render={<a href="#" />}
                  >
                    <HugeiconsIcon icon={Shield02Icon} className="size-5!" />
                    <span className="text-base font-semibold">Police</span>
                  </SidebarMenuButton>
                  <SidebarTrigger className="shrink-0" />
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavMain
            items={navMain}
            onCommandPalette={() => setCommandOpen(true)}
          />
        </SidebarContent>

        <SidebarFooter>
          <NavUser user={sidebarUser} />
        </SidebarFooter>
      </Sidebar>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
