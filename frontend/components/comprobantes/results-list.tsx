"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Calendar, User, CreditCard, Settings, X } from "lucide-react"
import type { Comprobante, ArchivoComprobante } from "@/types/comprobante"
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
  
  // Estados para el modal de vista previa
  const [showModal, setShowModal] = useState(false)
  const [currentFile, setCurrentFile] = useState<ArchivoComprobante | null>(null)
  const [currentVenta, setCurrentVenta] = useState<Comprobante | null>(null)

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

  // Función para abrir el modal de vista previa
  const handleVerComprobante = (archivo: ArchivoComprobante, venta: Comprobante) => {
    setCurrentFile(archivo)
    setCurrentVenta(venta)
    setShowModal(true)
  }

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentFile(null)
    setCurrentVenta(null)
  }

  // Obtener URL de preview con autenticación
  const getPreviewUrl = (filename: string) => {
    const token = localStorage.getItem('token')
    return `https://sistemas-de-ventas-production.up.railway.app/api/comprobantes/preview/${filename}${token ? `?token=${token}` : ''}`
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
                                   onClick={() => handleVerComprobante(archivo, comprobante)}
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

      {/* Modal de vista previa con fondo borroso */}
      {showModal && currentFile && currentVenta && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-gray-800 rounded-xl max-w-5xl max-h-[95vh] overflow-auto border border-gray-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="p-4 border-b border-gray-600 flex justify-between items-center bg-gray-900 rounded-t-xl">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {currentFile.original_name || currentFile.filename}
                </h3>
                <p className="text-sm text-gray-400">
                  Venta #{currentVenta.venta_id} - {currentVenta.cliente_nombre}
                </p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6">
              {currentFile.tipo === 'imagen' ? (
                <div className="flex justify-center">
                  <img 
                    src={getPreviewUrl(currentFile.filename)}
                    alt={currentFile.original_name || currentFile.filename}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      console.error('Error cargando imagen:', e)
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                </div>
              ) : currentFile.filename?.toLowerCase().endsWith('.pdf') ? (
                <div className="bg-white rounded-lg overflow-hidden">
                  <iframe 
                    src={getPreviewUrl(currentFile.filename)}
                    className="w-full h-[70vh]"
                    title={currentFile.original_name || currentFile.filename}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-xl mb-2">Vista previa no disponible</p>
                  <p className="mb-6">Tipo de archivo: {currentFile.tipo}</p>
                  <Button
                    onClick={() => handleDownloadFile(currentFile)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                </div>
              )}
            </div>
            
            {/* Footer con información del archivo */}
            <div className="p-4 border-t border-gray-600 bg-gray-900 rounded-b-xl">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex gap-4">
                  <span>Tipo: {currentFile.tipo}</span>
                  <span>Tamaño: {currentFile.size_mb?.toFixed(1)} MB</span>
                  <span>Subido: {formatDate(currentFile.uploaded_at)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadFile(currentFile)}
                  disabled={downloading === currentFile.filename}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {downloading === currentFile.filename ? "Descargando..." : "Descargar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 