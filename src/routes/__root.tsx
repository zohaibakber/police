import * as React from "react";
import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { checkForAppUpdate } from "@/lib/updater";

const RootLayout = () => {
  useEffect(() => {
    void checkForAppUpdate();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <DirectionProvider direction="rtl">
        <TooltipProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 64)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
            defaultOpen={false}
          >
            <AppSidebar variant="sidebar" collapsible="icon" />
            <SidebarInset>
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
                  <Outlet />
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
          <TanStackDevtools
            plugins={[
              {
                name: "TanStack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              formDevtoolsPlugin(),
            ]}
          />
          <Toaster />
        </TooltipProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
