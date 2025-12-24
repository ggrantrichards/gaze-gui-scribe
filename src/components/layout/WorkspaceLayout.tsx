import React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

