import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, GripVertical, Eye } from "lucide-react"
import type { Client, FormField } from "@/types/client"

interface ConfigureFormDialogProps {
  open: boolean
  client: Client | null
  onClose: () => void
  onSubmit: (formConfig: FormField[]) => void
}

export function ConfigureFormDialog({ open, client, onClose, onSubmit }: ConfigureFormDialogProps) {
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (client) {
      setFields(client.formConfig || [])
    }
  }, [client])

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: `campo_${fields.length + 1}`,
      label: `Campo ${fields.length + 1}`,
      type: "text",
      required: false,
      order: fields.length + 1,
    }
    setFields([...fields, newField])
  }

  const removeField = (fieldId: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este campo?")) {
      setFields(fields.filter((f) => f.id !== fieldId))
    }
  }

  // Drag & drop simple (swap)
  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= fields.length) return
    const updated = [...fields]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setFields(updated.map((f, i) => ({ ...f, order: i + 1 })))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onSubmit(fields)
    setLoading(false)
  }

  if (!open || !client) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Configurar Formulario</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-white">Campos del Formulario</h3>
            <Button type="button" onClick={addField} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-1" />
              Agregar Campo
            </Button>
          </div>
          {fields.length === 0 ? (
            <p className="text-gray-400">No hay campos configurados.</p>
          ) : (
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                  <div className="flex items-center gap-2">
                    <GripVertical
                      className="h-4 w-4 cursor-pointer text-gray-400"
                      onClick={() => moveField(idx, idx - 1)}
                    />
                    <GripVertical
                      className="h-4 w-4 cursor-pointer text-gray-400"
                      onClick={() => moveField(idx, idx + 1)}
                    />
                    <span className="text-white text-sm">{field.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{field.type}</Badge>
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
          <div className="flex justify-between items-center mt-4">
            <Button type="button" variant="outline" onClick={() => setShowPreview((p) => !p)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? "Ocultar Preview" : "Ver Preview"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </form>
        {showPreview && (
          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <h4 className="text-white font-semibold mb-2">Preview del Formulario</h4>
            <form className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-gray-300 text-sm mb-1">{field.label}</label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  />
                </div>
              ))}
            </form>
          </div>
        )}
      </div>
    </div>
  )
} 