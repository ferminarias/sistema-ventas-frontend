"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, User, CreditCard, X } from "lucide-react"
import type { Comprobante } from "@/types/comprobante"
import { comprobantesService } from "@/services/comprobantes"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useState } from "react"

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
              Vista Previa - {typeof comprobante.numero_comprobante === 'string' ? comprobante.numero_comprobante : JSON.stringify(comprobante.numero_comprobante)}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del comprobante */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-300">Tipo:</span>
                  <Badge
                    className={`
                      ${comprobante.tipo_comprobante === "FACTURA" ? "bg-blue-600 text-white" : ""}
                      ${comprobante.tipo_comprobante === "BOLETA" ? "bg-green-600 text-white" : ""}
                      ${comprobante.tipo_comprobante === "NOTA_CREDITO" ? "bg-orange-600 text-white" : ""}
                      ${comprobante.tipo_comprobante === "NOTA_DEBITO" ? "bg-red-600 text-white" : ""}
                    `}
                  >
                    {typeof comprobante.tipo_comprobante === 'string' ? comprobante.tipo_comprobante : JSON.stringify(comprobante.tipo_comprobante)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-300">Fecha:</span>
                  <span className="text-white">{formatDate(comprobante.fecha_emision)}</span>
                </div>

                {comprobante.fecha_vencimiento && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-300">Vencimiento:</span>
                    <span className="text-white">{formatDate(comprobante.fecha_vencimiento)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-300">Cliente:</span>
                  <span className="text-white">{typeof comprobante.cliente.nombre === 'string' ? comprobante.cliente.nombre : JSON.stringify(comprobante.cliente.nombre)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-300">Documento:</span>
                  <span className="text-white">{typeof comprobante.cliente.documento === 'string' ? comprobante.cliente.documento : JSON.stringify(comprobante.cliente.documento)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-300">Total:</span>
                  <span className="text-white text-xl font-bold">{formatCurrency(typeof comprobante.venta.total === 'number' ? comprobante.venta.total : 0)}</span>
                  <Badge
                    className={`
                      ${comprobante.venta.estado === "PAGADO" ? "bg-green-600 text-white" : ""}
                      ${comprobante.venta.estado === "PENDIENTE" ? "bg-yellow-600 text-white" : ""}
                      ${comprobante.venta.estado === "ANULADO" ? "bg-red-600 text-white" : ""}
                    `}
                  >
                    {typeof comprobante.venta.estado === 'string' ? comprobante.venta.estado : JSON.stringify(comprobante.venta.estado)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa del archivo */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
            <div className="bg-gray-800 p-4 border-b border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-white">{typeof comprobante.archivo_nombre === 'string' ? comprobante.archivo_nombre : JSON.stringify(comprobante.archivo_nombre)}</span>
                <span className="text-sm text-gray-400">({(typeof comprobante.archivo_tamaño === 'number' ? comprobante.archivo_tamaño / 1024 : 0).toFixed(1)} KB)</span>
              </div>
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="h-4 w-4 mr-1" />
                {downloading ? "Descargando..." : "Descargar"}
              </Button>
            </div>

            <div className="h-96 flex items-center justify-center bg-gray-900">
              {comprobante.archivo_adjunto && comprobantesService.isPdfFile(comprobante.archivo_adjunto) ? (
                <iframe
                  src={comprobantesService.getPreviewUrl(comprobante.archivo_adjunto)}
                  className="w-full h-full"
                  title={`Vista previa de ${comprobante.numero_comprobante || comprobante.venta_id}`}
                />
              ) : comprobante.archivo_adjunto && comprobantesService.isImageFile(comprobante.archivo_adjunto) ? (
                <img
                  src={comprobantesService.getPreviewUrl(comprobante.archivo_adjunto)}
                  alt={`Comprobante ${comprobante.numero_comprobante || comprobante.venta_id || 'N/A'}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>Vista previa no disponible para este tipo de archivo</p>
                  <p className="text-sm">Archivo: {comprobante.archivo_nombre || 'No disponible'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 