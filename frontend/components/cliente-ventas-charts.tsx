"use client"

import * as React from "react"
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

interface PieSliceMeta {
  start: number
  end: number
  startNormalized: number
  endNormalized: number
  value: number
  label: string
  innerRadius: number
  outerRadius: number
  percentage: number
}

const TAU = Math.PI * 2

const normalizeAngle = (angle: number) => {
  let normalized = angle % TAU
  if (normalized < 0) {
    normalized += TAU
  }
  return normalized
}

export function ClienteVentasCharts({ cliente, clientIdToName, nombreCliente }: ClienteVentasChartsProps) {
  const [activeTab, setActiveTab] = useState("mensual")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [semanaInicio, setSemanaInicio] = useState(1)
  const [semanaFin, setSemanaFin] = useState(52)
  const [showFilters, setShowFilters] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const pieSlicesRef = useRef<PieSliceMeta[]>([])
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{x: number, y: number, label: string, value: number, percentage: number} | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 500, height: 300 })

  // Estados para el nuevo grafico de programas
  const programaChartRef = useRef<HTMLCanvasElement>(null)
  const [hoveredProgramaIndex, setHoveredProgramaIndex] = useState<number | null>(null)
  const [programaTooltip, setProgramaTooltip] = useState<{x: number, y: number, label: string, value: number} | null>(null)

  // Estado para programa seleccionado y sus ventas
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newDimensions = { 
          width: Math.max(rect.width, 300), // Mínimo 300px
          height: Math.max(rect.height, 200) // Mínimo 200px
        };
        console.log('📐 Actualizando dimensiones:', newDimensions);
        setDimensions(newDimensions);
      }
    };
    
    // Esperar un poco antes de la primera medición
    const initialTimeout = setTimeout(updateSize, 100);
    
    const observer = new ResizeObserver(() => {
      // Debounce para evitar múltiples actualizaciones
      setTimeout(updateSize, 50);
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(initialTimeout);
      observer.disconnect();
    };
  }, []);

  // Validación defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-dashed border-border bg-card/50">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Cargando gráficos del cliente...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-dashed border-border bg-card/50">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Cargando distribución...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { ventas, loading: loadingVentas } = useVentas(cliente.toLowerCase())
  
  // Debug: Log para verificar que se están cargando todas las ventas para "general"
  useEffect(() => {
    console.log(`📊 ClienteVentasCharts - Cliente: "${cliente}"`);
    console.log(`📊 Total ventas cargadas: ${ventas?.length || 0}`);
    console.log(`📊 Loading: ${loadingVentas}`);
    if (cliente.toLowerCase() === 'general') {
      console.log('🌍 Modo GENERAL activado - deberían mostrarse TODAS las ventas');
      console.log('📋 Primeras 3 ventas:', ventas?.slice(0, 3));
    }
  }, [cliente, ventas?.length, loadingVentas])

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
    console.log('📊 Procesando datos con ventas:', ventas?.length || 0);
    
    const ventasPorMes = Array(12).fill(0)
    const ventasPorAsesor: Record<string, number> = {}
    const ventasPorPrograma: Record<string, number> = {}
    
    // Verificación defensiva: si ventas no está definido o no es un array, retornar valores por defecto
    if (!ventas || !Array.isArray(ventas)) {
      console.log('⚠️ Ventas no disponibles, usando datos por defecto');
      return {
        datos: ventasPorMes,
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        asesores: ventasPorAsesor,
        programas: ventasPorPrograma
      }
    }
    
    // Caso especial: si no hay ventas pero es un array válido, aún crear estructura
    if (ventas.length === 0) {
      console.log('📭 Array de ventas vacío, creando estructura vacía');
      const labels = activeTab === "mensual" 
        ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        : Array.from({ length: semanaFin - semanaInicio + 1 }, (_, i) => `S${semanaInicio + i}`);
        
      return {
        datos: activeTab === "mensual" ? Array(12).fill(0) : Array(semanaFin - semanaInicio + 1).fill(0),
        labels,
        asesores: ventasPorAsesor,
        programas: ventasPorPrograma
      }
    }
    
    if (activeTab === "mensual") {
      // Datos mensuales del año seleccionado
      ventas.forEach((v) => {
        const fecha = new Date(v.fecha_venta)
        if (isNaN(fecha.getTime()) || fecha.getFullYear() !== selectedYear) return
        
        ventasPorMes[fecha.getMonth()]++
        
        if (v.asesor) {
          ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1
        }
        
        // Procesar programa de interés
        const programa = v.campos_adicionales?.programa_interes || 'Sin programa especificado'
        ventasPorPrograma[programa] = (ventasPorPrograma[programa] || 0) + 1
      })
      
      return {
        datos: ventasPorMes,
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        asesores: ventasPorAsesor,
        programas: ventasPorPrograma
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
          
          // Procesar programa de interés
          const programa = v.campos_adicionales?.programa_interes || 'Sin programa especificado'
          ventasPorPrograma[programa] = (ventasPorPrograma[programa] || 0) + 1
        }
      })
      
      // Generar labels para el rango de semanas seleccionado
      const labels = Array.from({ length: rangoSemanas }, (_, i) => `S${semanaInicio + i}`)
      
      return {
        datos: ventasPorSemana,
        labels: labels,
        asesores: ventasPorAsesor,
        programas: ventasPorPrograma
      }
    }
  }

  const { datos, labels, asesores: ventasPorAsesor, programas: ventasPorPrograma = {} } = procesarDatos()

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

  // Procesar datos de programas - MOSTRAR TODOS LOS PROGRAMAS
  const procesarDatosProgramas = () => {
    const programasArray = Object.entries(ventasPorPrograma)
      .map(([nombre, ventas]) => ({ nombre, ventas }))
      .sort((a, b) => b.ventas - a.ventas)

    // Mostrar TODOS los programas sin agrupar en "Otros"
    // Esto permite ver cada programa individualmente sin pérdida de información
    return programasArray
  }

  const asesoresProcesados = procesarDatosAsesores()
  const asesoresNombres = asesoresProcesados.map(a => a.nombre)
  const asesoresValores = asesoresProcesados.map(a => a.ventas)

  const programasProcesados = procesarDatosProgramas()
  const programasNombres = programasProcesados.map(p => p.nombre)
  const programasValores = programasProcesados.map(p => p.ventas)

  // Obtener años disponibles en los datos
  const getYearsAvailable = () => {
    const years = new Set<number>()
    
    // Verificación defensiva: si ventas no está definido o no es un array, retornar año actual
    if (!ventas || !Array.isArray(ventas)) {
      return [new Date().getFullYear()]
    }
    
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

  // Función para obtener ventas por programa específico
  const getVentasPorPrograma = (nombrePrograma: string) => {
    if (!ventas || !Array.isArray(ventas)) return []

    return ventas.filter(v => {
      const programa = v.campos_adicionales?.programa_interes || 'Sin programa especificado'
      return programa === nombrePrograma
    })
  }

  // Función para obtener descripción del período actual
  const getDescripcionPeriodo = () => {
    if (activeTab === "mensual") {
      return `Datos mensuales del año ${selectedYear}`
    } else {
      if (semanaInicio === 1 && semanaFin === totalSemanasAño) {
        return `${selectedYear} - Todas las semanas (S1-S${totalSemanasAño})`
      }
      return `${selectedYear} - Semanas ${semanaInicio} a ${semanaFin}`
    }
  }

  // Función para obtener nombre del cliente
  const getNombreCliente = () => {
    return nombreCliente && nombreCliente !== "-"
      ? nombreCliente
      : cliente.charAt(0).toUpperCase() + cliente.slice(1)
  }

  // Paleta MODERNA 2025 - Colores vibrantes con cohesión dark theme
  const modernColors = [
    "#8b5cf6", // Violeta vibrante (principal)
    "#06b6d4", // Cyan brillante 
    "#10b981", // Esmeralda moderno
    "#f59e0b", // Ámbar dorado
    "#ef4444", // Rojo coral dinámico
    "#f97316", // Naranja energético
    "#84cc16", // Lima fresco
    "#3b82f6", // Azul tech
    "#ec4899", // Rosa magenta
    "#6366f1", // Índigo profundo
    "#8b5a2b", // Bronce elegante
    "#06b6d4", // Turquesa premium
    "#d946ef", // Fucsia moderno
  ]
  
  // Gradientes para depth y modernidad
  const gradientColors = [
    "linear-gradient(135deg, #8b5cf6, #a78bfa)", // Violeta
    "linear-gradient(135deg, #06b6d4, #67e8f9)", // Cyan
    "linear-gradient(135deg, #10b981, #6ee7b7)", // Esmeralda
    "linear-gradient(135deg, #f59e0b, #fbbf24)", // Ámbar
    "linear-gradient(135deg, #ef4444, #f87171)", // Rojo
    "linear-gradient(135deg, #f97316, #fb923c)", // Naranja
    "linear-gradient(135deg, #84cc16, #a3e635)", // Lima
    "linear-gradient(135deg, #3b82f6, #60a5fa)", // Azul
    "linear-gradient(135deg, #ec4899, #f472b6)", // Rosa
    "linear-gradient(135deg, #6366f1, #818cf8)", // Índigo
  ]

  // Colores específicos para programas (diferentes de asesores)
  const programaColors = [
    "#ef4444", // Rojo vibrante
    "#f97316", // Naranja energético
    "#eab308", // Amarillo dorado
    "#22c55e", // Verde vibrante
    "#06b6d4", // Cyan brillante
    "#3b82f6", // Azul tech
    "#8b5cf6", // Violeta
    "#ec4899", // Rosa magenta
    "#6366f1", // Índigo profundo
    "#84cc16", // Lima fresco
    "#f59e0b", // Ámbar
    "#10b981", // Esmeralda
    "#d946ef", // Fucsia moderno
  ]

  // Efecto para dibujar los graficos
  useEffect(() => {
    if (loadingVentas || !chartRef.current || !pieChartRef.current) {
      console.log("[charts] esperando carga o canvas")
      return
    }

    const canvas = chartRef.current
    const pieCanvas = pieChartRef.current

    const ctx = canvas.getContext("2d")
    const pieCtx = pieCanvas.getContext("2d")

    if (!ctx || !pieCtx) {
      console.log("[charts] contexto de canvas no disponible")
      return
    }

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = rect.width || canvas.width
    const height = rect.height || canvas.height

    canvas.width = width * dpr
    canvas.height = height * dpr
    pieCanvas.width = width * dpr
    pieCanvas.height = height * dpr

    ctx.scale(dpr, dpr)
    pieCtx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)
    pieCtx.clearRect(0, 0, width, height)

    if (datos.length > 0 && Math.max(...datos) > 0) {
      const maxValue = Math.max(...datos)
      const barWidth = Math.max((width - 100) / datos.length, 15)
      const chartHeight = height - 80

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      bgGradient.addColorStop(0, "rgba(59, 130, 246, 0.04)")
      bgGradient.addColorStop(1, "rgba(59, 130, 246, 0.01)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)"
      ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) {
        const gridY = height - 40 - (chartHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(50, gridY)
        ctx.lineTo(width - 50, gridY)
        ctx.stroke()
      }

      datos.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight
        const x = 50 + index * barWidth
        const y = height - 40 - barHeight
        const baseColor = modernColors[index % modernColors.length]

        const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight)
        barGradient.addColorStop(0, baseColor)
        barGradient.addColorStop(0.65, baseColor + "DD")
        barGradient.addColorStop(1, baseColor + "99")

        ctx.save()
        ctx.shadowColor = baseColor + "35"
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4

        ctx.fillStyle = barGradient
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth - 8, barHeight, 6)
        ctx.fill()

        ctx.strokeStyle = baseColor + "80"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()

        if (value > 0) {
          ctx.save()
          ctx.shadowColor = "rgba(15, 23, 42, 0.45)"
          ctx.shadowBlur = 2
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 11px Inter"
          ctx.textAlign = "center"
          ctx.fillText(value.toString(), x + barWidth / 2, y - 8)
          ctx.restore()
        }
      })

      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(50, height - 40)
      ctx.lineTo(width - 50, height - 40)
      ctx.stroke()

      labels.forEach((label, index) => {
        ctx.fillStyle = "#cbd5e1"
        ctx.font = "11px Inter"
        ctx.textAlign = "center"
        ctx.fillText(label, 50 + index * barWidth + barWidth / 2, height - 18)
      })
    } else {
      ctx.fillStyle = "#666"
      ctx.font = "16px Inter"
      ctx.textAlign = "center"
      ctx.fillText("No hay datos de ventas para mostrar", width / 2, height / 2)
    }

    pieSlicesRef.current = []

    if (asesoresValores.length > 0 && estadisticas.totalVentas > 0) {
      const centerX = width / 2
      const centerY = height / 2
      const baseOuterRadius = Math.min(width, height) * 0.32
      const baseInnerRadius = baseOuterRadius * 0.58
      let startAngle = -Math.PI / 2

      const backgroundGlow = pieCtx.createRadialGradient(centerX, centerY, baseInnerRadius * 0.4, centerX, centerY, baseOuterRadius * 2.2)
      backgroundGlow.addColorStop(0, "rgba(15, 23, 42, 0.55)")
      backgroundGlow.addColorStop(1, "rgba(15, 23, 42, 0)")
      pieCtx.fillStyle = backgroundGlow
      pieCtx.fillRect(0, 0, width, height)

      const slicesMeta: PieSliceMeta[] = []

      asesoresValores.forEach((value, index) => {
        const sliceAngle = (value / estadisticas.totalVentas) * TAU
        const midAngle = startAngle + sliceAngle / 2
        const normalizedMid = normalizeAngle(midAngle)
        const isHovered = hoveredPieIndex === index
        const outerRadius = baseOuterRadius + (isHovered ? 18 : 8)
        const innerRadius = Math.max(baseInnerRadius - (isHovered ? 8 : 0), baseInnerRadius * 0.65)
        const baseColor = modernColors[index % modernColors.length]
        const percentage = estadisticas.totalVentas > 0 ? (value / estadisticas.totalVentas) * 100 : 0

        const gradient = pieCtx.createLinearGradient(
          centerX + Math.cos(midAngle - Math.PI / 2) * innerRadius,
          centerY + Math.sin(midAngle - Math.PI / 2) * innerRadius,
          centerX + Math.cos(midAngle + Math.PI / 2) * outerRadius,
          centerY + Math.sin(midAngle + Math.PI / 2) * outerRadius
        )
        gradient.addColorStop(0, baseColor + "33")
        gradient.addColorStop(0.5, baseColor)
        gradient.addColorStop(1, baseColor + "F0")

        pieCtx.save()
        pieCtx.beginPath()
        pieCtx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle)
        pieCtx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true)
        pieCtx.closePath()

        pieCtx.shadowColor = baseColor + (isHovered ? "90" : "40")
        pieCtx.shadowBlur = isHovered ? 26 : 12
        pieCtx.shadowOffsetX = 0
        pieCtx.shadowOffsetY = 0

        pieCtx.fillStyle = gradient
        pieCtx.fill()

        pieCtx.lineWidth = isHovered ? 3 : 1.6
        pieCtx.strokeStyle = isHovered ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.2)"
        pieCtx.stroke()
        pieCtx.restore()

        const connectorRadius = outerRadius + 6
        const labelRadius = outerRadius + 36
        const connectorX = centerX + Math.cos(midAngle) * connectorRadius
        const connectorY = centerY + Math.sin(midAngle) * connectorRadius
        const labelX = centerX + Math.cos(midAngle) * labelRadius
        const labelY = centerY + Math.sin(midAngle) * labelRadius
        const drawLeft = normalizedMid > Math.PI / 2 && normalizedMid < (3 * Math.PI) / 2

        pieCtx.save()
        pieCtx.beginPath()
        pieCtx.moveTo(connectorX, connectorY)
        pieCtx.lineTo(labelX, labelY)
        pieCtx.strokeStyle = baseColor + (isHovered ? "B0" : "70")
        pieCtx.lineWidth = isHovered ? 1.5 : 1
        pieCtx.stroke()
        pieCtx.restore()

        pieCtx.save()
        pieCtx.font = "600 10px Inter"
        pieCtx.textAlign = drawLeft ? "end" : "start"
        pieCtx.textBaseline = "middle"
        const labelText = `${asesoresNombres[index]} - ${value} (${percentage.toFixed(1)}%)`
        const textWidth = pieCtx.measureText(labelText).width
        const paddingX = 10
        const paddingY = 6
        const bgWidth = textWidth + paddingX * 2
        const bgHeight = 22
        const bgX = drawLeft ? labelX - bgWidth : labelX
        const bgY = labelY - bgHeight / 2

        const labelGradient = pieCtx.createLinearGradient(bgX, bgY, bgX, bgY + bgHeight)
        labelGradient.addColorStop(0, baseColor + "E0")
        labelGradient.addColorStop(1, baseColor + "B0")

        pieCtx.globalAlpha = isHovered ? 0.98 : 0.88
        pieCtx.beginPath()
        pieCtx.roundRect(bgX, bgY, bgWidth, bgHeight, 10)
        pieCtx.fillStyle = labelGradient
        pieCtx.fill()
        pieCtx.globalAlpha = 1

        pieCtx.strokeStyle = baseColor + "75"
        pieCtx.lineWidth = 1
        pieCtx.stroke()

        const textX = drawLeft ? bgX + bgWidth - paddingX : bgX + paddingX
        pieCtx.fillStyle = "#ffffff"
        pieCtx.fillText(labelText, textX, labelY)
        pieCtx.restore()

        slicesMeta.push({
          start: startAngle,
          end: startAngle + sliceAngle,
          startNormalized: normalizeAngle(startAngle),
          endNormalized: normalizeAngle(startAngle + sliceAngle),
          value,
          label: asesoresNombres[index],
          innerRadius,
          outerRadius,
          percentage
        })

        startAngle += sliceAngle
      })

      pieSlicesRef.current = slicesMeta

      if (hoveredPieIndex !== null && hoveredPieIndex >= slicesMeta.length) {
        setHoveredPieIndex(null)
      }

      const selectedSlice = hoveredPieIndex !== null ? asesoresProcesados[hoveredPieIndex] : undefined
      const centerRadius = Math.max(baseInnerRadius - 6, baseInnerRadius * 0.82)
      const centerGradient = pieCtx.createRadialGradient(centerX, centerY, centerRadius * 0.25, centerX, centerY, centerRadius)
      centerGradient.addColorStop(0, selectedSlice ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.22)")
      centerGradient.addColorStop(1, "rgba(15, 23, 42, 0.92)")

      pieCtx.save()
      pieCtx.beginPath()
      pieCtx.arc(centerX, centerY, centerRadius, 0, TAU)
      pieCtx.fillStyle = centerGradient
      pieCtx.fill()
      pieCtx.strokeStyle = "rgba(255, 255, 255, 0.18)"
      pieCtx.lineWidth = 1
      pieCtx.stroke()
      pieCtx.restore()

      pieCtx.save()
      pieCtx.textAlign = "center"
      pieCtx.textBaseline = "middle"
      if (selectedSlice) {
        const porcentaje = estadisticas.totalVentas > 0
          ? Math.round((selectedSlice.ventas / estadisticas.totalVentas) * 1000) / 10
          : 0

        pieCtx.fillStyle = "#cbd5f5"
        pieCtx.font = "600 13px Inter"
        pieCtx.fillText(selectedSlice.nombre, centerX, centerY - 24)

        pieCtx.fillStyle = "#f8fafc"
        pieCtx.font = "700 28px Inter"
        pieCtx.fillText(String(selectedSlice.ventas), centerX, centerY + 4)

        pieCtx.fillStyle = "rgba(148, 163, 184, 0.92)"
        pieCtx.font = "500 12px Inter"
        pieCtx.fillText(`${porcentaje}% del total`, centerX, centerY + 28)
      } else {
        pieCtx.fillStyle = "#cbd5f5"
        pieCtx.font = "600 13px Inter"
        pieCtx.fillText("Total de ventas", centerX, centerY - 20)

        pieCtx.fillStyle = "#f8fafc"
        pieCtx.font = "700 30px Inter"
        pieCtx.fillText(String(estadisticas.totalVentas), centerX, centerY + 6)

        pieCtx.fillStyle = "rgba(148, 163, 184, 0.9)"
        pieCtx.font = "500 12px Inter"
        pieCtx.fillText(`${asesoresProcesados.length} asesores activos`, centerX, centerY + 30)
      }
      pieCtx.restore()
    } else {
      pieCtx.fillStyle = "#666"
      pieCtx.font = "16px Inter"
      pieCtx.textAlign = "center"
      pieCtx.fillText("No hay datos de asesores para mostrar", width / 2, height / 2)
    }
  }, [datos, labels, asesoresValores, estadisticas, loadingVentas, modernColors, hoveredPieIndex, asesoresNombres.join("|"), asesoresProcesados.length])

  // Efectos hover para interactividad profesional
  useEffect(() => {
    if (!chartRef.current || !pieChartRef.current) {
      return
    }

    const barCanvas = chartRef.current
    const pieCanvas = pieChartRef.current

    const handleBarHover = () => {
      barCanvas.style.cursor = datos.length > 0 ? "pointer" : "default"
    }

    const handleBarLeave = () => {
      barCanvas.style.cursor = "default"
    }

    const handlePieHover = (event: MouseEvent) => {
      const rect = pieCanvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const pointAngle = Math.atan2(dy, dx)
      const normalizedAngle = normalizeAngle(pointAngle)

      const slices = pieSlicesRef.current
      let foundIndex: number | null = null
      let foundSlice: PieSliceMeta | null = null

      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i]
        const withinRadius = distance >= slice.innerRadius && distance <= slice.outerRadius + 6
        if (!withinRadius) {
          continue
        }

        const angleMatches = slice.startNormalized <= slice.endNormalized
          ? normalizedAngle >= slice.startNormalized && normalizedAngle <= slice.endNormalized
          : normalizedAngle >= slice.startNormalized || normalizedAngle <= slice.endNormalized

        if (angleMatches) {
          foundIndex = i
          foundSlice = slice
          break
        }
      }

      if (foundSlice) {
        pieCanvas.style.cursor = "pointer"
        if (hoveredPieIndex !== foundIndex) {
          setHoveredPieIndex(foundIndex)
        }

        const slice = foundSlice
        const roundedPercentage = Math.round(slice.percentage * 10) / 10

        setTooltip(prev => {
          if (
            prev &&
            prev.label === slice.label &&
            prev.value === slice.value &&
            prev.percentage === roundedPercentage &&
            prev.x === event.clientX &&
            prev.y === event.clientY
          ) {
            return prev
          }

          return {
            x: event.clientX,
            y: event.clientY,
            label: slice.label,
            value: slice.value,
            percentage: roundedPercentage
          }
        })
      } else {
        pieCanvas.style.cursor = "default"
        if (hoveredPieIndex !== null) {
          setHoveredPieIndex(null)
        }
        setTooltip(null)
      }
    }

    const handlePieLeave = () => {
      pieCanvas.style.cursor = "default"
      if (hoveredPieIndex !== null) {
        setHoveredPieIndex(null)
      }
      setTooltip(null)
    }

    barCanvas.addEventListener("mousemove", handleBarHover)
    barCanvas.addEventListener("mouseleave", handleBarLeave)
    pieCanvas.addEventListener("mousemove", handlePieHover)
    pieCanvas.addEventListener("mouseleave", handlePieLeave)

    return () => {
      barCanvas.removeEventListener("mousemove", handleBarHover)
      barCanvas.removeEventListener("mouseleave", handleBarLeave)
      pieCanvas.removeEventListener("mousemove", handlePieHover)
      pieCanvas.removeEventListener("mouseleave", handlePieLeave)
    }
  }, [datos, hoveredPieIndex])


    return (
    <TooltipProvider>
      <div className="w-full space-y-4 px-2">
        {/* Mostrar estado de carga si esta cargando */}
        {loadingVentas ? (
          <div className="grid gap-6 grid-cols-1">
        <Card className="border-2 border-dashed border-border bg-card/50">
              <CardContent className="flex items-center justify-center h-96">
            <div className="text-center space-y-2">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
                  <p className="text-muted-foreground">Cargando datos de ventas...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-dashed border-border bg-card/50">
              <CardContent className="flex items-center justify-center h-96">
            <div className="text-center space-y-2">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
                  <p className="text-muted-foreground">Cargando distribución por asesor...</p>
            </div>
          </CardContent>
        </Card>
            <Card className="border-2 border-dashed border-border bg-card/50">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
                  <p className="text-muted-foreground">Cargando distribución por programa...</p>
      </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            {/* Estadisticas destacadas - Responsive al tema */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Ventas</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-blue-600/70 dark:text-blue-400/70 hover:text-blue-700 dark:hover:text-blue-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{tooltips.totalVentas}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-100">{estadisticas.totalVentas}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Promedio</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-green-600/70 dark:text-green-400/70 hover:text-green-700 dark:hover:text-green-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{tooltips.promedio}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-100">{estadisticas.promedioVentas}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Máximo</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-purple-600/70 dark:text-purple-400/70 hover:text-purple-700 dark:hover:text-purple-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{tooltips.maximo}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">{estadisticas.maxVentas}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30 backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Asesores</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-orange-600/70 dark:text-orange-400/70 hover:text-orange-700 dark:hover:text-orange-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{tooltips.asesores}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-100">{estadisticas.totalAsesores}</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico principal de ventas - Centrado y amplio */}
            <div className="grid gap-4 grid-cols-1">
              <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-bold text-foreground mb-2">
                        {nombreCliente && nombreCliente !== "-"
                          ? `📊 Ventas de ${nombreCliente}`
                          : "Cargando..."}
                      </CardTitle>
                      <CardDescription className="text-base text-muted-foreground">
                        {getDescripcionPeriodo()}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {datos.length} períodos
                    </Badge>
                  </div>

                  {/* Controles responsive al tema */}
                  <div className="space-y-4 mt-4">
                    <Tabs defaultValue="mensual" className="w-full" onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="mensual">
                          📅 Por Meses
                        </TabsTrigger>
                        <TabsTrigger value="semanal">
                          📊 Semanas ISO
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex flex-wrap gap-2 items-center">
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
                          >
                            <Filter className="h-4 w-4 mr-1" />
                            Filtros
                          </Button>

                          {(semanaInicio !== 1 || semanaFin !== totalSemanasAño) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetFiltros}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Panel de filtros expandible - Responsive al tema */}
                    {activeTab === "semanal" && showFilters && (
                      <Card className="bg-muted/50 border-border backdrop-blur-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm font-medium text-foreground">Filtros rápidos:</span>
                            <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(1)} className="h-7 text-xs">
                              Q1 (S1-13)
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(2)} className="h-7 text-xs">
                              Q2 (S14-26)
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(3)} className="h-7 text-xs">
                              Q3 (S27-39)
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setRangoTrimestre(4)} className="h-7 text-xs">
                              Q4 (S40-{totalSemanasAño})
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-foreground block mb-1">Semana inicio:</label>
                              <Select value={semanaInicio.toString()} onValueChange={(v) => setSemanaInicio(parseInt(v))}>
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({length: totalSemanasAño}, (_, i) => i + 1).map(week => (
                                    <SelectItem key={week} value={week.toString()}>S{week}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-foreground block mb-1">Semana fin:</label>
                              <Select value={semanaFin.toString()} onValueChange={(v) => setSemanaFin(parseInt(v))}>
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({length: totalSemanasAño}, (_, i) => i + 1)
                                    .filter(week => week >= semanaInicio)
                                    .map(week => (
                                    <SelectItem key={week} value={week.toString()}>S{week}</SelectItem>
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
                <CardContent className="pb-4 flex justify-center">
                  <div ref={containerRef} className="w-full max-w-5xl h-[350px] relative">
                    <canvas ref={chartRef} className="w-full h-full rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos secundarios - Cada uno ocupa toda la fila */}
            <div className="grid gap-4 grid-cols-1">
              <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-foreground text-3xl font-bold">Distribución por Asesor</CardTitle>
                  <CardDescription className="text-muted-foreground">{asesoresProcesados.length > 8
                    ? `Top 7 asesores + otros (${asesoresProcesados.length - 1} total)`
                    : `${asesoresProcesados.length} asesores activos`
                  } - {getNombreCliente()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex justify-center">
                  <div className="relative w-full max-w-4xl h-[300px]" ref={containerRef}>
                    <canvas ref={pieChartRef} className="w-full h-full rounded-lg cursor-pointer" />
                    {tooltip && (
                      <div
                        style={{
                          position: 'fixed',
                          left: tooltip.x + 15,
                          top: tooltip.y + 15,
                          zIndex: 50,
                          pointerEvents: 'none'
                        }}
                        className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-purple-500/30 backdrop-blur-md animate-fade-in"
                      >
                        <div className="font-bold text-purple-300 text-sm">{tooltip.label}</div>
                        <div className="text-cyan-100 text-xs mt-1">
                          {tooltip.value} ventas - {tooltip.percentage.toFixed(1)}%
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-purple-500 to-cyan-500 mt-2 opacity-50"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-foreground text-2xl flex items-center justify-center gap-2">
                    📚 Distribución por Programa
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {programasProcesados.length} programa{programasProcesados.length !== 1 ? 's' : ''} de interés - {getNombreCliente()}
                    <span className="text-xs text-green-400 ml-2">
                      (Todos los programas)
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  {programasProcesados.length > 0 ? (
                    <div className="space-y-3">
                      {programasProcesados.map((programa, index) => {
                        const ventasPrograma = getVentasPorPrograma(programa.nombre)
                        const isExpanded = programaSeleccionado === programa.nombre
                        const porcentaje = ((programa.ventas / estadisticas.totalVentas) * 100).toFixed(1)

                        return (
                          <div key={index} className="border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md">
                            <button
                              onClick={() => setProgramaSeleccionado(isExpanded ? null : programa.nombre)}
                              className="w-full p-4 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md"
                                    style={{ backgroundColor: programaColors[index % programaColors.length] }}
                                  >
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {programa.nombre}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {programa.ventas} venta{programa.ventas !== 1 ? 's' : ''} • {porcentaje}% del total
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-foreground">
                                      {programa.ventas}
                                    </div>
                                  </div>
                                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Barra de progreso */}
                              <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    backgroundColor: programaColors[index % programaColors.length],
                                    width: `${porcentaje}%`
                                  }}
                                />
                              </div>
                            </button>

                            {/* Panel expandible con detalles de ventas */}
                            {isExpanded && (
                              <div className="border-t border-border bg-muted/30 p-4 animate-in slide-in-from-top-2 duration-300">
                                <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: programaColors[index % programaColors.length] }}></span>
                                  Detalles de ventas ({ventasPrograma.length})
                                </h5>

                                {ventasPrograma.length > 0 ? (
                                  <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                    {ventasPrograma.map((venta, ventaIndex) => (
                                      <div
                                        key={ventaIndex}
                                        className="bg-card p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                                      >
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div>
                                            <span className="text-muted-foreground">Cliente:</span>
                                            <p className="font-medium text-foreground">{venta.nombre} {venta.apellido}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Email:</span>
                                            <p className="font-medium text-foreground truncate">{venta.email || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Asesor:</span>
                                            <p className="font-medium text-foreground">{venta.asesor}</p>
                                          </div>
                                          <div>
                                            <span className="text-muted-foreground">Fecha:</span>
                                            <p className="font-medium text-foreground">
                                              {new Date(venta.fecha_venta).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                              })}
                                            </p>
                                          </div>
                                          {venta.campos_adicionales?.modalidad && (
                                            <div>
                                              <span className="text-muted-foreground">Modalidad:</span>
                                              <p className="font-medium text-foreground">{venta.campos_adicionales.modalidad}</p>
                                            </div>
                                          )}
                                          {venta.campos_adicionales?.turno && (
                                            <div>
                                              <span className="text-muted-foreground">Turno:</span>
                                              <p className="font-medium text-foreground">{venta.campos_adicionales.turno}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No hay ventas para este programa</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                          📚
                        </div>
                        <p className="text-muted-foreground text-sm">No hay datos de programas disponibles</p>
                        <p className="text-muted-foreground text-xs">Los programas se mostrarán cuando haya ventas con campo "programa_interes"</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
