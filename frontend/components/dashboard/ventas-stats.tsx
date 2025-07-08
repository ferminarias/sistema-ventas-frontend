"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, DollarSign, ShoppingCart, Users } from "lucide-react"
import { useVentas } from "@/hooks/useVentas"
import { RailwayLoader } from "@/components/ui/railway-loader"

export function VentasStats() {
  const { ventas, loading, error } = useVentas()
  const ventasTotales = ventas.length
  const ingresos = ventas.reduce((acc, v) => acc + (v.total || 0), 0)
  const mesActual = new Date().getMonth()
  const clientesNuevos = new Set(
    ventas.filter(v => {
      const fecha = new Date(v.fecha_venta || v.fecha)
      return fecha.getMonth() === mesActual
    }).map(v => v.email || v.cliente)
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
      description: "Total de ingresos",
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

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-4 w-4 bg-gray-700 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-gray-600 rounded w-16 animate-pulse" />
                <div className="h-3 bg-gray-700 rounded w-32 animate-pulse" />
              </div>
              <div className="mt-4">
                <RailwayLoader size="sm" showText={false} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
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
              {stat.trend === "up" ? (
                <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
              )}
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 