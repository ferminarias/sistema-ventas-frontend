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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {cliente ? `Dashboard de ${cliente}` : "Dashboard de Ventas"}
        </h1>
        <p className="text-muted-foreground">
          {cliente
            ? `Visualiza y gestiona todas las ventas de ${cliente} en un solo lugar`
            : "Visualiza y gestiona todas tus ventas en un solo lugar"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar Excel"}
        </Button>
        <Button asChild size="sm">
          <Link href="/nueva-venta">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Link>
        </Button>
      </div>
    </div>
  )
}
