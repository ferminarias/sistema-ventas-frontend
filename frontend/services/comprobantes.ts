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
  
  if (Array.isArray(value)) {
    return value.map(ensureRenderableValue)
  }
  
  if (typeof value === 'object') {
    // Primero intentar extraer el valor usando extractValue
    const extracted = extractValue(value)
    
    // Si después de la extracción sigue siendo un objeto, convertir agresivamente
    if (typeof extracted === 'object' && extracted !== null) {
      // Si tiene propiedades conocidas que pueden ser renderizables
      if ('label' in extracted && typeof extracted.label === 'string') return extracted.label
      if ('value' in extracted && (typeof extracted.value === 'string' || typeof extracted.value === 'number')) return extracted.value
      if ('name' in extracted && typeof extracted.name === 'string') return extracted.name
      if ('text' in extracted && typeof extracted.text === 'string') return extracted.text
      if ('title' in extracted && typeof extracted.title === 'string') return extracted.title
      
      // Como último recurso, convertir a string simple
      try {
        return JSON.stringify(extracted)
      } catch {
        return '[objeto complejo]'
      }
    }
    
    return extracted
  }
  
  return String(value)
}

class ComprobantesService {
  // Obtener filtros disponibles
  async getFiltrosDisponibles(): Promise<FiltrosDisponibles> {
    console.log("🔍 Iniciando getFiltrosDisponibles...")
    
    const token = localStorage.getItem("token")
    console.log("🔐 Token para filtros:", {
      existe: !!token,
      longitud: token?.length || 0
    })
    
    const response = await fetch(`${API_BASE_URL}/api/comprobantes/filtros`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })
    
    console.log("📡 Response de filtros:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Error en getFiltrosDisponibles:", errorText)
      throw new Error(`Error al obtener filtros: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log("✅ Filtros obtenidos:", {
      clientes: data.clientes?.length || 0,
      tipos_archivo: data.tipos_archivo?.length || 0,
      rango_fechas: data.rango_fechas
    })
    
    return this.ensureAllValuesRenderable(data)
  }

  // Realizar búsqueda de comprobantes
  async searchComprobantes(filters: ComprobanteFilters): Promise<ComprobanteSearchResponse> {
    console.log("🔍 searchComprobantes llamado con filtros:", filters)
    
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
      console.error("❌ Error en respuesta de búsqueda:", response.status, response.statusText)
      throw new Error("Error al buscar comprobantes")
    }

    const backendResponse = await response.json()
    console.log("📊 Total encontrado:", backendResponse.pagination?.total_results || 0)

    // DEBUG: Mostrar respuesta completa del backend
    console.log("🔍 RESPUESTA COMPLETA DEL BACKEND:")
    console.log("- Estructura general:", Object.keys(backendResponse))
    console.log("- Pagination:", backendResponse.pagination)
    console.log("- Resultados array:", backendResponse.resultados)
    console.log("- Cantidad resultados:", backendResponse.resultados?.length || 0)
    
    if (backendResponse.resultados && backendResponse.resultados.length > 0) {
      console.log("\n🔍 PRIMER RESULTADO SIN PROCESAR:")
      const primerResultado = backendResponse.resultados[0]
      console.log("- Objeto completo:", JSON.stringify(primerResultado, null, 2))
      console.log("- Archivos en resultado:", primerResultado.archivos)
      console.log("- Archivos length:", primerResultado.archivos?.length)
      
      if (primerResultado.archivos && primerResultado.archivos.length > 0) {
        console.log("\n📎 PRIMER ARCHIVO SIN PROCESAR:")
        console.log(JSON.stringify(primerResultado.archivos[0], null, 2))
      }
    }

    // Mapear la respuesta del backend PRESERVANDO la estructura de archivos
    const mappedResponse: ComprobanteSearchResponse = {
      comprobantes: (backendResponse.resultados || []).map((comprobante: any, index: number) => {
        console.log(`\n🔄 PROCESANDO COMPROBANTE ${index + 1} - ANTES:`);
        console.log("- archivos ANTES del proceso:", comprobante.archivos);
        
        // Procesar solo campos que no sean archivos
        const procesado = {
          // Datos básicos sin procesar agresivamente
          venta_id: comprobante.venta_id,
          nombre: ensureRenderableValue(comprobante.nombre),
          apellido: ensureRenderableValue(comprobante.apellido),
          email: ensureRenderableValue(comprobante.email),
          telefono: ensureRenderableValue(comprobante.telefono),
          fecha_venta: ensureRenderableValue(comprobante.fecha_venta),
          cliente_id: comprobante.cliente_id,
          cliente_nombre: ensureRenderableValue(comprobante.cliente_nombre),
          asesor: ensureRenderableValue(comprobante.asesor),
          
          // PRESERVAR ARCHIVOS COMPLETAMENTE SIN PROCESAR
          archivos: comprobante.archivos || [],
          
          // Campos legacy para compatibilidad (procesados)
          id: ensureRenderableValue(comprobante.id),
          numero_comprobante: ensureRenderableValue(comprobante.numero_comprobante),
          tipo_comprobante: ensureRenderableValue(comprobante.tipo_comprobante),
          archivo_adjunto: ensureRenderableValue(comprobante.archivo_adjunto),
          archivo_nombre: ensureRenderableValue(comprobante.archivo_nombre),
        }
        
        console.log("- archivos DESPUÉS del proceso conservador:", procesado.archivos);
        
        return procesado
      }),
      total: ensureRenderableValue(extractValue(backendResponse.pagination?.total_results)) || 0,
      page: ensureRenderableValue(extractValue(backendResponse.pagination?.current_page)) || 1,
      limit: ensureRenderableValue(extractValue(backendResponse.pagination?.results_per_page)) || 20,
      total_pages: ensureRenderableValue(extractValue(backendResponse.pagination?.total_pages)) || 1
    }

    console.log("🎯 Comprobantes procesados:", mappedResponse.comprobantes?.length || 0)
    return mappedResponse
  }

  // Método para asegurar que todos los valores de un objeto sean renderizables
  private ensureAllValuesRenderable(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return ensureRenderableValue(obj)
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.ensureAllValuesRenderable(item))
    }
    
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Asegurar que cada valor sea renderable
      result[key] = ensureRenderableValue(value)
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