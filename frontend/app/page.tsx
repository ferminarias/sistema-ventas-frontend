"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth-service"

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Evitar loops infinitos agregando un pequeño delay
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const user = await authService.getCurrentUser()
        
        if (user) {
          router.replace("/dashboard")
        } else {
          // Si no hay usuario, ir al login en lugar de dashboard
          router.replace("/login")
        }
      } catch (error) {
        console.error('Error checking auth on home:', error)
        // En caso de error, ir al login
        router.replace("/login")
      } finally {
        setIsChecking(false)
      }
    }

    checkAuthAndRedirect()
  }, [router])

  // Mostrar loading solo mientras verifica (máximo unos segundos)
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Redirigiendo...</div>
      </div>
    )
  }

  // Fallback en caso de que no se redirija
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white text-lg">Cargando aplicación...</div>
    </div>
  )
}
