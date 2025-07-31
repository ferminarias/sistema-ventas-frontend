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
      await comprobantesService.downloadFile(comprobante.archivo_adjunto || '', comprobante.archivo_nombre)
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
              Vista Previa - {comprobante.numero_comprobante}
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
              <span className="text-white">{comprobante.tipo_comprobante}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Número:</span>
              <span className="text-white">{comprobante.numero_comprobante}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fecha:</span>
              <span className="text-white">{new Date(comprobante.fecha_venta).toLocaleDateString('es-ES')}</span>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="font-medium text-white mb-2">Información del Cliente</h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Nombre:</span>
              <span className="text-white">
                {typeof comprobante.cliente === 'object' ? comprobante.cliente.name : comprobante.cliente}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Documento:</span>
              <span className="text-white">
                {typeof comprobante.cliente === 'object' ? comprobante.cliente.documento : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{comprobante.email}</span>
            </div>
          </div>

          {/* Información de la venta */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="font-medium text-white mb-2">Información de la Venta</h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Estado:</span>
              <span className="text-white">{comprobante.venta.estado}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Asesor:</span>
              <span className="text-white">{comprobante.asesor}</span>
            </div>
          </div>

          {/* Archivo */}
          <div className="bg-gray-700 rounded-lg p-4 text-sm">
            <h3 className="font-medium text-white mb-2">Archivo Adjunto</h3>
            <div className="flex justify-between items-center">
              <span className="font-medium text-white">{comprobante.archivo_nombre}</span>
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