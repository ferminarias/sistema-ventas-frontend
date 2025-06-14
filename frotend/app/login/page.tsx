"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth-service"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    const checkAuth = async () => {
      const user = await authService.getCurrentUser()
      if (user) {
        router.replace("/dashboard")
      }
    }
    checkAuth()
  }, [router])

  const handleLoginSuccess = () => {
    router.push("/dashboard")
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />
} 