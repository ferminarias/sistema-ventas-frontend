"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { ventasApi } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface DashboardHeaderProps {
  cliente?: string
}

export function DashboardHeader({ cliente }: DashboardHeaderProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/exportar-excel${cliente ? `?cliente=${cliente}` : ''}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })

      if (!response.ok) throw new Error("Error al exportar")

      const data = await response.json()
      const downloadUrl = `${API_BASE}/${data.path}`
      window.open(downloadUrl, '_blank')

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {cliente ? `Dashboard - ${cliente}` : "Dashboard General"}
        </h1>
        <p className="text-muted-foreground">
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