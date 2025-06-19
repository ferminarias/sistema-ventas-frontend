"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth-service"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        const token = localStorage.getItem("token")
        
        if (!user || !token) {
          router.replace("/login")
          setIsAuth(false)
        } else {
          setIsAuth(true)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        router.replace("/login")
        setIsAuth(false)
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (checking) {
    return <div className="flex items-center justify-center h-screen">Verificando sesión...</div>
  }

  if (!isAuth) {
    return null
  }

  return <>{children}</>
} 