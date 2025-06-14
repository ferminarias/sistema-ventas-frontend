import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Building2 } from "lucide-react"
import type { Client, CreateClientRequest } from "@/types/client"
import type { User } from "@/types/auth"

interface EditClientDialogProps {
  open: boolean
  client: Client | null
  onClose: () => void
  onSubmit: (data: Partial<CreateClientRequest>) => void
  availableUsers: User[]
}

export function EditClientDialog({ open, client, onClose, onSubmit, availableUsers }: EditClientDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateClientRequest>>({
    name: "",
    description: "",
    assignedUsers: [] as number[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        description: client.description,
        assignedUsers: Array.isArray(client.assignedUsers)
          ? client.assignedUsers.filter((id): id is number => typeof id === 'number' && !isNaN(Number(id))).map((id) => Number(id))
          : [],
      })
    }
  }, [client])

  const supervisors = availableUsers.filter((user) => user.role === "supervisor")

  const handleUserToggle = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignedUsers: Array.isArray(prev.assignedUsers)
        ? (prev.assignedUsers.includes(userId)
            ? prev.assignedUsers.filter((id) => id !== userId)
            : [...prev.assignedUsers, userId])
        : [userId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onSubmit(formData)
    setLoading(false)
  }

  if (!open || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Editar Cliente</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Información Básica</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Nombre del Cliente</label>
              <Input
                type="text"
                placeholder="Ej: Universidad XYZ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Descripción (opcional)</label>
              <Input
                type="text"
                placeholder="Descripción del cliente"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Usuarios Asignados</h3>
            <div className="grid grid-cols-1 gap-2">
              {supervisors.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleUserToggle(user.id)}
                  className={`justify-start p-3 h-auto ${
                    Array.isArray(formData.assignedUsers) && (formData.assignedUsers.filter((id): id is number => typeof id === 'number').includes(user.id))
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs opacity-75">{user.email}</p>
                  </div>
                </Button>
              ))}
            </div>
            {Array.isArray(formData.assignedUsers) && formData.assignedUsers.filter((id): id is number => typeof id === 'number').length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.assignedUsers.filter((id): id is number => typeof id === 'number').map((userId) => (
                  <Badge key={userId} variant="secondary" className="text-xs">
                    {availableUsers.find((u) => u.id === userId)?.name || "Usuario desconocido"}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 