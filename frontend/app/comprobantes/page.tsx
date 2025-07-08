"use client"

import { useState, useEffect } from "react"
import { SearchFilters } from "@/components/comprobantes/search-filters"
import { ResultsList } from "@/components/comprobantes/results-list"
import { useComprobantesSearch } from "@/hooks/use-comprobantes-search"
import { useAuth } from "@/contexts/auth-context"
import type { ComprobanteFilters } from "@/types/comprobante"
import { FileSearch, AlertCircle, RefreshCw, Download, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RailwayLoader } from "@/components/ui/railway-loader"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function BusquedaComprobantesPage() {
  const { data, filtrosDisponibles, loading, loadingFiltros, error, search } = useComprobantesSearch()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentFilters, setCurrentFilters] = useState<ComprobanteFilters>({
    page: 1,
    limit: 20,
  })

  // Verificar permisos de acceso
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && user.role !== 'admin' && user.role !== 'supervisor') {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta sección",
        variant: "destructive",
      })
      router.push('/dashboard')
      return
    }
  }, [user, authLoading, router, toast])

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'supervisor')) {
      search(currentFilters)
    }
  }, [user])

  const handleSearch = (filters: ComprobanteFilters) => {
    setCurrentFilters(filters)
    search(filters)
  }

  const handleRefresh = () => {
    search(currentFilters)
  }

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <RailwayLoader size="lg" text="Verificando permisos..." />
      </div>
    )
  }

  // Si no tiene permisos, no mostrar nada (se redirigirá)
  if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-700 mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <FileSearch className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Búsqueda de Comprobantes</h1>
              <p className="text-gray-400">Encuentra y gestiona todos los comprobantes de venta del sistema</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <FileSearch className="h-4 w-4 mr-2" />
              Gestionar Archivos
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filtros de búsqueda */}
        <SearchFilters 
          onSearch={handleSearch} 
          filtrosDisponibles={filtrosDisponibles}
          loading={loading || loadingFiltros} 
        />

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Resultados */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Lista de Comprobantes {data && `(${data.total})`}</h2>
              </div>
              {data && data.total > 0 && (
                <span className="text-sm text-gray-400">Gestiona todos los comprobantes del sistema</span>
              )}
            </div>
          </div>

          <div className="p-6">
            <ResultsList comprobantes={data?.comprobantes || []} loading={loading} />
          </div>

          {/* Paginación simple */}
          {data && data.total_pages > 1 && (
            <div className="p-6 border-t border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Página {data.page} de {data.total_pages} • {data.total} comprobantes total
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page === 1}
                  onClick={() => handleSearch({ ...currentFilters, page: data.page - 1 })}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.page === data.total_pages}
                  onClick={() => handleSearch({ ...currentFilters, page: data.page + 1 })}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Estado inicial */}
        {!data && !loading && !error && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
            <FileSearch className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Buscar Comprobantes</h3>
            <p className="text-gray-400">Utiliza los filtros de arriba para buscar comprobantes específicos</p>
          </div>
        )}
      </div>
    </div>
  )
} 