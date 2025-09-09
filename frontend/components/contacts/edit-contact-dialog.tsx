"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { contactsService, type Contact, type ContactUser } from "@/services/contacts-service"

interface EditContactDialogProps {
  clientId: number
  contact: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactUpdated: () => void
}

const ESTADOS_OPTIONS = [
  { value: "no contactado", label: "No Contactado" },
  { value: "contactado", label: "Contactado" },
  { value: "interesado", label: "Interesado" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "propuesta", label: "Propuesta" },
  { value: "negociacion", label: "Negociación" },
  { value: "ganado", label: "Ganado" },
  { value: "perdido", label: "Perdido" },
  { value: "descartado", label: "Descartado" },
]

export function EditContactDialog({ clientId, contact, open, onOpenChange, onContactUpdated }: EditContactDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<ContactUser[]>([])
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    telefono_whatsapp: "",
    estado: "no contactado" as const,
    programa_interes: "",
    utm_medio: "",
    utm_source: "",
    utm_campaign: "",
    utm_content: "",
    assigned_to: "",
    notas: "",
  })

  // Inicializar formulario con datos del contacto
  useEffect(() => {
    if (contact && open) {
      setFormData({
        nombre: contact.nombre || "",
        apellido: contact.apellido || "",
        correo: contact.correo || "",
        telefono: contact.telefono || "",
        telefono_whatsapp: contact.telefono_whatsapp || "",
        estado: contact.estado,
        programa_interes: contact.programa_interes || "",
        utm_medio: contact.utm_medio || "",
        utm_source: contact.utm_source || "",
        utm_campaign: contact.utm_campaign || "",
        utm_content: contact.utm_content || "",
        assigned_to: contact.assigned_to?.toString() || "unassigned",
        notas: contact.campos_adicionales?.notas || "",
      })
      loadUsers()
    }
  }, [contact, open])

  const loadUsers = async () => {
    try {
      const usersData = await contactsService.getUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      toast({
        title: "Error",
        description: "Nombre y apellido son campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      const contactData = {
        ...formData,
        assigned_to: formData.assigned_to && formData.assigned_to !== "unassigned" ? parseInt(formData.assigned_to) : undefined,
        campos_adicionales: {
          ...contact.campos_adicionales,
          ...(formData.notas ? { notas: formData.notas } : {}),
        },
      }
      
      // Limpiar campos vacíos (excepto campos_adicionales)
      Object.keys(contactData).forEach(key => {
        if (key !== 'campos_adicionales' && contactData[key as keyof typeof contactData] === "") {
          contactData[key as keyof typeof contactData] = undefined
        }
      })

      await contactsService.updateContact(clientId, contact.id, contactData)
      
      toast({
        title: "Éxito",
        description: "Contacto actualizado correctamente",
      })
      
      onContactUpdated()
    } catch (error: any) {
      console.error('Error updating contact:', error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el contacto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contacto</DialogTitle>
          <DialogDescription>
            Modifica la información del contacto {contact.nombre} {contact.apellido}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Nombre del contacto"
                required
              />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
                placeholder="Apellido del contacto"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@ejemplo.com"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="Número de teléfono"
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => handleInputChange('empresa', e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                placeholder="Cargo en la empresa"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select onValueChange={(value) => handleInputChange('estado', value)} value={formData.estado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select onValueChange={(value) => handleInputChange('prioridad', value)} value={formData.prioridad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origen */}
            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Input
                id="origen"
                value={formData.origen}
                onChange={(e) => handleInputChange('origen', e.target.value)}
                placeholder="Ej: Redes sociales, Referido, Web, etc."
              />
            </div>

            {/* Asignado a */}
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Asignar a</Label>
              <Select onValueChange={(value) => handleInputChange('assigned_to', value)} value={formData.assigned_to}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {users.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre} {usuario.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleInputChange('notas', e.target.value)}
              placeholder="Información adicional sobre el contacto..."
              rows={3}
            />
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Creado por</Label>
              <p className="text-sm">
                {contact.created_user?.nombre} {contact.created_user?.apellido}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Fecha de creación</Label>
              <p className="text-sm">
                {new Date(contact.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
