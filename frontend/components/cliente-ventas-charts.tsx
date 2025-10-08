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
  const { ventas, loading: loadingVentas } = useVentas(cliente?.toLowerCase() || "")
  
  // Validacion defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-dashed border-border bg-card/50">
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center space-y-2">
              <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Cargando graficos del cliente...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
        <Card className="bg-card border-border backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {nombreCliente && nombreCliente !== "-" 
                    ? `Ventas de ${nombreCliente}` 
                    : "Graficos de Ventas"}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Vista de datos de ventas
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {ventas?.length || 0} ventas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="w-full h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Graficos temporalmente simplificados
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total de ventas: {ventas?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}