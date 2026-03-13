"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <HugeiconsIcon icon={Shield02Icon} className="size-5!" />
              <span className="text-base font-semibold">Police</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
