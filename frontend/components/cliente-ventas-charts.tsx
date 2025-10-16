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

  // Efecto para dibujar los gráficos
  useEffect(() => {
    console.log('🎨 Iniciando dibujo de gráficos:', {
      loadingVentas,
      datosLength: datos.length,
      asesoresLength: asesoresValores.length,
      chartRef: !!chartRef.current,
      pieChartRef: !!pieChartRef.current
    })

    if (loadingVentas || !chartRef.current || !pieChartRef.current) {
      console.log('⏳ Esperando carga o canvas...')
      return
    }

    const timeoutId = setTimeout(() => {
      const canvas = chartRef.current
      const pieCanvas = pieChartRef.current
      
      if (!canvas || !pieCanvas) {
        console.log('❌ Canvas no disponibles')
        return
      }

      const ctx = canvas.getContext('2d')
      const pieCtx = pieCanvas.getContext('2d')
      
      if (!ctx || !pieCtx) {
        console.log('❌ Contexto de canvas no disponible')
        return
      }

      // Configurar dimensiones y DPI
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      console.log('📐 Dimensiones del canvas:', { width, height, dpr })

      canvas.width = width * dpr
      canvas.height = height * dpr
      pieCanvas.width = width * dpr
      pieCanvas.height = height * dpr

      ctx.scale(dpr, dpr)
      pieCtx.scale(dpr, dpr)

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    pieCtx.clearRect(0, 0, width, height)

      // Dibujar gráfico de barras
      if (datos.length > 0 && Math.max(...datos) > 0) {
        console.log('📊 Dibujando gráfico de barras con datos:', datos)
        const maxValue = Math.max(...datos)
        const barWidth = Math.max((width - 100) / datos.length, 10)
        const chartHeight = height - 80

        // Fondo con gradiente sutil
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
        bgGradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)')
        bgGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)')
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, width, height)

        datos.forEach((value, index) => {
          const barHeight = (value / maxValue) * chartHeight
          const x = 50 + index * barWidth
          const y = height - 40 - barHeight

          // Crear gradiente para la barra
          const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight)
          const baseColor = modernColors[index % modernColors.length]
          barGradient.addColorStop(0, baseColor)
          barGradient.addColorStop(1, baseColor + 'CC') // Más transparente abajo

          // Sombra de la barra
          ctx.save()
          ctx.shadowColor = baseColor + '40'
          ctx.shadowBlur = 15
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 5

          // Dibujar barra con bordes redondeados
          ctx.fillStyle = barGradient
          const radius = 4
          ctx.beginPath()
          ctx.roundRect(x, y, barWidth - 5, barHeight, radius)
          ctx.fill()

          // Borde brillante
          ctx.strokeStyle = baseColor + '80'
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.restore()

          // Dibujar valor con estilo
          if (value > 0) {
            ctx.save()
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
            ctx.shadowBlur = 2
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 12px Inter'
            ctx.textAlign = 'center'
            ctx.fillText(value.toString(), x + barWidth/2, y - 8)
            ctx.restore()
          }
        })

        // Líneas de cuadrícula sutiles
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        for (let i = 1; i <= 4; i++) {
          const gridY = height - 40 - (chartHeight / 4) * i
          ctx.beginPath()
          ctx.moveTo(50, gridY)
          ctx.lineTo(width - 50, gridY)
          ctx.stroke()
        }

        // Dibujar eje X con estilo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(50, height - 40)
        ctx.lineTo(width - 50, height - 40)
        ctx.stroke()

        // Dibujar labels con estilo
        labels.forEach((label, index) => {
          ctx.save()
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          ctx.shadowBlur = 1
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          ctx.fillStyle = '#e2e8f0'
          ctx.font = '11px Inter'
          ctx.textAlign = 'center'
          ctx.fillText(label, 50 + index * barWidth + barWidth/2, height - 20)
          ctx.restore()
        })
      } else {
        console.log('📭 No hay datos para dibujar gráfico de barras')
        // Dibujar mensaje de "sin datos"
        ctx.fillStyle = '#666'
        ctx.font = '16px Inter'
        ctx.textAlign = 'center'
        ctx.fillText('No hay datos de ventas para mostrar', width/2, height/2)
      }

      // Dibujar gráfico circular de asesores
      if (asesoresValores.length > 0 && estadisticas.totalVentas > 0) {
        console.log('🥧 Dibujando gráfico circular con asesores:', asesoresValores)
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 3
        let startAngle = 0

        // Sombra del gráfico completo
        pieCtx.save()
        pieCtx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        pieCtx.shadowBlur = 20
        pieCtx.shadowOffsetX = 0
        pieCtx.shadowOffsetY = 10

        asesoresValores.forEach((value, index) => {
          const sliceAngle = (value / estadisticas.totalVentas) * 2 * Math.PI
          const baseColor = modernColors[index % modernColors.length]
          
          // Crear gradiente radial para el sector
          const gradient = pieCtx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
          )
          gradient.addColorStop(0, baseColor + 'FF')
          gradient.addColorStop(0.7, baseColor + 'CC')
          gradient.addColorStop(1, baseColor + '80')

          // Dibujar sector con gradiente
          pieCtx.beginPath()
          pieCtx.moveTo(centerX, centerY)
          pieCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
          pieCtx.closePath()
          pieCtx.fillStyle = gradient
          pieCtx.fill()

          // Borde brillante del sector
          pieCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          pieCtx.lineWidth = 3
          pieCtx.stroke()

          // Líneas hacia los labels
          const labelRadius = radius + 30
          const midAngle = startAngle + sliceAngle / 2
          const labelX = centerX + Math.cos(midAngle) * labelRadius
          const labelY = centerY + Math.sin(midAngle) * labelRadius

          // Línea conectora
          pieCtx.beginPath()
          pieCtx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius)
          pieCtx.lineTo(labelX, labelY)
          pieCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
          pieCtx.lineWidth = 2
          pieCtx.stroke()

          // Label con fondo
          const labelText = `${asesoresNombres[index]}: ${value}`
          pieCtx.font = 'bold 12px Inter'
          pieCtx.textAlign = midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? 'end' : 'start'
          
          // Fondo del label
          const textWidth = pieCtx.measureText(labelText).width
          const labelPadding = 8
          const labelBgX = midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? labelX - textWidth - labelPadding : labelX + labelPadding
          const labelBgY = labelY - 6
          
          pieCtx.fillStyle = baseColor + 'E6'
          pieCtx.fillRect(labelBgX - 4, labelBgY - 12, textWidth + 8, 20)
          
          // Borde del label
          pieCtx.strokeStyle = baseColor
          pieCtx.lineWidth = 1
          pieCtx.strokeRect(labelBgX - 4, labelBgY - 12, textWidth + 8, 20)
          
          // Texto del label
          pieCtx.fillStyle = '#ffffff'
          pieCtx.fillText(labelText, labelX, labelY)

          startAngle += sliceAngle
        })

        pieCtx.restore()

        // Centro del gráfico con efecto glassmorphism
        pieCtx.save()
        const centerGradient = pieCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.4)
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)')
        centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
        
        pieCtx.fillStyle = centerGradient
        pieCtx.beginPath()
        pieCtx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI)
        pieCtx.fill()
        
        pieCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        pieCtx.lineWidth = 2
        pieCtx.stroke()
        pieCtx.restore()

        // Texto central
        pieCtx.save()
        pieCtx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        pieCtx.shadowBlur = 3
        pieCtx.shadowOffsetX = 1
        pieCtx.shadowOffsetY = 1
        pieCtx.fillStyle = '#ffffff'
        pieCtx.font = 'bold 16px Inter'
        pieCtx.textAlign = 'center'
        pieCtx.fillText('Total', centerX, centerY - 5)
        pieCtx.font = 'bold 20px Inter'
        pieCtx.fillText(estadisticas.totalVentas.toString(), centerX, centerY + 15)
        pieCtx.restore()
      } else {
        console.log('📭 No hay datos para dibujar gráfico circular')
        // Dibujar mensaje de "sin datos"
        pieCtx.fillStyle = '#666'
        pieCtx.font = '16px Inter'
        pieCtx.textAlign = 'center'
        pieCtx.fillText('No hay datos de asesores para mostrar', width/2, height/2)
      }

      console.log('✅ Gráficos dibujados exitosamente')
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [datos, labels, asesoresValores, estadisticas, loadingVentas, modernColors])

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
                          {tooltip.value} ventas realizadas
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