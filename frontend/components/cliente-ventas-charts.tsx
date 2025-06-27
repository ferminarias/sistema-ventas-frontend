"use client"

// Gráficos mejorados con soporte retina - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useRef, useState } from "react"
import { useVentas } from "@/hooks/useVentas"

interface ClienteVentasChartsProps {
  cliente: string
  clientIdToName?: Record<string, string>
  nombreCliente?: string
}

export function ClienteVentasCharts({ cliente, clientIdToName, nombreCliente }: ClienteVentasChartsProps) {
  const [activeTab, setActiveTab] = useState("mensual")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)

  // Validación defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando gráficos del cliente...</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando gráficos del cliente...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { ventas } = useVentas(cliente.toLowerCase())

  // Agrupar ventas por mes y por asesor
  const ventasPorMes = Array(12).fill(0)
  const ventasPorSemana = Array(7).fill(0)
  const ventasPorAsesor: Record<string, number> = {}

  ventas.forEach((v) => {
    const fecha = new Date(v.fecha_venta)
    if (isNaN(fecha.getTime())) return // Validar fecha válida
    
    ventasPorMes[fecha.getMonth()]++
    ventasPorSemana[fecha.getDay()]++
    
    if (v.asesor) {
      ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1
    }
  })

  // Procesar datos de asesores para optimizar visualización
  const procesarDatosAsesores = () => {
    const asesoresArray = Object.entries(ventasPorAsesor)
      .map(([nombre, ventas]) => ({ nombre, ventas }))
      .sort((a, b) => b.ventas - a.ventas)

    // Si hay más de 8 asesores, agrupa los menores en "Otros"
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

    // Dibujar gráfico circular mejorado
    if (asesoresValores.length > 0) {
      const centerX = width * 0.6 // Mover el centro hacia la derecha para dar espacio a la leyenda
      const centerY = height / 2
      const radius = Math.min(centerX - 20, centerY - 20)
      
      // Paleta de colores más amplia y distintiva
      const colors = [
        "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe",
        "#f59e0b", "#f97316", "#ef4444", "#10b981", "#06b6d4",
        "#8b5a2b", "#6b7280", "#9ca3af"
      ]
      
      let startAngle = 0
      const total = asesoresValores.reduce((acc, val) => acc + val, 0) || 1

      // Dibujar sectores del gráfico circular
      asesoresValores.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI
        pieCtx.beginPath()
        pieCtx.moveTo(centerX, centerY)
        pieCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
        pieCtx.closePath()
        pieCtx.fillStyle = colors[index % colors.length]
        pieCtx.fill()
        
        // Agregar borde a los sectores
        pieCtx.strokeStyle = "#ffffff"
        pieCtx.lineWidth = 2
        pieCtx.stroke()
        
        startAngle += sliceAngle
      })

      // Dibujar leyenda mejorada en el lado izquierdo
      const legendStartX = 15
      const legendStartY = 30
      const legendItemHeight = 22
      const maxLegendItems = Math.min(asesoresNombres.length, 10)

      asesoresNombres.slice(0, maxLegendItems).forEach((legend, index) => {
        const y = legendStartY + index * legendItemHeight
        
        // Cuadrado de color
        pieCtx.fillStyle = colors[index % colors.length]
        pieCtx.fillRect(legendStartX, y - 8, 12, 12)
        
        // Borde del cuadrado
        pieCtx.strokeStyle = "#ffffff"
        pieCtx.lineWidth = 1
        pieCtx.strokeRect(legendStartX, y - 8, 12, 12)
        
        // Texto del asesor
        pieCtx.fillStyle = "#374151"
        pieCtx.font = "11px sans-serif"
        pieCtx.textAlign = "left"
        
        // Truncar nombre si es muy largo
        const maxNameLength = 15
        const displayName = legend.length > maxNameLength 
          ? legend.substring(0, maxNameLength) + "..." 
          : legend
        
        pieCtx.fillText(displayName, legendStartX + 18, y + 2)
        
        // Número de ventas
        pieCtx.fillStyle = "#6b7280"
        pieCtx.font = "10px sans-serif"
        pieCtx.fillText(`(${asesoresValores[index]})`, legendStartX + 18, y + 14)
      })

      // Si hay más elementos, mostrar indicador
      if (asesoresNombres.length > maxLegendItems) {
        const y = legendStartY + maxLegendItems * legendItemHeight
        pieCtx.fillStyle = "#9ca3af"
        pieCtx.font = "10px sans-serif"
        pieCtx.fillText(`+${asesoresNombres.length - maxLegendItems} más...`, legendStartX, y + 2)
      }
    } else {
      // Mostrar mensaje cuando no hay datos
      pieCtx.fillStyle = "#9ca3af"
      pieCtx.font = "14px sans-serif"
      pieCtx.textAlign = "center"
      pieCtx.fillText("No hay datos de asesores", width / 2, height / 2)
    }
  }, [activeTab, ventas, asesoresProcesados])

  // Utilidad para mostrar el nombre real del cliente
  const getNombreCliente = () => {
    if (cliente === "all") return "Todos los clientes"
    if (clientIdToName && clientIdToName[String(cliente)]) return clientIdToName[String(cliente)]
    return ""
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {nombreCliente && nombreCliente !== "-" 
              ? `Ventas de ${nombreCliente}` 
              : <span className="text-slate-400">Cargando nombre del cliente...</span>}
          </CardTitle>
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
          <CardDescription>
            {asesoresProcesados.length > 8 
              ? `Top 7 asesores + otros (${asesoresProcesados.length - 1} total)`
              : `${asesoresProcesados.length} asesores`
            } - {getNombreCliente()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <canvas ref={pieChartRef} width={500} height={300} className="w-full"></canvas>
        </CardContent>
      </Card>
    </div>
  )
}
