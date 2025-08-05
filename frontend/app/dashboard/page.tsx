"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth-service"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ClienteVentasCharts } from "@/components/cliente-ventas-charts"
import { ClienteVentasTable } from "@/components/cliente-ventas-table"
import type { User } from "@/types/auth"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userPromise = authService.getCurrentUser()
    Promise.resolve(userPromise).then(currentUser => {
      if (!currentUser) {
        router.replace("/")
      } else {
        console.log('🔐 Dashboard General - Usuario autenticado:', currentUser);
        console.log('👤 Rol del usuario:', currentUser.role);
        console.log('🌍 Acceso a datos globales:', currentUser.role === 'admin' ? 'SÍ' : 'NO');
        setUser(currentUser)
        setLoading(false)
      }
    })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground text-lg">Cargando...</div>
      </div>
    )
  }

  if (!user) return null

  // Dashboard general: no hay cliente específico, pero podemos mostrar resumen global
  return (
    <div className="flex-1 bg-background text-foreground overflow-auto">
      <DashboardHeader cliente={"General"} />
      <div className="p-6 space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Resumen de ventas y actividad global del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Bienvenido, {user.username || user.name}</div>
            <div className="text-sm text-muted-foreground">Rol: {user.role}</div>
          </CardContent>
        </Card>
        <ClienteVentasCharts cliente={"general"} nombreCliente={"General"} />
        <ClienteVentasTable cliente={"general"} />
      </div>
    </div>
  )
}
