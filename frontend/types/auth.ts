export type UserRole = "admin" | "supervisor"

export interface User {
  id?: number | string
  username?: string
  name: string
  nombre?: string
  email: string
  role: UserRole
  allowedClients?: string[] // Solo para supervisores
  assignedClients?: string[] // Para compatibilidad con sidebar
  lastLogin?: string
  last_login?: string
  createdAt?: string
  created_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: UserRole
  assignedClients?: string[]
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  role?: UserRole
  assignedClients?: string[]
}

export interface AuthResponse {
  user: User
  token: string
} 