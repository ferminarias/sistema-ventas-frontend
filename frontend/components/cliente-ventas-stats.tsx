"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, DollarSign, ShoppingCart, Users } from "lucide-react"
import { useVentas } from "@/hooks/useVentas"

interface ClienteVentasStatsProps {
  cliente: string
}

export function ClienteVentasStats({ cliente }: ClienteVentasStatsProps) {
  // Validación defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return <div className="text-center p-4">Cargando métricas del cliente...</div>
  }

  const { ventas, loading, error } = useVentas(cliente.toLowerCase())

  // Calcular métricas reales
  const ventasTotales = ventas.length
  // Suponiendo que cada venta es de $1000 (puedes ajustar si tienes campo de monto)
  const ingresos = ventas.length * 1000
  // Clientes nuevos: cantidad de emails únicos este mes
  const mesActual = new Date().getMonth()
  const clientesNuevos = new Set(
    ventas.filter(v => new Date(v.fecha_venta).getMonth() === mesActual).map(v => v.email)
  ).size

  const stats = [
    {
      title: "Ventas Totales",
      value: ventasTotales,
      description: "Total de ventas registradas",
      icon: ShoppingCart,
      trend: "up",
    },
    {
      title: "Ingresos",
      value: `$${ingresos.toLocaleString()}`,
      description: "Estimado (simulado)",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Clientes Nuevos",
      value: clientesNuevos,
      description: "Este mes",
      icon: Users,
      trend: "up",
    },
  ]

  if (loading) return <div>Cargando métricas...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{typeof stat.value === 'string' || typeof stat.value === 'number' ? stat.value : JSON.stringify(stat.value)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
