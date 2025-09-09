"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { contactsService, type Contact, type ContactField } from "@/services/contacts-service"

interface ContactFieldsDialogProps {
  contact: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactUpdated: () => void
}

export function ContactFieldsDialog({ contact, open, onOpenChange, onContactUpdated }: ContactFieldsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [availableFields, setAvailableFields] = useState<ContactField[]>([])
  const [newFieldValues, setNewFieldValues] = useState<Record<string, any>>({})
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<any>("")

  useEffect(() => {
    if (open) {
      loadAvailableFields()
    }
  }, [open])

  const loadAvailableFields = async () => {
    try {
      const fields = await contactsService.getFields()
      setAvailableFields(fields)
    } catch (error) {
      console.error('Error loading available fields:', error)
    }
  }

  const handleAddField = async (fieldId: string) => {
    const value = newFieldValues[fieldId]
    if (!value) {
      toast({
        title: "Error",
        description: "Ingresa un valor para el campo",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await contactsService.updateContactField(contact.id, fieldId, value)
      setNewFieldValues(prev => ({ ...prev, [fieldId]: "" }))
      toast({
        title: "Éxito",
        description: "Campo agregado correctamente",
      })
      onContactUpdated()
    } catch (error: any) {
      console.error('Error adding field:', error)
      toast({
        title: "Error",
        description: error.message || "Error al agregar campo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateField = async (fieldId: string) => {
    try {
      setLoading(true)
      await contactsService.updateContactField(contact.id, fieldId, editingValue)
      setEditingFieldId(null)
      setEditingValue("")
      toast({
        title: "Éxito",
        description: "Campo actualizado correctamente",
      })
      onContactUpdated()
    } catch (error: any) {
      console.error('Error updating field:', error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar campo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteField = async (fieldId: string) => {
    try {
      setLoading(true)
      await contactsService.deleteContactField(contact.id, fieldId)
      toast({
        title: "Éxito",
        description: "Campo eliminado correctamente",
      })
      onContactUpdated()
    } catch (error: any) {
      console.error('Error deleting field:', error)
      toast({
        title: "Error",
        description: error.message || "Error al eliminar campo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (fieldId: string, currentValue: any) => {
    setEditingFieldId(fieldId)
    setEditingValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingFieldId(null)
    setEditingValue("")
  }

  const renderFieldInput = (field: ContactField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date ? date.toISOString().split('T')[0] : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      case 'textarea':
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
            rows={3}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
          />
        )
      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
          />
        )
    }
  }

  const getFieldDisplayValue = (field: ContactField, value: any) => {
    if (!value) return "-"
    
    switch (field.type) {
      case 'date':
        try {
          return format(new Date(value), "PPP", { locale: es })
        } catch {
          return value
        }
      default:
        return value.toString()
    }
  }

  // Campos existentes en el contacto
  const existingFields = Object.keys(contact.campos_adicionales || {})
  
  // Campos disponibles para agregar (que no están ya en el contacto)
  const fieldsToAdd = availableFields.filter(field => !existingFields.includes(field.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campos Adicionales</DialogTitle>
          <DialogDescription>
            Gestiona los campos adicionales para {contact.nombre} {contact.apellido}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campos existentes */}
          {existingFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campos Existentes</CardTitle>
                <CardDescription>
                  Campos adicionales ya configurados para este contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {existingFields.map((fieldId) => {
                    const field = availableFields.find(f => f.id === fieldId)
                    const currentValue = contact.campos_adicionales?.[fieldId]
                    
                    if (!field) {
                      return (
                        <div key={fieldId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Label className="font-medium">{fieldId}</Label>
                            <p className="text-sm text-muted-foreground">Campo personalizado</p>
                            <p className="text-sm">{currentValue}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteField(fieldId)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    }

                    return (
                      <div key={fieldId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Label className="font-medium">{field.label}</Label>
                            <Badge variant="secondary">{field.type}</Badge>
                            {field.required && <Badge variant="destructive">Requerido</Badge>}
                          </div>
                          
                          {editingFieldId === fieldId ? (
                            <div className="space-y-2">
                              {renderFieldInput(field, editingValue, setEditingValue)}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateField(fieldId)}
                                  disabled={loading}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{getFieldDisplayValue(field, currentValue)}</p>
                          )}
                        </div>
                        
                        {editingFieldId !== fieldId && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(fieldId, currentValue)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteField(fieldId)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agregar nuevos campos */}
          {fieldsToAdd.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agregar Campos</CardTitle>
                <CardDescription>
                  Campos disponibles para agregar a este contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fieldsToAdd.map((field) => (
                    <div key={field.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="font-medium">{field.label}</Label>
                        <Badge variant="secondary">{field.type}</Badge>
                        {field.required && <Badge variant="destructive">Requerido</Badge>}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          {renderFieldInput(
                            field,
                            newFieldValues[field.id],
                            (value) => setNewFieldValues(prev => ({ ...prev, [field.id]: value }))
                          )}
                        </div>
                        <Button
                          onClick={() => handleAddField(field.id)}
                          disabled={loading || !newFieldValues[field.id]}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {fieldsToAdd.length === 0 && existingFields.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No hay campos adicionales disponibles para este contacto
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
