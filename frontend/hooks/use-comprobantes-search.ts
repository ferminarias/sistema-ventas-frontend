"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { ComprobanteFilters, ComprobanteSearchResponse, FiltrosDisponibles } from "@/types/comprobante"
import { comprobantesService } from "@/services/comprobantes"

export function useComprobantesSearch() {
  const [data, setData] = useState<ComprobanteSearchResponse | null>(null)
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<FiltrosDisponibles | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFiltros, setLoadingFiltros] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<any>(null)
  const lastQueryRef = useRef<string>("")

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

  const searchComprobantes = useCallback((filters: ComprobanteFilters, opts?: { debounceMs?: number }) => {
    const debounceMs = opts?.debounceMs ?? 400
    setError(null)

    // Construir clave de query para evitar búsquedas idénticas
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.append(k, String(v))
    })
    const queryKey = params.toString()
    if (queryKey === lastQueryRef.current && data) {
      return // Evitar request duplicado
    }
    lastQueryRef.current = queryKey

    // Limpiar debounce anterior
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      // Cancelar request previo
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      try {
        const response = await comprobantesService.searchComprobantes(
          filters,
          { signal: controller.signal, timeoutMs: 15000 }
        )
        setData(response)
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error("❌ Error en búsqueda de comprobantes:", err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }, debounceMs)
  }, [data])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    lastQueryRef.current = ""
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()
  }, [])

  return {
    data,
    filtrosDisponibles,
    loading,
    loadingFiltros,
    error,
    search: searchComprobantes,
    reset,
  }
} 