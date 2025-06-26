"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/services/auth-service"
import { LoginForm } from "@/components/login-form"
import type { User } from "@/types/auth"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Rutas que NO necesitan autenticación
  const publicRoutes = ["/api"] // Solo las APIs pueden ser públicas

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        
        // Timeout para evitar que se quede cargando indefinidamente en móviles
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Authentication timeout')), 10000) // 10 segundos
        })
        
        const authPromise = authService.getCurrentUser()
        
        const currentUser = await Promise.race([authPromise, timeoutPromise]) as User | null
        setUser(currentUser)
        
        // Si no hay usuario, limpiar localStorage por si hay datos corruptos
        if (!currentUser && typeof window !== "undefined") {
          localStorage.removeItem("auth_user")
          localStorage.removeItem("token")
        }
        
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
        
        // Limpiar localStorage en caso de error (especialmente útil en móviles)
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_user")
          localStorage.removeItem("token")
        }
        
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Mostrar loading mientras verifica
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    )
  }

  // Si es ruta pública, mostrar contenido sin verificar auth
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si no hay usuario y no es ruta pública, mostrar login
  if (!user) {
    return <LoginForm onLoginSuccess={setUser} />
  }

  // Si hay usuario, mostrar el contenido protegido
  return <>{children}</>
} 