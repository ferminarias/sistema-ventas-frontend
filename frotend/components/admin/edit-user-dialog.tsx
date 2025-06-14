"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Edit, Save } from "lucide-react"
import type { User, UpdateUserRequest } from "@/types/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditUserDialogProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSubmit: (userData: UpdateUserRequest) => void
}

export function EditUserDialog({ open, user, onClose, onSubmit }: EditUserDialogProps) {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "admin",
    assignedClients: user?.assignedClients || [],
  })
  const [loading, setLoading] = useState(false)

  const availableClients = ["Aliat", "Anahuac", "Cesa", "Faro"]

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email,
        role: user.role,
        assignedClients: user.assignedClients || [],
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const payload = {
      ...formData,
      allowedClients: formData.assignedClients,
    }
    delete payload.assignedClients

    onSubmit(payload)
    setLoading(false)
  }

  const handleClientToggle = (client: string) => {
    setFormData(prev => {
      const currentClients = prev.assignedClients || []
      const newClients = currentClients.includes(client)
        ? currentClients.filter(c => c !== client)
        : [...currentClients, client]
      return { ...prev, assignedClients: newClients }
    })
  }

  if (!open || !user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nombre de Usuario</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Rol</label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "supervisor") => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clientes Asignados - Solo para supervisores */}
          {formData.role === "supervisor" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Clientes Asignados</label>
              <p className="text-xs text-gray-400">Selecciona los clientes que podrá gestionar</p>
              <div className="grid grid-cols-2 gap-2">
                {availableClients.map((client) => (
                  <Button
                    key={client}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleClientToggle(client)}
                    className={`justify-start ${
                      formData.assignedClients?.includes(client)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {client}
                  </Button>
                ))}
              </div>
              {formData.assignedClients && formData.assignedClients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.assignedClients.map((client) => (
                    <Badge key={client} variant="secondary" className="text-xs">
                      {client}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-gray-700 p-3 rounded-md">
            <p className="text-xs text-gray-400">
              <strong>Creado:</strong> {user.createdAt}
            </p>
            <p className="text-xs text-gray-400">
              <strong>Último login:</strong> {user.lastLogin}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 