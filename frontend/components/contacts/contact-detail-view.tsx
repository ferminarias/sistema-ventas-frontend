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
import { type Contact } from "@/services/contacts-service"

interface ContactDetailViewProps {
  contact: Contact
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

export function ContactDetailView({ contact, onClose, onUpdate }: ContactDetailViewProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchActivity, setSearchActivity] = useState("")
  const [activeTab, setActiveTab] = useState<'activity' | 'notes' | 'emails' | 'calls' | 'tasks' | 'meetings'>('activity')

  // Generar iniciales del contacto
  const getInitials = (name: string, lastName: string) => {
    return `${name?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  // Cargar actividades del contacto (mock por ahora)
  useEffect(() => {
    // Simular carga de actividades
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'lifecycle_change',
        title: 'Etapa del ciclo de vida actualizada',
        description: 'La etapa del ciclo de vida de este contacto se actualizó en Oportunidad.',
        timestamp: '20 de nov. de 2024 a la(s) 14:26 GMT-3',
        user: 'Sistema'
      },
      {
        id: '2',
        type: 'form_submission',
        title: 'Formulario enviado',
        description: `${contact.nombre} ${contact.apellido} envió Formulario Turismo en Turismo | Educación Continua Anáhuac.`,
        timestamp: '19 de nov. de 2024 a la(s) 10:15 GMT-3',
        user: 'Sistema'
      },
      {
        id: '3',
        type: 'contact_created',
        title: 'Contacto creado',
        description: 'Contacto creado a partir de Tráfico directo de www.anahuac.mx/mexico/educacioncontinua/turismo',
        timestamp: '19 de nov. de 2024 a la(s) 10:14 GMT-3',
        user: 'Sistema'
      }
    ]
    setActivities(mockActivities)
  }, [contact])

  // Agregar nueva nota
  const handleAddNote = () => {
    if (!newNote.trim()) return

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'note',
      title: 'Nota agregada',
      description: newNote,
      timestamp: new Date().toLocaleString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      user: 'Usuario actual'
    }

    setActivities(prev => [newActivity, ...prev])
    setNewNote("")
    toast({
      title: "Nota agregada",
      description: "La nota se ha guardado correctamente",
    })
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
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
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar izquierdo - Información del contacto */}
          <div className="w-80 border-r bg-gray-50 p-6">
            {/* Avatar y nombre */}
            <div className="text-center mb-6">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
                  {getInitials(contact.nombre, contact.apellido)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{contact.nombre} {contact.apellido}</h2>
              <p className="text-gray-600">{contact.correo}</p>
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button variant="outline" size="sm" className="flex flex-col h-16">
                <MessageSquare className="h-4 w-4 mb-1" />
                <span className="text-xs">Nota</span>
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-16">
                <Mail className="h-4 w-4 mb-1" />
                <span className="text-xs">Correo</span>
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-16">
                <Phone className="h-4 w-4 mb-1" />
                <span className="text-xs">Llamada</span>
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-16">
                <CheckSquare className="h-4 w-4 mb-1" />
                <span className="text-xs">Tarea</span>
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-16">
                <Calendar className="h-4 w-4 mb-1" />
                <span className="text-xs">Reunión</span>
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-16">
                <MoreVertical className="h-4 w-4 mb-1" />
                <span className="text-xs">Más</span>
              </Button>
            </div>

            {/* Información del contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acerca de este objeto Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Correo</label>
                  <p className="text-sm">{contact.correo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de móvil</label>
                  <p className="text-sm">{contact.telefono_whatsapp || contact.telefono || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Propietario del contacto</label>
                  <p className="text-sm">Usuario actual</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado del lead</label>
                  <Badge variant={getEstadoBadgeVariant(contact.estado)} className="mt-1">
                    {contact.estado || 'No especificado'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Programa de Interés</label>
                  <p className="text-sm">{contact.programa_interes || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Etapa de Negocio</label>
                  <p className="text-sm">Lead nuevo</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="text-sm">{contact.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Apellidos</label>
                  <p className="text-sm">{contact.apellido}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de teléfono</label>
                  <p className="text-sm">{contact.telefono || 'No especificado'}</p>
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
          <div className="flex-1 flex flex-col">
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
            <ScrollArea className="flex-1 p-6">
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
          <div className="w-80 border-l bg-gray-50 p-6">
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
                  <CardTitle className="text-sm">Propiedades personalizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">No hay propiedades personalizadas configuradas.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
