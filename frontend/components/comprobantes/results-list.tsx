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
      console.log("🔍 ESTRUCTURA COMPLETA DE COMPROBANTES:")
      console.log("📊 Total comprobantes:", comprobantes.length)
      
      comprobantes.forEach((comprobante, index) => {
        console.log(`\n📄 COMPROBANTE ${index + 1}:`)
        console.log("- ID venta:", comprobante.venta_id)
        console.log("- Cliente:", comprobante.cliente_nombre)
        console.log("- Archivos array:", comprobante.archivos)
        console.log("- Cantidad archivos:", comprobante.archivos?.length || 0)
        
        if (comprobante.archivos && comprobante.archivos.length > 0) {
          comprobante.archivos.forEach((archivo, i) => {
            console.log(`\n  📎 ARCHIVO ${i + 1}:`)
            console.log("  - Objeto completo:", JSON.stringify(archivo, null, 4))
            console.log("  - filename:", archivo.filename)
            console.log("  - original_name:", archivo.original_name)
            console.log("  - file_url:", archivo.file_url)
            console.log("  - tipo:", archivo.tipo)
            console.log("  - size_mb:", archivo.size_mb)
            console.log("  - field_id:", archivo.field_id)
            console.log("  - uploaded_at:", archivo.uploaded_at)
          })
        } else {
          console.log("  ❌ NO HAY ARCHIVOS o archivos es null/undefined")
        }
        
        // Verificar propiedades legacy
        console.log("- archivo_adjunto (legacy):", comprobante.archivo_adjunto)
        console.log("- archivo_nombre (legacy):", comprobante.archivo_nombre)
      })
    }
  }, [comprobantes])

  // Estado para URLs de imagen cargadas con autenticación
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())

  // Función para cargar imagen con autenticación
  const loadImageWithAuth = async (filename: string): Promise<string> => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(comprobantesService.getPreviewUrl(filename), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'image/*',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      console.log("✅ Imagen cargada:", filename)
      return url
    } catch (error) {
      console.error("❌ Error cargando imagen:", filename, error)
      throw error
    }
  }

  // Componente de imagen con autenticación
  const AuthenticatedImage = ({ filename, alt, className }: { filename: string, alt: string, className: string }) => {
    const [imageSrc, setImageSrc] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
      let isMounted = true

      const loadImage = async () => {
        try {
          setLoading(true)
          setError(false)
          
          // Verificar si ya tenemos la URL en cache
          const cachedUrl = imageUrls.get(filename)
          if (cachedUrl) {
            setImageSrc(cachedUrl)
            setLoading(false)
            return
          }

          const url = await loadImageWithAuth(filename)
          if (isMounted) {
            setImageSrc(url)
            setImageUrls(prev => new Map(prev).set(filename, url))
            setLoading(false)
          }
        } catch (err) {
          if (isMounted) {
            setError(true)
            setLoading(false)
          }
        }
      }

      loadImage()

      return () => {
        isMounted = false
      }
    }, [filename])

    if (loading) {
      return (
        <div className={`${className} flex items-center justify-center bg-gray-800`}>
          <div className="text-gray-400">Cargando imagen...</div>
        </div>
      )
    }

    if (error || !imageSrc) {
      return (
        <div className={`${className} flex items-center justify-center bg-gray-800`}>
          <img src="/placeholder.jpg" alt="Error cargando imagen" className={className} />
        </div>
      )
    }

    return <img src={imageSrc} alt={alt} className={className} />
  }

  const [previewFile, setPreviewFile] = useState<Comprobante | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  
  // Estados para el modal de vista previa
  const [showModal, setShowModal] = useState(false)
  const [currentFile, setCurrentFile] = useState<ArchivoComprobante | null>(null)
  const [currentVenta, setCurrentVenta] = useState<Comprobante | null>(null)

  // Limpiar URLs de blob al desmontar el componente
  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

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
    // Obtener filename de manera consistente
    const filename = getFilename(archivo)
    const originalName = archivo.original_name || archivo.filename || 'archivo_descarga'
    
    console.log("🔽 Iniciando descarga:", {
      filename,
      originalName,
      archivo_completo: archivo
    })
    
    if (!filename) {
      console.error("❌ No se encontró filename para descargar")
      return
    }
    
    setDownloading(filename)
    try {
      await comprobantesService.downloadFile(filename, originalName)
      console.log("✅ Descarga exitosa")
    } catch (error) {
      console.error("❌ Error al descargar archivo:", error)
    } finally {
      setDownloading(null)
    }
  }

  // Función para abrir el modal de vista previa
  const handleVerComprobante = (archivo: ArchivoComprobante, venta: Comprobante) => {
    console.log("🔍 Abriendo vista previa:", getFilename(archivo))
    
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
    return comprobantesService.getPreviewUrl(filename)
  }

  // Obtener URL de descarga con autenticación
  const getDownloadUrl = (filename: string) => {
    return comprobantesService.getDownloadUrl(filename)
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

  // Helper para obtener filename de manera consistente
  const getFilename = (archivo: ArchivoComprobante) => {
    return archivo.filename || archivo.file_url || archivo.original_name || ''
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
    const actualFilename = typeof filename === 'string' ? filename : ''
    
    // Si es una imagen o PDF, permitir preview
    if (actualFilename && (comprobantesService.isImageFile(actualFilename) || comprobantesService.isPdfFile(actualFilename))) {
      return true
    }
    
    // Para otros tipos, no mostrar preview (solo descarga)
    return false
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!comprobantes || comprobantes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-600" />
        <h3 className="mt-2 text-sm font-semibold text-gray-300">No hay comprobantes</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron comprobantes que coincidan con los filtros aplicados.
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
                <div className="flex items-center gap-6 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {typeof comprobante.email === 'string' ? comprobante.email : 'Email no disponible'}
                  </div>
                  {comprobante.telefono && (
                    <div>
                      Tel: {typeof comprobante.telefono === 'string' ? comprobante.telefono : 'No disponible'}
                    </div>
                  )}
                </div>

                {/* Archivos adjuntos */}
                {comprobante.archivos && comprobante.archivos.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Archivos adjuntos:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {comprobante.archivos.map((archivo, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {getDisplayName(archivo)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {getTipoArchivo(archivo)} • {typeof archivo.size_mb === 'number' ? archivo.size_mb.toFixed(1) : '0.0'} MB
                              </p>
                              
                              {/* Botones de acción */}
                              <div className="flex gap-1 mt-2">
                                {canPreview(getFilename(archivo)) && (
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
                                  disabled={downloading === getFilename(archivo)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {downloading === getFilename(archivo) ? "..." : "Descargar"}
                                </Button>
                              </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
              <h3 className="text-lg font-semibold text-white">Vista Previa</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

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

              {isImageFile(getFilename(currentFile)) ? (
                <div className="flex justify-center">
                  <div className="relative">
                    <AuthenticatedImage
                      filename={getFilename(currentFile)}
                      alt={getDisplayName(currentFile)}
                      className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                    />
                  </div>
                </div>
              ) : isPdfFile(getFilename(currentFile)) ? (
                <div className="flex justify-center">
                  <iframe
                    src={getPreviewUrl(getFilename(currentFile))}
                    className="w-full h-96 rounded-lg border border-gray-600"
                    title={getDisplayName(currentFile)}
                    onLoad={() => {
                      console.log("✅ PDF cargado exitosamente:", getFilename(currentFile))
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Vista previa no disponible para este tipo de archivo</p>
                    <p className="text-sm text-gray-500">Usa el botón de descarga para ver el contenido</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-card bg-gray-900 rounded-b-xl">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex gap-4">
                  <span>Tipo: {typeof currentFile.tipo === 'object' ? (currentFile.tipo as any).label || (currentFile.tipo as any).value || 'Desconocido' : currentFile.tipo}</span>
                  <span>Tamaño: {typeof currentFile.size_mb === 'number' ? currentFile.size_mb.toFixed(1) : '0.0'} MB</span>
                  <span>Subido: {formatDate(currentFile.uploaded_at)}</span>
                </div>
                <Button
                  onClick={() => handleDownloadFile(currentFile)}
                  disabled={downloading === getFilename(currentFile)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading === getFilename(currentFile) ? "Descargando..." : "Descargar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 