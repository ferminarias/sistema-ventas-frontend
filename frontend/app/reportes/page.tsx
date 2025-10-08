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
          <div className="p-2 sm:p-4 lg:p-6 w-full max-w-full mx-auto">
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

            {/* Gráfico principal optimizado para todo el ancho */}
            <Card className="mb-6 bg-gray-800/70 border-gray-700/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-white text-xl sm:text-2xl">Ventas de General</CardTitle>
                    <p className="text-slate-400 text-sm mt-1">2025 - Vista mensual</p>
                    <div className="text-xs text-slate-500 mt-1">12 períodos</div>
                  </div>
                  <div className="flex gap-2 bg-slate-700/50 p-1 rounded-lg self-start sm:self-auto">
                    <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium transition-colors">
                      📊 Por Meses
                    </button>
                    <button className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded text-sm font-medium transition-colors">
                      📈 Semanas ISO
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-80 sm:h-96 bg-gray-900/50 rounded-lg p-3 sm:p-6 flex items-end justify-between gap-1 sm:gap-2">
                  {/* Gráfico de barras mensual optimizado */}
                  {[
                    { mes: 'Ene', valor: 0 },
                    { mes: 'Feb', valor: 0 },
                    { mes: 'Mar', valor: 21 },
                    { mes: 'Abr', valor: 44 },
                    { mes: 'May', valor: 0 },
                    { mes: 'Jun', valor: 0 },
                    { mes: 'Jul', valor: 0 },
                    { mes: 'Ago', valor: 0 },
                    { mes: 'Sep', valor: 8 },
                    { mes: 'Oct', valor: 0 },
                    { mes: 'Nov', valor: 0 },
                    { mes: 'Dic', valor: 0 }
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                      <div className="w-full flex flex-col items-center justify-end mb-2" style={{ height: '260px' }}>
                        {item.valor > 0 && (
                          <>
                            <div className="text-white text-xs sm:text-sm font-bold mb-2 bg-gray-800/80 px-2 py-1 rounded">
                              {item.valor}
                            </div>
                            <div 
                              className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md transition-all duration-500 hover:from-purple-500 hover:to-purple-300 hover:scale-105 cursor-pointer shadow-lg hover:shadow-purple-500/30"
                              style={{ 
                                height: `${Math.max((item.valor / 44) * 220, 20)}px`,
                                minHeight: '20px'
                              }}
                              title={`${item.mes}: ${item.valor} ventas`}
                            ></div>
                          </>
                        )}
                      </div>
                      <div className="text-slate-400 text-xs sm:text-sm font-medium text-center">
                        {item.mes}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cards de estadísticas adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-gray-800/70 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-slate-400">
                      Métricas y KPIs del sistema
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">73</div>
                        <div className="text-xs text-slate-400">Total Ventas</div>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">4.2</div>
                        <div className="text-xs text-slate-400">Promedio Mes</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Análisis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-slate-400">
                      Herramientas de análisis avanzado
                    </p>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Mes más activo:</span>
                        <span className="text-white font-medium">Abril</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Crecimiento:</span>
                        <span className="text-green-400 font-medium">+15%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/70 border-gray-700/50 md:col-span-2 xl:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white">Resumen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-slate-400">
                      Dashboard completamente optimizado
                    </p>
                    <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="text-green-400 font-medium text-sm">
                        ✅ Aprovecha todo el ancho disponible
                      </div>
                      <div className="text-green-400 font-medium text-sm mt-1">
                        📱 Totalmente responsivo
                      </div>
                    </div>
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