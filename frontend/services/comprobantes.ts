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
    console.log("🔄 FILTROS BACKEND RAW:", backendFilters)

    // Función helper para extraer valores de objetos {label, value}
    const extractValue = (obj: any): any => {
      if (obj && typeof obj === 'object' && 'value' in obj) {
        return obj.value
      }
      if (obj && typeof obj === 'object' && 'label' in obj) {
        return obj.label
      }
      return obj
    }

    // Mapeo correcto usando 'name' en lugar de 'nombre'
    const cleanedFilters: FiltrosDisponibles = {
      clientes: (backendFilters.clientes || []).map((cliente: any) => {
        const id = extractValue(cliente.id) || extractValue(cliente) || 0
        const name = extractValue(cliente.name) || extractValue(cliente.nombre) || extractValue(cliente) || 'Sin nombre'
        return {
          id: typeof id === 'number' ? id : (typeof id === 'string' ? parseInt(id) : 0),
          name: typeof name === 'string' ? name : String(name)
        }
      }),
      asesores: (backendFilters.asesores || []).map((asesor: any) => {
        const id = extractValue(asesor.id) || extractValue(asesor) || 0
        const name = extractValue(asesor.name) || extractValue(asesor.nombre) || extractValue(asesor) || 'Sin nombre'
        return {
          id: typeof id === 'number' ? id : (typeof id === 'string' ? parseInt(id) : 0),
          name: typeof name === 'string' ? name : String(name)
        }
      }),
      tipos_archivo: (backendFilters.tipos_archivo || []).map((tipo: any) => {
        const value = extractValue(tipo)
        return typeof value === 'string' ? value : String(value)
      }),
      rango_fechas: backendFilters.rango_fechas || {
        fecha_min: '2020-01-01',
        fecha_max: new Date().toISOString().split('T')[0]
      },
      estadisticas: backendFilters.estadisticas || {
        total_comprobantes: 0,
        total_clientes: 0,
        tipos_mas_comunes: []
      }
    }

    console.log("✅ FILTROS LIMPIADOS:", cleanedFilters)
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
    console.log("🔄 MAPEO BACKEND RESPONSE:", backendResponse)

    // Función helper para extraer valores de objetos {label, value}
    const extractValue = (obj: any): any => {
      if (obj && typeof obj === 'object' && 'value' in obj) {
        return obj.value
      }
      if (obj && typeof obj === 'object' && 'label' in obj) {
        return obj.label
      }
      return obj
    }

    // Función para limpiar un objeto de propiedades {label, value}
    const cleanObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj
      if (Array.isArray(obj)) return obj.map(cleanObject)
      
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = extractValue(value)
        // Si sigue siendo un objeto, aplicar recursivamente
        if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
          cleaned[key] = cleanObject(cleaned[key])
        }
      }
      return cleaned
    }

    // Mapear la respuesta del backend a la estructura esperada por el frontend
    const mappedResponse: ComprobanteSearchResponse = {
      comprobantes: (backendResponse.resultados || []).map((comprobante: any) => cleanObject(comprobante)),
      total: extractValue(backendResponse.pagination?.total_results) || 0,
      page: extractValue(backendResponse.pagination?.current_page) || 1,
      limit: extractValue(backendResponse.pagination?.results_per_page) || 20,
      total_pages: extractValue(backendResponse.pagination?.total_pages) || 1
    }

    console.log("✅ RESPONSE MAPEADA:", mappedResponse)
    return mappedResponse
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
    return `${API_BASE_URL}/api/comprobantes/preview/${filename}?token=${token}`
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