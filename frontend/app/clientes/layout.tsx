"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { User } from "@/types/auth";

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(currentUser => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  return <DashboardLayout user={user} onLogout={handleLogout}>{children}</DashboardLayout>;
} 