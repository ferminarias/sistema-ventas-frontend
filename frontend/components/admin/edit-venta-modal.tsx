'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'
import { type VentaAdmin } from '@/services/admin-ventas-service'
import { RailwayLoader } from '@/components/ui/railway-loader'

interface Props {
  venta: VentaAdmin
  clientes: any[]
  permisos: any
  onSave: (data: Partial<VentaAdmin>) => void
  onClose: () => void
}

export default function EditVentaModal({ venta, clientes, permisos, onSave, onClose }: Props) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
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