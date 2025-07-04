"use client"

// Gráficos mejorados con soporte retina - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useRef, useState } from "react"
import { useVentas } from "@/hooks/useVentas"

// Simulamos la importación de Chart.js
// En un proyecto real, usaríamos Chart.js o una librería similar
export function DashboardCharts() {
  const [activeTab, setActiveTab] = useState("mensual")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const { ventas, loading, error } = useVentas()
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{x: number, y: number, label: string, value: number} | null>(null)

  // Agrupar ventas por mes y por asesor
  const ventasPorMes = Array(12).fill(0)
  const ventasPorSemana = Array(7).fill(0)
  const ventasPorAsesor: Record<string, number> = {}

  ventas.forEach((v: any) => {
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

  // Paleta pastel/profesional
  const pastelColors = [
    "#a5b4fc", // azul lavanda
    "#6ee7b7", // verde menta
    "#fcd34d", // amarillo suave
    "#fca5a5", // rojo coral suave
    "#f9a8d4", // rosa pastel
    "#fbcfe8", // rosa claro
    "#c7d2fe", // azul claro
    "#fde68a", // amarillo pastel
    "#bbf7d0", // verde agua
    "#fef9c3", // crema
    "#ddd6fe", // violeta claro
    "#bae6fd", // celeste
    "#d1fae5", // verde muy claro
  ]

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

    // Datos para el gráfico
    const data = activeTab === "mensual" ? ventasPorMes : ventasPorSemana
    const labels = activeTab === "mensual"
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    // === ESTILOS DE CLIENTES ===
    // Fondo y gradiente de barras
    ctx.clearRect(0, 0, width, height)
    const isMany = data.length > 24
    const margin = isMany ? 60 : 50
    const chartHeight = height - margin
    const chartWidth = width - margin
    const availableWidth = chartWidth * 0.9
    const maxBarWidth = isMany ? 8 : 20
    const minBarWidth = 2
    const calculatedBarWidth = Math.max(minBarWidth, Math.min(maxBarWidth, availableWidth / data.length * 0.8))
    const maxValue = Math.max(...data, 1)
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight)
    gradient.addColorStop(0, "#a855f7")
    gradient.addColorStop(0.5, "#8b5cf6")
    gradient.addColorStop(1, "#7c3aed")

    data.forEach((value, index) => {
      const x = margin / 2 + (index * chartWidth) / data.length
      const barHeight = (value / maxValue) * (chartHeight - 60)
      ctx.fillStyle = "rgba(168, 85, 247, 0.3)"
      ctx.fillRect(x + 1, chartHeight - barHeight - 18, calculatedBarWidth, barHeight)
      ctx.fillStyle = gradient
      ctx.fillRect(x, chartHeight - barHeight - 20, calculatedBarWidth, barHeight)
      ctx.strokeStyle = "#c084fc"
      ctx.lineWidth = 1
      ctx.strokeRect(x, chartHeight - barHeight - 20, calculatedBarWidth, barHeight)
      // Etiquetas
      ctx.fillStyle = "#e5e7eb"
      ctx.font = isMany ? "9px Inter, sans-serif" : "10px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.save()
      ctx.translate(x + calculatedBarWidth / 2, height - 8)
      if (isMany) ctx.rotate(-Math.PI / 3)
      ctx.fillText(labels[index], 0, 0)
      ctx.restore()
      // Valor encima de la barra
      if (value > 0 && barHeight > 25 && (!isMany || value >= maxValue * 0.3)) {
        ctx.fillStyle = "#f3f4f6"
        ctx.font = "bold 10px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(value.toString(), x + calculatedBarWidth / 2, chartHeight - barHeight - 30)
      }
    })
    // Línea de base
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin / 2, chartHeight - 20)
    ctx.lineTo(width - margin / 2, chartHeight - 20)
    ctx.stroke()

    // === PIE CHART ESTILO CLIENTES ===
    pieCtx.clearRect(0, 0, width, height)
    const centerX = width * 0.6
    const centerY = height / 2
    const radius = Math.min(centerX - 30, centerY - 30)
    let startAngle = 0
    const total = asesoresValores.reduce((acc, val) => acc + val, 0) || 1
    asesoresValores.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI
      // Efecto hover: si está sobre este sector, agrandar y sombra
      const isHovered = hoveredPieIndex === index
      const r = isHovered ? radius + 10 : radius
      const cx = isHovered ? centerX + Math.cos(startAngle + sliceAngle/2) * 8 : centerX
      const cy = isHovered ? centerY + Math.sin(startAngle + sliceAngle/2) * 8 : centerY
      // Sombra
      if (isHovered) {
        pieCtx.save()
        pieCtx.shadowColor = "rgba(0,0,0,0.25)"
        pieCtx.shadowBlur = 16
      }
      // Sector principal
      pieCtx.beginPath()
      pieCtx.moveTo(cx, cy)
      pieCtx.arc(cx, cy, r, startAngle, startAngle + sliceAngle)
      pieCtx.closePath()
      pieCtx.fillStyle = pastelColors[index % pastelColors.length]
      pieCtx.fill()
      // Borde
      pieCtx.strokeStyle = isHovered ? "#6366f1" : "#1f2937"
      pieCtx.lineWidth = isHovered ? 4 : 2
      pieCtx.stroke()
      if (isHovered) pieCtx.restore()
      startAngle += sliceAngle
    })
    // Leyenda
    const legendStartX = 20
    const legendStartY = 30
    const legendItemHeight = 24
    const maxLegendItems = Math.min(asesoresNombres.length, 9)
    asesoresNombres.slice(0, maxLegendItems).forEach((legend, index) => {
      const y = legendStartY + index * legendItemHeight
      pieCtx.beginPath()
      pieCtx.arc(legendStartX + 6, y, 6, 0, 2 * Math.PI)
      pieCtx.fillStyle = pastelColors[index % pastelColors.length]
      pieCtx.fill()
      pieCtx.strokeStyle = "#374151"
      pieCtx.lineWidth = 2
      pieCtx.stroke()
      pieCtx.fillStyle = "#1e293b"
      pieCtx.font = "bold 11px Inter, sans-serif"
      pieCtx.textAlign = "left"
      const maxNameLength = 14
      const displayName = legend.length > maxNameLength 
        ? legend.substring(0, maxNameLength) + "..." 
        : legend
      pieCtx.fillText(displayName, legendStartX + 18, y + 2)
      pieCtx.fillStyle = "#64748b"
      pieCtx.font = "10px Inter, sans-serif"
      pieCtx.fillText(`${asesoresValores[index]} ventas`, legendStartX + 18, y + 14)
    })
    if (asesoresNombres.length > maxLegendItems) {
      const y = legendStartY + maxLegendItems * legendItemHeight
      pieCtx.fillStyle = "#9ca3af"
      pieCtx.font = "italic 10px Inter, sans-serif"
      pieCtx.fillText(`+${asesoresNombres.length - maxLegendItems} más...`, legendStartX, y + 2)
    }
  }, [activeTab, ventas, hoveredPieIndex])

  // Efecto hover: detectar sector con mouse
  useEffect(() => {
    if (!pieChartRef.current) return
    const canvas = pieChartRef.current
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)
      const centerX = canvas.width * 0.6
      const centerY = canvas.height / 2
      const radius = Math.min(centerX - 30, centerY - 30)
      let startAngle = 0
      const total = asesoresValores.reduce((acc, val) => acc + val, 0) || 1
      let found = null
      for (let i = 0; i < asesoresValores.length; i++) {
        const value = asesoresValores[i]
        const sliceAngle = (value / total) * 2 * Math.PI
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx*dx + dy*dy)
        const angle = Math.atan2(dy, dx)
        let a = angle >= 0 ? angle : (2 * Math.PI + angle)
        if (dist <= radius + 12 && a >= startAngle && a < startAngle + sliceAngle) {
          found = i
          setTooltip({
            x: e.clientX,
            y: e.clientY,
            label: asesoresNombres[i],
            value: asesoresValores[i]
          })
          break
        }
        startAngle += sliceAngle
      }
      setHoveredPieIndex(found)
      if (found === null) setTooltip(null)
    }
    const handleMouseLeave = () => {
      setHoveredPieIndex(null)
      setTooltip(null)
    }
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [asesoresNombres, asesoresValores])

  if (loading) return <div>Cargando gráficos...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-gray-800/50 border-gray-600/50 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle>Ventas</CardTitle>
          <CardDescription>Visualización de ventas por período</CardDescription>
          <Tabs defaultValue="mensual" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-700/50 border-gray-600">
              <TabsTrigger value="mensual" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
                Mensual
              </TabsTrigger>
              <TabsTrigger value="semanal" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
                Semanal
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <canvas ref={chartRef} width={500} height={300} className="w-full rounded-lg"></canvas>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-600/50 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle>Distribución por Asesor</CardTitle>
          <CardDescription>Porcentaje de ventas por asesor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas ref={pieChartRef} width={500} height={300} className="w-full rounded-lg cursor-pointer"></canvas>
            {tooltip && (
              <div style={{position: 'fixed', left: tooltip.x + 12, top: tooltip.y + 12, zIndex: 50, pointerEvents: 'none'}} className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-blue-400/40">
                <div className="font-bold">{tooltip.label}</div>
                <div>{tooltip.value} ventas</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 