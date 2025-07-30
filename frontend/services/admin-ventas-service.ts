import { ApiError } from "@/lib/api-error"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Función para obtener el token del localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Función para obtener headers con autenticación
function getAuthHeaders(isGetRequest: boolean = false): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {
    "Accept": "application/json"
  }

  if (!isGetRequest) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// Función para manejar las respuestas de la API
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await ApiError.fromResponse(response)
  }
  
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>
  }
  
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError("Respuesta no válida del servidor", 500)
  }
}

export interface VentaAdmin {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  asesor: string
  fecha_venta: string
  cliente: number
  cliente_nombre: string
  tiene_archivos: boolean
  campos_adicionales?: any
}

export interface AdminVentasResponse {
  ventas: VentaAdmin[]
  pagination: {
    current_page: number
    total_pages: number
    total_results: number
    has_next: boolean
    has_prev: boolean
    results_per_page: number
  }
  stats: {
    total_ventas: number
    ventas_con_archivos: number
  }
  user_permissions: {
    role: string
    can_edit_all: boolean
    can_delete: boolean
  }
}

export interface AdminStats {
  total_ventas: number
  ventas_hoy: number
  ventas_mes: number
  top_asesores: Array<{asesor: string; ventas: number}>
  top_clientes: Array<{cliente: string; ventas: number}>
  user_role: string
}

export const adminVentasService = {
  // Listar ventas con filtros
  async getVentasAdmin(params: {
    page?: number
    limit?: number
    cliente_id?: number
    asesor?: string
    busqueda?: string
    fecha_inicio?: string
    fecha_fin?: string
  }): Promise<AdminVentasResponse> {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString())
        }
      })
      
      const response = await fetch(`${API_BASE}/api/ventas/admin?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(true),
        credentials: 'include',
        mode: 'cors'
      })
      
      return handleResponse<AdminVentasResponse>(response)
    } catch (error) {
      console.error('Error en getVentasAdmin:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al obtener ventas", 500)
    }
  },

  // Editar venta
  async editarVenta(id: number, data: Partial<VentaAdmin> & { archivos_eliminar?: string[], archivos_nuevos?: Record<string, string> }): Promise<{message: string; venta: VentaAdmin}> {
    try {
      console.log("🔄 Editando venta:", id, "con datos:", {
        ...data,
        archivos_nuevos: data.archivos_nuevos ? Object.keys(data.archivos_nuevos).map(key => 
          `${key}: ${data.archivos_nuevos![key].substring(0, 50)}...`
        ) : undefined
      })
      
      const headers = getAuthHeaders(false) // ✅ false para incluir Content-Type: application/json
      console.log("📡 Headers enviados:", headers)
      
      const response = await fetch(`${API_BASE}/api/ventas/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(data)
      })
      
      return handleResponse<{message: string; venta: VentaAdmin}>(response)
    } catch (error) {
      console.error('Error en editarVenta:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al editar venta", 500)
    }
  },

  // Eliminar venta
  async eliminarVenta(id: number): Promise<{message: string; deleted_venta: any}> {
    try {
      const response = await fetch(`${API_BASE}/api/ventas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
        credentials: 'include',
        mode: 'cors'
      })
      
      return handleResponse<{message: string; deleted_venta: any}>(response)
    } catch (error) {
      console.error('Error en eliminarVenta:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al eliminar venta", 500)
    }
  },

  // Obtener estadísticas
  async getStats(): Promise<AdminStats> {
    try {
      const response = await fetch(`${API_BASE}/api/ventas/admin/stats`, {
        method: 'GET',
        headers: getAuthHeaders(true),
        credentials: 'include',
        mode: 'cors'
      })
      
      return handleResponse<AdminStats>(response)
    } catch (error) {
      console.error('Error en getStats:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al obtener estadísticas", 500)
    }
  }
} 