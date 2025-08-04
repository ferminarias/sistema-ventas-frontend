"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, X } from "lucide-react"
import type { Comprobante } from "@/types/comprobante"
import { comprobantesService } from "@/services/comprobantes"

interface FilePreviewProps {
  comprobante: Comprobante
  open: boolean
  onClose: () => void
}

export function FilePreview({ comprobante, open, onClose }: FilePreviewProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      // Crear un objeto archivo temporal para usar download_url
      const archivoTemp = {
        download_url: `/api/comprobantes/descargar/${comprobante.archivo_adjunto || ''}`,
        original_name: comprobante.archivo_nombre || 'archivo'
      }
      await comprobantesService.downloadFile(archivoTemp, comprobante.archivo_nombre)
    } catch (error) {
      console.error("Error al descargar:", error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gray-800 border-gray-600 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              Vista Previa - {String(comprobante.numero_comprobante || 'Sin número')}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Información del comprobante */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Tipo:</span>
              <span className="text-white">{String(comprobante.tipo_comprobante || 'Tipo no especificado')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Número:</span>
              <span className="text-white">{String(comprobante.numero_comprobante || 'Número no especificado')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fecha:</span>
              <span className="text-white">{comprobante.fecha_venta ? new Date(comprobante.fecha_venta).toLocaleDateString('es-ES') : 'Fecha no especificada'}</span>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="font-medium text-white mb-2">Información del Cliente</h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Nombre:</span>
              <span className="text-white">
                {typeof comprobante.cliente === 'object' ? String(comprobante.cliente.nombre || 'Cliente sin nombre') : String(comprobante.cliente || 'Cliente sin nombre')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Documento:</span>
              <span className="text-white">
                {typeof comprobante.cliente === 'object' ? String(comprobante.cliente.documento || 'N/A') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{String(comprobante.email || 'Email no disponible')}</span>
            </div>
          </div>

          {/* Información de la venta */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="font-medium text-white mb-2">Información de la Venta</h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Estado:</span>
              <span className="text-white">{String(comprobante.venta?.estado || 'Estado no especificado')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Asesor:</span>
              <span className="text-white">{String(comprobante.asesor || 'Asesor no especificado')}</span>
            </div>
          </div>

          {/* Archivo */}
          <div className="bg-gray-700 rounded-lg p-4 text-sm">
            <h3 className="font-medium text-white mb-2">Archivo Adjunto</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium text-white">{String(comprobante.archivo_nombre || 'Archivo sin nombre')}</span>
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? "Descargando..." : "Descargar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 