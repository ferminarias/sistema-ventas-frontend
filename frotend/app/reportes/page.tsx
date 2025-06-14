"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Loader2 } from "lucide-react"
import {
  Tooltip as UiTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { clientService } from '@/services/client-service'
import { ClienteVentasCharts } from '@/components/cliente-ventas-charts'

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

// 1. Clases base para todas las Card
const cardBase = "transition-all duration-200 border border-slate-700/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-opacity-90"
// 2. Clases para highlight de métricas principales
const metricHighlights = [
  "bg-gradient-to-r from-blue-600 to-blue-400 border-t-4 border-blue-400",
  "bg-gradient-to-r from-purple-600 to-purple-400 border-t-4 border-purple-400",
  "bg-gradient-to-r from-cyan-600 to-cyan-400 border-t-4 border-cyan-400",
  "bg-gradient-to-r from-pink-600 to-pink-400 border-t-4 border-pink-400"
]

// Componente HeatmapCell mejorado
const HeatmapCell = ({ day, intensity, week, date, sales, avg, isActive, onHover, onClick }: {
  day: string, intensity: number, week: number, date?: string, sales?: number, avg?: number, isActive?: boolean, onHover?: () => void, onClick?: () => void
}) => {
  const intensityClasses = [
    "bg-slate-600 text-slate-200", // 0 ventas
    "bg-blue-900 text-white",      // pocas ventas
    "bg-blue-700 text-white",
    "bg-blue-500 text-white",
    "bg-blue-400 text-white",
    "bg-blue-300 text-slate-900"   // muchas ventas
  ];
  const percent = avg && sales ? Math.round(((sales - avg) / avg) * 100) : 0;
  const trend = percent > 0 ? `↑${percent}%` : percent < 0 ? `↓${Math.abs(percent)}%` : "= promedio";
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <div
          className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-300 ${intensityClasses[intensity]} ${isActive ? 'ring-2 ring-blue-400 scale-105 z-10' : ''} animate-fade-in`}
          style={{ animationDelay: `${(week * 7 + ["L","M","X","J","V","S","D"].indexOf(day)) * 30}ms` }}
          onMouseEnter={onHover}
          onMouseLeave={() => onHover && onHover(undefined)}
          onClick={onClick}
        >
          {day}
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} side="top" className="bg-slate-900 text-white border-blue-500/50">
        <div className="font-semibold">{day}{date ? `, ${date}` : ""}</div>
        <div>{sales !== undefined ? `${sales} ventas` : "Sin datos"}</div>
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
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");

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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
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
    <TooltipProvider>
      <div className={`min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[0,1,2,3].map(i => (
              <Card key={i} className={`${cardBase} ${metricHighlights[i]} bg-slate-800/80 backdrop-blur-sm`}>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-white mb-2">
                    {i === 0 ? metrics?.totalSales ?? '-' :
                     i === 1 ? metrics?.avgCloseTime ?? '-' :
                     i === 2 ? metrics?.dailyAverage ?? '-' :
                     metrics?.conversionRate ?? '-'}
                  </div>
                  <div className="text-white/90 font-medium text-sm">
                    {i === 0 ? 'Ventas del Mes' :
                     i === 1 ? 'Tiempo Promedio de Cierre' :
                     i === 2 ? 'Ventas por Día Promedio' :
                     'Tasa de Conversión'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico de tendencia de ventas */}
          <Card className={`${cardBase} mb-6 relative`}>
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Evolución de Ventas</CardTitle>
                  <div className="text-slate-400">Cantidad de ventas por período</div>
                </div>
                <div className="flex gap-1 bg-slate-700/50 p-1 rounded-lg">
                  {['7d', '30d', '90d', '1y'].map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      className={selectedPeriod === period ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}
                    >
                      {period.toUpperCase()}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    title="Descargar gráfico como imagen"
                    onClick={() => downloadChartImage(lineChartRef, 'evolucion_ventas.png')}
                  >
                    📷
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {salesTrendData ? (
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
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
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
                >
                  📷
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {hourlyDistribution && hourlyDistribution.labels && hourlyDistribution.sales ? (
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
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
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
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {advisor.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{advisor.name}</h4>
                            <div className="text-slate-400 text-sm">Asesor Senior</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{advisor.sales} ventas</div>
                          <div className="text-slate-400 text-sm">{advisor.percentage}% del total</div>
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
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
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
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {advisor.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{advisor.name}</h4>
                            <div className="text-slate-400 text-sm">Especialista {clientIdToName[advisor.client] || advisor.client}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{advisor.sales} ventas</div>
                          <div className="text-slate-400 text-sm">{clientIdToName[advisor.client] || advisor.client}</div>
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
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
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
                          <h4 className="text-white font-medium">{clientIdToName[client.name] || client.name}</h4>
                          <div className="text-slate-400 text-sm">Frecuencia: {client.frequency} días</div>
                          <div className="text-slate-400 text-xs">Asesor: {client.advisor}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{client.sales} ventas</div>
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
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
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
                    <div className="text-2xl font-bold text-blue-400 mb-2">{stage.number}</div>
                    <div className="text-slate-400 text-sm mb-2">{stage.label}</div>
                    <div className="text-white text-sm font-medium">{stage.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mapa de calor */}
          <Card className={`${cardBase} relative`}>
            {loading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
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
                {(heatmap && heatmap.length >= 28
                  ? (() => {
                      // Mapear datos reales a formato esperado
                      const avg = heatmap.reduce((acc, c) => acc + c.sales, 0) / heatmap.length;
                      const mapped = Array(28).fill(null).map((_, idx) => {
                        const week = Math.floor(idx / 7);
                        const dayIndex = idx % 7;
                        const real = heatmap.find(cell => Number(cell.dayOfWeek) === dayIndex && Number(cell.week) === week);
                        return {
                          day: ["L", "M", "X", "J", "V", "S", "D"][dayIndex],
                          intensity: real ? Math.min(5, Math.floor(real.sales / 5)) : 0,
                          week,
                          date: real?.date,
                          sales: real?.sales,
                          avg,
                          isActive: activeDay === dayIndex,
                          onHover: () => setActiveDay(dayIndex),
                          onClick: () => alert(`Detalle de ventas para ${["L", "M", "X", "J", "V", "S", "D"][dayIndex]}${real?.date ? ", " + real.date : ""}: ${real?.sales ?? 0} ventas`),
                        };
                      });
                      return mapped;
                    })()
                  : (() => {
                      const simulated = generateHeatmap();
                      return simulated.map((cell, idx) => ({
                        ...cell,
                        isActive: activeDay === idx % 7,
                        onHover: () => setActiveDay(idx % 7),
                        onClick: () => alert(`Detalle de ventas para ${["L", "M", "X", "J", "V", "S", "D"][idx % 7]}: ${cell.intensity * 5} ventas (simulado)`),
                      }));
                    })()
                ).map((cell, index) => (
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Cliente</label>
                  <Select
                    value={selectedClient}
                    onValueChange={(value) => setSelectedClient(String(value))}
                    disabled={Object.keys(clientIdToName).length === 0}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {allClients.map((client) => (
                        <SelectItem key={String(client.id)} value={String(client.id)}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Fecha Fin</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${data.path}`;
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
                    className="h-auto p-4 bg-slate-700/50 hover:bg-slate-600/50 border-2 border-slate-600 hover:border-blue-500 transition-all"
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
  )
} 