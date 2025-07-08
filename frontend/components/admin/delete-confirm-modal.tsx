'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { type VentaAdmin } from '@/services/admin-ventas-service'
import { RailwayLoader } from '@/components/ui/railway-loader'

interface Props {
  venta: VentaAdmin
  onConfirm: () => void
  onClose: () => void
}

export function DeleteConfirmModal({ venta, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-md">
        <CardHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <CardTitle className="text-white">
                ¿Eliminar Venta?
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
              <RailwayLoader size="md" text="Eliminando venta..." />
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-gray-300">
              ¿Estás seguro que deseas eliminar esta venta? Esta acción no se puede deshacer.
            </p>
            
            {/* Información de la venta */}
            <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">ID de Venta:</span>
                <span className="text-white font-mono">#{venta.id}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Cliente:</span>
                <span className="text-white">{venta.nombre} {venta.apellido}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Email:</span>
                <span className="text-white text-sm">{venta.email}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Asesor:</span>
                <span className="text-white">{venta.asesor}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Cliente Empresa:</span>
                <span className="text-white">{venta.cliente_nombre}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Fecha:</span>
                <span className="text-white">
                  {new Date(venta.fecha_venta).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              {venta.tiene_archivos && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Archivos:</span>
                  <span className="text-yellow-400 text-sm">⚠️ Tiene archivos adjuntos</span>
                </div>
              )}
            </div>

            {/* Alerta de advertencia */}
            <Alert className="border-red-700 bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                <strong>Advertencia:</strong> Esta acción eliminará permanentemente la venta y 
                {venta.tiene_archivos && ' todos sus archivos adjuntos'}. No se puede deshacer.
              </AlertDescription>
            </Alert>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? "Eliminando..." : "Sí, Eliminar"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                disabled={loading}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                ❌ Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  )
} 