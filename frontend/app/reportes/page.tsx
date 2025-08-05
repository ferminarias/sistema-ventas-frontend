"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line, Bar, Scatter } from "react-chartjs-2"
import { analyticsService } from "@/services/analytics-service"
import { Loader2, ArrowLeft } from "lucide-react"
import { RailwayLoader } from "@/components/ui/railway-loader"
import {
  Tooltip as UiTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { clientService } from '@/services/client-service'
import { ClienteVentasCharts } from '@/components/cliente-ventas-charts'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

// 1. Clases base optimizadas para mejor rendimientoimage.png
const cardBase = `
  transition-all duration-300 ease-out
  border border-gray-700/50 shadow-xl rounded-2xl 
  bg-gray-800/70
  hover:shadow-2xl hover:border-gray-600/70
  group relative
`

// 2. Clases optimizadas para métricas principales
const metricHighlights = [
  "bg-gray-800/90 border-t-4 border-blue-500/80 shadow-lg",
  "bg-gray-800/90 border-t-4 border-purple-500/80 shadow-lg", 
  "bg-gray-800/90 border-t-4 border-cyan-500/80 shadow-lg",
  "bg-gray-800/90 border-t-4 border-pink-500/80 shadow-lg"
]

// Componente HeatmapCell con mejoras UX/UI avanzadas
const HeatmapCell = ({ day, intensity, week, date, sales, avg, isActive, onHover, onClick }: {
  day: string, intensity: number, week: number, date?: string, sales?: number, avg?: number, isActive?: boolean, onHover?: () => void, onClick?: () => void
}) => {
  // Colores optimizados para mejor rendimiento
  const intensityStyles = [
    { 
      bg: "bg-slate-600", 
      text: "text-slate-200", 
      shadow: "shadow-sm"
    }, // 0 ventas
    { 
      bg: "bg-blue-900", 
      text: "text-white", 
      shadow: "shadow-md"
    }, // pocas ventas
    { 
      bg: "bg-blue-700", 
      text: "text-white", 
      shadow: "shadow-lg"
    },
    { 
      bg: "bg-blue-500", 
      text: "text-white", 
      shadow: "shadow-xl"
    },
    { 
      bg: "bg-blue-400", 
      text: "text-white", 
      shadow: "shadow-2xl"
    },
    { 
      bg: "bg-blue-300", 
      text: "text-slate-900", 
      shadow: "shadow-2xl"
    } // muchas ventas
  ];
  
  const currentStyle = intensityStyles[intensity] || intensityStyles[0];
  const percent = avg && sales ? Math.round(((sales - avg) / avg) * 100) : 0;
  const trend = percent > 0 ? `↑${percent}%` : percent < 0 ? `↓${Math.abs(percent)}%` : "= promedio";
  
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer 
            transition-all duration-200 ease-out
            ${currentStyle.bg} ${currentStyle.text} ${currentStyle.shadow}
            hover:scale-105 hover:brightness-110
            ${isActive ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''}
            border border-white/10 hover:border-white/30
          `}
          onMouseEnter={onHover}
          onMouseLeave={() => onHover && onHover()}
          onClick={onClick}
        >
          <span>{day}</span>
          {intensity > 3 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"></div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        sideOffset={8} 
        side="top" 
        className="bg-slate-900 text-white border border-blue-500/50 shadow-xl"
      >
        <div className="font-semibold text-cyan-300">{day}{date ? `, ${date}` : ""}</div>
        <div className="text-sm">{sales !== undefined ? `${sales} ventas` : "Sin datos"}</div>
        {avg !== undefined && sales !== undefined && (
          <div className="text-xs text-blue-300">{trend} vs promedio</div>
        )}
      </TooltipContent>
    </UiTooltip>
  );
};

// Función para generar heatmap simulado si no hay datos reales
const generateHeatmap = () => {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const heatmapData = [];
  for (let week = 0; week < 4; week++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // Generar intensidad (simulada)
      const intensity = dayIndex < 5
        ? Math.floor(Math.random() * 4) + 2 // Días laborables (más actividad)
        : Math.floor(Math.random() * 2) + 1; // Fin de semana (menos actividad)
      heatmapData.push({
        day: days[dayIndex],
        intensity,
        week,
      });
    }
  }
  return heatmapData;
};

export default function ReportesPage() {
  console.log("=== REPORTES PAGE RENDER ===");
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  
  // Usar el año actual de forma dinámica
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  // Estados para datos reales
  const [metrics, setMetrics] = useState<any>(null)
  const [topAdvisorsGeneral, setTopAdvisorsGeneral] = useState<any[]>([])
  const [topAdvisorsByClient, setTopAdvisorsByClient] = useState<any[]>([])
  const [topClients, setTopClients] = useState<any[]>([])
  const [salesTrend, setSalesTrend] = useState<any>(null)
  const [hourlyDistribution, setHourlyDistribution] = useState<any>(null)
  const [pipeline, setPipeline] = useState<any>(null)
  const [heatmap, setHeatmap] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [allClients, setAllClients] = useState<any[]>([])
  const [clientIdToName, setClientIdToName] = useState<Record<string, string>>({})

  const lineChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const [metricsData, advisorsData, clientsData, salesTrendData, hourlyData, pipelineData, heatmapData] = await Promise.all([
          analyticsService.getMetrics(),
          analyticsService.getTopAdvisors(),
          analyticsService.getTopClients(),
          analyticsService.getSalesTrend(selectedPeriod),
          analyticsService.getHourlyDistribution(),
          analyticsService.getPipeline(),
          analyticsService.getHeatmap(),
        ])
        setMetrics(metricsData)
        setTopAdvisorsGeneral(advisorsData.general)
        setTopAdvisorsByClient(advisorsData.byClient)
        setTopClients(clientsData)
        setSalesTrend(salesTrendData)
        setHourlyDistribution(hourlyData)
        setPipeline(pipelineData)
        setHeatmap(heatmapData)
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedPeriod])

  useEffect(() => {
    setFadeIn(true)
  }, [])

  useEffect(() => {
    // Cargar todos los clientes reales para el mapeo id->nombre
    clientService.getAllClients().then((clients) => {
      setAllClients(clients)
      const map: Record<string, string> = {}
      clients.forEach((c: any) => { map[String(c.id)] = c.name })
      setClientIdToName(map)
    })
  }, [])

  // Función para descargar el gráfico como imagen
  const downloadChartImage = (ref: React.RefObject<any>, filename: string) => {
    if (ref.current) {
      // Chart.js v3+ con react-chartjs-2: acceder a chartInstance
      const chart = ref.current.chart || ref.current;
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl font-bold">{error}</div>
      </div>
    )
  }

  // Opciones para el gráfico de tendencia
  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#cbd5e1",
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#6366f1',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items: any[]) => `Fecha: ${items[0].label}`,
          label: (item: any) => `${item.dataset.label}: ${item.formattedValue} ventas`,
        },
        displayColors: false,
        caretSize: 6,
        cornerRadius: 6,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#cbd5e1" },
        grid: { color: "#334155" },
      },
      y: {
        ticks: { color: "#cbd5e1" },
        grid: { color: "#334155" },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        ticks: { color: "#cbd5e1" },
        grid: { drawOnChartArea: false },
      },
    },
  }

  // Opciones para el gráfico de barras (distribución horaria)
  const hourlyBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#cbd5e1" } },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#6366f1',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items: any[]) => `Hora: ${items[0].label}:00`,
          label: (item: any) => `${item.dataset.label}: ${item.formattedValue} ventas`,
        },
        displayColors: false,
        caretSize: 6,
        cornerRadius: 6,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" } },
      y: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" } },
    },
  }

  // Datos para el gráfico de tendencia
  const salesTrendData = salesTrend && {
    labels: salesTrend.labels,
    datasets: [
      {
        label: "Ventas Diarias",
        data: salesTrend.sales,
        borderColor: "#1946e3",
        backgroundColor: "rgba(25, 70, 227, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Ventas Acumuladas",
        data: salesTrend.cumulative,
        borderColor: "#06b6d4",
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  }

  const nombreClienteSeleccionado = selectedClient === "all"
    ? "Todos los clientes"
    : clientIdToName[String(selectedClient)] || "(Nombre no disponible)"

  console.log("selectedClient:", selectedClient);
  console.log("clientIdToName:", clientIdToName);
  console.log("Nombre calculado:", nombreClienteSeleccionado);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <TooltipProvider>
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-6 max-w-7xl mx-auto">
            {/* Botón de volver atrás */}
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="shrink-0 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-4xl font-bold text-white">📊 Reportes y Análisis</h1>
            </div>
            {/* Métricas principales con data storytelling mejorado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[0,1,2,3].map(i => {
                const metricData = [
                  { value: metrics?.totalSales ?? '-', label: 'Ventas del Mes', icon: '📈', trend: '+12%', isPositive: true },
                  { value: metrics?.avgCloseTime ?? '-', label: 'Tiempo Promedio de Cierre', icon: '⏱️', trend: '-5%', isPositive: true },
                  { value: metrics?.dailyAverage ?? '-', label: 'Ventas por Día Promedio', icon: '📊', trend: '+8%', isPositive: true },
                  { value: metrics?.conversionRate ?? '-', label: 'Tasa de Conversión', icon: '🎯', trend: '+3%', isPositive: true }
                ][i];
                
                return (
                  <Card key={i} className={`${cardBase} ${metricHighlights[i]} group cursor-pointer`}>
                    <CardContent className="p-6 relative">
                      {/* Icono animado en el fondo */}
                      <div className="absolute top-4 right-4 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                        {metricData.icon}
                      </div>
                      
                      {/* Valor principal con animación de contador */}
                      <div className="text-4xl font-bold text-white mb-3 tracking-tight relative z-10">
                        <span className="drop-shadow-sm">{metricData.value}</span>
                        {metricData.value !== '-' && (
                          <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/60"></div>
                        )}
                      </div>
                      
                      {/* Label con trend indicator */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-white/90 font-medium text-sm leading-tight">
                          {metricData.label}
                        </div>
                        {metricData.value !== '-' && (
                          <div className={`
                            text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1
                            ${metricData.isPositive 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }
                          `}>
                            <span className={metricData.isPositive ? '↗️' : '↘️'}></span>
                            {metricData.trend}
                          </div>
                        )}
                      </div>
                      
                                             {/* Barra de progreso sutil */}
                       {metricData.value !== '-' && (
                         <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-500 ${
                               i === 0 ? 'bg-blue-500' :
                               i === 1 ? 'bg-purple-500' :
                               i === 2 ? 'bg-cyan-500' :
                               'bg-pink-500'
                             }`}
                             style={{ width: `${65 + i * 10}%` }}
                           ></div>
                         </div>
                       )}
                      
                      {/* Micro-interacción en hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Gráfico de tendencia de ventas */}
            <Card className={`${cardBase} mb-6 relative`}>
              {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                  <RailwayLoader size="lg" text="Generando gráfico de tendencias..." />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Evolución de Ventas</CardTitle>
                    <div className="text-slate-400">Cantidad de ventas por período</div>
                  </div>
                  <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg relative z-20">
                    {['7d', '30d', '90d', '1y'].map((period) => (
                      <Button
                        key={period}
                        variant={selectedPeriod === period ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedPeriod(period)}
                        className={`relative z-30 ${selectedPeriod === period ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        {period.toUpperCase()}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      title="Descargar gráfico como imagen"
                      onClick={() => downloadChartImage(lineChartRef, 'evolucion_ventas.png')}
                      className="relative z-30"
                    >
                      📷
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {loading ? (
                    <RailwayLoader size="lg" text="Generando gráfico de tendencias..." />
                  ) : salesTrendData ? (
                    <Line ref={lineChartRef} data={salesTrendData} options={salesTrendOptions} />
                  ) : (
                    <div className="text-center text-slate-400">No hay datos de ventas</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distribución horaria */}
            <Card className={`${cardBase} mb-6 relative`}>
              {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                  <RailwayLoader size="lg" text="Analizando distribución horaria..." />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Distribución Horaria</CardTitle>
                    <div className="text-slate-400">Cuándo se registran más ventas</div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Descargar gráfico como imagen"
                    onClick={() => downloadChartImage(barChartRef, 'distribucion_horaria.png')}
                    className="relative z-30"
                  >
                    📷
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {loading ? (
                    <RailwayLoader size="lg" text="Analizando distribución horaria..." />
                  ) : hourlyDistribution && hourlyDistribution.labels && hourlyDistribution.sales ? (
                    <Bar
                      ref={barChartRef}
                      data={{
                        labels: hourlyDistribution.labels,
                        datasets: [
                          {
                            label: 'Ventas por hora',
                            data: hourlyDistribution.sales,
                            backgroundColor: 'rgba(139, 92, 246, 0.8)',
                            borderColor: '#8b5cf6',
                            borderWidth: 1,
                            borderRadius: 4,
                          },
                        ],
                      }}
                      options={hourlyBarOptions}
                    />
                  ) : (
                    <div className="text-center text-slate-400">No hay datos de distribución horaria</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Asesores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className={`${cardBase} relative`}>
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                    <RailwayLoader size="md" text="Cargando asesores..." />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white">🏆 Top Asesores General</CardTitle>
                  <div className="text-slate-400">Mejores vendedores del mes</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAdvisorsGeneral.length > 0 ? (
                      topAdvisorsGeneral.map((advisor, index) => (
                        <div 
                          key={index} 
                          className="group relative flex items-center justify-between p-5 bg-gradient-to-r from-slate-700/40 to-slate-600/30 hover:from-slate-600/50 hover:to-slate-500/40 rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 ease-out transform hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 relative z-10"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Efecto de brillo en hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                          
                          <div className="flex items-center gap-5 z-10">
                            <div className="relative">
                              {/* Avatar con animación 3D */}
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-2xl shadow-blue-500/40 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 border-2 border-white/20">
                                <span className="drop-shadow-lg">
                                  {advisor.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              
                              {/* Badge animado para el primer lugar */}
                              {index === 0 && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs shadow-xl shadow-yellow-400/50 animate-bounce border-2 border-white/30">
                                  🏆
                                </div>
                              )}
                              
                              {/* Ranking indicator */}
                              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {index + 1}
                              </div>
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white font-bold text-base leading-tight truncate max-w-[200px] group-hover:text-cyan-300 transition-colors duration-300">
                                {typeof advisor.name === 'string' ? advisor.name : JSON.stringify(advisor.name)}
                              </h4>
                              <div className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Asesor Senior
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 z-10">
                            <div className="text-white font-bold text-xl group-hover:text-cyan-300 transition-colors duration-300 drop-shadow-sm">
                              {typeof advisor.sales === 'string' || typeof advisor.sales === 'number' ? advisor.sales : JSON.stringify(advisor.sales)}
                            </div>
                            <div className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                              <span className="text-xs">📈</span>
                              {typeof advisor.percentage === 'string' || typeof advisor.percentage === 'number' ? advisor.percentage : JSON.stringify(advisor.percentage)}% del total
                            </div>
                          </div>
                          
                          {/* Barra de progreso sutil */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700/50 rounded-b-2xl overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(90, 20 + (advisor.percentage || 0))}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-400">No hay datos de asesores</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={`${cardBase} relative`}>
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                    <RailwayLoader size="md" text="Cargando especialistas..." />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white">👥 Top Asesores por Cliente</CardTitle>
                  <div className="text-slate-400">Especialistas por cuenta</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAdvisorsByClient.length > 0 ? (
                      topAdvisorsByClient.map((advisor, index) => (
                        <div 
                          key={index} 
                          className="group relative flex items-center justify-between p-5 bg-gradient-to-r from-purple-700/40 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-500/40 rounded-2xl border border-purple-600/30 hover:border-purple-500/50 transition-all duration-300 ease-out transform hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10 relative z-10"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Efecto de brillo en hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                          
                          <div className="flex items-center gap-5 z-10">
                            <div className="relative">
                              {/* Avatar con animación 3D */}
                              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-2xl shadow-purple-500/40 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 border-2 border-white/20">
                                <span className="drop-shadow-lg">
                                  {advisor.name.split(" ").map((n: string) => n[0]).join("")}
                                </span>
                              </div>
                              
                              {/* Badge animado para el primer lugar */}
                              {index === 0 && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-xs shadow-xl shadow-emerald-400/50 animate-bounce border-2 border-white/30">
                                  👑
                                </div>
                              )}
                              
                              {/* Ranking indicator */}
                              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {index + 1}
                              </div>
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white font-bold text-base leading-tight truncate max-w-[200px] group-hover:text-pink-300 transition-colors duration-300">
                                {typeof advisor.name === 'string' ? advisor.name : JSON.stringify(advisor.name)}
                              </h4>
                              <div className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                Especialista {typeof advisor.client === 'string' ? (clientIdToName[advisor.client] || advisor.client) : JSON.stringify(advisor.client)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 z-10">
                            <div className="text-white font-bold text-xl group-hover:text-pink-300 transition-colors duration-300 drop-shadow-sm">
                              {typeof advisor.sales === 'string' || typeof advisor.sales === 'number' ? advisor.sales : JSON.stringify(advisor.sales)}
                            </div>
                            <div className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                              <span className="text-xs">🎯</span>
                              {typeof advisor.client === 'string' ? (clientIdToName[advisor.client] || advisor.client) : JSON.stringify(advisor.client)}
                            </div>
                          </div>
                          
                          {/* Barra de progreso sutil */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-700/50 rounded-b-2xl overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{ width: `${Math.min(90, 25 + (index < 3 ? (3-index) * 15 : 10))}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-400">No hay datos de asesores por cliente</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Clientes */}
            <Card className={`${cardBase} relative`}>
              {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                  <RailwayLoader size="md" text="Analizando clientes..." />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white">Top Clientes por Volumen</CardTitle>
                <div className="text-slate-400">Mayor cantidad de ventas</div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topClients.length > 0 ? (
                    topClients.map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {(clientIdToName[client.name] || client.name)[0]}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{typeof client.name === 'string' ? (clientIdToName[client.name] || client.name) : JSON.stringify(client.name)}</h4>
                            <div className="text-slate-400 text-sm">Frecuencia: {typeof client.frequency === 'string' || typeof client.frequency === 'number' ? client.frequency : JSON.stringify(client.frequency)} días</div>
                            <div className="text-slate-400 text-xs">Asesor: {typeof client.advisor === 'string' ? client.advisor : JSON.stringify(client.advisor)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{typeof client.sales === 'string' || typeof client.sales === 'number' ? client.sales : JSON.stringify(client.sales)} ventas</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400">No hay datos de clientes</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pipeline de ventas */}
                          <Card className={`${cardBase} relative`}>
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                    <RailwayLoader size="lg" text="Generando pipeline..." />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white">Pipeline de Ventas</CardTitle>
                  <div className="text-slate-400">Estado actual del embudo de conversión</div>
                </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {pipeline && [
                    { number: pipeline.prospects, label: "Prospectos", value: "100%" },
                    { number: pipeline.contacted, label: "Contactados", value: "" },
                    { number: pipeline.interested, label: "Interesados", value: "" },
                    { number: pipeline.proposals, label: "Propuestas", value: "" },
                    { number: pipeline.closed, label: "Cerradas", value: "" },
                  ].map((stage, index) => (
                    <div key={index} className="text-center p-4 bg-slate-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 mb-2">{typeof stage.number === 'string' || typeof stage.number === 'number' ? stage.number : JSON.stringify(stage.number)}</div>
                      <div className="text-slate-400 text-sm mb-2">{typeof stage.label === 'string' ? stage.label : JSON.stringify(stage.label)}</div>
                      <div className="text-white text-sm font-medium">{typeof stage.value === 'string' ? stage.value : JSON.stringify(stage.value)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mapa de calor */}
            <Card className={`${cardBase} relative`}>
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-slate-900/70 to-black/60 flex items-center justify-center z-10 rounded-2xl backdrop-blur-md">
                  <div className="flex flex-col items-center gap-4 p-8 bg-slate-800/80 rounded-2xl border border-slate-600/50 shadow-2xl">
                    <RailwayLoader size="lg" text="" />
                    <div className="text-white font-medium text-center animate-pulse">
                      <div className="text-lg mb-2">🔥 Generando mapa de calor...</div>
                      <div className="text-sm text-slate-400">Analizando patrones de actividad</div>
                    </div>
                  </div>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">Mapa de Calor - Actividad de Ventas</CardTitle>
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                        tabIndex={0}
                        aria-label="¿Qué es el mapa de calor?"
                        type="button"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={8} side="right" className="max-w-xs text-left">
                      <div className="font-semibold mb-1">¿Qué muestra este mapa de calor?</div>
                      <div>
                        Visualiza la intensidad de ventas por día de la semana durante las últimas 4 semanas.<br />
                        <span className="text-blue-300">Colores más intensos = más ventas.</span><br />
                        Útil para detectar patrones de actividad y días pico.
                      </div>
                    </TooltipContent>
                  </UiTooltip>
                </div>
                <div className="text-slate-400">Últimas semanas por día de la semana</div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 w-full">
                  {(() => {
                    // Siempre mostrar el grid completo de 4 semanas x 7 días = 28 celdas
                    const hasRealData = heatmap && heatmap.length > 0;
                    const avg = hasRealData ? heatmap.reduce((acc, c) => acc + (c.sales || 0), 0) / heatmap.length : 0;
                    
                    return Array(28).fill(null).map((_, idx) => {
                      const week = Math.floor(idx / 7);
                      const dayIndex = idx % 7;
                      const dayName = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][dayIndex];
                      
                      // Buscar datos reales para esta celda
                      const real = hasRealData ? heatmap.find(cell => 
                        Number(cell.dayOfWeek) === dayIndex && Number(cell.week) === week
                      ) : null;
                      
                      // Calcular intensidad: 0-5 basado en ventas
                      const intensity = real && real.sales ? Math.min(5, Math.ceil(real.sales / 2)) : 0;
                      
                      return {
                        day: ["L", "M", "X", "J", "V", "S", "D"][dayIndex],
                        intensity,
                        week,
                        date: real?.date,
                        sales: real?.sales || 0,
                        avg,
                        isActive: activeDay === dayIndex,
                        onHover: () => setActiveDay(dayIndex),
                        onClick: () => {
                          const ventasText = (real?.sales || 0) === 1 ? "venta" : "ventas";
                          const dateText = real?.date ? ` del ${real.date}` : "";
                          const percentChange = avg && real?.sales ? Math.round(((real.sales - avg) / avg) * 100) : 0;
                          
                          let message;
                          if (real?.sales && real.sales > 0) {
                            const trendText = percentChange > 0 ? `${percentChange}% por encima` : 
                                            percentChange < 0 ? `${Math.abs(percentChange)}% por debajo` : 'Igual al';
                            message = `📊 ${dayName}${dateText}\n\n✅ ${real.sales} ${ventasText} realizadas\n📈 ${trendText} del promedio semanal`;
                          } else if (hasRealData) {
                            message = `📊 ${dayName}${dateText}\n\n💤 Sin ventas registradas para este día`;
                          } else {
                            message = `📊 ${dayName}\n\n⚠️ Cargando datos de ventas...\n\n💡 Los datos aparecerán cuando el sistema termine de cargar.`;
                          }
                          alert(message);
                        },
                      };
                    });
                  })().map((cell, index) => (
                    <HeatmapCell key={index} {...cell} />
                  ))}
                </div>
                {/* Leyenda de escala de colores */}
                <div className="flex items-center gap-2 mt-4 justify-center">
                  {[0,1,2,3,4,5].map(i => (
                    <div key={i} className={`w-6 h-3 rounded-sm ${[
                      "bg-slate-600 text-slate-200",
                      "bg-blue-900 text-white",
                      "bg-blue-700 text-white",
                      "bg-blue-500 text-white",
                      "bg-blue-400 text-white",
                      "bg-blue-300 text-slate-900"
                    ][i]}`}></div>
                  ))}
                  <span className="text-xs text-slate-300 ml-2">Menos ventas</span>
                  <span className="text-xs text-slate-300 ml-2">Más ventas</span>
                </div>
              </CardContent>
            </Card>

            {/* Exportar reportes */}
            <Card className={`${cardBase}`}>
              <CardHeader>
                <CardTitle className="text-white">Exportar Análisis Personalizado</CardTitle>
                <div className="text-slate-400">Filtra y descarga reportes específicos</div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-700/30 rounded-lg relative z-20">
                  <div className="relative z-30">
                    <label className="block text-sm font-medium text-white mb-2">Cliente</label>
                    <Select
                      value={selectedClient}
                      onValueChange={(value) => setSelectedClient(String(value))}
                      disabled={Object.keys(clientIdToName).length === 0}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 relative z-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 z-50">
                        <SelectItem value="all" className="text-white hover:bg-gray-700">Todos los clientes</SelectItem>
                        {allClients.map((client) => (
                          <SelectItem key={String(client.id)} value={String(client.id)} className="text-white hover:bg-gray-700">
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative z-30">
                    <label className="block text-sm font-medium text-white mb-2">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 placeholder:text-gray-400 relative z-40"
                    />
                  </div>
                  <div className="relative z-30">
                    <label className="block text-sm font-medium text-white mb-2">Fecha Fin</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 placeholder:text-gray-400 relative z-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-20">
                  {[
                    { format: "excel", icon: "📊", title: "Excel Completo", desc: "Todas las métricas filtradas", color: "from-green-600 to-green-500" },
                    { format: "pdf", icon: "📄", title: "Reporte PDF", desc: "Resumen ejecutivo filtrado", color: "from-red-600 to-red-500" },
                    { format: "csv", icon: "📋", title: "Datos CSV", desc: "Datos filtrados para análisis", color: "from-blue-600 to-blue-500" },
                    { format: "api", icon: "🔗", title: "API JSON", desc: "Datos filtrados para integración", color: "from-cyan-600 to-cyan-500" },
                  ].map((option) => (
                    <Button
                      key={option.format}
                      onClick={async () => {
                        try {
                          const filters = {
                            client: selectedClient !== "all" ? selectedClient : undefined,
                            startDate,
                            endDate,
                            format: option.format,
                          };
                          const data = await analyticsService.exportData(filters);
                          if (option.format === "excel" || option.format === "pdf" || option.format === "csv") {
                            if (!data.path) throw new Error("No se recibió la ruta del archivo");
                            const downloadUrl = `${API_BASE}/${data.path}`;
                            const link = document.createElement("a");
                            link.href = downloadUrl;
                            link.download = data.path.split("/").pop() || `reporte.${option.format}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            alert("Datos JSON filtrados:\n" + JSON.stringify(data, null, 2));
                          }
                        } catch (err: any) {
                          alert("Error al exportar: " + (err.message || err));
                        }
                      }}
                      className="h-auto p-4 bg-gray-800/60 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 transition-all rounded-xl text-white relative z-30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center text-white text-lg`}
                        >
                          {option.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-white">{option.title}</div>
                          <div className="text-xs text-slate-400">{option.desc}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Renderizar ClienteVentasCharts solo cuando el mapeo ya está completamente cargado y el nombre está disponible */}
            {Object.keys(clientIdToName).length > 0 && 
              (selectedClient === "all" || clientIdToName[String(selectedClient)] !== undefined) && (
              <ClienteVentasCharts
                cliente={selectedClient}
                clientIdToName={clientIdToName}
                nombreCliente={nombreClienteSeleccionado}
              />
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
} 