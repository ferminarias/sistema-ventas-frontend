"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  CheckSquare, 
  Users, 
  Edit3, 
  MoreVertical,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Building,
  MapPin,
  Globe,
  Star,
  Heart,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type Contact, contactsService } from "@/services/contacts-service"

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

interface ContactDetailViewProps {
  contact: Contact
  clientId: number
  onClose: () => void
  onUpdate: (contact: Contact) => void
}

interface Activity {
  id: string
  type: 'note' | 'call' | 'email' | 'meeting' | 'task' | 'lifecycle_change' | 'form_submission' | 'contact_created'
  title: string
  description: string
  timestamp: string
  user?: string
  metadata?: Record<string, any>
}

export function ContactDetailView({ contact, clientId, onClose, onUpdate }: ContactDetailViewProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchActivity, setSearchActivity] = useState("")
  const [activeTab, setActiveTab] = useState<'activity' | 'notes' | 'emails' | 'calls' | 'tasks' | 'meetings'>('activity')
  
  // Estados para edición inline
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Generar iniciales del contacto
  const getInitials = (name: string, lastName: string) => {
    return `${name?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  // Cargar actividades del contacto
  useEffect(() => {
    const loadActivities = async () => {
      try {
        // Cargar notas del backend
        const notes = await contactsService.getContactNotes(clientId, contact.id)
        
        // Convertir notas a actividades
        const noteActivities: Activity[] = notes.map(note => ({
          id: note.id.toString(),
          type: 'note' as const,
          title: 'Nota agregada',
          description: note.note,
          timestamp: new Date(note.created_at).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          }),
          user: note.created_by
        }))

        // Solo mostrar notas reales del backend
        setActivities(noteActivities)
      } catch (error: any) {
        console.error('Error al cargar actividades:', error)
        // En caso de error, mostrar array vacío
        setActivities([])
      }
    }

    loadActivities()
  }, [contact, clientId])

  // Agregar nueva nota
  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      // Guardar nota en el backend
      const savedNote = await contactsService.addContactNote(clientId, contact.id, newNote)
      
      // Crear actividad para mostrar en el timeline
      const newActivity: Activity = {
        id: savedNote.id.toString(),
        type: 'note',
        title: 'Nota agregada',
        description: savedNote.note,
        timestamp: new Date(savedNote.created_at).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        user: savedNote.created_by
      }

      setActivities(prev => [newActivity, ...prev])
      setNewNote("")
      
      toast({
        title: "Nota guardada",
        description: "La nota se ha guardado correctamente en el backend",
      })
    } catch (error: any) {
      console.error('Error al guardar nota:', error)
      toast({
        title: "Error",
        description: error.message || "Error al guardar la nota",
        variant: "destructive",
      })
    }
  }

  // Funciones para edición inline
  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditingValue(String(currentValue || ''))
    setHasChanges(false)
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditingValue("")
    setHasChanges(false)
  }

  const handleFieldChange = (value: string) => {
    setEditingValue(value)
    setHasChanges(value !== String(contact[editingField as keyof Contact] || ''))
  }

  const saveField = async () => {
    if (!editingField || !hasChanges) return

    try {
      setSaving(true)
      
      // Crear objeto con el campo actualizado
      const updatedContact = {
        ...contact,
        [editingField]: editingValue
      }

      // Actualizar en el backend
      await contactsService.updateContact(clientId, contact.id, updatedContact)
      
      // Actualizar el contacto local
      onUpdate(updatedContact)
      
      // Cerrar edición
      setEditingField(null)
      setEditingValue("")
      setHasChanges(false)
      
      toast({
        title: "Campo actualizado",
        description: "El campo se ha guardado correctamente",
      })
    } catch (error: any) {
      console.error('Error al actualizar campo:', error)
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el campo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Acciones rápidas
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'note':
        // Enfocar el área de texto para agregar nota
        const textarea = document.querySelector('textarea[placeholder="Agregar una nota..."]') as HTMLTextAreaElement
        if (textarea) {
          textarea.focus()
        }
        break
      case 'email':
        toast({
          title: "Enviar correo",
          description: `Abriendo cliente de correo para ${contact.correo}`,
        })
        window.open(`mailto:${contact.correo}`, '_blank')
        break
      case 'call':
        toast({
          title: "Llamar",
          description: `Iniciando llamada a ${contact.telefono || contact.telefono_whatsapp}`,
        })
        if (contact.telefono || contact.telefono_whatsapp) {
          window.open(`tel:${contact.telefono || contact.telefono_whatsapp}`, '_self')
        }
        break
      case 'task':
        toast({
          title: "Crear tarea",
          description: "Funcionalidad de tareas próximamente disponible",
        })
        break
      case 'meeting':
        toast({
          title: "Programar reunión",
          description: "Funcionalidad de reuniones próximamente disponible",
        })
        break
      case 'more':
        toast({
          title: "Más opciones",
          description: "Funcionalidades adicionales próximamente disponibles",
        })
        break
    }
  }

  // Obtener icono según tipo de actividad
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'note': return <MessageSquare className="h-4 w-4" />
      case 'call': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'meeting': return <Calendar className="h-4 w-4" />
      case 'task': return <CheckSquare className="h-4 w-4" />
      case 'lifecycle_change': return <Users className="h-4 w-4" />
      case 'form_submission': return <Edit3 className="h-4 w-4" />
      case 'contact_created': return <User className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Obtener color del badge según estado
  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "ganado": return "default"
      case "contactado": return "default"
      case "interesado": return "secondary"
      case "seguimiento": return "secondary"
      case "propuesta": return "secondary"
      case "negociacion": return "secondary"
      case "perdido": return "destructive"
      case "descartado": return "outline"
      case "no contactado": return "outline"
      default: return "outline"
    }
  }

  // Componente para campo editable
  const EditableField = ({ field, label, value, type = "text" }: { field: string; label: string; value: any; type?: string }) => {
    const isEditing = editingField === field
    const displayValue = String(value || 'No especificado')

    if (isEditing) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
          <div className="flex gap-2">
            {type === "select" && field === "estado" ? (
              <Select value={editingValue} onValueChange={handleFieldChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={editingValue}
                onChange={(e) => handleFieldChange(e.target.value)}
                className="flex-1"
                type={type}
              />
            )}
            <Button 
              size="sm" 
              onClick={saveField}
              disabled={!hasChanges || saving}
            >
              {saving ? "..." : "✓"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={cancelEditing}
              disabled={saving}
            >
              ✕
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors group"
        onClick={() => startEditing(field, value)}
      >
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center justify-between">
          <p className="text-sm">{displayValue}</p>
          <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-1">
      <div className="bg-background border rounded-lg shadow-xl w-full max-w-[98vw] h-[98vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              ← Volver
            </Button>
            <h1 className="text-2xl font-bold">Vista del Contacto</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar izquierdo - Información del contacto */}
          <div className="w-80 border-r bg-muted/30 p-6 overflow-y-auto">
            {/* Avatar y nombre */}
            <div className="text-center mb-6">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
                  {getInitials(contact.nombre, contact.apellido)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{contact.nombre} {contact.apellido}</h2>
              <p className="text-muted-foreground">{contact.correo}</p>
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-16"
                onClick={() => handleQuickAction('note')}
              >
                <MessageSquare className="h-4 w-4 mb-1" />
                <span className="text-xs">Nota</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-16"
                onClick={() => handleQuickAction('email')}
              >
                <Mail className="h-4 w-4 mb-1" />
                <span className="text-xs">Correo</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-16"
                onClick={() => handleQuickAction('call')}
              >
                <Phone className="h-4 w-4 mb-1" />
                <span className="text-xs">Llamada</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-16"
                onClick={() => handleQuickAction('task')}
              >
                <CheckSquare className="h-4 w-4 mb-1" />
                <span className="text-xs">Tarea</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-16"
                onClick={() => handleQuickAction('meeting')}
              >
                <Calendar className="h-4 w-4 mb-1" />
                <span className="text-xs">Reunión</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-16"
                onClick={() => handleQuickAction('more')}
              >
                <MoreVertical className="h-4 w-4 mb-1" />
                <span className="text-xs">Más</span>
              </Button>
            </div>

            {/* Información del contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acerca de este objeto Contacto</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Haz clic en cualquier campo para editarlo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 group">
                <EditableField field="nombre" label="Nombre" value={contact.nombre} />
                <EditableField field="apellido" label="Apellidos" value={contact.apellido} />
                <EditableField field="correo" label="Correo" value={contact.correo} type="email" />
                <EditableField field="telefono" label="Teléfono" value={contact.telefono} type="tel" />
                <EditableField field="telefono_whatsapp" label="WhatsApp" value={contact.telefono_whatsapp} type="tel" />
                <EditableField field="estado" label="Estado del Lead" value={contact.estado} type="select" />
                <EditableField field="programa_interes" label="Programa de Interés" value={contact.programa_interes} />
                <EditableField field="utm_source" label="UTM Source" value={contact.utm_source} />
                <EditableField field="utm_campaign" label="UTM Campaign" value={contact.utm_campaign} />
                
                {/* Campos de solo lectura */}
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Propietario del contacto</label>
                      <p className="text-sm">{contact.assigned_user?.nombre || 'Usuario actual'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de creación</label>
                      <p className="text-sm">{contact.fecha_insercion ? new Date(contact.fecha_insercion).toLocaleDateString('es-ES') : 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Última actualización</label>
                      <p className="text-sm">{contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('es-ES') : 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Secciones colapsables */}
            <div className="mt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-between">
                <span>Suscripciones a comunicaciones</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between">
                <span>Actividad del sitio web</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Centro - Timeline de actividades */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Barra de búsqueda y filtros */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar actividad"
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar actividad ({activities.length})
                </Button>
                <Button variant="outline" size="sm">
                  Todos los usuarios
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1">
                {[
                  { id: 'activity', label: 'Actividad' },
                  { id: 'notes', label: 'Notas' },
                  { id: 'emails', label: 'Correos' },
                  { id: 'calls', label: 'Llamadas' },
                  { id: 'tasks', label: 'Tareas' },
                  { id: 'meetings', label: 'Reuniones' }
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <ScrollArea className="flex-1 p-6 max-h-[calc(98vh-200px)]">
              <div className="space-y-6">
                {/* Agregar nueva nota */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(contact.nombre, contact.apellido)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Agregar una nota..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar nota
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de actividades */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">noviembre 2024</h3>
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{activity.title}</h4>
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        {activity.user && (
                          <p className="text-xs text-gray-400 mt-1">por {activity.user}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar derecho - Información avanzada */}
          <div className="w-80 border-l bg-muted/30 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Información avanzada</h3>
              <Button variant="ghost" size="sm">
                Personalizar
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full mb-4">
              Contraer todo
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            
            {/* Contenido de información avanzada */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Estado del Contacto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Estado actual:</span>
                      <Badge variant={getEstadoBadgeVariant(contact.estado)}>
                        {contact.estado || 'No especificado'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Puede editar:</span>
                      <span className="text-sm">{contact.can_edit ? 'Sí' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Puede eliminar:</span>
                      <span className="text-sm">{contact.can_delete ? 'Sí' : 'No'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Propiedades personalizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.campos_adicionales && Object.keys(contact.campos_adicionales).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(contact.campos_adicionales).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground">{key}:</span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay propiedades personalizadas configuradas.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total actividades:</span>
                      <span className="text-sm">{activities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Notas:</span>
                      <span className="text-sm">{activities.filter(a => a.type === 'note').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Última actividad:</span>
                      <span className="text-sm">{activities[0]?.timestamp.split(' ')[0] || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
