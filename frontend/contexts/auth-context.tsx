"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { authService } from "@/services/auth-service"
import type { User, LoginCredentials } from "@/types/auth"

const AUTH_KEY = "auth_user"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isSupervisor: boolean
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Hidratación inicial desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem(AUTH_KEY);
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error al parsear auth_user:", error);
          // Limpieza segura sin redirección
          localStorage.removeItem("token");
          localStorage.removeItem(AUTH_KEY);
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  // Redirigir al login solo cuando no hay usuario y no está cargando - EVITAR LOOPS
  useEffect(() => {
    if (!user && !loading && typeof window !== "undefined") {
      const currentPath = window.location.pathname
      // Solo redirigir si estamos en una página protegida
      if (currentPath !== "/login" && currentPath !== "/" && !currentPath.includes("/login")) {
        console.log("🔄 Redirigiendo a login desde:", currentPath)
        // Usar router.push en lugar de window.location para evitar recargas
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    }
  }, [user, loading])

  // Refrescar usuario desde el backend si es necesario
  const refreshUser = async () => {
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      // authService.login espera email y password por separado
      const user = await authService.login(credentials.email, credentials.password)
      setUser(user)
      if (typeof window !== "undefined") {
        // El token ya se guarda en localStorage dentro de authService.login, pero lo guardamos también como cookie
        const token = localStorage.getItem("token")
        if (token) {
          document.cookie = `token=${token}; path=/;`;
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem(AUTH_KEY)
      }
    } finally {
      setLoading(false)
    }
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role === "admin"
  const isSupervisor = user?.role === "supervisor"

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isSupervisor,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
} 