"use client"

// Gráficos mejorados con soporte retina y semanas ISO del año - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useRef, useState } from "react"
import { useVentas } from "@/hooks/useVentas"

interface ClienteVentasChartsProps {
  cliente: string
  clientIdToName?: Record<string, string>
  nombreCliente?: string
}

export function ClienteVentasCharts({ cliente, clientIdToName, nombreCliente }: ClienteVentasChartsProps) {
  const [activeTab, setActiveTab] = useState("mensual")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
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

  // Función para obtener la semana ISO del año según estándar ISO 8601
  const getSemanaISO = (fecha: Date) => {
    // Crear una copia en UTC para evitar problemas de zona horaria
    const fechaUTC = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
    
    // Encontrar el jueves de la semana (el jueves siempre está en la semana correcta)
    // El día de la semana: 0=domingo, 1=lunes, ..., 6=sábado
    // Para ISO: 1=lunes, 2=martes, ..., 7=domingo
    const diaDeSemanaTrans = (fechaUTC.getUTCDay() + 6) % 7  // Convertir domingo=0 a domingo=6
    const juevesDeEstaSemana = new Date(fechaUTC)
    juevesDeEstaSemana.setUTCDate(fechaUTC.getUTCDate() - diaDeSemanaTrans + 3)  // +3 para llegar al jueves
    
    // El año ISO es el año del jueves
    const yearISO = juevesDeEstaSemana.getUTCFullYear()
    
    // Encontrar el primer jueves del año ISO
    const enero4 = new Date(Date.UTC(yearISO, 0, 4))  // 4 de enero siempre está en la semana 1
    const diaDeEnero4 = (enero4.getUTCDay() + 6) % 7
    const primerJueves = new Date(enero4)
    primerJueves.setUTCDate(enero4.getUTCDate() - diaDeEnero4 + 3)
    
    // Calcular la diferencia en días y convertir a semanas
    const diferenciaDias = (juevesDeEstaSemana.getTime() - primerJueves.getTime()) / (1000 * 60 * 60 * 24)
    const semanaISO = Math.floor(diferenciaDias / 7) + 1
    
    return {
      year: yearISO,
      week: semanaISO
    }
  }

  // Función para obtener cuántas semanas tiene un año ISO
  const getSemanasEnAño = (year: number) => {
    // Un año tiene 53 semanas si el 1 de enero o el 31 de diciembre cae en jueves
    const enero1 = new Date(year, 0, 1)
    const diciembre31 = new Date(year, 11, 31)
    
    // Si el 1 de enero es jueves (día 4) o si es año bisiesto y empieza en miércoles
    if (enero1.getDay() === 4 || (diciembre31.getDay() === 4)) {
      return 53
    }
    return 52
  }

  // Procesar datos según el filtro seleccionado
  const procesarDatos = () => {
    const ventasPorMes = Array(12).fill(0)
    const ventasPorAsesor: Record<string, number> = {}
    
    if (activeTab === "mensual") {
      // Datos mensuales del año seleccionado
      ventas.forEach((v) => {
        const fecha = new Date(v.fecha_venta)
        if (isNaN(fecha.getTime()) || fecha.getFullYear() !== selectedYear) return
        
        ventasPorMes[fecha.getMonth()]++
        
        if (v.asesor) {
          ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1
        }
      })
      
      return {
        datos: ventasPorMes,
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        asesores: ventasPorAsesor
      }
    } else {
      // Datos semanales ISO del año seleccionado
      const totalSemanas = getSemanasEnAño(selectedYear)
      const ventasPorSemana = Array(totalSemanas).fill(0)
      
      ventas.forEach((v) => {
        const fecha = new Date(v.fecha_venta)
        if (isNaN(fecha.getTime())) return
        
        const semanaInfo = getSemanaISO(fecha)
        
        // Solo procesar ventas del año seleccionado
        if (semanaInfo.year === selectedYear && semanaInfo.week >= 1 && semanaInfo.week <= totalSemanas) {
          ventasPorSemana[semanaInfo.week - 1]++  // Array es 0-indexed
          
          if (v.asesor) {
            ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1
          }
        }
      })
      
      // Generar labels para las semanas (S1, S2, ... S52/53)
      const labels = Array.from({ length: totalSemanas }, (_, i) => `S${i + 1}`)
      
      return {
        datos: ventasPorSemana,
        labels: labels,
        asesores: ventasPorAsesor
      }
    }
  }

  const { datos, labels, asesores: ventasPorAsesor } = procesarDatos()

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

  // Obtener años disponibles en los datos
  const getYearsAvailable = () => {
    const years = new Set<number>()
    ventas.forEach(v => {
      const fecha = new Date(v.fecha_venta)
      if (!isNaN(fecha.getTime())) {
        years.add(fecha.getFullYear())
      }
    })
    const sortedYears = Array.from(years).sort((a, b) => b - a)
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()]
  }

  const yearsAvailable = getYearsAvailable()

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

    // Dibujar gráfico de barras
    const barWidth = width / (datos.length * 1.5)  // Ajustar para que las barras no estén muy juntas
    const maxValue = Math.max(...datos, 1)
    const margin = 40
    const chartHeight = height - margin
    
    ctx.fillStyle = "#7c3aed"
    datos.forEach((value, index) => {
      const x = (index * (width - margin)) / datos.length + margin / 2
      const barHeight = (value / maxValue) * (chartHeight - 40)
      const barActualWidth = Math.min(barWidth, (width - margin) / datos.length - 2)
      
      // Dibujar barra
      ctx.fillRect(x, chartHeight - barHeight - 20, barActualWidth, barHeight)
      
      // Etiquetas de eje X (solo mostrar algunas para evitar solapamiento)
      const shouldShowLabel = datos.length <= 20 || index % Math.ceil(datos.length / 20) === 0
      if (shouldShowLabel) {
        ctx.fillStyle = "#6b7280"
        ctx.font = "9px sans-serif"
        ctx.textAlign = "center"
        ctx.save()
        ctx.translate(x + barActualWidth / 2, height - 5)
        if (activeTab === "semanal" && datos.length > 30) {
          ctx.rotate(-Math.PI / 4)  // Rotar labels si hay muchas semanas
        }
        ctx.fillText(labels[index], 0, 0)
        ctx.restore()
      }
      
      // Valor encima de la barra (solo si hay espacio)
      if (value > 0 && barHeight > 15) {
        ctx.fillStyle = "#6b7280"
        ctx.font = "9px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(value.toString(), x + barActualWidth / 2, chartHeight - barHeight - 25)
      }
      
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
  }, [activeTab, selectedYear, ventas, datos, labels, asesoresProcesados])

  // Utilidad para mostrar el nombre real del cliente
  const getNombreCliente = () => {
    if (cliente === "all") return "Todos los clientes"
    if (clientIdToName && clientIdToName[String(cliente)]) return clientIdToName[String(cliente)]
    return ""
  }

  // Obtener descripción del período seleccionado
  const getDescripcionPeriodo = () => {
    if (activeTab === "mensual") {
      return `Año ${selectedYear}`
    } else {
      const totalSemanas = getSemanasEnAño(selectedYear)
      return `${selectedYear} - Semanas ISO (${totalSemanas} semanas del año)`
    }
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
          <CardDescription>
            Tendencias históricas - {getDescripcionPeriodo()}
          </CardDescription>
          
          {/* Controles de filtro mejorados */}
          <div className="space-y-4">
            <Tabs defaultValue="mensual" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mensual">Por Meses</TabsTrigger>
                <TabsTrigger value="semanal">Por Semanas ISO</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {yearsAvailable.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {activeTab === "semanal" && (
                <div className="text-xs text-muted-foreground flex items-center">
                  ⓘ Semanas 1-{getSemanasEnAño(selectedYear)} del año {selectedYear}
                </div>
              )}
            </div>
          </div>
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
            } - {getNombreCliente()} ({getDescripcionPeriodo()})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <canvas ref={pieChartRef} width={500} height={300} className="w-full"></canvas>
        </CardContent>
      </Card>
    </div>
  )
}
