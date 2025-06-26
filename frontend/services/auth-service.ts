import type { AuthResponse, CreateUserRequest, LoginCredentials, User } from "@/types/auth"
import { ApiError } from "@/lib/api-error"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Función para manejar las respuestas de la API
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(error.message || `Error: ${response.status} ${response.statusText}`, response.status)
  }
  return response.json() as Promise<T>
}

// Función para obtener el token del localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Función para obtener headers con autenticación
function getAuthHeaders(): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const AUTH_KEY = "auth_user"

class AuthService {
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await handleResponse<{ user: User; token: string }>(response)

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_KEY, JSON.stringify(data.user))
        localStorage.setItem("token", data.token)
      }

      return data.user
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Error al conectar con el servidor", 500)
    }
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem("token")
      window.location.href = "/"
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") {
      return null
    }

    try {
      const userJson = localStorage.getItem(AUTH_KEY)
      const token = getToken()
      
      if (!userJson || !token) {
        return null
      }

      const user = JSON.parse(userJson)
      
      // Verificar si el token sigue siendo válido (especialmente importante en móviles)
      const isValid = await this.verifyToken()
      
      if (!isValid) {
        // Token inválido, limpiar storage
        localStorage.removeItem(AUTH_KEY)
        localStorage.removeItem("token")
        return null
      }
      
      return user
    } catch (error) {
      console.error("Error parsing user from localStorage:", error)
      // Limpiar localStorage en caso de error
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem("token")
      return null
    }
  }

  // Verificar si el token actual es válido usando el endpoint /me
  async verifyToken(): Promise<boolean> {
    const token = getToken()
    if (!token) return false

    try {
      const response = await fetch(`${API_BASE}/api/me`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      })
      
      return response.ok
    } catch (error) {
      console.error("Token verification failed:", error)
      return false
    }
  }

  // Crear un nuevo usuario (solo admin)
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
      credentials: "include",
    })

    return handleResponse<User>(response)
  }

  // Obtener todos los usuarios (solo admin)
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/api/users`, {
      headers: getAuthHeaders(),
      credentials: "include",
    })

    return handleResponse<User[]>(response)
  }

  // Actualizar un usuario (solo admin)
  async updateUser(userId: string, userData: Partial<CreateUserRequest>): Promise<User> {
    const response = await fetch(`${API_BASE}/api/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
      credentials: "include",
    })

    return handleResponse<User>(response)
  }

  // Eliminar un usuario (solo admin)
  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    })

    return handleResponse<void>(response)
  }
}

export const authService = new AuthService() 
