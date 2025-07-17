"use client";
import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth-service";
import type { User } from "@/types/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then(setUser);
  }, []);

  if (!user) {
    // Puedes mostrar un loader aquí si quieres
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={user} onLogout={() => { authService.logout(); window.location.href = "/"; }} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
} 