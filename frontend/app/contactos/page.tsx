"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Download, Upload, MoreVertical, Edit, Trash2, Eye, UserCheck, UserX, AlertTriangle, Star, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { contactsService, type Contact, type ContactFilters, type ContactStats } from "@/services/contacts-service"
import { useAuth } from "@/contexts/auth-context"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog"
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog"
import { ContactFieldsDialog } from "@/components/contacts/contact-fields-dialog"

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

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case "ganado": return <UserCheck className="h-4 w-4" />
    case "contactado": return <Star className="h-4 w-4" />
    case "interesado": return <Star className="h-4 w-4" />
    case "seguimiento": return <Star className="h-4 w-4" />
    case "propuesta": return <Star className="h-4 w-4" />
    case "negociacion": return <AlertTriangle className="h-4 w-4" />
    case "perdido": return <UserX className="h-4 w-4" />
    case "descartado": return <UserX className="h-4 w-4" />
    case "no contactado": return <AlertTriangle className="h-4 w-4" />
    default: return null
  }
}

export default function ContactosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(50)
  
  // Estados de filtros
  const [filters, setFilters] = useState<ContactFilters>({
    page: 1,
    per_page: 50,
    sort_by: 'updated_at',
    sort_order: 'desc'
  })
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [managingFieldsContact, setManagingFieldsContact] = useState<Contact | null>(null)
  const [exporting, setExporting] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadContacts()
    loadStats()
  }, [filters])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await contactsService.getContacts(filters)
      setContacts(response.contacts)
      setTotalPages(response.total_pages)
      setCurrentPage(response.page)
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast({
        title: "Error",
        description: "Error al cargar contactos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await contactsService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }))
  }

  const handleFilterChange = (key: keyof ContactFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleDelete = async (contact: Contact) => {
    try {
      await contactsService.deleteContact(contact.id)
      toast({
        title: "Éxito",
        description: "Contacto eliminado correctamente",
      })
      loadContacts()
      loadStats()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: "Error",
        description: "Error al eliminar contacto",
        variant: "destructive",
      })
    } finally {
      setDeletingContact(null)
    }
  }

  const handleExport = async (format: 'excel' | 'csv' = 'excel') => {
    try {
      setExporting(true)
      const blob = await contactsService.exportContacts({
        ...filters,
        format,
        include_fields: true
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contactos_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Éxito",
        description: `Contactos exportados en formato ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('Error exporting contacts:', error)
      toast({
        title: "Error",
        description: "Error al exportar contactos",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const onContactCreated = () => {
    loadContacts()
    loadStats()
    setShowCreateDialog(false)
  }

  const onContactUpdated = () => {
    loadContacts()
    loadStats()
    setEditingContact(null)
  }

  const onContactFieldsUpdated = () => {
    loadContacts()
    loadStats()
    setManagingFieldsContact(null)
  }

  const onContactsImported = () => {
    loadContacts()
    loadStats()
    setShowImportDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de datos de contactos y clientes potenciales
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Exportar a Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Exportar a CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contactos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_contacts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganados</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ganado}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Seguimiento</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.seguimiento}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interesados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interesado}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select onValueChange={(value) => handleFilterChange('estado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ESTADOS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Programa de Interés</label>
              <Input
                placeholder="Filtrar por programa..."
                onChange={(e) => handleFilterChange('programa_interes', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select onValueChange={(value) => handleFilterChange('sort_by', value)} defaultValue="updated_at">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">Última actualización</SelectItem>
                  <SelectItem value="fecha_insercion">Fecha de creación</SelectItem>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="apellido">Apellido</SelectItem>
                  <SelectItem value="correo">Correo</SelectItem>
                  <SelectItem value="estado">Estado</SelectItem>
                  <SelectItem value="programa_interes">Programa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de contactos */}
      <Card>
        <CardHeader>
          <CardTitle>Contactos ({stats?.total_contacts || 0})</CardTitle>
          <CardDescription>
            Lista de todos los contactos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead>UTM Source</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Cargando contactos...
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No se encontraron contactos
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {contact.nombre} {contact.apellido}
                          </div>
                          {contact.programa_interes && (
                            <div className="text-sm text-muted-foreground">
                              {contact.programa_interes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{contact.correo || '-'}</TableCell>
                      <TableCell>{contact.telefono || '-'}</TableCell>
                      <TableCell>{contact.telefono_whatsapp || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getEstadoIcon(contact.estado)}
                          <Badge variant={getEstadoBadgeVariant(contact.estado)}>
                            {contact.estado}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {contact.programa_interes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {contact.utm_source || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.assigned_user ? (
                          <div className="text-sm">
                            {contact.assigned_user.nombre} {contact.assigned_user.apellido}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(contact.updated_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingContact(contact)}
                              disabled={!contact.can_edit}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setManagingFieldsContact(contact)}
                              disabled={!contact.can_edit}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Campos Adicionales
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingContact(contact)}
                              disabled={!contact.can_delete}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onContactCreated={onContactCreated}
      />

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          onContactUpdated={onContactUpdated}
        />
      )}

      <ImportContactsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onContactsImported={onContactsImported}
      />

      {managingFieldsContact && (
        <ContactFieldsDialog
          contact={managingFieldsContact}
          open={!!managingFieldsContact}
          onOpenChange={(open) => !open && setManagingFieldsContact(null)}
          onContactUpdated={onContactFieldsUpdated}
        />
      )}

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el contacto{' '}
              <strong>
                {deletingContact?.nombre} {deletingContact?.apellido}
              </strong>{' '}
              del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContact && handleDelete(deletingContact)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
