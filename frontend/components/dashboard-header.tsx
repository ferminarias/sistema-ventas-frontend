"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ventasApi } from "@/lib/api"

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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
          {cliente ? `Dashboard de ${cliente}` : "Dashboard de Ventas"}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          {cliente
            ? `Visualiza y gestiona todas las ventas de ${cliente} en un solo lugar`
            : "Visualiza y gestiona todas tus ventas en un solo lugar"}
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
  )
}
