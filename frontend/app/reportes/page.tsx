"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function ReportesPage() {
  const router = useRouter()
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    setFadeIn(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <TooltipProvider>
        <div className={`transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => router.back()}
                className="shrink-0 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-4xl font-bold text-white">📊 Reportes y Analisis</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800/70 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Reportes Temporales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-slate-400">
                      Sistema de reportes temporalmente simplificado
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                      Funcionalidad completa sera restaurada pronto
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Estadisticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-400">
                      Metricas y KPIs del sistema
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Analisis</CardTitle>
                </CardHeader>
<<<<<<< Current (Your changes)
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
                        }
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
                    {user?.role === 'admin' ? (
                      <Select
                        value={selectedClient}
                        onValueChange={(value) => {
                          setSelectedClient(String(value));
                          setClienteFiltro(value === "all" ? undefined : String(value));
                        }}
                        disabled={allowedClients.length === 0}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white focus:border-blue-500 relative z-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 z-50">
                          <SelectItem value="all" className="text-white hover:bg-gray-700">Todos los clientes</SelectItem>
                          {allowedClients.map((client) => (
                            <SelectItem key={String(client.id)} value={String(client.id)} className="text-white hover:bg-gray-700">
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-10 px-3 flex items-center rounded-md bg-gray-900 border border-gray-700 text-sm text-slate-300">
                        {(() => {
                          const current = allowedClients.find(c => String(c.id) === selectedClient)
                          return current ? current.name : 'Asignando cliente...'
                        })()}
                      </div>
                    )}
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
=======
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-slate-400">
                      Herramientas de analisis avanzado
                    </p>
>>>>>>> Incoming (Background Agent changes)
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
} 