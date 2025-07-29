"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ventasApi } from "@/lib/api/ventas"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

interface DashboardHeaderProps {
  cliente?: string
}

export function DashboardHeader({ cliente }: DashboardHeaderProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      await ventasApi.exportarExcel(cliente)
      toast({
        title: "Éxito",
        description: "Archivo exportado correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-display text-3xl md:text-4xl lg:text-5xl">
          {cliente ? `Dashboard - ${cliente}` : "Dashboard General"}
        </h1>
        <p className="text-caption">
          {cliente ? `Ventas de ${cliente}` : "Ventas de todos los clientes"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {loading ? "Exportando..." : "Exportar"}
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