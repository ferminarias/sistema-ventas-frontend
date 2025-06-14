"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Building2, Plus } from "lucide-react"
import type { CreateClientRequest, FormField } from "@/types/client"
import type { User } from "@/types/auth"

interface CreateClientDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (clientData: CreateClientRequest) => void
  availableUsers: User[]
}

export function CreateClientDialog({ open, onClose, onSubmit, availableUsers }: CreateClientDialogProps) {
  const [formData, setFormData] = useState<CreateClientRequest>({
    name: "",
    description: "",
    assignedUsers: [],
    formConfig: [],
  })
  const [loading, setLoading] = useState(false)

  // Filtrar solo supervisores
  const supervisors = availableUsers.filter((user) => user.role === "supervisor")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("Enviando cliente", formData); // Log para depuración

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Enviar los IDs como enteros
    onSubmit({
      ...formData,
      assignedUsers: formData.assignedUsers.map(id => Number(id)),
    })
    setLoading(false)

    // Reset form
    setFormData({
      name: "",
      description: "",
      assignedUsers: [],
      formConfig: [],
    })
  }

  const handleUserToggle = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter((id) => id !== userId)
        : [...prev.assignedUsers, userId],
    }))
  }

  const addBasicField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: `campo_${formData.formConfig.length + 1}`,
      label: `Campo ${formData.formConfig.length + 1}`,
      type: "text",
      required: false,
      placeholder: "",
      order: formData.formConfig.length + 1,
    }

    setFormData({
      ...formData,
      formConfig: [...formData.formConfig, newField],
    })
  }

  const removeField = (fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      formConfig: prev.formConfig.filter((field: FormField) => field.id !== fieldId),
    }))
  }

  const getUserName = (userId: number) => {
    return availableUsers.find((user) => user.id === userId)?.name || "Usuario desconocido"
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Crear Cliente</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
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

          {/* Usuarios asignados */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Usuarios Asignados</h3>
            <p className="text-sm text-gray-400">Selecciona qué supervisores tendrán acceso a este cliente</p>

            <div className="grid grid-cols-1 gap-2">
              {supervisors.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleUserToggle(user.id as number)}
                  className={`justify-start p-3 h-auto ${
                    formData.assignedUsers.includes(user.id as number)
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

            {formData.assignedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.assignedUsers.map((userId) => (
                  <Badge key={userId} variant="secondary" className="text-xs">
                    {getUserName(userId)}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Configuración básica de formulario */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Campos del Formulario</h3>
              <Button type="button" onClick={addBasicField} size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Campo
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              Agrega campos básicos ahora. Podrás configurarlos en detalle después de crear el cliente.
            </p>

            {formData.formConfig.length > 0 && (
              <div className="space-y-2">
                {formData.formConfig.map((field, idx) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                    <div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => {
                          const newLabel = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            formConfig: prev.formConfig.map((f, i) =>
                              i === idx ? { ...f, label: newLabel, name: newLabel.toLowerCase().replace(/\s+/g, '_') } : f
                            ),
                          }))
                        }}
                        className="bg-gray-600 text-white rounded px-2 py-1 mb-1 w-full font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Nombre del campo"
                      />
                      <p className="text-gray-400 text-xs">Tipo: {field.type}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
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
              {loading ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
