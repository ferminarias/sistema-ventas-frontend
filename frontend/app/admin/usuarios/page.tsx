"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth-service"
import { UserManagement } from "@/components/admin/user-management"
import type { User } from "@/types/auth"

export default function UsuariosPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        router.push("/")
      } else if (currentUser.role !== "admin") {
        // Solo admin puede acceder
        router.push("/dashboard")
      } else {
        setUser(currentUser)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    authService.logout()
    router.replace("/")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return <UserManagement user={user} />
}
