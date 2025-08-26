"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Eye, EyeOff, UserPlus, ChevronDown } from "lucide-react"
import type { CreateUserRequest } from "@/types/auth"
import { ApiError } from "@/lib/api-error"

interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateUserRequest) => void
}

// Nueva función para obtener clientes
async function fetchClients() {
      const res = await fetch("https://sistemas-de-ventas-production.up.railway.app/api/clientes", {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      credentials: 'include'
    })
  if (!res.ok) throw new Error("Error al obtener clientes")
  return res.json()
}

export function CreateUserDialog({ open, onClose, onSubmit }: CreateUserDialogProps) {
  const [formData, setFormData] = useState<Omit<CreateUserRequest, 'assignedClients'> & { assignedClients: number[] }>({
    username: "",
    email: "",
    password: "",
    role: "supervisor",
    assignedClients: [],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [availableClients, setAvailableClients] = useState<{ id: number, name: string }[]>([])
  const [openRole, setOpenRole] = useState(false)

  // Obtener clientes al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchClients().then(setAvailableClients).catch(() => setAvailableClients([]))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mapeo aquí:
    const payload: any = {
      ...formData,
      allowedClients: formData.assignedClients,
    }
    delete (payload as any).assignedClients

    onSubmit(payload)
    setLoading(false)
    // Reset form...
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "supervisor",
      assignedClients: [],
    })
  }

  const handleClientToggle = (clientId: number) => {
    setFormData(prev => {
      const currentClients = prev.assignedClients || []
      const newClients = currentClients.includes(clientId)
        ? currentClients.filter((c: number) => c !== clientId)
        : [...currentClients, clientId]
      return { ...prev, assignedClients: newClients }
    })
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
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
            <label className="text-sm font-medium text-gray-300">Contraseña</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-gray-300">Rol</label>
            <Select
              value={formData.role}
              onValueChange={(v) => setFormData({ ...formData, role: v as "admin"|"supervisor" })}
              open={openRole} 
              onOpenChange={setOpenRole}
            >
              <SelectTrigger
                id="role"
                className={`bg-gray-700 border-gray-600 text-white justify-between
                  ${openRole ? "ring-2 ring-indigo-500/60 border-indigo-500/40" : ""}`}
              >
                <SelectValue placeholder="Selecciona un rol" />
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${openRole ? "rotate-180" : ""}`} />
              </SelectTrigger>

              <SelectContent
                position="popper"
                sideOffset={8}
                className="z-[80] min-w-[14rem] rounded-xl border border-white/10 bg-gray-800/95 shadow-2xl backdrop-blur"
              >
                <SelectItem 
                  value="admin" 
                  className="px-3 py-2 rounded-lg text-white data-[highlighted]:bg-white/5 data-[state=checked]:bg-indigo-500/15 data-[state=checked]:outline data-[state=checked]:outline-1 data-[state=checked]:outline-indigo-500/40"
                >
                  Administrador
                </SelectItem>
                <SelectItem 
                  value="supervisor" 
                  className="px-3 py-2 rounded-lg text-white data-[highlighted]:bg-white/5 data-[state=checked]:bg-indigo-500/15 data-[state=checked]:outline data-[state=checked]:outline-1 data-[state=checked]:outline-indigo-500/40"
                >
                  Supervisor
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clientes Asignados - Solo para supervisores */}
          {formData.role === "supervisor" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Clientes Asignados</label>
              <p className="text-xs text-gray-400">Selecciona los clientes que podrá gestionar</p>
              <div className="grid grid-cols-2 gap-2">
                {availableClients.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleClientToggle(c.id)}
                    className={`justify-start ${
                      formData.assignedClients?.includes(c.id)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
              {formData.assignedClients && formData.assignedClients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.assignedClients.map((clientId) => (
                    <Badge key={clientId} variant="secondary" className="text-xs">
                      {availableClients.find(c => c.id === clientId)?.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="sticky bottom-0 bg-card pt-4 pb-2 z-10 border-t flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Crear Usuario
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 


