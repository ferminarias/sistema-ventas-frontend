"use client"

import { useState } from "react"
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
  const [filters, setFilters] = useState<ComprobanteFilters>({
    page: 1,
    limit: 20,
  })

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
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-white">Filtros de Búsqueda</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="busqueda" className="text-gray-300 text-sm">
            Búsqueda General
          </Label>
          <Input
            id="busqueda"
            placeholder="Buscar por nombre, documento, etc."
            value={filters.busqueda || ""}
            onChange={(e) => handleInputChange("busqueda", e.target.value)}
            className="bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cliente_id" className="text-gray-300 text-sm">
            Cliente
          </Label>
          <Select
            value={filters.cliente_id?.toString() || "all"}
            onValueChange={(value) => handleInputChange("cliente_id", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white focus:border-purple-500">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                Todos los clientes
              </SelectItem>
              {filtrosDisponibles?.clientes?.map((cliente: any) => (
                <SelectItem key={cliente.id} value={cliente.id.toString()} className="text-white hover:bg-gray-700">
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_archivo" className="text-gray-300 text-sm">
            Tipo de Archivo
          </Label>
          <Select
            value={filters.tipo_archivo || "all"}
            onValueChange={(value) => handleInputChange("tipo_archivo", value === "all" ? "" : value)}
          >
            <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white focus:border-purple-500">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">
                Todos los tipos
              </SelectItem>
              {filtrosDisponibles?.tipos_archivo?.map((tipo: string) => (
                <SelectItem key={tipo} value={tipo} className="text-white hover:bg-gray-700">
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_inicio" className="text-gray-300 text-sm">
            Fecha Inicio
          </Label>
          <Input
            id="fecha_inicio"
            type="date"
            value={filters.fecha_inicio || ""}
            onChange={(e) => handleInputChange("fecha_inicio", e.target.value)}
            min={filtrosDisponibles?.rango_fechas?.fecha_min}
            max={filtrosDisponibles?.rango_fechas?.fecha_max}
            className="bg-[#2a2a2a] border-gray-700 text-white focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fecha_fin" className="text-gray-300 text-sm">
            Fecha Fin
          </Label>
          <Input
            id="fecha_fin"
            type="date"
            value={filters.fecha_fin || ""}
            onChange={(e) => handleInputChange("fecha_fin", e.target.value)}
            min={filtrosDisponibles?.rango_fechas?.fecha_min}
            max={filtrosDisponibles?.rango_fechas?.fecha_max}
            className="bg-[#2a2a2a] border-gray-700 text-white focus:border-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit" className="text-gray-300 text-sm">
            Resultados por página
          </Label>
          <Select
            value={filters.limit?.toString() || "20"}
            onValueChange={(value) => handleInputChange("limit", value)}
          >
            <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white focus:border-purple-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-gray-700">
              <SelectItem value="10" className="text-white hover:bg-gray-700">10</SelectItem>
              <SelectItem value="20" className="text-white hover:bg-gray-700">20</SelectItem>
              <SelectItem value="50" className="text-white hover:bg-gray-700">50</SelectItem>
              <SelectItem value="100" className="text-white hover:bg-gray-700">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {loading ? "Buscando..." : "Buscar Comprobantes"}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center gap-2 bg-transparent"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar Filtros
        </Button>
      </div>
    </div>
  )
} 