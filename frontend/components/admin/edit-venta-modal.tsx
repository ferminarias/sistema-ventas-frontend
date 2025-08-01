'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Image, Trash2, Upload, Eye } from 'lucide-react'
import { type VentaAdmin } from '@/services/admin-ventas-service'
import { RailwayLoader } from '@/components/ui/railway-loader'
import { FileUpload } from '@/components/ui/file-upload'
import { comprobantesService } from '@/services/comprobantes'
import { useToast } from '@/components/ui/use-toast'

interface Props {
  venta: VentaAdmin
  clientes: any[]
  permisos: any
  onSave: (data: Partial<VentaAdmin> & { archivos_eliminar?: string[], archivos_nuevos?: Record<string, string> }) => void
  onClose: () => void
}

interface ArchivoAdjunto {
  field_id: string
  filename: string
  original_name: string
  file_url: string
}

export function EditVentaModal({ venta, clientes, permisos, onSave, onClose }: Props) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nombre: venta.nombre,
    apellido: venta.apellido,
    email: venta.email,
    telefono: venta.telefono,
    asesor: venta.asesor,
    cliente: venta.cliente,
    fecha_venta: (() => {
      // Convertir la fecha a formato yyyy-MM-dd de manera robusta
      try {
        const date = new Date(venta.fecha_venta)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch {
        // Fallback si la fecha no es válida
        return new Date().toISOString().split('T')[0]
      }
    })()
  })
  const [loading, setLoading] = useState(false)
  
  // Estados para manejo de archivos
  const [archivosActuales, setArchivosActuales] = useState<ArchivoAdjunto[]>([])
  const [archivosAEliminar, setArchivosAEliminar] = useState<string[]>([])
  const [archivosNuevos, setArchivosNuevos] = useState<Record<string, string>>({})
  const [mostrandoArchivos, setMostrandoArchivos] = useState(false)
  const [cargandoArchivos, setCargandoArchivos] = useState(false)

  // Cargar archivos adjuntos existentes
  useEffect(() => {
    if (!venta.tiene_archivos) {
      return
    }
    
    const cargarArchivos = async () => {
      setCargandoArchivos(true)
      try {
        // Intentar extraer archivos desde campos_adicionales o usar endpoint específico
        if (venta.campos_adicionales && typeof venta.campos_adicionales === 'object') {
          const archivos: ArchivoAdjunto[] = []
          
          Object.entries(venta.campos_adicionales).forEach(([fieldId, value]) => {
            // Si el valor parece ser una URL de archivo
            if (typeof value === 'string' && (
              value.startsWith('https://res.cloudinary.com/') || 
              value.startsWith('local_') ||
              value.includes('/api/comprobantes/') ||
              value.startsWith('/static/uploads/') // ✅ Agregar detección para archivos locales
            )) {
              archivos.push({
                field_id: fieldId,
                filename: value.split('/').pop() || value,
                original_name: `${fieldId}.jpg`,
                file_url: value
              })
            }
          })
          
          setArchivosActuales(archivos)
        }
      } catch (error) {
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar algunos archivos adjuntos",
          variant: "destructive"
        })
      } finally {
        setCargandoArchivos(false)
      }
    }

    cargarArchivos()
  }, [venta, toast])

  const handleEliminarArchivo = (fieldId: string) => {
    setArchivosAEliminar(prev => [...prev, fieldId])
    setArchivosActuales(prev => prev.filter(archivo => archivo.field_id !== fieldId))
    
    toast({
      title: "Archivo marcado para eliminación",
      description: "El archivo se eliminará al guardar los cambios"
    })
  }

  const handleAgregarArchivo = (fieldId: string, base64: string) => {
    setArchivosNuevos(prev => {
      const nuevos = {
        ...prev,
        [fieldId]: base64
      }
      return nuevos
    })
    
    toast({
      title: "Archivo agregado",
      description: "El archivo se subirá al guardar los cambios"
    })
  }

  const handleEliminarArchivoNuevo = (fieldId: string) => {
    setArchivosNuevos(prev => {
      const nuevos = { ...prev }
      delete nuevos[fieldId]
      return nuevos
    })
  }

  const handleVerArchivo = (archivo: ArchivoAdjunto) => {
    try {
      const url = comprobantesService.getPreviewUrl(archivo.file_url)
      window.open(url, '_blank')
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo abrir el archivo",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      
      const payload = {
        ...formData,
        ...(archivosAEliminar.length > 0 && { archivos_eliminar: archivosAEliminar }),
        ...(Object.keys(archivosNuevos).length > 0 && { archivos_nuevos: archivosNuevos })
      }
      
      await onSave(payload)
    } catch (error) {
      console.error("📎 Error en handleSubmit:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              ✏️ Editar Venta #{venta.id}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
              <RailwayLoader size="md" text="Guardando cambios..." />
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Nombre *</Label>
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Apellido *</Label>
                <Input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Teléfono *</Label>
              <Input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Asesor *</Label>
              <Input
                type="text"
                value={formData.asesor}
                onChange={(e) => setFormData({...formData, asesor: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                required
              />
            </div>

            {permisos?.can_edit_all && (
              <div className="space-y-2">
                <Label className="text-white">Cliente *</Label>
                <Select
                  value={formData.cliente.toString()}
                  onValueChange={(value) => setFormData({...formData, cliente: parseInt(value)})}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()} className="text-white hover:bg-gray-600">
                        {cliente.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white">Fecha de Venta</Label>
              <Input
                type="date"
                value={formData.fecha_venta}
                onChange={(e) => setFormData({...formData, fecha_venta: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
              />
            </div>

            {/* Sección de Archivos */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-white text-lg">📎 Comprobantes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrandoArchivos(!mostrandoArchivos)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {mostrandoArchivos ? 'Ocultar' : 'Mostrar'} Archivos
                </Button>
              </div>

              {mostrandoArchivos && (
                <div className="space-y-4">
                  {/* Archivos actuales */}
                  {cargandoArchivos ? (
                    <div className="flex items-center justify-center py-4">
                      <RailwayLoader size="sm" text="Cargando archivos..." />
                    </div>
                  ) : archivosActuales.length > 0 ? (
                    <div>
                      <Label className="text-white text-sm">Archivos Existentes</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {archivosActuales.map((archivo) => (
                          <div key={archivo.field_id} className="bg-gray-700 p-3 rounded border border-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <Image className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{archivo.field_id}</p>
                                  <p className="text-gray-400 text-xs truncate">
                                    {archivo.original_name || archivo.filename}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVerArchivo(archivo)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEliminarArchivo(archivo.field_id)}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No hay archivos adjuntos</p>
                  )}

                  {/* Archivos marcados para eliminación */}
                  {archivosAEliminar.length > 0 && (
                    <div>
                      <Label className="text-red-400 text-sm">⚠️ Archivos a eliminar ({archivosAEliminar.length})</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {archivosAEliminar.map(fieldId => (
                          <span key={fieldId} className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">
                            {fieldId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subir nuevos archivos */}
                  <div>
                    <Label className="text-white text-sm">Agregar Nuevos Comprobantes</Label>
                    <div className="space-y-3 mt-2">
                      <FileUpload
                        value=""
                        onChange={(base64) => {
                          if (base64) {
                            const fieldId = `imagen_comprobante_${Date.now()}`
                            handleAgregarArchivo(fieldId, base64)
                          }
                        }}
                        label="Comprobante Principal"
                        placeholder="Seleccionar imagen..."
                        accept="image/*"
                        maxSize={2} // Reducir a 2MB para evitar errores del backend
                      />
                      
                      {/* Aviso sobre tamaño */}
                      <div className="bg-yellow-900/50 border border-yellow-600 rounded p-3">
                        <p className="text-yellow-300 text-sm">
                          ⚠️ <strong>Importante:</strong> Las imágenes deben ser menores a 2MB.
                          Si tu imagen es muy grande, comprímela usando herramientas como TinyPNG.
                        </p>
                      </div>
                      
                      {/* Preview de archivos nuevos */}
                      {Object.entries(archivosNuevos).length > 0 && (
                        <div>
                          <Label className="text-green-400 text-sm">✅ Archivos a subir ({Object.keys(archivosNuevos).length})</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {Object.entries(archivosNuevos).map(([fieldId, base64]) => (
                              <div key={fieldId} className="bg-green-900 p-3 rounded border border-green-600">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img 
                                      src={base64} 
                                      alt="Preview" 
                                      className="h-8 w-8 object-cover rounded flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-green-300 text-sm font-medium truncate">{fieldId}</p>
                                      <p className="text-green-400 text-xs">
                                        {Math.round((base64.length * 3/4 - 2) / 1024)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEliminarArchivoNuevo(fieldId)}
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Guardando..." : "💾 Guardar Cambios"}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                ❌ Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </div>
    </div>
  )
} 