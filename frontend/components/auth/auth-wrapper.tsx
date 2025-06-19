"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { authService } from "@/services/auth-service"
import { LoginForm } from "@/components/auth/login-form"
import type { User } from "@/types/auth"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
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
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        setUser(null)
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