"use client"

import { useEffect, useRef } from "react"

interface SalesChartProps {
  selectedClient: string | null
}

export function SalesChart({ selectedClient }: SalesChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)

  // Simulación de datos de ventas por mes
  const data = [55, 60, 65, 70, 75, 80, 85, 90, 88, 86, 90, 93]
  const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height)
        const barWidth = chartRef.current.width / (data.length * 2)
        const maxValue = Math.max(...data, 1)
        ctx.fillStyle = "#7c3aed"
        data.forEach((value, index) => {
          const x = index * (barWidth * 2) + barWidth / 2
          const barHeight = (value / maxValue) * (chartRef.current!.height - 40)
          ctx.fillRect(x, chartRef.current!.height - barHeight - 20, barWidth, barHeight)
          ctx.fillStyle = "#6b7280"
          ctx.font = "10px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(labels[index], x + barWidth / 2, chartRef.current!.height - 5)
          ctx.fillText(value.toString(), x + barWidth / 2, chartRef.current!.height - barHeight - 25)
          ctx.fillStyle = "#7c3aed"
        })
      }
    }
  }, [selectedClient])

  return (
    <div className="bg-card border border-card rounded-lg p-4 pb-10">
      <h3 className="text-lg font-semibold mb-2 text-foreground">Ventas por Mes</h3>
      <canvas ref={chartRef} width={500} height={320} className="w-full"></canvas>
    </div>
  )
} 