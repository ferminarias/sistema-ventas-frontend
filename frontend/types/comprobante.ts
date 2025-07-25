export interface ArchivoComprobante {
  field_id: string
  filename: string
  original_name: string
  file_url: string
  tipo: string
  uploaded_at: string
  size_mb: number
}

export interface Comprobante {
  venta_id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  fecha_venta: string
  cliente_id: number
  cliente_nombre: string
  asesor: string
  archivos: ArchivoComprobante[]
  
  // Mantener propiedades antiguas para compatibilidad
  id?: string
  numero_comprobante?: string
  tipo_comprobante?: "FACTURA" | "BOLETA" | "NOTA_CREDITO" | "NOTA_DEBITO"
  fecha_emision?: string
  fecha_vencimiento?: string
  cliente?: {
    id: string
    nombre: string
    documento: string
    email?: string
  }
  venta?: {
    id: string
    total: number
    estado: "PENDIENTE" | "PAGADO" | "ANULADO"
  }
  archivo_adjunto?: string
  archivo_nombre?: string
  archivo_tipo?: string
  archivo_tamaño?: number
  created_at?: string
  updated_at?: string
}

export interface ComprobanteFilters {
  fecha_inicio?: string
  fecha_fin?: string
  cliente_id?: number
  tipo_archivo?: string
  busqueda?: string
  page?: number
  limit?: number
}

export interface FiltrosDisponibles {
  clientes: { id: number; name: string }[]
  asesores: { id: number; name: string }[]
  tipos_archivo: string[]
  rango_fechas: {
    fecha_min: string
    fecha_max: string
  }
  estadisticas: {
    total_comprobantes: number
    total_clientes: number
    tipos_mas_comunes: { tipo: string; cantidad: number }[]
  }
}

export interface ComprobanteSearchResponse {
  comprobantes: Comprobante[]
  total: number
  page: number
  limit: number
  total_pages: number
} 