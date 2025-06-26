const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Función para obtener el token del localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Función para obtener headers con autenticación
export function getAuthHeaders(includeContentType: boolean = true): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {
    'Accept': 'application/json'
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// Función helper para hacer fetch con autenticación
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(!options.body || typeof options.body === 'string'),
    credentials: 'include',
    ...options
  }

  return fetch(url, defaultOptions)
}

export { API_BASE } 