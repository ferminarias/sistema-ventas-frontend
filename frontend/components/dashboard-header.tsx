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

// Función para capitalizar correctamente el nombre del cliente
const formatClientName = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
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
        description: `El archivo Excel ${cliente ? `de ${formatClientName(cliente)} ` : ""}ha sido generado correctamente.`,
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
        description: `Los datos ${cliente ? `de ${formatClientName(cliente)} ` : ""}han sido actualizados.`,
      })
    }, 1000)
  }

  const formattedClientName = cliente ? formatClientName(cliente) : null

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {/* Sección de contenido principal */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Título principal con tipografía moderna */}
          <h1 className="text-display text-3xl md:text-4xl lg:text-5xl text-white">
            {formattedClientName ? `Dashboard de ${formattedClientName}` : "Dashboard de Ventas"}
          </h1>
          
          {/* Descripción con mejor contraste y tipografía */}
          <div className="flex items-start gap-3">
            <p className="text-body text-gray-200 leading-relaxed max-w-2xl">
              {formattedClientName
                ? `Gestiona, analiza y potencia las ventas de ${formattedClientName} desde un solo panel centralizado.`
                : "Gestiona y potencia todas tus ventas desde un solo panel centralizado."}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-gray-400 hover:text-gray-300 cursor-help mt-1 flex-shrink-0 transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-gray-800 border-gray-700 text-gray-200">
                <span className="text-sm">
                  Este panel te permite visualizar métricas clave, analizar tendencias y tomar decisiones informadas para mejorar el rendimiento de ventas.
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Sección de acciones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* Botones de acción secundarios */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="flex-1 sm:flex-none bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-button">Actualizar</span>
              <span className="sm:hidden text-button">Refrescar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1 sm:flex-none bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline text-button">{isExporting ? "Exportando..." : "Exportar Excel"}</span>
              <span className="sm:hidden text-button">{isExporting ? "..." : "Excel"}</span>
            </Button>
          </div>
          
          {/* Botón de acción principal */}
          <Button 
            asChild 
            size="sm"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Link href="/nueva-venta">
              <Plus className="mr-2 h-4 w-4" />
              <span className="text-button">Nueva Venta</span>
            </Link>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
