"use client"

// Gráficos mejorados con soporte retina y semanas ISO del año - v2025.01
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, TrendingUp, Users, Filter, RotateCcw } from "lucide-react"
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

  // Validación defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <CalendarDays className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-500">Cargando gráficos del cliente...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <Users className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-500">Cargando distribución...</p>
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

    // Dibujar gráfico de barras con gradiente
    const barWidth = width / (datos.length * 1.3)
    const maxValue = Math.max(...datos, 1)
    const margin = 50
    const chartHeight = height - margin
    
    // Crear gradiente para las barras
    const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight)
    gradient.addColorStop(0, "#8b5cf6")
    gradient.addColorStop(1, "#7c3aed")
    
    datos.forEach((value, index) => {
      const x = (index * (width - margin)) / datos.length + margin / 2
      const barHeight = (value / maxValue) * (chartHeight - 60)
      const barActualWidth = Math.min(barWidth, (width - margin) / datos.length - 4)
      
      // Sombra de la barra
      ctx.fillStyle = "rgba(124, 58, 237, 0.2)"
      ctx.fillRect(x + 2, chartHeight - barHeight - 18, barActualWidth, barHeight)
      
      // Barra principal con gradiente
      ctx.fillStyle = gradient
      ctx.fillRect(x, chartHeight - barHeight - 20, barActualWidth, barHeight)
      
      // Borde de la barra
      ctx.strokeStyle = "#6d28d9"
      ctx.lineWidth = 1
      ctx.strokeRect(x, chartHeight - barHeight - 20, barActualWidth, barHeight)
      
      // Etiquetas de eje X
      const shouldShowLabel = datos.length <= 24 || index % Math.ceil(datos.length / 16) === 0
      if (shouldShowLabel) {
        ctx.fillStyle = "#4b5563"
        ctx.font = "10px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.save()
        ctx.translate(x + barActualWidth / 2, height - 8)
        if (activeTab === "semanal" && datos.length > 24) {
          ctx.rotate(-Math.PI / 6)
        }
        ctx.fillText(labels[index], 0, 0)
        ctx.restore()
      }
      
      // Valor encima de la barra
      if (value > 0 && barHeight > 20) {
        ctx.fillStyle = "#374151"
        ctx.font = "bold 10px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(value.toString(), x + barActualWidth / 2, chartHeight - barHeight - 30)
      }
    })

    // Dibujar gráfico circular con mejor estética
    if (asesoresValores.length > 0) {
      const centerX = width * 0.6
      const centerY = height / 2
      const radius = Math.min(centerX - 30, centerY - 30)
      
      // Paleta de colores más moderna
      const colors = [
        "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
        "#ec4899", "#8b5a2b", "#6b7280", "#84cc16", "#f97316",
        "#6366f1", "#14b8a6", "#a855f7"
      ]
      
      let startAngle = 0
      const total = asesoresValores.reduce((acc, val) => acc + val, 0) || 1

      // Dibujar sectores con efecto 3D
      asesoresValores.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI
        
        // Sombra del sector
        pieCtx.beginPath()
        pieCtx.moveTo(centerX + 2, centerY + 2)
        pieCtx.arc(centerX + 2, centerY + 2, radius, startAngle, startAngle + sliceAngle)
        pieCtx.closePath()
        pieCtx.fillStyle = "rgba(0, 0, 0, 0.1)"
        pieCtx.fill()
        
        // Sector principal
        pieCtx.beginPath()
        pieCtx.moveTo(centerX, centerY)
        pieCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
        pieCtx.closePath()
        pieCtx.fillStyle = colors[index % colors.length]
        pieCtx.fill()
        
        // Borde del sector
        pieCtx.strokeStyle = "#ffffff"
        pieCtx.lineWidth = 3
        pieCtx.stroke()
        
        startAngle += sliceAngle
      })

      // Leyenda mejorada
      const legendStartX = 20
      const legendStartY = 30
      const legendItemHeight = 24
      const maxLegendItems = Math.min(asesoresNombres.length, 9)

      asesoresNombres.slice(0, maxLegendItems).forEach((legend, index) => {
        const y = legendStartY + index * legendItemHeight
        
        // Círculo de color en lugar de cuadrado
        pieCtx.beginPath()
        pieCtx.arc(legendStartX + 6, y, 6, 0, 2 * Math.PI)
        pieCtx.fillStyle = colors[index % colors.length]
        pieCtx.fill()
        pieCtx.strokeStyle = "#ffffff"
        pieCtx.lineWidth = 2
        pieCtx.stroke()
        
        // Texto del asesor
        pieCtx.fillStyle = "#374151"
        pieCtx.font = "bold 11px Inter, sans-serif"
        pieCtx.textAlign = "left"
        
        const maxNameLength = 14
        const displayName = legend.length > maxNameLength 
          ? legend.substring(0, maxNameLength) + "..." 
          : legend
        
        pieCtx.fillText(displayName, legendStartX + 18, y + 2)
        
        // Número de ventas con estilo
        pieCtx.fillStyle = "#6b7280"
        pieCtx.font = "10px Inter, sans-serif"
        pieCtx.fillText(`${asesoresValores[index]} ventas`, legendStartX + 18, y + 14)
      })

      if (asesoresNombres.length > maxLegendItems) {
        const y = legendStartY + maxLegendItems * legendItemHeight
        pieCtx.fillStyle = "#9ca3af"
        pieCtx.font = "italic 10px Inter, sans-serif"
        pieCtx.fillText(`+${asesoresNombres.length - maxLegendItems} más...`, legendStartX, y + 2)
      }
    } else {
      pieCtx.fillStyle = "#9ca3af"
      pieCtx.font = "14px Inter, sans-serif"
      pieCtx.textAlign = "center"
      pieCtx.fillText("No hay datos de asesores", width / 2, height / 2)
    }
  }, [activeTab, selectedYear, semanaInicio, semanaFin, ventas, datos, labels, asesoresProcesados])

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
    <div className="space-y-6">
      {/* Estadísticas destacadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Ventas</p>
                <p className="text-2xl font-bold text-blue-900">{estadisticas.totalVentas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-600">Promedio</p>
                <p className="text-2xl font-bold text-green-900">{estadisticas.promedioVentas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-600">Máximo</p>
                <p className="text-2xl font-bold text-purple-900">{estadisticas.maxVentas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-600">Asesores</p>
                <p className="text-2xl font-bold text-orange-900">{estadisticas.totalAsesores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {nombreCliente && nombreCliente !== "-" 
                    ? `Ventas de ${nombreCliente}` 
                    : "Cargando..."}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {getDescripcionPeriodo()}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {datos.length} períodos
              </Badge>
            </div>
            
            {/* Controles mejorados */}
            <div className="space-y-4 mt-4">
              <Tabs defaultValue="mensual" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="mensual" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    📅 Por Meses
                  </TabsTrigger>
                  <TabsTrigger value="semanal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    📊 Semanas ISO
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-32 bg-white border-gray-200">
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
                      className="bg-white"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Filtros
                    </Button>
                    
                    {(semanaInicio !== 1 || semanaFin !== totalSemanasAño) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFiltros}
                        className="bg-white text-gray-600"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              {/* Panel de filtros expandible */}
              {activeTab === "semanal" && showFilters && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium text-blue-700">Filtros rápidos:</span>
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
                        <label className="text-xs font-medium text-blue-700 block mb-1">Semana inicio:</label>
                        <Select value={semanaInicio.toString()} onValueChange={(v) => setSemanaInicio(parseInt(v))}>
                          <SelectTrigger className="h-8 bg-white">
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
                        <label className="text-xs font-medium text-blue-700 block mb-1">Semana fin:</label>
                        <Select value={semanaFin.toString()} onValueChange={(v) => setSemanaFin(parseInt(v))}>
                          <SelectTrigger className="h-8 bg-white">
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
          <CardContent>
            <canvas ref={chartRef} width={500} height={300} className="w-full rounded-lg"></canvas>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Distribución por Asesor
            </CardTitle>
            <CardDescription>
              {asesoresProcesados.length > 8 
                ? `Top 7 asesores + otros (${asesoresProcesados.length - 1} total)`
                : `${asesoresProcesados.length} asesores activos`
              } - {getNombreCliente()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <canvas ref={pieChartRef} width={500} height={300} className="w-full rounded-lg"></canvas>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
