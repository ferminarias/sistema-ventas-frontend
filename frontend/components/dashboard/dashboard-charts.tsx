"use client"

// Gráficos mejorados con soporte retina - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useRef, useState } from "react"
import { useVentas } from "@/hooks/useVentas"
import { RailwayLoader } from "@/components/ui/railway-loader"

// Simulamos la importación de Chart.js
// En un proyecto real, usaríamos Chart.js o una librería similar
export function DashboardCharts() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const pieContainerRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('mensual')
  const { ventas, loading, error } = useVentas()
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{x: number, y: number, label: string, value: number} | null>(null)
  const [pieAnim, setPieAnim] = useState<number[]>([])
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 500, height: 300 })
  const [pieCanvasDimensions, setPieCanvasDimensions] = useState({ width: 500, height: 300 })

  // Función para obtener dimensiones del contenedor
  const updateCanvasDimensions = () => {
    if (chartContainerRef.current) {
      const rect = chartContainerRef.current.getBoundingClientRect()
      setCanvasDimensions({ 
        width: Math.max(rect.width || 500, 300), 
        height: Math.max(rect.height || 300, 200) 
      })
    }
    if (pieContainerRef.current) {
      const rect = pieContainerRef.current.getBoundingClientRect()
      setPieCanvasDimensions({ 
        width: Math.max(rect.width || 500, 300), 
        height: Math.max(rect.height || 300, 200) 
      })
    }
  }

  // Observador de redimensionamiento
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions()
    })

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current)
    }
    if (pieContainerRef.current) {
      resizeObserver.observe(pieContainerRef.current)
    }

    // Dimensiones iniciales
    updateCanvasDimensions()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Agrupar ventas por mes y por asesor
  const ventasPorMes = Array(12).fill(0)
  const ventasPorSemana = Array(7).fill(0)
  const ventasPorAsesor: Record<string, number> = {}

  ventas.forEach(venta => {
    const fecha = new Date(venta.fecha_venta)
    const mes = fecha.getMonth()
    const dia = fecha.getDay()
    
    ventasPorMes[mes]++
    ventasPorSemana[dia]++
    
    const asesor = venta.asesor || 'Sin asesor'
    ventasPorAsesor[asesor] = (ventasPorAsesor[asesor] || 0) + 1
  })

  const procesarDatosAsesores = () => {
    const asesoresArray = Object.entries(ventasPorAsesor)
      .map(([nombre, ventas]) => ({ nombre, ventas }))
      .sort((a, b) => b.ventas - a.ventas)

    if (asesoresArray.length > 8) {
      const topAsesores = asesoresArray.slice(0, 7)
      const otrosAsesores = asesoresArray.slice(7)
      const totalOtros = otrosAsesores.reduce((sum, asesor) => sum + asesor.ventas, 0)
      
      if (totalOtros > 0) {
        topAsesores.push({ nombre: `Otros (${otrosAsesores.length})`, ventas: totalOtros })
      }
      
      return topAsesores
    }
    
    return asesoresArray
  }

  const asesoresProcesados = procesarDatosAsesores()
  const asesoresNombres = asesoresProcesados.map(a => a.nombre)
  const asesoresValores = asesoresProcesados.map(a => a.ventas)

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

    const { width, height } = canvasDimensions
    const { width: pieWidth, height: pieHeight } = pieCanvasDimensions

    // Ajustar resolución para pantallas retina
    const dpr = window.devicePixelRatio || 1

    // Canvas de gráfico de barras
    chartRef.current.width = width * dpr
    chartRef.current.height = height * dpr
    chartRef.current.style.width = width + "px"
    chartRef.current.style.height = height + "px"

    // Canvas de gráfico circular
    pieChartRef.current.width = pieWidth * dpr
    pieChartRef.current.height = pieHeight * dpr
    pieChartRef.current.style.width = pieWidth + "px"
    pieChartRef.current.style.height = pieHeight + "px"

    const ctx = chartRef.current.getContext("2d")
    const pieCtx = pieChartRef.current.getContext("2d")
    if (!ctx || !pieCtx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    pieCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    pieCtx.clearRect(0, 0, pieWidth, pieHeight)

    // Datos para el gráfico de barras
    const data = activeTab === "mensual" ? ventasPorMes : ventasPorSemana
    const labels = activeTab === "mensual"
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    // === ESTILOS DE CLIENTES ===
    // Fondo y gradiente de barras
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
    // GRÁFICO CIRCULAR CON DIMENSIONES ADAPTABLES
    if (asesoresValores.length > 0) {
      const pastelColors = [
        "#93c5fd", "#fbbf24", "#34d399", "#f87171", "#a78bfa", 
        "#fb7185", "#60a5fa", "#fcd34d", "#4ade80", "#f472b6",
        "#818cf8", "#fb923c", "#22d3ee", "#a3e635", "#e879f9"
      ]

      // Calcular dimensiones adaptables para el gráfico circular
      const centerX = pieWidth * 0.52
      const centerY = pieHeight / 2
      const radius = Math.min(centerX - 25, centerY - 25, pieWidth * 0.25, pieHeight * 0.3)
      
      let startAngle = 0
      const total = asesoresValores.reduce((acc, val) => acc + val, 0) || 1

      // Dibujar sectores del gráfico circular
      asesoresValores.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI
        // Efecto hover: explosión radial + glow + opacidad
        const anim = pieAnim[index] ?? 0
        const r = radius + anim * 16
        const cx = centerX + Math.cos(startAngle + sliceAngle/2) * anim * 12
        const cy = centerY + Math.sin(startAngle + sliceAngle/2) * anim * 12
        
        // Glow animado
        if (anim > 0.01) {
          pieCtx.save()
          pieCtx.shadowColor = pastelColors[index % pastelColors.length]
          pieCtx.shadowBlur = 24 * anim
        }
        
        // Sector principal
        pieCtx.globalAlpha = hoveredPieIndex === null ? 1 : (hoveredPieIndex === index ? 1 : 0.35)
        pieCtx.beginPath()
        pieCtx.moveTo(cx, cy)
        pieCtx.arc(cx, cy, r, startAngle, startAngle + sliceAngle)
        pieCtx.closePath()
        pieCtx.fillStyle = pastelColors[index % pastelColors.length]
        pieCtx.fill()
        
        // Borde
        pieCtx.strokeStyle = anim > 0.01 ? "#6366f1" : "#1f2937"
        pieCtx.lineWidth = anim > 0.01 ? 4 : 2
        pieCtx.stroke()
        
        if (anim > 0.01) pieCtx.restore()
        pieCtx.globalAlpha = 1
        startAngle += sliceAngle
      })

      // Leyenda adaptable
      const legendStartX = 15
      const legendStartY = 25
      const legendItemHeight = Math.min(22, (pieHeight - 50) / Math.max(asesoresNombres.length, 1))
      const maxLegendItems = Math.min(asesoresNombres.length, Math.floor((pieHeight - 50) / legendItemHeight))

      asesoresNombres.slice(0, maxLegendItems).forEach((legend, index) => {
        const y = legendStartY + index * legendItemHeight
        
        // Círculo de color
        pieCtx.beginPath()
        pieCtx.arc(legendStartX + 5, y, 5, 0, 2 * Math.PI)
        pieCtx.fillStyle = pastelColors[index % pastelColors.length]
        pieCtx.fill()
        pieCtx.strokeStyle = "#374151"
        pieCtx.lineWidth = 1.5
        pieCtx.stroke()
        
        // Texto del asesor
        pieCtx.fillStyle = "#f3f4f6"
        pieCtx.font = "bold 11px Inter, sans-serif"
        pieCtx.textAlign = "left"
        
        const maxNameLength = Math.max(10, Math.floor(pieWidth / 25))
        const displayName = legend.length > maxNameLength 
          ? legend.substring(0, maxNameLength) + "..." 
          : legend
        
        pieCtx.fillText(displayName, legendStartX + 16, y + 2)
        
        // Número de ventas
        pieCtx.font = "10px Inter, sans-serif"
        pieCtx.fillText(`${asesoresValores[index]} ventas`, legendStartX + 16, y + 12)
      })

      // Indicador de más elementos si es necesario
      if (asesoresNombres.length > maxLegendItems) {
        const y = legendStartY + maxLegendItems * legendItemHeight
        pieCtx.fillStyle = "#9ca3af"
        pieCtx.font = "italic 10px Inter, sans-serif"
        pieCtx.fillText(`+${asesoresNombres.length - maxLegendItems} más...`, legendStartX + 16, y + 2)
      }
    } else {
      // Mostrar mensaje cuando no hay datos
      pieCtx.fillStyle = "#9ca3af"
      pieCtx.font = "14px sans-serif"
      pieCtx.textAlign = "center"
      pieCtx.fillText("No hay datos de asesores", pieWidth / 2, pieHeight / 2)
    }
  }, [activeTab, ventas, hoveredPieIndex, pieAnim, canvasDimensions, pieCanvasDimensions])

  // Animación para hover
  useEffect(() => {
    const targetAnim = asesoresValores.map((_, i) => hoveredPieIndex === i ? 1 : 0)
    
    const animate = () => {
      setPieAnim(prev => {
        const newAnim = prev.map((current, i) => {
          const target = targetAnim[i]
          const diff = target - current
          return Math.abs(diff) < 0.01 ? target : current + diff * 0.15
        })
        
        const needsUpdate = newAnim.some((val, i) => Math.abs(val - (prev[i] ?? 0)) > 0.001)
        if (needsUpdate) {
          requestAnimationFrame(animate)
        }
        
        return newAnim
      })
    }
    
    animate()
  }, [hoveredPieIndex, asesoresValores.length])

  // Manejo de eventos del mouse para el gráfico circular
  useEffect(() => {
    const canvas = pieChartRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) * (canvas.width / rect.width)
      const y = (e.clientY - rect.top) * (canvas.height / rect.height)
      
      const { width: pieWidth, height: pieHeight } = pieCanvasDimensions
      const centerX = pieWidth * 0.52
      const centerY = pieHeight / 2
      const radius = Math.min(centerX - 25, centerY - 25, pieWidth * 0.25, pieHeight * 0.3)
      
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
  }, [asesoresNombres, asesoresValores, pieCanvasDimensions])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="space-y-2">
                <div className="h-6 bg-gray-700 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-700 rounded w-48 animate-pulse" />
              </div>
              <div className="h-10 bg-gray-700 rounded w-40 animate-pulse mt-4" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-700/30 rounded-lg flex items-center justify-center">
                <RailwayLoader size="lg" text={i === 1 ? "Cargando gráfico de ventas..." : "Cargando distribución por asesor..."} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
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
          <div ref={chartContainerRef} className="w-full" style={{ height: '300px' }}>
            <canvas ref={chartRef} className="w-full h-full rounded-lg"></canvas>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-600/50 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle>Distribución por Asesor</CardTitle>
          <CardDescription>Porcentaje de ventas por asesor</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={pieContainerRef} className="relative w-full" style={{ height: '300px' }}>
            <canvas ref={pieChartRef} className="w-full h-full rounded-lg cursor-pointer"></canvas>
            {tooltip && (
              <div 
                style={{
                  position: 'fixed', 
                  left: tooltip.x + 12, 
                  top: tooltip.y + 12, 
                  zIndex: 50, 
                  pointerEvents: 'none', 
                  opacity: 1, 
                  transform: 'translateY(0px)', 
                  transition: 'opacity 0.18s, transform 0.18s'
                }} 
                className="backdrop-blur-md bg-gray-900/80 text-white text-xs px-3 py-2 rounded-xl shadow-2xl border border-blue-400/40 animate-fade-in"
              >
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