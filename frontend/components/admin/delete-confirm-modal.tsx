'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { X, AlertTriangle, Trash2, CheckCircle } from 'lucide-react'
import { type VentaAdmin } from '@/services/admin-ventas-service'
import { RailwayLoader } from '@/components/ui/railway-loader'

interface Props {
  venta: VentaAdmin
  onConfirm: () => void
  onClose: () => void
}

export function DeleteConfirmModal({ venta, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [textoConfirmacion, setTextoConfirmacion] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const TEXTO_REQUERIDO = 'ELIMINAR'
  const textoEsCorrecto = textoConfirmacion === TEXTO_REQUERIDO

  // Auto-enfocar el input al abrir el modal
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 300) // Pequeño delay para que la animación termine
    
    return () => clearTimeout(timer)
  }, [])

  const handleConfirm = async () => {
    if (!textoEsCorrecto) return
    
    setLoading(true)
    try {
      await onConfirm()
      setTextoConfirmacion('') // Limpiar input después del éxito
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[95vh] overflow-hidden relative">
        <CardHeader className="border-b border-gray-700 pb-4 flex-shrink-0">
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
        
        <CardContent className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
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

            {/* Confirmación por tipeo - Doble verificación */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-orange-900/20 rounded">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                </div>
                <span className="text-white font-medium">Confirmación de Seguridad</span>
              </div>
              
              <p className="text-gray-300 text-sm">
                Para confirmar la eliminación, escribe <code className="bg-gray-600 px-2 py-1 rounded text-white font-mono">{TEXTO_REQUERIDO}</code> en el campo de abajo:
              </p>
              
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={`Escribe "${TEXTO_REQUERIDO}" para confirmar`}
                  value={textoConfirmacion}
                  onChange={(e) => setTextoConfirmacion(e.target.value.toUpperCase())}
                  disabled={loading}
                  className={`bg-gray-700 border transition-all duration-200 text-white placeholder-gray-400 focus:ring-2 ${
                    textoConfirmacion.length > 0
                      ? textoEsCorrecto
                        ? 'border-green-500 focus:border-green-400 focus:ring-green-500/20'
                        : 'border-red-500 focus:border-red-400 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && textoEsCorrecto) {
                      handleConfirm()
                    }
                  }}
                />
                
                {textoConfirmacion.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {textoEsCorrecto ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              
              {textoConfirmacion.length > 0 && !textoEsCorrecto && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <X className="h-3 w-3" />
                  El texto no coincide. Debe escribir exactamente "{TEXTO_REQUERIDO}"
                </p>
              )}
              
              {textoEsCorrecto && (
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  ✓ Confirmación correcta. Ya puedes eliminar la venta.
                </p>
              )}
            </div>
          </div>
        </CardContent>

        {/* Botones de acción fijos en la parte inferior */}
        <div className="border-t border-gray-700 p-4 bg-gray-800 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={loading || !textoEsCorrecto}
              className={`flex-1 transition-all duration-200 ${
                textoEsCorrecto 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {loading ? "Eliminando..." : textoEsCorrecto ? "✓ Eliminar Venta" : "🔒 Escribe confirmación"}
            </Button>
            <Button
              onClick={() => {
                setTextoConfirmacion('')
                onClose()
              }}
              variant="outline"
              disabled={loading}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              ❌ Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 