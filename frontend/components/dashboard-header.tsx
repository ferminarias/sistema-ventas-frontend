"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Plus, RefreshCw, Info } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ventasApi } from "@/lib/api/ventas"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardHeaderProps {
  cliente?: string
}

export function DashboardHeader({ cliente }: DashboardHeaderProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await ventasApi.exportarExcel(cliente)
      toast({
        title: "Exportación completada",
        description: `El archivo Excel ${cliente ? `de ${cliente} ` : ""}ha sido generado correctamente.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo Excel.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Datos actualizados",
        description: `Los datos ${cliente ? `de ${cliente} ` : ""}han sido actualizados.`,
      })
    }, 1000)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
            {cliente ? `Dashboard de ${cliente}` : "Dashboard de Ventas"}
          </h1>
          <p className="text-blue-300 text-base md:text-lg font-medium flex items-center gap-2">
            {cliente
              ? `Gestiona, analiza y potencia las ventas de ${cliente} desde un solo panel centralizado.`
              : "Gestiona y potencia todas tus ventas desde un solo panel centralizado."}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-blue-400/80 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <span>Este panel te permite visualizar métricas clave, analizar tendencias y tomar decisiones informadas para mejorar el rendimiento de ventas.</span>
              </TooltipContent>
            </Tooltip>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
              <span className="sm:hidden">Refrescar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{isExporting ? "Exportando..." : "Exportar Excel"}</span>
              <span className="sm:hidden">{isExporting ? "..." : "Excel"}</span>
            </Button>
          </div>
          <Button 
            asChild 
            size="sm"
            className="w-full sm:w-auto"
          >
            <Link href="/nueva-venta">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Venta
            </Link>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
