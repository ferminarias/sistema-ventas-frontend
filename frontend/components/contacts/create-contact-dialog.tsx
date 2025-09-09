"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { contactsService, type ContactUser } from "@/services/contacts-service"
import { useAuth } from "@/contexts/auth-context"

interface CreateContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactCreated: () => void
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

export function CreateContactDialog({ open, onOpenChange, onContactCreated }: CreateContactDialogProps) {
  const { user } = useAuth()
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

  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

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
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : undefined,
        campos_adicionales: formData.notas ? { notas: formData.notas } : undefined,
      }
      
      // Limpiar campos vacíos
      Object.keys(contactData).forEach(key => {
        if (contactData[key as keyof typeof contactData] === "") {
          delete contactData[key as keyof typeof contactData]
        }
      })

      await contactsService.createContact(contactData)
      
      toast({
        title: "Éxito",
        description: "Contacto creado correctamente",
      })
      
      // Resetear formulario
      setFormData({
        nombre: "",
        apellido: "",
        correo: "",
        telefono: "",
        telefono_whatsapp: "",
        estado: "no contactado",
        programa_interes: "",
        utm_medio: "",
        utm_source: "",
        utm_campaign: "",
        utm_content: "",
        assigned_to: "",
        notas: "",
      })
      
      onContactCreated()
    } catch (error: any) {
      console.error('Error creating contact:', error)
      toast({
        title: "Error",
        description: error.message || "Error al crear el contacto",
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
          <DialogTitle>Crear Nuevo Contacto</DialogTitle>
          <DialogDescription>
            Completa la información para agregar un nuevo contacto al sistema
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

            {/* Correo */}
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                placeholder="correo@ejemplo.com"
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

            {/* Teléfono WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="telefono_whatsapp">Teléfono WhatsApp</Label>
              <Input
                id="telefono_whatsapp"
                value={formData.telefono_whatsapp}
                onChange={(e) => handleInputChange('telefono_whatsapp', e.target.value)}
                placeholder="Número de WhatsApp"
              />
            </div>

            {/* Programa de Interés */}
            <div className="space-y-2">
              <Label htmlFor="programa_interes">Programa de Interés</Label>
              <Input
                id="programa_interes"
                value={formData.programa_interes}
                onChange={(e) => handleInputChange('programa_interes', e.target.value)}
                placeholder="Ej: Maestría en Marketing, Diplomado..."
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado del Funnel</Label>
              <Select onValueChange={(value) => handleInputChange('estado', value)} defaultValue="no contactado">
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

            {/* UTM Medium */}
            <div className="space-y-2">
              <Label htmlFor="utm_medio">UTM Medium</Label>
              <Input
                id="utm_medio"
                value={formData.utm_medio}
                onChange={(e) => handleInputChange('utm_medio', e.target.value)}
                placeholder="Ej: email, social, cpc..."
              />
            </div>

            {/* UTM Source */}
            <div className="space-y-2">
              <Label htmlFor="utm_source">UTM Source</Label>
              <Input
                id="utm_source"
                value={formData.utm_source}
                onChange={(e) => handleInputChange('utm_source', e.target.value)}
                placeholder="Ej: google, facebook, newsletter..."
              />
            </div>

            {/* UTM Campaign */}
            <div className="space-y-2">
              <Label htmlFor="utm_campaign">UTM Campaign</Label>
              <Input
                id="utm_campaign"
                value={formData.utm_campaign}
                onChange={(e) => handleInputChange('utm_campaign', e.target.value)}
                placeholder="Ej: spring_sale, back_to_school..."
              />
            </div>

            {/* UTM Content */}
            <div className="space-y-2">
              <Label htmlFor="utm_content">UTM Content</Label>
              <Input
                id="utm_content"
                value={formData.utm_content}
                onChange={(e) => handleInputChange('utm_content', e.target.value)}
                placeholder="Ej: logolink, textlink..."
              />
            </div>

            {/* Asignado a */}
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Asignar a</Label>
              <Select onValueChange={(value) => handleInputChange('assigned_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Contacto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
