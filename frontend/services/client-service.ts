import type { Client, CreateClientRequest, UpdateClientRequest } from "@/types/client"
import type { User } from "@/types/auth"
import { ApiError } from "@/lib/api-error"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';
const API_URL = API_BASE;

// Función para logging de debug
function logRequest(method: string, url: string, headers: HeadersInit, body?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${method}] ${url}`, {
      headers,
      body: body ? JSON.stringify(body, null, 2) : undefined
    })
  }
}

// Función para obtener el token del localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token")
  if (process.env.NODE_ENV === 'development') {
    console.log('Token:', token ? 'Presente' : 'No presente')
  }
  return token
}

// Función para construir URL con parámetros de consulta
function buildUrl(baseUrl: string, params?: Record<string, string>): string {
  if (!params) return baseUrl;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value);
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Función para obtener headers con autenticación
function getAuthHeaders(isGetRequest: boolean = false): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {
    "Accept": "application/json"
  }

  // IMPORTANTE: No enviamos Content-Type en peticiones GET
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
    console.error(`Error en la petición: ${response.status} ${response.statusText}`)
    console.error('URL:', response.url)
    console.error('Headers:', Object.fromEntries(response.headers.entries()))
    
    try {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        console.error('Error data:', errorData)
        throw await ApiError.fromResponse(response)
      } else {
        const text = await response.text()
        console.error('Error text:', text)
        throw new ApiError(
          `Error del servidor: ${response.status} ${response.statusText}`,
          response.status
        )
      }
    } catch (error) {
      console.error('Error al procesar respuesta:', error)
      throw new ApiError(
        `Error al procesar respuesta: ${response.status} ${response.statusText}`,
        response.status
      )
    }
  }
  
  try {
    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return response.json() as Promise<T>
    }
    
    // Si no es JSON, intentamos parsear como texto
    const text = await response.text()
    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError("Respuesta no válida del servidor", 500)
    }
  } catch (error) {
    console.error('Error al procesar respuesta exitosa:', error)
    throw new ApiError("Error al procesar respuesta del servidor", 500)
  }
}

// Filtra clientes según los permisos del usuario
export function getClientsByUser(user: User, clients: Client[]): Client[] {
  if (user.role === "admin") return clients;
  if (!user.allowedClients) return [];
  return clients.filter(c => 
    user.allowedClients?.includes(String(c.id)) || 
    user.allowedClients?.includes(c.name)
  );
}

// Verifica si un usuario puede acceder a un cliente específico
export function canAccessClient(user: User, clientId: number): boolean {
  if (user.role === "admin") return true;
  if (!user.allowedClients) return false;
  return user.allowedClients.includes(String(clientId));
}

class ClientService {
  private currentUser: User | null = null;

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  // Obtener todos los clientes
  async getAllClients(params?: { cliente?: string }): Promise<Client[]> {
    try {
      const url = buildUrl(`${API_URL}/api/clientes`, params)
      logRequest('GET', url, getAuthHeaders(true))
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(true),
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache'
      })
      const clients = await handleResponse<Client[]>(response)
      return this.currentUser ? getClientsByUser(this.currentUser, clients) : clients
    } catch (error) {
      console.error('Error en getAllClients:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al obtener clientes", 500)
    }
  }

  // Crear un nuevo cliente
  async createClient(clientData: CreateClientRequest): Promise<Client> {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      throw new ApiError("No tienes permiso para crear clientes", 403)
    }

    try {
      const url = `${API_URL}/api/clientes`
      logRequest('POST', url, getAuthHeaders(false), clientData)
      
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: JSON.stringify(clientData),
        credentials: 'include',
        mode: 'cors'
      })
      return handleResponse<Client>(response)
    } catch (error) {
      console.error('Error en createClient:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al crear cliente", 500)
    }
  }

  // Actualizar un cliente
  async updateClient(clientId: number, clientData: UpdateClientRequest): Promise<Client> {
    if (!this.currentUser) {
      throw new ApiError("Debes iniciar sesión para actualizar clientes", 401)
    }

    if (!canAccessClient(this.currentUser, Number(clientId))) {
      throw new ApiError("No tienes permiso para actualizar este cliente", 403)
    }

    try {
      const url = `${API_URL}/api/clientes/${clientId}`
      logRequest('PUT', url, getAuthHeaders(false), clientData)
      
      const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(false),
        body: JSON.stringify(clientData),
        credentials: 'include',
        mode: 'cors'
      })
      
      if (!response.ok) {
        throw new Error('Error updating client');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en updateClient:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al actualizar cliente", 500)
    }
  }

  // Eliminar un cliente
  async deleteClient(clientId: number): Promise<void> {
    if (!this.currentUser) {
      throw new ApiError("Debes iniciar sesión para eliminar clientes", 401)
    }

    if (!canAccessClient(this.currentUser, Number(clientId))) {
      throw new ApiError("No tienes permiso para eliminar este cliente", 403)
    }

    try {
      const url = `${API_URL}/api/clientes/${clientId}`
      logRequest('DELETE', url, getAuthHeaders(false))
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(false),
        credentials: 'include',
        mode: 'cors'
      })
      await handleResponse<void>(response)
    } catch (error) {
      console.error('Error en deleteClient:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al eliminar cliente", 500)
    }
  }

  // Obtener un cliente
  async getClient(clientId: number): Promise<Client> {
    try {
      const url = `${API_URL}/api/clientes/${clientId}`
      logRequest('GET', url, getAuthHeaders(true))
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(true),
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache'
      })
      return handleResponse<Client>(response)
    } catch (error) {
      console.error('Error en getClient:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al obtener cliente", 500)
    }
  }

  // Subir logo del cliente
  async uploadClientLogo(clientId: number, logoBase64: string): Promise<Client> {
    if (!this.currentUser) {
      throw new ApiError("Debes iniciar sesión para subir logos", 401)
    }

    if (!canAccessClient(this.currentUser, Number(clientId))) {
      throw new ApiError("No tienes permiso para actualizar este cliente", 403)
    }

    try {
      const url = `${API_URL}/api/clientes/${clientId}/logo`
      const requestBody = { logo: logoBase64 }
      logRequest('POST', url, getAuthHeaders(false), requestBody)
      
      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: JSON.stringify(requestBody),
        credentials: 'include',
        mode: 'cors'
      })
      
      if (!response.ok) {
        throw new Error('Error uploading logo');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en uploadClientLogo:', error)
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al subir logo del cliente", 500)
    }
  }
}

export const clientService = new ClientService()
