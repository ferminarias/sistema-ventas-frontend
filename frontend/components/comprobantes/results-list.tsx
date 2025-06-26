"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Calendar, User, CreditCard, Settings } from "lucide-react"
import type { Comprobante } from "@/types/comprobante"
import { FilePreview } from "./file-preview"
import { comprobantesService } from "@/services/comprobantes"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ResultsListProps {
  comprobantes: Comprobante[]
  loading?: boolean
}

export function ResultsList({ comprobantes, loading = false }: ResultsListProps) {
  const [previewFile, setPreviewFile] = useState<Comprobante | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (comprobante: Comprobante) => {
    const fileId = comprobante.id || comprobante.venta_id?.toString() || ''
    setDownloading(fileId)
    try {
      await comprobantesService.downloadFile(comprobante.archivo_adjunto || '', comprobante.archivo_nombre)
    } catch (error) {
      console.error("Error al descargar:", error)
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadFile = async (archivo: import("@/types/comprobante").ArchivoComprobante) => {
    setDownloading(archivo.filename)
    try {
      await comprobantesService.downloadFile(archivo.filename, archivo.original_name)
    } catch (error) {
      console.error("Error al descargar archivo:", error)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-700 border border-gray-600 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                <div className="h-3 bg-gray-600 rounded w-1/3"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-600 rounded"></div>
                <div className="h-8 w-20 bg-gray-600 rounded"></div>
                <div className="h-8 w-8 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (comprobantes.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No se encontraron comprobantes</h3>
        <p className="text-gray-400">
          Intenta ajustar los filtros de búsqueda para encontrar los comprobantes que necesitas.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {comprobantes.map((comprobante) => (
          <div
            key={comprobante.venta_id || comprobante.id}
            className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Header principal */}
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-semibold text-lg">
                    {comprobante.nombre} {comprobante.apellido}
                  </h3>
                  <Badge className="bg-blue-600 text-white">
                    Venta #{comprobante.venta_id}
                  </Badge>
                </div>

                {/* Información de la venta */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(comprobante.fecha_venta)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {comprobante.cliente_nombre}
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    {comprobante.asesor}
                  </div>
                </div>

                {/* Información del cliente */}
                <div className="text-xs text-gray-500">
                  Email: {comprobante.email} • Teléfono: {comprobante.telefono}
                </div>

                {/* Preview de archivos */}
                {comprobante.archivos && comprobante.archivos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Archivos adjuntos:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {comprobante.archivos.map((archivo, index) => (
                        <div key={index} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                          {/* Preview de imagen */}
                          {comprobantesService.isImageFile(archivo.filename) && (
                            <div className="mb-2">
                              <img 
                                src={comprobantesService.getPreviewUrl(archivo.filename)} 
                                alt={archivo.original_name}
                                className="w-full h-32 object-cover rounded border border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Preview de PDF */}
                          {comprobantesService.isPdfFile(archivo.filename) && (
                            <div className="mb-2">
                              <div className="w-full h-32 bg-red-100 rounded border border-gray-600 flex items-center justify-center">
                                <FileText className="h-12 w-12 text-red-600" />
                              </div>
                            </div>
                          )}

                          {/* Información del archivo */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-white truncate">{archivo.original_name}</p>
                            <p className="text-xs text-gray-400">
                              {archivo.tipo} • {archivo.size_mb.toFixed(1)} MB
                            </p>
                            
                            {/* Botones de acción */}
                            <div className="flex gap-1 mt-2">
                              {comprobantesService.canPreview(archivo.filename) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                                                     onClick={() => setPreviewFile({ 
                                     ...comprobante, 
                                     archivo_adjunto: archivo.filename, 
                                     archivo_nombre: archivo.original_name,
                                     id: comprobante.id || comprobante.venta_id?.toString() || archivo.filename
                                   } as Comprobante)}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs px-2 py-1"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleDownloadFile(archivo)}
                                disabled={downloading === archivo.filename}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                {downloading === archivo.filename ? "..." : "Descargar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback para estructura antigua */}
                {(!comprobante.archivos || comprobante.archivos.length === 0) && comprobante.archivo_nombre && (
                  <div className="text-xs text-gray-500">
                    Archivo: {typeof comprobante.archivo_nombre === 'string' ? comprobante.archivo_nombre : JSON.stringify(comprobante.archivo_nombre)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewFile && (
        <FilePreview comprobante={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  )
} 