"use client"

// Gráficos mejorados con soporte retina - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useRef, useState } from "react"
import { useVentas } from "@/hooks/useVentas"
import type { Venta } from "@/lib/api"

// Simulamos la importación de Chart.js
// En un proyecto real, usaríamos Chart.js o una librería similar
export function DashboardCharts() {
  const [activeTab, setActiveTab] = useState("mensual")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const { ventas, loading, error } = useVentas()

  // Agrupar ventas por mes y por asesor
  const ventasPorMes = Array(12).fill(0)
  const ventasPorSemana = Array(7).fill(0)
  const ventasPorAsesor: Record<string, number> = {}

  ventas.forEach((v: Venta) => {
    const fecha = new Date(v.fecha_venta || v.fecha)
    if (isNaN(fecha.getTime())) return // Validar fecha válida
    
    ventasPorMes[fecha.getMonth()]++
    ventasPorSemana[fecha.getDay()]++
    
    if (v.asesor) {
      ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1
    }
  })

  const asesoresNombres = Object.keys(ventasPorAsesor)
  const asesoresValores = Object.values(ventasPorAsesor)

  useEffect(() => {
    if (!chartRef.current || !pieChartRef.current) return

    // Ajustar resolución para pantallas retina
    const dpr = window.devicePixelRatio || 1;
    const width = 500;
    const height = 300;
    chartRef.current.width = width * dpr;
    chartRef.current.height = height * dpr;
    chartRef.current.style.width = width + "px";
    chartRef.current.style.height = height + "px";
    pieChartRef.current.width = width * dpr;
    pieChartRef.current.height = height * dpr;
    pieChartRef.current.style.width = width + "px";
    pieChartRef.current.style.height = height + "px";

    const ctx = chartRef.current.getContext("2d")
    const pieCtx = pieChartRef.current.getContext("2d")
    if (!ctx || !pieCtx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pieCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    pieCtx.clearRect(0, 0, width, height)

    // Datos para el gráfico
    const data = activeTab === "mensual" ? ventasPorMes : ventasPorSemana
    const labels = activeTab === "mensual"
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    // Dibujar gráfico de barras
    const barWidth = width / (data.length * 2)
    const maxValue = Math.max(...data, 1)
    ctx.fillStyle = "#7c3aed"
    data.forEach((value, index) => {
      const x = index * (barWidth * 2) + barWidth / 2
      const barHeight = (value / maxValue) * (height - 40)
      ctx.fillRect(x, height - barHeight - 20, barWidth, barHeight)
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(labels[index], x + barWidth / 2, height - 5)
      ctx.fillText(value.toString(), x + barWidth / 2, height - barHeight - 25)
      ctx.fillStyle = "#7c3aed"
    })

    // Dibujar gráfico circular
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 10
    const colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]
    let startAngle = 0
    const total = asesoresValores.reduce((acc, val) => acc + val, 0) || 1

    asesoresValores.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI
      pieCtx.beginPath()
      pieCtx.moveTo(centerX, centerY)
      pieCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      pieCtx.closePath()
      pieCtx.fillStyle = colors[index % colors.length]
      pieCtx.fill()
      startAngle += sliceAngle
    })

    // Leyenda
    asesoresNombres.forEach((legend, index) => {
      pieCtx.fillStyle = colors[index % colors.length]
      pieCtx.fillRect(20, 20 + index * 20, 15, 15)
      pieCtx.fillStyle = "#6b7280"
      pieCtx.font = "12px sans-serif"
      pieCtx.textAlign = "left"
      pieCtx.fillText(legend, 40, 32 + index * 20)
    })
  }, [activeTab, ventas])

  if (loading) return <div>Cargando gráficos...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ventas</CardTitle>
          <CardDescription>Visualización de ventas por período</CardDescription>
          <Tabs defaultValue="mensual" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mensual">Mensual</TabsTrigger>
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <canvas ref={chartRef} width={500} height={300} className="w-full"></canvas>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Asesor</CardTitle>
          <CardDescription>Porcentaje de ventas por asesor</CardDescription>
        </CardHeader>
        <CardContent>
          <canvas ref={pieChartRef} width={500} height={300} className="w-full"></canvas>
        </CardContent>
      </Card>
    </div>
  )
} 