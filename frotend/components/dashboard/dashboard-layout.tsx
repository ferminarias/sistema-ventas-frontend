"use client"

import type { User } from "@/types/auth"
import { MobileHeader } from "@/components/mobile-header"
import { Sidebar } from "@/components/sidebar"
import { useState } from "react"
import { MainContent } from "@/components/dashboard/main-content"

interface DashboardLayoutProps {
  user: User
  onLogout: () => void
  children?: React.ReactNode
}

export function DashboardLayout({ user, onLogout, children }: DashboardLayoutProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={user} onLogout={onLogout} selectedClient={selectedClient} onClientSelect={setSelectedClient} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children ? children : <MainContent user={user} selectedClient={selectedClient} />}
        </main>
      </div>
    </div>
  )
} 