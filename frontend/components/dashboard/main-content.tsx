"use client"

import { RefreshCw, FileDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VentasStats } from "./ventas-stats"
import { DashboardCharts } from "./dashboard-charts"
import type { User } from "@/types/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ventasApi } from "@/lib/api/ventas"

interface MainContentProps {
  user: User
  selectedClient: string | null
}

export function MainContent({ user, selectedClient }: MainContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const title = selectedClient ? `Dashboard - ${selectedClient}` : "Dashboard de Ventas"
  const subtitle = selectedClient
    ? `Análisis detallado de ${selectedClient}`
    : "Visualiza y gestiona todas tus ventas en un solo lugar"

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await ventasApi.exportarExcel(selectedClient || undefined)
      toast({
        title: "Exportación completada",
        description: "El archivo Excel ha sido generado y descargado correctamente.",
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

  const handleNewSale = () => {
    router.push("/nueva-venta")
  }

  return (
    <div className="flex-1 bg-background text-foreground overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="border-border text-foreground hover:bg-muted"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>
            <Button 
              variant="outline" 
              className="border-border text-foreground hover:bg-muted"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {isExporting ? "Exportando..." : "Exportar Excel"}
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleNewSale}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <VentasStats />
        <DashboardCharts />
      </div>
    </div>
  )
} 