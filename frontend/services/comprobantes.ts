import type { ComprobanteFilters, ComprobanteSearchResponse, FiltrosDisponibles } from "@/types/comprobante"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

// Función para obtener headers de autenticación
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// Función mejorada para extraer valores de objetos {label, value}
const extractValue = (obj: any): any => {
  // Si es null o undefined, retornar tal como está
  if (obj === null || obj === undefined) return obj
  
  // Si no es objeto, retornar tal como está
  if (typeof obj !== 'object') return obj
  
  // Si es array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(extractValue)
  }
  
  // Si tiene la propiedad 'value', usar esa
  if ('value' in obj && obj.value !== undefined) {
    return extractValue(obj.value) // Recursivo en caso de objetos anidados
  }
  
  // Si tiene la propiedad 'label', usar esa
  if ('label' in obj && obj.label !== undefined) {
    return extractValue(obj.label) // Recursivo en caso de objetos anidados
  }
  
  // Si es un objeto con solo una propiedad, extraer esa propiedad
  const keys = Object.keys(obj)
  if (keys.length === 1) {
    return extractValue(obj[keys[0]])
  }
  
  // Si es un objeto normal, limpiar recursivamente todas sus propiedades
  return cleanObject(obj)
}

// Función mejorada para limpiar objetos recursivamente
const cleanObject = (obj: any): any => {
  // Si es null, undefined o no es objeto, retornar tal como está
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }
  
  // Si es array, limpiar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(extractValue)
  }
  
  // Si es un objeto, limpiar cada propiedad
  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    cleaned[key] = extractValue(value)
  }
  
  return cleaned
}

// Función para asegurar que un valor sea válido para renderizar en React
const ensureRenderableValue = (value: any): any => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(ensureRenderableValue)
  if (typeof value === 'object') {
    // Si después de la limpieza sigue siendo un objeto, convertir a string
    const cleaned = cleanObject(value)
    if (typeof cleaned === 'object' && cleaned !== null) {
      // Como último recurso, convertir a string legible
      return JSON.stringify(cleaned)
    }
    return cleaned
  }
  return String(value)
}

class ComprobantesService {
  // Obtener filtros disponibles
  async getFiltrosDisponibles(): Promise<FiltrosDisponibles> {
    const response = await fetch(`${API_BASE_URL}/api/comprobantes/filtros`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })

    if (!response.ok) {
      throw new Error("Error al obtener filtros disponibles")
    }

    const backendFilters = await response.json()

    // Mapeo correcto con limpieza agresiva
    const cleanedFilters: FiltrosDisponibles = {
      clientes: (backendFilters.clientes || []).map((cliente: any) => {
        const cleanedCliente = cleanObject(cliente)
        return {
          id: ensureRenderableValue(cleanedCliente.id || cleanedCliente) || 0,
          name: ensureRenderableValue(cleanedCliente.name || cleanedCliente.nombre || cleanedCliente) || 'Sin nombre'
        }
      }),
      asesores: (backendFilters.asesores || []).map((asesor: any) => {
        const cleanedAsesor = cleanObject(asesor)
        return {
          id: ensureRenderableValue(cleanedAsesor.id || cleanedAsesor) || 0,
          name: ensureRenderableValue(cleanedAsesor.name || cleanedAsesor.nombre || cleanedAsesor) || 'Sin nombre'
        }
      }),
      tipos_archivo: (backendFilters.tipos_archivo || []).map((tipo: any) => {
        return ensureRenderableValue(extractValue(tipo)) || 'Desconocido'
      }),
      rango_fechas: {
        fecha_min: ensureRenderableValue(extractValue(backendFilters.rango_fechas?.fecha_min)) || '2020-01-01',
        fecha_max: ensureRenderableValue(extractValue(backendFilters.rango_fechas?.fecha_max)) || new Date().toISOString().split('T')[0]
      },
      estadisticas: {
        total_comprobantes: ensureRenderableValue(extractValue(backendFilters.estadisticas?.total_comprobantes)) || 0,
        total_clientes: ensureRenderableValue(extractValue(backendFilters.estadisticas?.total_clientes)) || 0,
        tipos_mas_comunes: (backendFilters.estadisticas?.tipos_mas_comunes || []).map((tipo: any) => ensureRenderableValue(extractValue(tipo)))
      }
    }

    return cleanedFilters
  }

  // Realizar búsqueda de comprobantes
  async searchComprobantes(filters: ComprobanteFilters): Promise<ComprobanteSearchResponse> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`${API_BASE_URL}/api/comprobantes/search?${params}`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })

    if (!response.ok) {
      throw new Error("Error al buscar comprobantes")
    }

    const backendResponse = await response.json()

    // Mapear la respuesta del backend con limpieza agresiva
    const mappedResponse: ComprobanteSearchResponse = {
      comprobantes: (backendResponse.resultados || []).map((comprobante: any) => {
        const cleaned = cleanObject(comprobante)
        // Asegurar que todos los valores sean renderizables
        return this.ensureAllValuesRenderable(cleaned)
      }),
      total: ensureRenderableValue(extractValue(backendResponse.pagination?.total_results)) || 0,
      page: ensureRenderableValue(extractValue(backendResponse.pagination?.current_page)) || 1,
      limit: ensureRenderableValue(extractValue(backendResponse.pagination?.results_per_page)) || 20,
      total_pages: ensureRenderableValue(extractValue(backendResponse.pagination?.total_pages)) || 1
    }

    return mappedResponse
  }

  // Método para asegurar que todos los valores de un objeto sean renderizables
  private ensureAllValuesRenderable(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return ensureRenderableValue(obj)
    if (Array.isArray(obj)) return obj.map(item => this.ensureAllValuesRenderable(item))
    
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.ensureAllValuesRenderable(value)
    }
    return result
  }

  // Descargar archivo usando el nuevo endpoint
  async downloadFile(filename: string, originalName?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/comprobantes/descargar/${filename}`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })

    if (!response.ok) {
      throw new Error("Error al descargar archivo")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = originalName || filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Obtener URL de preview para mostrar archivos directamente
  getPreviewUrl(filename: string): string {
    const token = localStorage.getItem("token")
    
    // Si es una URL completa de Cloudinary, devolverla directamente
    if (filename.startsWith('https://res.cloudinary.com/')) {
      return filename
    }
    
    // Si es archivo local temporal (empieza con 'local_')
    if (filename.startsWith('local_')) {
      return `${API_BASE_URL}/api/files/local/${filename}${token ? `?token=${token}` : ''}`
    }
    
    // Para archivos normales, usar endpoint de preview con autenticación
    return `${API_BASE_URL}/api/comprobantes/preview/${filename}${token ? `?token=${token}` : ''}`
  }

  // Obtener URL de descarga con autenticación
  getDownloadUrl(filename: string): string {
    const token = localStorage.getItem("token")
    return `${API_BASE_URL}/api/comprobantes/descargar/${filename}${token ? `?token=${token}` : ''}`
  }

  // Detectar si un archivo es imagen
  isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  // Detectar si un archivo es PDF
  isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf')
  }

  // Verificar si un archivo se puede previsualizar
  canPreview(filename: string): boolean {
    return this.isImageFile(filename) || this.isPdfFile(filename)
  }

  // Mantener compatibilidad con getFileUrl
  getFileUrl(filename: string): string {
    return this.getPreviewUrl(filename)
  }
}

// Exportar instancia del servicio
export const comprobantesService = new ComprobantesService()

// Mantener compatibilidad con las funciones individuales
export async function searchComprobantes(filters: ComprobanteFilters): Promise<ComprobanteSearchResponse> {
  return comprobantesService.searchComprobantes(filters)
}

export async function downloadComprobante(id: string): Promise<void> {
  return comprobantesService.downloadFile(id)
} 