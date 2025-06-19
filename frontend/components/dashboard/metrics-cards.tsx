"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign } from "lucide-react"

interface MetricsCardsProps {
  selectedClient: string | null
}

export function MetricsCards({ selectedClient }: MetricsCardsProps) {
  // Simulación de datos
  const metrics = [
    {
      title: "Ventas Totales",
      value: 93,
      icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
      change: "+7% respecto al mes anterior",
      color: "text-green-400"
    },
    {
      title: "Ingresos",
      value: "$10,120",
      icon: <DollarSign className="h-6 w-6 text-purple-400" />,
      change: "+5.8% respecto al mes anterior",
      color: "text-green-400"
    },
    {
      title: "Clientes Nuevos",
      value: 22,
      icon: <Users className="h-6 w-6 text-purple-400" />,
      change: "-2% respecto al mes anterior",
      color: "text-red-400"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric, idx) => (
        <Card key={idx} className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-white">{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{metric.value}</div>
            <div className={`text-xs mt-2 ${metric.color}`}>{metric.change}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 