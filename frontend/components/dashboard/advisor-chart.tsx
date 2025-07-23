"use client"

import { useEffect, useRef } from "react"

interface AdvisorChartProps {
  selectedClient: string | null
}

export function AdvisorChart({ selectedClient }: AdvisorChartProps) {
  const pieChartRef = useRef<HTMLCanvasElement>(null)

  // Simulación de datos de ventas por asesor
  const asesores = [
    { nombre: "Javier Ruiz", ventas: 30 },
    { nombre: "Sofía Martínez", ventas: 25 },
    { nombre: "Luis Hernández", ventas: 18 },
    { nombre: "Carmen Vega", ventas: 12 },
    { nombre: "Otros", ventas: 8 },
  ]
  const pieData = asesores.map(a => a.ventas)
  const asesoresNombres = asesores.map(a => a.nombre)

  useEffect(() => {
    if (pieChartRef.current) {
      const pieCtx = pieChartRef.current.getContext("2d")
      if (pieCtx) {
        pieCtx.clearRect(0, 0, pieChartRef.current.width, pieChartRef.current.height)
        const centerX = pieChartRef.current.width / 2
        const centerY = pieChartRef.current.height / 2
        const radius = Math.min(centerX, centerY) - 10
        const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]
        let startAngle = 0
        const total = pieData.reduce((acc, val) => acc + val, 0) || 1
        pieData.forEach((value, index) => {
          const sliceAngle = (value / total) * 2 * Math.PI
          pieCtx.beginPath()
          pieCtx.moveTo(centerX, centerY)
          pieCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
          pieCtx.closePath()
          pieCtx.fillStyle = colors[index % colors.length]
          pieCtx.fill()
          startAngle += sliceAngle
        })
        asesoresNombres.forEach((legend, index) => {
          pieCtx.fillStyle = colors[index % colors.length]
          pieCtx.fillRect(20, 20 + index * 20, 15, 15)
          pieCtx.fillStyle = "#6b7280"
          pieCtx.font = "12px sans-serif"
          pieCtx.textAlign = "left"
          pieCtx.fillText(legend, 40, 32 + index * 20)
        })
      }
    }
  }, [selectedClient])

  return (
    <div className="bg-card border border-card rounded-lg p-4 pb-10">
      <h3 className="text-lg font-semibold mb-2 text-foreground">Distribución por Asesor</h3>
      <canvas ref={pieChartRef} width={500} height={320} className="w-full"></canvas>
    </div>
  )
} 