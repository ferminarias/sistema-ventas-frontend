"use client"

import { RefreshCw, FileDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VentasStats } from "./ventas-stats"
import { DashboardCharts } from "./dashboard-charts"
import type { User } from "@/types/auth"
import { useRouter } from "next/navigation"

interface MainContentProps {
  user: User
  selectedClient: string | null
}

export function MainContent({ user, selectedClient }: MainContentProps) {
  const router = useRouter()
  const title = selectedClient ? `Dashboard - ${selectedClient}` : "Dashboard de Ventas"
  const subtitle = selectedClient
    ? `Análisis detallado de ${selectedClient}`
    : "Visualiza y gestiona todas tus ventas en un solo lugar"

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleExportExcel = () => {
    // Implementar exportación a Excel
    window.open("https://sistemas-de-ventas-production.up.railway.app/api/exportar/excel", "_blank")
  }

  const handleNewSale = () => {
    router.push("/nueva-venta")
  }

  return (
    <div className="flex-1 bg-gray-900 text-white overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-gray-400 mt-1">{subtitle}</p>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="border-gray-600 text-white hover:bg-gray-700"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              className="border-gray-600 text-white hover:bg-gray-700"
              onClick={handleExportExcel}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Excel
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