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
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-slate-400">
                      Herramientas de analisis avanzado
                    </p>
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