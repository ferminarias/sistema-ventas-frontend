"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, FileText, Calendar, User, CreditCard, Settings } from "lucide-react"
import type { Comprobante } from "@/types/comprobante"
import { FilePreview } from "./file-preview"
import { comprobantesService } from "@/services/comprobantes"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ResultsListProps {
  comprobantes: Comprobante[]
  loading?: boolean
}

export function ResultsList({ comprobantes, loading = false }: ResultsListProps) {
  const [previewFile, setPreviewFile] = useState<Comprobante | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (comprobante: Comprobante) => {
    setDownloading(comprobante.id)
    try {
      await comprobantesService.downloadFile(comprobante.archivo_adjunto, comprobante.archivo_nombre)
    } catch (error) {
      console.error("Error al descargar:", error)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                <div className="h-3 bg-gray-600 rounded w-1/3"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-600 rounded"></div>
                <div className="h-8 w-20 bg-gray-600 rounded"></div>
                <div className="h-8 w-8 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (comprobantes.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No se encontraron comprobantes</h3>
        <p className="text-gray-400">
          Intenta ajustar los filtros de búsqueda para encontrar los comprobantes que necesitas.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {comprobantes.map((comprobante) => (
          <div
            key={comprobante.id}
            className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 hover:bg-[#333333] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-semibold text-lg">{typeof comprobante.numero_comprobante === 'string' ? comprobante.numero_comprobante : JSON.stringify(comprobante.numero_comprobante)}</h3>
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

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(comprobante.fecha_emision)}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {typeof comprobante.cliente.nombre === 'string' ? comprobante.cliente.nombre : JSON.stringify(comprobante.cliente.nombre)}
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-white font-semibold">{formatCurrency(typeof comprobante.venta.total === 'number' ? comprobante.venta.total : 0)}</span>
                  </div>
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

                <div className="text-xs text-gray-500">
                  Cliente: {typeof comprobante.cliente.documento === 'string' ? comprobante.cliente.documento : JSON.stringify(comprobante.cliente.documento)} • Archivo: {typeof comprobante.archivo_nombre === 'string' ? comprobante.archivo_nombre : JSON.stringify(comprobante.archivo_nombre)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewFile(comprobante)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownload(comprobante)}
                  disabled={downloading === comprobante.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {downloading === comprobante.id ? "..." : "Descargar"}
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewFile && (
        <FilePreview comprobante={previewFile} open={!!previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  )
} 