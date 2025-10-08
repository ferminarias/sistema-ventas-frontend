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
  // Validacion defensiva para cliente
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
      </div>
    )
  }

  const { ventas, loading: loadingVentas } = useVentas(cliente.toLowerCase())
  
  // Estados del componente
  const [activeTab, setActiveTab] = useState("mensual")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [semanaInicio, setSemanaInicio] = useState(1)
  const [semanaFin, setSemanaFin] = useState(53)
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<any>(null)
  const [hoveredProgramaIndex, setHoveredProgramaIndex] = useState<number | null>(null)
  const [programaTooltip, setProgramaTooltip] = useState<any>(null)
  const [dimensions, setDimensions] = useState({ width: 500, height: 300 })

  // Referencias para canvas
  const chartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const programaChartRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Debug: Log para verificar que se están cargando todas las ventas para "general"
  useEffect(() => {
    console.log(`📊 ClienteVentasCharts - Cliente: "${cliente}"`)
    console.log(`📊 Total ventas cargadas: ${ventas?.length || 0}`)
    console.log(`📊 Loading: ${loadingVentas}`)
    if (cliente.toLowerCase() === 'general') {
      console.log('🌍 Modo GENERAL activado - deberían mostrarse TODAS las ventas')
      console.log('📋 Primeras 3 ventas:', ventas?.slice(0, 3))
    }
  }, [cliente, ventas?.length, loadingVentas])

  // Calcular total de semanas en el año
  const totalSemanasAño = 53

  // Efecto para actualizar dimensiones del contenedor
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: Math.max(rect.width, 400), height: Math.max(rect.height, 300) })
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Función para obtener los años disponibles
  const getYearsAvailable = () => {
    const years = new Set<number>()
    
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
  const setTrimestre = (trimestre: number) => {
    const semanasPorTrimestre = Math.floor(totalSemanasAño / 4)
    setSemanaInicio((trimestre - 1) * semanasPorTrimestre + 1)
    setSemanaFin(Math.min(trimestre * semanasPorTrimestre, totalSemanasAño))
  }

  const resetFiltros = () => {
    setSemanaInicio(1)
    setSemanaFin(totalSemanasAño)
    setShowFilters(false)
  }

  // Obtener descripción del período
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

  // Utilidad para mostrar el nombre real del cliente
  const getNombreCliente = () => {
    if (cliente === "all") return "Todos los clientes"
    if (clientIdToName && clientIdToName[String(cliente)]) return clientIdToName[String(cliente)]
    return nombreCliente || cliente
  }

  if (loadingVentas) {
    return (
      <TooltipProvider>
        <div className="space-y-6">
          <Card className="border-2 border-dashed border-border bg-card/50">
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center space-y-2">
                <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
                <p className="text-muted-foreground">Cargando datos de ventas...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header con información del cliente */}
        <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                    {getNombreCliente()[0]?.toUpperCase() || "?"}
                  </div>
                  Gráficos de {getNombreCliente()}
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {getDescripcionPeriodo()} • Cliente ID: {cliente}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  <Users className="w-3 h-3 mr-1" />
                {ventas?.length || 0} ventas
              </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Pestañas para cambiar vista */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mensual">Vista Mensual</TabsTrigger>
                <TabsTrigger value="semanal">Vista Semanal</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Contenido principal */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 border-dashed border-border bg-card/50">
            <CardContent className="flex items-center justify-center h-48">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-muted-foreground">
                  Gráficos temporalmente simplificados
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total de ventas: {ventas?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-border bg-card/50">
            <CardContent className="flex items-center justify-center h-48">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4">📈</div>
                <p className="text-muted-foreground">
                  Análisis por {activeTab === "mensual" ? "meses" : "semanas"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Año: {selectedYear}
                </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}