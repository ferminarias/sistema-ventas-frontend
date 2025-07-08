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
import EditVentaModal from '@/components/admin/edit-venta-modal'
import DeleteConfirmModal from '@/components/admin/delete-confirm-modal'

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
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    cliente_id: '',
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

  // Cargar datos iniciales
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'supervisor')) {
      cargarDatos()
      cargarClientes()
    }
  }, [filtros, user])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const response = await adminVentasService.getVentasAdmin(filtros)
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
      console.error(error)
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

  const confirmarEdicion = async (ventaEditada: Partial<VentaAdmin>) => {
    if (!editModal.venta) return
    
    try {
      await adminVentasService.editarVenta(editModal.venta.id, ventaEditada)
      toast({
        title: "Éxito",
        description: "Venta actualizada correctamente",
      })
      setEditModal({show: false, venta: null})
      cargarDatos() // Recargar lista
    } catch (error: any) {
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
    setFiltros({
      busqueda: '',
      cliente_id: '',
      asesor: '',
      fecha_inicio: '',
      fecha_fin: '',
      page: 1,
      limit: 20
    })
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
              value={filtros.cliente_id}
              onValueChange={(value) => setFiltros({...filtros, cliente_id: value, page: 1})}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-purple-500">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="" className="text-white hover:bg-gray-600">Todos los clientes</SelectItem>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()} className="text-white hover:bg-gray-600">
                    {cliente.name}
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