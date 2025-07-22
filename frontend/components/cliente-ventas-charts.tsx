"use client"

// Gráficos mejorados con soporte retina y semanas ISO del año - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarDays, TrendingUp, Users, Filter, RotateCcw, Info } from "lucide-react"
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
  const [semanaInicio, setSemanaInicio] = useState(1)
  const [semanaFin, setSemanaFin] = useState(52)
  const [showFilters, setShowFilters] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{x: number, y: number, label: string, value: number} | null>(null)
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 300 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Validación defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-dashed border-gray-600 bg-gray-800/50">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <CalendarDays className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-400">Cargando gráficos del cliente...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-dashed border-gray-600 bg-gray-800/50">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <Users className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-400">Cargando distribución...</p>
            </div>
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

  const totalSemanasAño = getSemanasEnAño(selectedYear)

  // Ajustar semanaFin si cambió el año y excede el límite
  useEffect(() => {
    if (semanaFin > totalSemanasAño) {
      setSemanaFin(totalSemanasAño)
    }
  }, [selectedYear, totalSemanasAño, semanaFin])

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
      // Datos semanales ISO del año seleccionado (filtrado por rango)
      const rangoSemanas = semanaFin - semanaInicio + 1
      const ventasPorSemana = Array(rangoSemanas).fill(0)
      
      ventas.forEach((v) => {
        const fecha = new Date(v.fecha_venta)
        if (isNaN(fecha.getTime())) return
        
        const semanaInfo = getSemanaISO(fecha)
        
        // Solo procesar ventas del año y rango de semanas seleccionado
        if (semanaInfo.year === selectedYear && 
            semanaInfo.week >= semanaInicio && 
            semanaInfo.week <= semanaFin) {
          const indice = semanaInfo.week - semanaInicio  // Ajustar índice al rango
          ventasPorSemana[indice]++
          
          if (v.asesor) {
            ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1
          }
        }
      })
      
      // Generar labels para el rango de semanas seleccionado
      const labels = Array.from({ length: rangoSemanas }, (_, i) => `S${semanaInicio + i}`)
      
      return {
        datos: ventasPorSemana,
        labels: labels,
        asesores: ventasPorAsesor
      }
    }
  }

  const { datos, labels, asesores: ventasPorAsesor } = procesarDatos()

  // Calcular estadísticas para mostrar
  const estadisticas = {
    totalVentas: datos.reduce((sum, val) => sum + val, 0),
    promedioVentas: Math.round((datos.reduce((sum, val) => sum + val, 0) / datos.length) * 10) / 10,
    maxVentas: Math.max(...datos),
    totalAsesores: Object.keys(ventasPorAsesor).length
  }

  // Generar tooltips dinámicos según el modo actual
  const getTooltips = () => {
    const tipoPerido = activeTab === "mensual" ? "mes" : "semana"
    const rangoPeriodo = activeTab === "mensual" 
      ? `año ${selectedYear}` 
      : `semanas ${semanaInicio} a ${semanaFin} de ${selectedYear}`

    return {
      totalVentas: `Suma total de todas las ventas registradas en el ${rangoPeriodo}.`,
      promedio: `Promedio de ventas por ${tipoPerido} en el período seleccionado. Se calcula dividiendo el total de ventas entre la cantidad de ${tipoPerido === "mes" ? "meses" : "semanas"} del período.`,
      maximo: `Mayor cantidad de ventas registradas en un solo ${tipoPerido} dentro del período seleccionado.`,
      asesores: `Número de asesores que realizaron al menos una venta en el ${rangoPeriodo}.`
    }
  }

  const tooltips = getTooltips()

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

  // Funciones para filtros rápidos
  const setRangoTrimestre = (trimestre: number) => {
    const iniciosSemanas = [1, 14, 27, 40]
    const finesSemanas = [13, 26, 39, Math.min(52, totalSemanasAño)]
    setSemanaInicio(iniciosSemanas[trimestre - 1])
    setSemanaFin(finesSemanas[trimestre - 1])
  }

  const resetFiltros = () => {
    setSemanaInicio(1)
    setSemanaFin(totalSemanasAño)
    setShowFilters(false)
  }

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
    if (!chartRef.current || !pieChartRef.current) return;
    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    chartRef.current.width = width * dpr;
    chartRef.current.height = height * dpr;
    chartRef.current.style.width = width + "px";
    chartRef.current.style.height = height + "px";
    pieChartRef.current.width = width * dpr;
    pieChartRef.current.height = height * dpr;
    pieChartRef.current.style.width = width + "px";
    pieChartRef.current.style.height = height + "px";
    const ctx = chartRef.current.getContext("2d");
    const pieCtx = pieChartRef.current.getContext("2d");
    if (!ctx || !pieCtx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pieCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    pieCtx.clearRect(0, 0, width, height)

    // Mejorar visualización de barras según cantidad de datos
    const isManySemanas = datos.length > 24
    const margin = isManySemanas ? 60 : 50
    const chartHeight = height - margin
    const chartWidth = width - margin
    
    // Calcular ancho de barras más inteligente
    const availableWidth = chartWidth // 100% del espacio disponible
    const maxBarWidth = isManySemanas ? 8 : 20
    const minBarWidth = 2
    const calculatedBarWidth = Math.max(minBarWidth, Math.min(maxBarWidth, availableWidth / datos.length * 0.8))
    
    const maxValue = Math.max(...datos, 1)
    
    // Crear gradiente para las barras (más vibrante para modo oscuro)
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight)
    gradient.addColorStop(0, "#a855f7")
    gradient.addColorStop(0.5, "#8b5cf6")
    gradient.addColorStop(1, "#7c3aed")
    
    datos.forEach((value, index) => {
      // Nuevo cálculo de x para encuadrar bien las barras y etiquetas
      const x = margin / 2 + (datos.length === 1 ? chartWidth / 2 - calculatedBarWidth / 2 : (index * (chartWidth - calculatedBarWidth)) / (datos.length - 1))
      const barHeight = (value / maxValue) * (chartHeight - 60)
      
      // Sombra de la barra
      ctx.fillStyle = "rgba(168, 85, 247, 0.3)"
      ctx.fillRect(x + 1, chartHeight - barHeight - 18, calculatedBarWidth, barHeight)
      
      // Barra principal con gradiente
      ctx.fillStyle = gradient
      ctx.fillRect(x, chartHeight - barHeight - 20, calculatedBarWidth, barHeight)
      
      // Borde brillante para resaltar
      ctx.strokeStyle = "#c084fc"
      ctx.lineWidth = 1
      ctx.strokeRect(x, chartHeight - barHeight - 20, calculatedBarWidth, barHeight)
      
      // Mejorar etiquetas según cantidad de datos
      let shouldShowLabel = true
      if (isManySemanas) {
        // Para muchas semanas, mostrar cada 4-6 labels
        const interval = Math.ceil(datos.length / 12)
        shouldShowLabel = index % interval === 0 || index === datos.length - 1
      }
      
      if (shouldShowLabel) {
        ctx.fillStyle = "#e5e7eb"
        ctx.font = isManySemanas ? "9px Inter, sans-serif" : "10px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.save()
        ctx.translate(x + calculatedBarWidth / 2, height - 8)
        if (isManySemanas) {
          ctx.rotate(-Math.PI / 3) // Más rotación para mejor legibilidad
        }
        ctx.fillText(labels[index], 0, 0)
        ctx.restore()
      }
      
      // Valor encima de la barra (más selectivo)
      if (value > 0 && barHeight > 25 && (!isManySemanas || value >= maxValue * 0.3)) {
        ctx.fillStyle = "#f3f4f6"
        ctx.font = "bold 10px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(value.toString(), x + calculatedBarWidth / 2, chartHeight - barHeight - 30)
      }
    })

    // Línea de base sutil
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin / 2, chartHeight - 20)
    ctx.lineTo(width - margin / 2, chartHeight - 20)
    ctx.stroke()

    // PIE CHART CON HOVER
    pieCtx.clearRect(0, 0, width, height)
    const centerX = width * 0.52  // Mejor centrado - balance perfecto entre círculo y leyenda
    const centerY = height / 2
    const radius = Math.min(centerX - 25, centerY - 25)
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
    // Leyenda - mejor posicionada con el nuevo centrado
    const legendStartX = 15
    const legendStartY = 25
    const legendItemHeight = 22
    const maxLegendItems = Math.min(asesoresNombres.length, 9)
          asesoresNombres.slice(0, maxLegendItems).forEach((legend, index) => {
        const y = legendStartY + index * legendItemHeight
        pieCtx.beginPath()
        pieCtx.arc(legendStartX + 5, y, 5, 0, 2 * Math.PI)  // Círculo ligeramente más pequeño
        pieCtx.fillStyle = pastelColors[index % pastelColors.length]
        pieCtx.fill()
        pieCtx.strokeStyle = "#374151"
        pieCtx.lineWidth = 1.5
        pieCtx.stroke()
        pieCtx.fillStyle = "#1e293b"
        pieCtx.font = "bold 11px Inter, sans-serif"
        pieCtx.textAlign = "left"
        const maxNameLength = 15  // Un carácter más para mejor lectura
        const displayName = legend.length > maxNameLength 
          ? legend.substring(0, maxNameLength) + "..." 
          : legend
        pieCtx.fillText(displayName, legendStartX + 16, y + 2)
        pieCtx.fillStyle = "#64748b"
        pieCtx.font = "10px Inter, sans-serif"
        pieCtx.fillText(`${asesoresValores[index]} ventas`, legendStartX + 16, y + 13)
      })
          if (asesoresNombres.length > maxLegendItems) {
        const y = legendStartY + maxLegendItems * legendItemHeight
        pieCtx.fillStyle = "#9ca3af"
        pieCtx.font = "italic 10px Inter, sans-serif"
        pieCtx.fillText(`+${asesoresNombres.length - maxLegendItems} más...`, legendStartX + 16, y + 2)
      }
  }, [activeTab, selectedYear, semanaInicio, semanaFin, ventas, datos, labels, asesoresProcesados, hoveredPieIndex])

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

  // Utilidad para mostrar el nombre real del cliente
  const getNombreCliente = () => {
    if (cliente === "all") return "Todos los clientes"
    if (clientIdToName && clientIdToName[String(cliente)]) return clientIdToName[String(cliente)]
    return ""
  }

  // Obtener descripción del período seleccionado
  const getDescripcionPeriodo = () => {
    if (activeTab === "mensual") {
      return `${selectedYear} - Vista mensual`
    } else {
      if (semanaInicio === 1 && semanaFin === totalSemanasAño) {
        return `${selectedYear} - Todas las semanas (S1-S${totalSemanasAño})`
      }
      return `${selectedYear} - Semanas ${semanaInicio} a ${semanaFin}`
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Estadísticas destacadas - Modo oscuro con tooltips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <p className="text-sm font-medium text-blue-300">Total Ventas</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-blue-400/70 hover:text-blue-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{tooltips.totalVentas}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-blue-100">{estadisticas.totalVentas}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 text-green-400" />
                  <p className="text-sm font-medium text-green-300">Promedio</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-green-400/70 hover:text-green-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{tooltips.promedio}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-green-100">{estadisticas.promedioVentas}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <p className="text-sm font-medium text-purple-300">Máximo</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-purple-400/70 hover:text-purple-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{tooltips.maximo}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-purple-100">{estadisticas.maxVentas}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-orange-400" />
                  <p className="text-sm font-medium text-orange-300">Asesores</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-orange-400/70 hover:text-orange-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-sm">{tooltips.asesores}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-orange-100">{estadisticas.totalAsesores}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos principales - Modo oscuro */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-800/50 border-gray-600/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {nombreCliente && nombreCliente !== "-" 
                      ? `Ventas de ${nombreCliente}` 
                      : "Cargando..."}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-300 mt-1">
                    {getDescripcionPeriodo()}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-purple-900/50 text-purple-200 border-purple-600/50">
                  {datos.length} períodos
                </Badge>
              </div>
              
              {/* Controles mejorados para modo oscuro */}
              <div className="space-y-4 mt-4">
                <Tabs defaultValue="mensual" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-700/50 border-gray-600">
                    <TabsTrigger value="mensual" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
                      📅 Por Meses
                    </TabsTrigger>
                    <TabsTrigger value="semanal" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-300">
                      📊 Semanas ISO
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex flex-wrap gap-2 items-center">
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-32 bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {yearsAvailable.map(year => (
                        <SelectItem key={year} value={year.toString()} className="text-white hover:bg-gray-700">
                          📅 {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {activeTab === "semanal" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-600"
                      >
                        <Filter className="h-4 w-4 mr-1" />
                        Filtros
                      </Button>
                      
                      {(semanaInicio !== 1 || semanaFin !== totalSemanasAño) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFiltros}
                          className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Panel de filtros expandible - Modo oscuro */}
                {activeTab === "semanal" && showFilters && (
                  <Card className="bg-blue-900/30 border-blue-600/50 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-blue-300">Filtros rápidos:</span>
                        <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(1)} className="h-7 text-xs bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-600">
                          Q1 (S1-13)
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(2)} className="h-7 text-xs bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-600">
                          Q2 (S14-26)
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(3)} className="h-7 text-xs bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-600">
                          Q3 (S27-39)
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(4)} className="h-7 text-xs bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-600">
                          Q4 (S40-{totalSemanasAño})
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-blue-300 block mb-1">Semana inicio:</label>
                          <Select value={semanaInicio.toString()} onValueChange={(v) => setSemanaInicio(parseInt(v))}>
                            <SelectTrigger className="h-8 bg-gray-700/50 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {Array.from({length: totalSemanasAño}, (_, i) => i + 1).map(week => (
                                <SelectItem key={week} value={week.toString()} className="text-white hover:bg-gray-700">S{week}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-blue-300 block mb-1">Semana fin:</label>
                          <Select value={semanaFin.toString()} onValueChange={(v) => setSemanaFin(parseInt(v))}>
                            <SelectTrigger className="h-8 bg-gray-700/50 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {Array.from({length: totalSemanasAño}, (_, i) => i + 1)
                                .filter(week => week >= semanaInicio)
                                .map(week => (
                                <SelectItem key={week} value={week.toString()} className="text-white hover:bg-gray-700">S{week}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-10">
              <div ref={containerRef} className="w-full h-[320px] relative">
                <canvas ref={chartRef} className="w-full h-full rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-600/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle>Distribución por Asesor</CardTitle>
              <CardDescription>{asesoresProcesados.length > 8 
                ? `Top 7 asesores + otros (${asesoresProcesados.length - 1} total)`
                : `${asesoresProcesados.length} asesores activos`
              } - {getNombreCliente()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <div className="relative w-full h-[320px]" ref={containerRef}>
                <canvas ref={pieChartRef} className="w-full h-full rounded-lg cursor-pointer" />
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
      </div>
    </TooltipProvider>
  )
}
