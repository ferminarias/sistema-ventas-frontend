"use client"

import { useState, useCallback, useEffect } from "react"
import type { ComprobanteFilters, ComprobanteSearchResponse, FiltrosDisponibles } from "@/types/comprobante"
import { comprobantesService } from "@/services/comprobantes"

export function useComprobantesSearch() {
  const [data, setData] = useState<ComprobanteSearchResponse | null>(null)
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<FiltrosDisponibles | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFiltros, setLoadingFiltros] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar filtros disponibles al montar el hook
  useEffect(() => {
    const loadFiltros = async () => {
      setLoadingFiltros(true)
      try {
        const filtros = await comprobantesService.getFiltrosDisponibles()
        setFiltrosDisponibles(filtros)
      } catch (err) {
        console.error("Error al cargar filtros disponibles:", err)
      } finally {
        setLoadingFiltros(false)
      }
    }

    loadFiltros()
  }, [])

  const search = useCallback(async (filters: ComprobanteFilters) => {
    setLoading(true)
    setError(null)

    try {
      const response = await comprobantesService.searchComprobantes(filters)
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar comprobantes")
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    data,
    filtrosDisponibles,
    loading,
    loadingFiltros,
    error,
    search,
    reset,
  }
} 