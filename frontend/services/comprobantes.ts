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
    const token = localStorage.getItem("token")
    
    const response = await fetch(`${API_BASE_URL}/api/comprobantes/filtros`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Error en getFiltrosDisponibles:", errorText)
      throw new Error(`Error al obtener filtros: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log("🔍 DEBUG: Filtros recibidos del backend:", data)
    
    // SOLUCIÓN: Agregar tipos de archivo que siempre deben estar disponibles
    const enhancedData = this.enhanceFiltersWithLegacyTypes(data)
    
    return this.ensureAllValuesRenderable(enhancedData)
  }

  // NUEVO: Mejorar filtros para incluir tipos legacy como 'imagen_comprobante'
  private enhanceFiltersWithLegacyTypes(data: any): any {
    const enhanced = { ...data }
    
    // Asegurar que tipos_archivo existe
    if (!enhanced.tipos_archivo) {
      enhanced.tipos_archivo = []
    }
    
    // Tipos legacy que siempre deben estar disponibles
    const legacyTypes = [
      'imagen_comprobante',
      'comprobantes', 
      'comprobante',
      'imagen',
      'archivo',
      'documento'
    ]
    
    // Agregar tipos legacy que no estén ya presentes
    legacyTypes.forEach(type => {
      if (!enhanced.tipos_archivo.includes(type)) {
        enhanced.tipos_archivo.push(type)
        console.log(`✅ Agregado tipo legacy: ${type}`)
      }
    })
    
    console.log("🔧 Tipos de archivo después de mejoras:", enhanced.tipos_archivo)
    
    return enhanced
  }

  // Realizar búsqueda de comprobantes
  async searchComprobantes(filters: ComprobanteFilters): Promise<ComprobanteSearchResponse> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, value.toString())
      }
    })

    console.log("🔍 DEBUG: Enviando búsqueda con filtros:", filters)
    console.log("🔍 DEBUG: URL de búsqueda:", `${API_BASE_URL}/api/comprobantes/search?${params}`)

    const response = await fetch(`${API_BASE_URL}/api/comprobantes/search?${params}`, {
      headers: getAuthHeaders(),
      credentials: "include"
    })

    if (!response.ok) {
      console.error("❌ Error en respuesta de búsqueda:", response.status, response.statusText)
      throw new Error("Error al buscar comprobantes")
    }

    const backendResponse = await response.json()
    console.log("🔍 DEBUG: Respuesta del backend:", backendResponse)

    // Analizar archivos encontrados para debugging
    if (backendResponse.resultados?.length > 0) {
      console.log("📁 DEBUG: Analizando archivos encontrados...")
      backendResponse.resultados.forEach((comprobante: any, index: number) => {
        if (comprobante.archivos?.length > 0) {
          console.log(`📋 Comprobante ${index + 1} (ID: ${comprobante.venta_id}):`)
          comprobante.archivos.forEach((archivo: any, archIndex: number) => {
            console.log(`  📁 Archivo ${archIndex + 1}: field_id="${archivo.field_id}", filename="${archivo.filename}", tipo="${archivo.tipo}"`)
          })
        }
      })
    }

    // Mapear la respuesta del backend PRESERVANDO la estructura de archivos
    const mappedResponse: ComprobanteSearchResponse = {
      comprobantes: (backendResponse.resultados || []).map((comprobante: any) => {
        // Procesar solo campos que no sean archivos, PRESERVAR ARCHIVOS INTACTOS
        return {
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
      }),
      total: ensureRenderableValue(extractValue(backendResponse.pagination?.total_results)) || 0,
      page: ensureRenderableValue(extractValue(backendResponse.pagination?.current_page)) || 1,
      limit: ensureRenderableValue(extractValue(backendResponse.pagination?.results_per_page)) || 20,
      total_pages: ensureRenderableValue(extractValue(backendResponse.pagination?.total_pages)) || 1
    }

    console.log("✅ DEBUG: Respuesta mapeada:", mappedResponse)
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

  // Descargar archivo usando la estructura correcta del backend
  async downloadFile(filename: string | any, originalName?: string): Promise<void> {
    const token = localStorage.getItem("token")
    
    // Si filename es un objeto archivo completo, usar download_url
    if (typeof filename === 'object' && filename.download_url) {
      const downloadUrl = `${API_BASE_URL}${filename.download_url}`
      console.log("✅ Descargando usando download_url:", downloadUrl)
      
      // Verificar si es Cloudinary (no necesita auth)
      if (filename.storage_type === 'cloudinary' && filename.file_url && filename.file_url.startsWith('https://res.cloudinary.com/')) {
        console.log("✅ Descarga directa de Cloudinary:", filename.file_url)
        const link = document.createElement("a")
        link.href = filename.file_url
        link.download = originalName || filename.original_name || filename.filename || 'archivo'
        link.target = "_blank"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // Para archivos del backend, usar fetch con autenticación
      try {
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          // NO usar credentials: 'include' para evitar CORS
    })

    if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = originalName || filename.original_name || filename.filename || 'archivo'
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)
      } catch (error) {
        console.error("❌ Error al descargar archivo:", error)
        throw error
      }
      return
    }
    
    // Fallback: usar filename como string
    const downloadUrl = `${API_BASE_URL}/api/comprobantes/descargar/${filename}`
    console.log("✅ Descargando usando filename:", downloadUrl)
    
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        // NO usar credentials: 'include' para evitar CORS
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = originalName || filename
      document.body.appendChild(link)
      link.click()
    window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error("❌ Error al descargar archivo:", error)
      throw error
    }
  }

  // Obtener URL de preview usando la estructura correcta del backend
  getPreviewUrlFromFile(archivo: any): string {
    const token = localStorage.getItem("token")
    
    console.log("🔍 Generando URL para archivo:", {
      filename: archivo.filename,
      original_name: archivo.original_name,
      file_url: archivo.file_url,
      preview_url: archivo.preview_url,
      storage_type: archivo.storage_type,
      tipo: archivo.tipo,
      size_mb: archivo.size_mb,
      field_id: archivo.field_id
    })
    
    // OPCIÓN 1: Usar URL directa de Cloudinary (más rápida) - NO necesita auth
    if (archivo.storage_type === 'cloudinary' && archivo.file_url && archivo.file_url.startsWith('https://res.cloudinary.com/')) {
      console.log("✅ Usando URL directa de Cloudinary:", archivo.file_url)
      return archivo.file_url
    }
    
    // OPCIÓN 2: Usar preview_url del backend (recomendado) - SÍ necesita auth
    if (archivo.preview_url) {
      // Para URLs del backend, NO agregar token en URL, usar headers en fetch
      const url = `${API_BASE_URL}${archivo.preview_url}`
      console.log("✅ Usando preview_url del backend (necesita auth en headers):", url)
      return url
    }
    
    // OPCIÓN 3: Fallback para archivos locales antiguos - CORREGIDO
    if (archivo.storage_type === 'local' && archivo.file_url && archivo.file_url.startsWith('/static/')) {
      const url = `${API_BASE_URL}${archivo.file_url}`
      console.log("✅ Usando URL local /static/ (necesita auth en headers):", url)
      return url
    }
    
    // OPCIÓN 4: Detectar archivos locales por nombre de archivo
    const filename = archivo.filename || archivo.original_name || ''
    
    // Detectar archivos locales por patrón de nombre (MÁS AGRESIVO)
    if (filename.includes('imagen_comprobante_') || filename.includes('comprobante_')) {
      // Es un archivo local, usar /static/uploads/
      const url = `${API_BASE_URL}/static/uploads/${filename}`
      console.log("✅ Detectado archivo local por patrón, usando /static/uploads/:", url)
      return url
    }
    
    // OPCIÓN 4.5: Si el archivo tiene una ruta completa en file_url
    if (archivo.file_url && archivo.file_url.startsWith('/static/uploads/')) {
      const url = `${API_BASE_URL}${archivo.file_url}`
      console.log("✅ Usando file_url con ruta completa /static/uploads/:", url)
      return url
    }
    
    // OPCIÓN 4.6: Detectar por extensión de imagen sin storage_type
    if (filename && (filename.includes('.jpeg') || filename.includes('.jpg') || filename.includes('.png') || filename.includes('.gif'))) {
      // Probar múltiples rutas para archivos locales
      console.log("✅ Archivo sin storage_type, probando múltiples rutas para:", filename)
      
      // Intentar primero con endpoint de preview (recomendado)
      const url = `${API_BASE_URL}/api/comprobantes/preview/${filename}`
      console.log("✅ Usando endpoint preview para archivo sin storage_type:", url)
      return url
    }
    
    // OPCIÓN 5: Fallback final usando endpoint de preview
    const url = `${API_BASE_URL}/api/comprobantes/preview/${filename}`
    console.log("✅ Usando URL fallback endpoint preview:", url)
    return url
  }

  // Mantener método original para compatibilidad
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