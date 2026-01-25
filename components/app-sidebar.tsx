import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ui/theme-toggle"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-12 w-full items-center px-4 font-semibold">
          Finance Manager
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4">
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
