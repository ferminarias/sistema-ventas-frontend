"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Filter } from "lucide-react"
import type { ComprobanteFilters } from "@/types/comprobante"

interface SearchFiltersProps {
  onSearch: (filters: ComprobanteFilters) => void
  filtrosDisponibles?: any
  loading?: boolean
}

export function SearchFilters({ onSearch, filtrosDisponibles, loading = false }: SearchFiltersProps) {
  // Debug: Log básico de filtros
  useEffect(() => {
    if (!filtrosDisponibles) {
      console.warn("⚠️ filtrosDisponibles es null/undefined")
    }
  }, [filtrosDisponibles])

  const [filters, setFilters] = useState<ComprobanteFilters>({
    busqueda: "",
    cliente_id: undefined,
    tipo_archivo: "",
    fecha_inicio: "",
    fecha_fin: "",
    limit: 20
  })

  // Función helper para obtener el valor seguro de un tipo de archivo
  const getTipoValue = (tipo: any): string => {
    if (typeof tipo === 'object' && tipo.value) {
      return tipo.value
    }
    return tipo || ''
  }

  // Función helper para obtener el label seguro de un tipo de archivo
  const getTipoLabel = (tipo: any): string => {
    if (typeof tipo === 'object' && tipo.label) {
      return tipo.label
    }
    if (typeof tipo === 'string') {
      return tipo.charAt(0).toUpperCase() + tipo.slice(1)
    }
    return 'Desconocido'
  }

  // Función helper para obtener el nombre seguro de un cliente
  const getClienteName = (cliente: any): string => {
    if (typeof cliente === 'object' && cliente.name) {
      return cliente.name
    }
    if (typeof cliente === 'string') {
      return cliente
    }
    return 'Cliente sin nombre'
  }

  const handleInputChange = (field: keyof ComprobanteFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 1,
    }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    const resetFilters: ComprobanteFilters = {
      page: 1,
      limit: 20,
    }
    setFilters(resetFilters)
    onSearch(resetFilters)
  }

  return (
    <div className="bg-card border border-card rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Filtros de Búsqueda</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="busqueda" className="text-muted-foreground text-sm">
            Búsqueda General
          </Label>
          <Input
            id="busqueda"
            placeholder="Buscar por nombre, documento, etc."
            value={filters.busqueda || ""}
            onChange={(e) => handleInputChange("busqueda", e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cliente_id" className="text-muted-foreground text-sm">
            Cliente
          </Label>
          <Select
            value={filters.cliente_id ? filters.cliente_id.toString() : "all"}
            onValueChange={(value) => handleInputChange("cliente_id", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-muted border-border text-foreground focus:border-purple-500">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="all" className="text-foreground hover:bg-muted">
                Todos los clientes
              </SelectItem>
              {filtrosDisponibles?.clientes?.map((cliente: any) => {
                // Protección contra cliente.id undefined
                const clienteId = cliente.id || cliente.cliente_id || 'unknown'
                const clienteKey = `cliente-${clienteId}`
                
                return (
                  <SelectItem key={clienteKey} value={clienteId.toString()} className="text-foreground hover:bg-muted">
                    {getClienteName(cliente)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_archivo" className="text-muted-foreground text-sm">
            Tipo de Archivo
          </Label>
          <Select
            value={filters.tipo_archivo || "all"}
            onValueChange={(value) => handleInputChange("tipo_archivo", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-muted border-border text-foreground focus:border-purple-500">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="all" className="text-foreground hover:bg-muted">
                Todos los tipos
              </SelectItem>
              {/* Tipos prioritarios primero */}
              <SelectItem value="imagen_comprobante" className="text-foreground hover:bg-muted font-medium">
                🎯 Imagen Comprobante (Legacy)
              </SelectItem>
              <SelectItem value="comprobantes" className="text-foreground hover:bg-muted font-medium">
                📋 Comprobantes
              </SelectItem>
              {/* Separador visual */}
              <SelectItem value="" disabled className="text-muted-foreground">
                ───────────────────
              </SelectItem>
              {filtrosDisponibles?.tipos_archivo?.filter((tipo: any) => {
                const tipoValue = getTipoValue(tipo)
                return tipoValue !== 'imagen_comprobante' && tipoValue !== 'comprobantes'
              }).map((tipo: any, index: number) => (
                <SelectItem key={index} value={getTipoValue(tipo)} className="text-foreground hover:bg-muted">
                  {getTipoLabel(tipo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_inicio" className="text-muted-foreground text-sm">
            Fecha Inicio
          </Label>
          <Input
            id="fecha_inicio"
            type="date"
            value={filters.fecha_inicio || ""}
            onChange={(e) => handleInputChange("fecha_inicio", e.target.value)}
            min={filtrosDisponibles?.rango_fechas?.fecha_min}
            max={filtrosDisponibles?.rango_fechas?.fecha_max}
            className="bg-muted border-border text-foreground focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_fin" className="text-muted-foreground text-sm">
            Fecha Fin
          </Label>
          <Input
            id="fecha_fin"
            type="date"
            value={filters.fecha_fin || ""}
            onChange={(e) => handleInputChange("fecha_fin", e.target.value)}
            min={filtrosDisponibles?.rango_fechas?.fecha_min}
            max={filtrosDisponibles?.rango_fechas?.fecha_max}
            className="bg-muted border-border text-foreground focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit" className="text-muted-foreground text-sm">
            Resultados por página
          </Label>
          <Select
            value={filters.limit ? filters.limit.toString() : "20"}
            onValueChange={(value) => handleInputChange("limit", value)}
          >
            <SelectTrigger className="bg-muted border-border text-foreground focus:border-purple-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="10" className="text-foreground hover:bg-muted">10</SelectItem>
              <SelectItem value="20" className="text-foreground hover:bg-muted">20</SelectItem>
              <SelectItem value="50" className="text-foreground hover:bg-muted">50</SelectItem>
              <SelectItem value="100" className="text-foreground hover:bg-muted">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-foreground flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {loading ? "Buscando..." : "Buscar Comprobantes"}
        </Button>
        
        {/* Búsquedas rápidas */}
        <Button
          variant="outline"
          onClick={() => {
            const anahuacFilters: ComprobanteFilters = {
              tipo_archivo: "imagen_comprobante",
              page: 1,
              limit: 20
            }
            setFilters(anahuacFilters)
            onSearch(anahuacFilters)
          }}
          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white flex items-center gap-2"
        >
          🎯 Buscar Anahuac (Legacy)
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const comprobantesFilters: ComprobanteFilters = {
              tipo_archivo: "comprobantes",
              page: 1,
              limit: 20
            }
            setFilters(comprobantesFilters)
            onSearch(comprobantesFilters)
          }}
          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center gap-2"
        >
          📋 Buscar Comprobantes
        </Button>
        
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-border text-muted-foreground hover:bg-card flex items-center gap-2 bg-transparent"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>
    </div>
  )
} 