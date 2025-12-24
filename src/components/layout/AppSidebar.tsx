import React from 'react'
import { 
  LayoutDashboard, 
  FolderOpen, 
  BookOpen, 
  Settings, 
  Plus, 
  ChevronRight,
  History,
  Sparkles,
  MousePointer2
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const mainItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/app",
  },
  {
    title: "Projects",
    icon: FolderOpen,
    url: "#",
  },
  {
    title: "History",
    icon: History,
    url: "#",
  },
  {
    title: "Suggestions",
    icon: Sparkles,
    url: "#",
  },
]

const projectItems = [
  {
    title: "Landing Page V1",
    url: "#",
  },
  {
    title: "Signup Flow",
    url: "#",
  },
  {
    title: "User Dashboard",
    url: "#",
  },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="bg-primary-50 text-primary-700 hover:bg-primary-100">
              <Plus className="w-5 h-5" />
              <span className="font-bold">New Project</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between group">
            Projects
            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projectItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Documentation">
              <a href="#" className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Documentation</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <a href="#" className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

