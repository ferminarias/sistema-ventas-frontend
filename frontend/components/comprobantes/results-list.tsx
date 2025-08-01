"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Calendar, User, CreditCard, Settings, X } from "lucide-react"
import { RailwayLoader } from "@/components/ui/railway-loader"
import type { Comprobante, ArchivoComprobante } from "@/types/comprobante"
import { FilePreview } from "./file-preview"
import { comprobantesService } from "@/services/comprobantes"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ResultsListProps {
  comprobantes: Comprobante[]
  loading?: boolean
}

export function ResultsList({ comprobantes, loading = false }: ResultsListProps) {
  // Debug: Log de estructura de datos
  useEffect(() => {
    if (comprobantes.length > 0) {
      console.log("🔍 Estructura de comprobantes:", {
        total: comprobantes.length,
        muestra_comprobante: JSON.stringify(comprobantes[0], null, 2),
        archivos_primer_comprobante: comprobantes[0].archivos?.map(archivo => ({
          filename: archivo.filename,
          original_name: archivo.original_name,
          tipo: archivo.tipo,
          tipo_tipo: typeof archivo.tipo,
          size_mb: archivo.size_mb,
          file_url: archivo.file_url
        }))
      })
    }
  }, [comprobantes])

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
    return comprobantesService.getPreviewUrl(filename) // ✅ Usar servicio en lugar de hardcodear
  }

  // Obtener URL de descarga con autenticación
  const getDownloadUrl = (filename: string) => {
    return comprobantesService.getDownloadUrl(filename) // ✅ Usar servicio en lugar de hardcodear
  }

  // Obtener nombre amigable para mostrar
  const getDisplayName = (archivo: ArchivoComprobante) => {
    // Usar original_name si está disponible, sino filename
    if (typeof archivo.original_name === 'string') {
      return archivo.original_name
    }
    if (typeof archivo.filename === 'string') {
      return archivo.filename
    }
    return 'Archivo sin nombre'
  }

  // Obtener tipo de archivo de forma segura
  const getTipoArchivo = (archivo: ArchivoComprobante) => {
    if (typeof archivo.tipo === 'object') {
      return (archivo.tipo as any).label || (archivo.tipo as any).value || 'Desconocido'
    }
    if (typeof archivo.tipo === 'string') {
      return archivo.tipo
    }
    return 'Desconocido'
  }

  // Función segura para verificar si es imagen
  const isImageFile = (filename: any) => {
    if (typeof filename !== 'string') return false
    return comprobantesService.isImageFile(filename)
  }

  // Función segura para verificar si es PDF
  const isPdfFile = (filename: any) => {
    if (typeof filename !== 'string') return false
    return comprobantesService.isPdfFile(filename)
  }

  // Función segura para verificar si se puede previsualizar
  const canPreview = (filename: any) => {
    if (typeof filename !== 'string') return false
    return comprobantesService.canPreview(filename)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <RailwayLoader size="lg" text="Buscando comprobantes..." />
        </div>
        
        {/* Skeleton para los resultados */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-card rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header skeleton */}
                  <div className="flex items-center gap-3">
                    <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
                    <div className="h-6 bg-blue-600/30 rounded w-16 animate-pulse"></div>
                  </div>
                  
                  {/* Info skeleton */}
                  <div className="flex items-center gap-6">
                    <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-28 animate-pulse"></div>
                  </div>
                  
                  {/* Contact skeleton */}
                  <div className="h-3 bg-muted rounded w-64 animate-pulse"></div>
                  
                  {/* Files skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="bg-card border border-card rounded-lg p-3">
                          <div className="h-32 bg-muted rounded mb-2 animate-pulse"></div>
                          <div className="space-y-1">
                            <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                            <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
                            <div className="flex gap-1 mt-2">
                              <div className="h-6 bg-muted rounded w-12 animate-pulse"></div>
                              <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons skeleton */}
                <div className="flex flex-col gap-2">
                  <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
                </div>
              </div>
              
              {/* Mini railway loader per card */}
              <div className="mt-4 flex justify-center">
                <RailwayLoader size="sm" showText={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (comprobantes.length === 0) {
    return (
      <div className="bg-card border border-card rounded-lg p-12 text-center">
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
            className="bg-card border border-card rounded-lg p-4 hover:bg-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {typeof comprobante.nombre === 'string' ? comprobante.nombre : 'Sin nombre'} {typeof comprobante.apellido === 'string' ? comprobante.apellido : ''}
                  </h3>
                  <Badge variant="secondary" className="bg-blue-600 text-white">
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
                    {typeof comprobante.cliente_nombre === 'string' ? comprobante.cliente_nombre : 'Cliente sin nombre'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    {typeof comprobante.asesor === 'string' ? comprobante.asesor : 'Asesor no especificado'}
                  </div>
                </div>

                {/* Información del cliente */}
                <div className="text-xs text-gray-500">
                  Email: {typeof comprobante.email === 'string' ? comprobante.email : 'Email no disponible'} • Teléfono: {typeof comprobante.telefono === 'string' ? comprobante.telefono : 'Teléfono no disponible'}
                </div>

                {/* Preview de archivos */}
                {comprobante.archivos && comprobante.archivos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Archivos adjuntos:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {comprobante.archivos.map((archivo, index) => (
                        <div key={index} className="bg-card border border-card rounded-lg p-3">
                          {/* Preview de imagen */}
                          {isImageFile(archivo.filename) && (
                            <div className="mb-2">
                              <img 
                                src={comprobantesService.getPreviewUrl(typeof archivo.filename === 'string' ? archivo.filename : '')} 
                                alt={typeof archivo.original_name === 'string' ? archivo.original_name : 'Imagen'}
                                className="w-full h-32 object-cover rounded border border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Preview de PDF */}
                          {isPdfFile(archivo.filename) && (
                            <div className="mb-2">
                              <div className="w-full h-32 bg-red-100 rounded border border-gray-600 flex items-center justify-center">
                                <FileText className="h-12 w-12 text-red-600" />
                              </div>
                            </div>
                          )}

                          {/* Información del archivo */}
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-white truncate">
                              {getDisplayName(archivo)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {getTipoArchivo(archivo)} • {typeof archivo.size_mb === 'number' ? archivo.size_mb.toFixed(1) : '0.0'} MB
                            </p>
                            
                            {/* Botones de acción */}
                                                         <div className="flex gap-1 mt-2">
                               {canPreview(archivo.filename) && (
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
                                 disabled={downloading === (typeof archivo.filename === 'string' ? archivo.filename : '')}
                                 className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1"
                               >
                                 <Download className="h-3 w-3 mr-1" />
                                 {downloading === (typeof archivo.filename === 'string' ? archivo.filename : '') ? "..." : "Descargar"}
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
                    Archivo: {typeof comprobante.archivo_nombre === 'string' ? comprobante.archivo_nombre : 'Archivo sin nombre'}
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
            className="bg-card rounded-xl max-w-5xl max-h-[95vh] overflow-auto border border-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="p-4 border-b border-card flex justify-between items-center bg-gray-900 rounded-t-xl">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {getDisplayName(currentFile)}
                </h3>
                <p className="text-sm text-gray-400">
                  Venta #{currentVenta.venta_id} - {typeof currentVenta.cliente_nombre === 'string' ? currentVenta.cliente_nombre : 'Cliente sin nombre'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-4 space-y-4">
              {/* Información del archivo */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Venta ID:</span>
                  <span className="text-white">#{currentVenta.venta_id}</span>
                </div>
                <div>
                  <span className="text-gray-400">Cliente:</span>
                  <span className="text-white">{typeof currentVenta.cliente_nombre === 'string' ? currentVenta.cliente_nombre : 'Cliente sin nombre'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Archivo:</span>
                  <span className="text-white">{typeof currentFile.original_name === 'string' ? currentFile.original_name : (typeof currentFile.filename === 'string' ? currentFile.filename : 'Archivo sin nombre')}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tamaño:</span>
                  <span className="text-white">{typeof currentFile.size_mb === 'number' ? `${currentFile.size_mb.toFixed(1)} MB` : 'N/A'}</span>
                </div>
              </div>

              {currentFile.tipo === 'imagen' ? (
                <div className="flex justify-center">
                  <img 
                    src={getPreviewUrl(typeof currentFile.filename === 'string' ? currentFile.filename : '')}
                    alt={typeof currentFile.original_name === 'string' ? currentFile.original_name : (typeof currentFile.filename === 'string' ? currentFile.filename : 'Archivo')}
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
                    src={getPreviewUrl(typeof currentFile.filename === 'string' ? currentFile.filename : '')}
                    className="w-full h-[70vh]"
                    title={typeof currentFile.original_name === 'string' ? currentFile.original_name : (typeof currentFile.filename === 'string' ? currentFile.filename : 'Archivo')}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-xl mb-2">Vista previa no disponible</p>
                  <p className="mb-6">Tipo de archivo: {typeof currentFile.tipo === 'object' ? (currentFile.tipo as any).label || (currentFile.tipo as any).value || 'Desconocido' : currentFile.tipo}</p>
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
            <div className="p-4 border-t border-card bg-gray-900 rounded-b-xl">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex gap-4">
                  <span>Tipo: {typeof currentFile.tipo === 'object' ? (currentFile.tipo as any).label || (currentFile.tipo as any).value || 'Desconocido' : currentFile.tipo}</span>
                  <span>Tamaño: {typeof currentFile.size_mb === 'number' ? currentFile.size_mb.toFixed(1) : '0.0'} MB</span>
                  <span>Subido: {formatDate(currentFile.uploaded_at)}</span>
                </div>
                <Button
                  onClick={() => handleDownloadFile(currentFile)}
                  disabled={downloading === (typeof currentFile.filename === 'string' ? currentFile.filename : '')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === (typeof currentFile.filename === 'string' ? currentFile.filename : '') ? "Descargando..." : "Descargar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 