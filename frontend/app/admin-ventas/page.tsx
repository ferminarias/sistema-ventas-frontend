'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { adminVentasService, type VentaAdmin, type AdminVentasResponse } from '@/services/admin-ventas-service'
import { clientService } from '@/services/client-service'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, RotateCcw, Edit, Trash2, Users, FileText, BarChart3 } from 'lucide-react'
import { RailwayLoader } from '@/components/ui/railway-loader'
import dynamic from 'next/dynamic'

// Importar modales de forma lazy para evitar errores de hidratación
const EditVentaModal = dynamic(() => import('@/components/admin/edit-venta-modal').then(mod => ({ default: mod.EditVentaModal })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><RailwayLoader size="md" text="Cargando modal..." /></div>
})

const DeleteConfirmModal = dynamic(() => import('@/components/admin/delete-confirm-modal').then(mod => ({ default: mod.DeleteConfirmModal })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><RailwayLoader size="md" text="Cargando modal..." /></div>
})

export default function AdminVentasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [ventas, setVentas] = useState<VentaAdmin[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [permisos, setPermisos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<any[]>([])
  
  // Estados para filtros - valores iniciales limpios para evitar React error #31
  const [filtros, setFiltros] = useState({
    busqueda: '',
    cliente_id: 'all',
    asesor: '',
    fecha_inicio: '',
    fecha_fin: '',
    page: 1,
    limit: 20
  })
  
  // Estados para modales
  const [editModal, setEditModal] = useState<{show: boolean; venta: VentaAdmin | null}>({
    show: false,
    venta: null
  })
  const [deleteModal, setDeleteModal] = useState<{show: boolean; venta: VentaAdmin | null}>({
    show: false,
    venta: null
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

  // Cargar datos iniciales una sola vez
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'supervisor')) {
      cargarDatos()
      cargarClientes()
    }
  }, [user])

  // Recargar solo ventas cuando cambian filtros
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'supervisor')) {
      cargarDatos()
    }
  }, [filtros])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Preparar filtros - convertir "all" a undefined para evitar errores
      const filtrosLimpios = {
        ...filtros,
        cliente_id: filtros.cliente_id === 'all' ? undefined : Number(filtros.cliente_id)
      }
      
      const response = await adminVentasService.getVentasAdmin(filtrosLimpios)
      setVentas(response.ventas)
      setPagination(response.pagination)
      setStats(response.stats)
      setPermisos(response.user_permissions)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar ventas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarClientes = async () => {
    try {
      const clientesData = await clientService.getAllClients()
      setClientes(clientesData)
    } catch (error) {
      console.error('Error cargando clientes:', error)
    }
  }

  const handleEditarVenta = (venta: VentaAdmin) => {
    setEditModal({show: true, venta})
  }

  const handleEliminarVenta = (venta: VentaAdmin) => {
    setDeleteModal({show: true, venta})
  }

  const confirmarEdicion = async (ventaEditada: Partial<VentaAdmin> & { archivos_eliminar?: string[], archivos_nuevos?: Record<string, string> }) => {
    if (!editModal.venta) return
    
    console.log("📎 confirmarEdicion recibió:", {
      ventaId: editModal.venta.id,
      archivosEliminar: ventaEditada.archivos_eliminar,
      archivosNuevos: ventaEditada.archivos_nuevos ? Object.keys(ventaEditada.archivos_nuevos) : undefined,
      archivosNuevosCount: ventaEditada.archivos_nuevos ? Object.keys(ventaEditada.archivos_nuevos).length : 0
    })
    
    // Verificar estructura detallada de archivos_nuevos
    if (ventaEditada.archivos_nuevos) {
      console.log("📎 Estructura detallada de archivos_nuevos:", 
        Object.entries(ventaEditada.archivos_nuevos).map(([key, value]) => ({
          fieldId: key,
          isBase64: typeof value === 'string' && value.startsWith('data:'),
          length: typeof value === 'string' ? value.length : 0,
          preview: typeof value === 'string' ? value.substring(0, 100) + '...' : 'No es string'
        }))
      )
    }
    
    try {
      console.log("📎 Enviando petición al backend...")
      const response = await adminVentasService.editarVenta(editModal.venta.id, ventaEditada)
      
      console.log("📎 Respuesta completa del backend:", {
        message: response.message,
        venta: response.venta,
        ventaTieneArchivos: response.venta?.tiene_archivos,
        ventaCamposAdicionales: response.venta?.campos_adicionales
      })
      
      // Actualizar la venta en la lista local inmediatamente
      if (response.venta) {
        setVentas(prev => prev.map(v => 
          v.id === response.venta.id ? { ...v, ...response.venta } : v
        ))
        console.log("📎 Venta actualizada en lista local")
      }
      
      // Mensaje de éxito más detallado
      let mensaje = "Venta actualizada correctamente"
      if (ventaEditada.archivos_eliminar && ventaEditada.archivos_eliminar.length > 0) {
        mensaje += `. ${ventaEditada.archivos_eliminar.length} archivo(s) eliminado(s)`
      }
      if (ventaEditada.archivos_nuevos && Object.keys(ventaEditada.archivos_nuevos).length > 0) {
        mensaje += `. ${Object.keys(ventaEditada.archivos_nuevos).length} archivo(s) agregado(s)`
      }
      
      toast({
        title: "Éxito",
        description: mensaje,
      })
      
      console.log("📎 Cerrando modal y recargando datos...")
      const ventaIdParaVerificacion = editModal.venta.id // ✅ Guardar antes de cerrar modal
      setEditModal({show: false, venta: null})
      
      // Verificar inmediatamente si los archivos se guardaron
      if (ventaEditada.archivos_nuevos && Object.keys(ventaEditada.archivos_nuevos).length > 0) {
        console.log("📎 Verificando si los archivos se guardaron...")
        setTimeout(async () => {
          try {
            const ventaActualizada = await adminVentasService.getVentaById(ventaIdParaVerificacion) // ✅ Usar ID guardado
            console.log("📎 Verificación post-guardado:", {
              tieneArchivos: ventaActualizada.tiene_archivos,
              camposAdicionales: ventaActualizada.campos_adicionales,
              archivosEncontrados: ventaActualizada.campos_adicionales ? Object.keys(ventaActualizada.campos_adicionales) : []
            })
            
            // Verificar también si aparece en búsqueda de comprobantes
            console.log("🔍 Verificando búsqueda de comprobantes para venta:", ventaIdParaVerificacion)
            const { comprobantesService } = await import('@/services/comprobantes')
            
            // Primero buscar por ID específico
            const resultadoBusqueda = await comprobantesService.searchComprobantes({
              busqueda: ventaIdParaVerificacion.toString(),
              page: 1,
              limit: 20
            })
            console.log("🔍 Resultado de búsqueda post-edición (por ID):", {
              filtro_usado: `busqueda: ${ventaIdParaVerificacion.toString()}`,
              total: resultadoBusqueda.total,
              comprobantes: resultadoBusqueda.comprobantes?.length || 0,
              comprobantesDetalle: resultadoBusqueda.comprobantes?.map(c => ({
                id: c.id,
                venta_id: c.venta_id,
                archivos: c.archivos?.length || 0
              }))
            })
            
            // También buscar sin filtros para ver si aparece en general
            const resultadoGeneral = await comprobantesService.searchComprobantes({
              page: 1,
              limit: 20
            })
            console.log("🔍 Resultado de búsqueda general:", {
              total: resultadoGeneral.total,
              comprobantes: resultadoGeneral.comprobantes?.length || 0,
              ventasEncontradas: resultadoGeneral.comprobantes?.map(c => c.venta_id).filter(id => id === ventaIdParaVerificacion)
            })
          } catch (error) {
            console.error("📎 Error verificando archivos guardados:", error)
          }
        }, 2000)
      }
      
      // Recargar después de un pequeño delay para asegurar que el backend procesó
      setTimeout(() => {
        console.log("📎 Recargando datos de admin ventas...")
        cargarDatos()
      }, 1000)
      
    } catch (error: any) {
      console.error("📎 Error completo en confirmarEdicion:", {
        error,
        message: error.message,
        stack: error.stack
      })
      toast({
        title: "Error",
        description: error.message || "Error al actualizar venta",
        variant: "destructive",
      })
    }
  }

  const confirmarEliminacion = async () => {
    if (!deleteModal.venta) return
    
    try {
      await adminVentasService.eliminarVenta(deleteModal.venta.id)
      toast({
        title: "Éxito",
        description: "Venta eliminada correctamente",
      })
      setDeleteModal({show: false, venta: null})
      cargarDatos() // Recargar lista
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar venta",
        variant: "destructive",
      })
    }
  }

  const handleLimpiarFiltros = () => {
    const filtrosLimpios = {
      busqueda: '',
      cliente_id: 'all',
      asesor: '',
      fecha_inicio: '',
      fecha_fin: '',
      page: 1,
      limit: 20
    }
    setFiltros(filtrosLimpios)
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Administrador de Ventas</h1>
              <p className="text-gray-400">Gestiona y administra todas las ventas del sistema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Total Ventas</h3>
                  <p className="text-2xl font-bold text-blue-400">{stats.total_ventas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Con Archivos</h3>
                  <p className="text-2xl font-bold text-green-400">{stats.ventas_con_archivos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Tu Rol</h3>
                  <p className="text-lg font-bold text-purple-400 capitalize">{permisos?.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              placeholder="Buscar por nombre, email..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value, page: 1})}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
            />
            
            <Select
              value={String(filtros.cliente_id)}
              onValueChange={(value) => setFiltros({...filtros, cliente_id: value, page: 1})}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-purple-500">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-600">Todos los clientes</SelectItem>
                {clientes.map(cliente => (
                  <SelectItem key={String(cliente.id)} value={String(cliente.id)} className="text-white hover:bg-gray-600">
                    {String(cliente.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Filtrar por asesor"
              value={filtros.asesor}
              onChange={(e) => setFiltros({...filtros, asesor: e.target.value, page: 1})}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
            />
            
            <Input
              type="date"
              placeholder="Fecha inicio"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value, page: 1})}
              className="bg-gray-700 border-gray-600 text-white focus:border-purple-500"
            />
            
            <Input
              type="date"
              placeholder="Fecha fin"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value, page: 1})}
              className="bg-gray-700 border-gray-600 text-white focus:border-purple-500"
            />
            
            <Button
              onClick={handleLimpiarFiltros}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            📊 Lista de Ventas 
            {pagination && (
              <span className="text-gray-400 font-normal ml-2">
                ({pagination.total_results} registros)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12">
              <RailwayLoader size="lg" text="Cargando ventas..." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-white font-medium">ID</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Nombre</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Email</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Asesor</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Archivos</th>
                      <th className="px-4 py-3 text-left text-white font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(venta => (
                      <tr key={venta.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-gray-300 border-gray-600">
                            #{venta.id}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-white">{venta.cliente_nombre}</td>
                        <td className="px-4 py-3 text-white">{venta.nombre} {venta.apellido}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{venta.email}</td>
                        <td className="px-4 py-3 text-white">{venta.asesor}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {new Date(venta.fecha_venta).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {venta.tiene_archivos ? (
                            <Badge className="bg-green-600 text-white">
                              ✓ Sí
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 border-gray-600">
                              - No
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditarVenta(venta)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            {permisos?.can_delete && (
                              <Button
                                onClick={() => handleEliminarVenta(venta)}
                                size="sm"
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <span className="text-gray-400 text-sm">
                    Mostrando {((pagination.current_page - 1) * pagination.results_per_page) + 1} - {Math.min(pagination.current_page * pagination.results_per_page, pagination.total_results)} de {pagination.total_results}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      disabled={!pagination.has_prev}
                      onClick={() => setFiltros({...filtros, page: pagination.current_page - 1})}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-white bg-gray-700 rounded">
                      {pagination.current_page} / {pagination.total_pages}
                    </span>
                    <Button
                      disabled={!pagination.has_next}
                      onClick={() => setFiltros({...filtros, page: pagination.current_page + 1})}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {editModal.show && editModal.venta && (
        <EditVentaModal
          venta={editModal.venta}
          clientes={clientes}
          permisos={permisos}
          onSave={confirmarEdicion}
          onClose={() => setEditModal({show: false, venta: null})}
        />
      )}

      {deleteModal.show && deleteModal.venta && (
        <DeleteConfirmModal
          venta={deleteModal.venta}
          onConfirm={confirmarEliminacion}
          onClose={() => setDeleteModal({show: false, venta: null})}
        />
      )}
    </div>
  )
} 