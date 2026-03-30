"use client";

import { usePathname } from "next/navigation";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNavbar } from "@/components/bottom-navbar";
import { Chatbot } from "@/components/chatbot";

interface AppShellProps {
  children: React.ReactNode;
}

const HIDDEN_NAV_ROUTES = new Set(["/login"]);

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideNavigation = pathname ? HIDDEN_NAV_ROUTES.has(pathname) : false;

  if (hideNavigation) {
    return (
      <main className="flex min-h-svh flex-1 flex-col overflow-auto">
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger className="hidden md:flex" />
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-auto pb-24 md:pb-0">
          {children}
        </main>
        <BottomNavbar />
      </SidebarInset>
      <Chatbot />
    </SidebarProvider>
  );
}
