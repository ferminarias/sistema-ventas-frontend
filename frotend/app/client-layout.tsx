"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { authService } from "@/services/auth-service";
import type { User } from "@/types/auth";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.replace("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MobileHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
} 