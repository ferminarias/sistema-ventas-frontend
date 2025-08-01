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
  console.log("🔧 EditVentaModal renderizado con venta:", venta.id)
  
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nombre: venta.nombre,
    apellido: venta.apellido,
    email: venta.email,
    telefono: venta.telefono,
    asesor: venta.asesor,
    cliente: venta.cliente,
    fecha_venta: venta.fecha_venta.split('T')[0] // Solo la fecha
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
    console.log("🔧 useEffect ejecutándose para venta:", venta.id)
    console.log("🔧 venta.tiene_archivos:", venta.tiene_archivos)
    console.log("🔧 venta.campos_adicionales:", venta.campos_adicionales)
    
    const cargarArchivos = async () => {
      if (!venta.tiene_archivos) {
        console.log("🔧 No tiene archivos, saltando carga")
        return
      }
      
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
              value.includes('/api/comprobantes/')
            )) {
              archivos.push({
                field_id: fieldId,
                filename: value.split('/').pop() || value,
                original_name: `${fieldId}.jpg`,
                file_url: value
              })
            }
          })
          
          console.log("🔧 Archivos encontrados:", archivos)
          setArchivosActuales(archivos)
        }
      } catch (error) {
        console.error('Error cargando archivos:', error)
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
    console.log("📎 handleAgregarArchivo llamado con:", {
      fieldId,
      base64Length: base64.length,
      base64Preview: base64.substring(0, 100) + "..."
    })
    
    setArchivosNuevos(prev => {
      const nuevos = {
        ...prev,
        [fieldId]: base64
      }
      console.log("📎 Estado actual de archivos nuevos:", Object.keys(nuevos))
      console.log("📎 Total de archivos nuevos:", Object.keys(nuevos).length)
      return nuevos
    })
    
    console.log("📎 Toast mostrado")
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
    console.log("🔧 handleSubmit ejecutándose")
    e.preventDefault()
    setLoading(true)
    try {
      console.log("📎 Estado antes de enviar:", {
        archivosAEliminar,
        archivosNuevos: Object.keys(archivosNuevos),
        archivosNuevosCount: Object.keys(archivosNuevos).length
      })
      
      const payload = {
        ...formData,
        ...(archivosAEliminar.length > 0 && { archivos_eliminar: archivosAEliminar }),
        ...(Object.keys(archivosNuevos).length > 0 && { archivos_nuevos: archivosNuevos })
      }
      
      console.log("📎 Payload de edición con archivos:", {
        ...payload,
        archivos_nuevos: Object.keys(archivosNuevos).map(key => ({
          [key]: `${archivosNuevos[key].substring(0, 50)}...`
        }))
      })
      
      console.log("📎 Llamando onSave con payload")
      await onSave(payload)
      console.log("📎 onSave completado exitosamente")
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
                      {/* Botón de test para verificar funcionamiento */}
                      <Button
                        type="button"
                        onClick={() => {
                          console.log("🧪 Test: Botón clickeado")
                          const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                          const fieldId = `test_imagen_${Date.now()}`
                          console.log("🧪 Test: Agregando imagen de prueba")
                          handleAgregarArchivo(fieldId, testBase64)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white mb-2"
                      >
                        🧪 Test: Agregar Imagen de Prueba
                      </Button>
                      
                      <FileUpload
                        value=""
                        onChange={(base64) => {
                          console.log("📎 FileUpload onChange llamado con:", {
                            base64Length: base64 ? base64.length : 0,
                            base64Preview: base64 ? base64.substring(0, 100) + "..." : "null"
                          })
                          if (base64) {
                            const fieldId = `imagen_comprobante_${Date.now()}`
                            console.log("📎 Llamando handleAgregarArchivo con fieldId:", fieldId)
                            handleAgregarArchivo(fieldId, base64)
                          }
                        }}
                        label="Comprobante Principal"
                        placeholder="Seleccionar imagen..."
                        accept="image/*"
                        maxSize={2} // Reducir a 2MB para evitar errores del backend
                      />
                      
                      {/* Test alternativo con input file directo */}
                      <div className="bg-blue-900/50 border border-blue-600 rounded p-3">
                        <Label className="text-blue-300 text-sm">🧪 Test Alternativo (Input File Directo)</Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              console.log("🧪 Test: Archivo seleccionado directamente:", file.name, file.size)
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                const base64 = e.target?.result as string
                                if (base64) {
                                  console.log("🧪 Test: Base64 generado, llamando handleAgregarArchivo")
                                  const fieldId = `test_directo_${Date.now()}`
                                  handleAgregarArchivo(fieldId, base64)
                                }
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="mt-2 text-blue-300"
                        />
                      </div>
                      
                      {/* Test para verificar búsqueda de comprobantes */}
                      <div className="bg-orange-900/50 border border-orange-600 rounded p-3">
                        <Label className="text-orange-300 text-sm">🔍 Test de Búsqueda</Label>
                        <Button
                          type="button"
                          onClick={async () => {
                            console.log("🔍 Probando búsqueda de comprobantes para venta:", venta.id)
                            try {
                              const { comprobantesService } = await import('@/services/comprobantes')
                              const result = await comprobantesService.searchComprobantes({
                                busqueda: venta.id.toString(),
                                page: 1,
                                limit: 20
                              })
                              console.log("🔍 Resultado de búsqueda:", {
                                total: result.total,
                                comprobantes: result.comprobantes?.length || 0,
                                comprobantesEncontrados: result.comprobantes?.map(c => ({
                                  id: c.id,
                                  venta_id: c.venta_id,
                                  archivos: c.archivos?.length || 0
                                }))
                              })
                            } catch (error) {
                              console.error("🔍 Error en búsqueda de prueba:", error)
                            }
                          }}
                          className="mt-2 bg-orange-600 hover:bg-orange-700 text-white w-full"
                        >
                          🔍 Probar Búsqueda de Comprobantes
                        </Button>
                      </div>
                      
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