"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Key, Eye, EyeOff, AlertTriangle } from "lucide-react"
import type { User } from "@/types/auth"

interface ChangePasswordDialogProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSubmit: (newPassword: string) => void
}

export function ChangePasswordDialog({ open, user, onClose, onSubmit }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onSubmit(newPassword)
    setLoading(false)

    // Reset form
    setNewPassword("")
    setConfirmPassword("")
    setError("")
  }

  const handleClose = () => {
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    onClose()
  }

  if (!open || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Cambiar Contraseña</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Información del usuario */}
        <div className="bg-gray-700 p-3 rounded-md mb-4">
          <p className="text-white font-medium">{user.name}</p>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nueva contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nueva contraseña</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Confirmar contraseña</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-900 border border-red-700 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Advertencia */}
          <div className="flex items-start space-x-2 p-3 bg-yellow-900 border border-yellow-700 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-200 text-sm font-medium">Advertencia</p>
              <p className="text-yellow-300 text-xs">
                El usuario deberá usar la nueva contraseña en su próximo inicio de sesión.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 