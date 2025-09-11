"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Download, 
  Upload, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Star,
  Eye,
  EyeOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { contactsService, type Contact, type ContactFilters, type ContactStats } from "@/services/contacts-service"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog"
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog"
import { ContactFieldsDialog } from "@/components/contacts/contact-fields-dialog"
import { ContactDetailView } from "@/components/contacts/contact-detail-view"

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

interface AdvancedContactsTableProps {
  clientId: number
  clientName: string
}

type ColumnDef = {
  id: string
  label: string
  accessor: (contact: Contact) => string
  isCustom?: boolean
}

export function AdvancedContactsTable({ clientId, clientName }: AdvancedContactsTableProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Estados de datos
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState("50")
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("updated_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  
  // Estados de UI
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [managingFieldsContact, setManagingFieldsContact] = useState<Contact | null>(null)
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
  const [exporting, setExporting] = useState(false)
  
  // Edición inline
  const [editingCell, setEditingCell] = useState<{ contactId: number; columnId: string } | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  
  // Estados de gestión de columnas
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportColumns, setExportColumns] = useState<string[]>([])
  const [dynamicFieldDefs, setDynamicFieldDefs] = useState<Array<{id:string;label:string;type:string;options?:string[]}>>([])
  
  // Definición de columnas base
  const BASE_COLUMNS: ColumnDef[] = [
    { id: "id", label: "ID", accessor: c => String(c.id ?? "") },
    { id: "nombre", label: "Nombre", accessor: c => String(c.nombre ?? "") },
    { id: "apellido", label: "Apellido", accessor: c => String(c.apellido ?? "") },
    { id: "correo", label: "Email", accessor: c => String(c.correo ?? "") },
    { id: "telefono", label: "Teléfono", accessor: c => String(c.telefono ?? "") },
    { id: "telefono_whatsapp", label: "WhatsApp", accessor: c => String(c.telefono_whatsapp ?? "") },
    { id: "estado", label: "Estado", accessor: c => String(c.estado ?? "") },
    { id: "programa_interes", label: "Programa", accessor: c => String(c.programa_interes ?? "") },
    { id: "utm_source", label: "UTM Source", accessor: c => String(c.utm_source ?? "") },
    { id: "utm_campaign", label: "UTM Campaign", accessor: c => String(c.utm_campaign ?? "") },
    { id: "fecha_insercion", label: "Fecha Creación", accessor: c => String(c.fecha_insercion ?? "") },
    { id: "updated_at", label: "Última Actualización", accessor: c => String(c.updated_at ?? "") },
  ]

  // Columnas dinámicas basadas en campos adicionales
  const CUSTOM_COLUMNS: ColumnDef[] = Array.isArray(dynamicFieldDefs) ? dynamicFieldDefs
    .map(def => ({
      id: `campos_adicionales.${def.id}`,
      label: def.label || def.id,
      accessor: (c: Contact) => {
        const raw = (c.campos_adicionales || {})[def.id]
        if (raw == null) return ""
        if (def.type === 'date') return String(raw)
        if (def.type === 'select' && def.options && def.options.length) return String(raw)
        return typeof raw === 'string' ? raw : JSON.stringify(raw)
      },
      isCustom: true,
    })) : []

  const ALL_COLUMNS: ColumnDef[] = [...BASE_COLUMNS, ...CUSTOM_COLUMNS]

  // Columnas editables inline (base)
  const EDITABLE_COLUMNS = new Set([
    "nombre",
    "apellido",
    "correo",
    "telefono",
    "telefono_whatsapp",
    "estado",
    "programa_interes",
  ])

  // Gestión de preferencias de columnas
  const storageKey = `contactsTable:columns:v1:${user?.id || "anonymous"}:${clientId}`
  
  const loadPrefs = (): { visible: string[]; order: string[] } | null => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  
  const savePrefs = (visible: string[], order: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ visible, order }))
    } catch {}
  }

  const prefs = loadPrefs()
  const defaultVisible = prefs?.visible || BASE_COLUMNS.slice(0, 8).map(c => c.id) // Mostrar las primeras 8 columnas por defecto
  const defaultOrder = prefs?.order || ALL_COLUMNS.map(c => c.id)
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder)
  const [dialogVisible, setDialogVisible] = useState<string[]>(defaultVisible)
  const [dialogOrder, setDialogOrder] = useState<string[]>(defaultOrder)

  // Funciones de gestión de columnas
  const moveColumn = (id: string, direction: "up" | "down") => {
    setDialogOrder(prev => {
      const idx = prev.indexOf(id)
      if (idx === -1) return prev
      const next = [...prev]
      const swapWith = direction === "up" ? idx - 1 : idx + 1
      if (swapWith < 0 || swapWith >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[swapWith]
      next[swapWith] = tmp
      return next
    })
  }

  const toggleColumnVisibility = (columnId: string) => {
    setDialogVisible(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const saveColumnPreferences = () => {
    setVisibleColumns(dialogVisible)
    setColumnOrder(dialogOrder)
    savePrefs(dialogVisible, dialogOrder)
    setManageColumnsOpen(false)
    toast({
      title: "Preferencias guardadas",
      description: "La configuración de columnas se ha actualizado",
    })
  }

  const resetColumnPreferences = () => {
    const resetVisible = BASE_COLUMNS.slice(0, 8).map(c => c.id)
    const resetOrder = ALL_COLUMNS.map(c => c.id)
    setDialogVisible(resetVisible)
    setDialogOrder(resetOrder)
  }

  // Columnas ordenadas y visibles
  const orderedColumns = columnOrder
    .map(id => ALL_COLUMNS.find(c => c.id === id))
    .filter((c): c is ColumnDef => !!c)
  const renderColumns = orderedColumns.filter(c => visibleColumns.includes(c.id))

  // Cargar datos
  // Debug: Verificar autenticación para contactos
  const debugAuth = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const authUser = localStorage.getItem('auth_user')
    
    console.log('🔐 DEBUG AUTH CONTACTOS:')
    console.log('- Token existe:', !!token)
    console.log('- Token length:', token ? token.length : 0)
    console.log('- Auth user existe:', !!authUser)
    console.log('- User from context:', user)
    console.log('- Client ID:', clientId)
    
    if (token) {
      try {
        // Verificar si el token no está expirado (básico)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Date.now() / 1000
        console.log('- Token expira en:', new Date(payload.exp * 1000))
        console.log('- Token válido:', payload.exp > now)
      } catch (e) {
        console.log('- Error al parsear token:', e)
      }
    }
  }

  useEffect(() => {
    if (clientId) {
      debugAuth() // Debug de autenticación
      loadContacts()
      loadStats()
      loadDynamicFields()
    }
  }, [clientId, searchTerm, sortBy, sortOrder, estadoFilter, currentPage, perPage])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const filters: ContactFilters = {
        page: currentPage,
        per_page: parseInt(perPage),
        sort_by: sortBy,
        sort_order: sortOrder as 'asc' | 'desc'
      }

      if (searchTerm) filters.search = searchTerm
      if (estadoFilter && estadoFilter !== "all") filters.estado = estadoFilter

      const response = await contactsService.getContacts(clientId, filters)
      setContacts(response.contacts)
      setTotalPages(response.total_pages)
    } catch (error: any) {
      console.error('Error loading contacts:', error)
      
      // Detectar si es un error de CORS
      if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
        toast({
          title: "⚠️ Sistema de Contactos en Mantenimiento",
          description: "Los endpoints de contactos necesitan configuración CORS en Railway. Contacta al administrador del sistema.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Error al cargar contactos",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      console.log('📊 Cargando estadísticas para cliente:', clientId)
      const statsData = await contactsService.getStats(clientId)
      console.log('📊 Estadísticas recibidas:', statsData)
      setStats(statsData)
    } catch (error: any) {
      console.error('Error loading stats:', error)
      
      // Detectar si es un error de CORS y mostrar mensaje específico
      if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
        console.warn('📊 Stats endpoint bloqueado por CORS - configurar en Railway')
      }
    }
  }

  const loadDynamicFields = async () => {
    try {
      console.log('🔧 Cargando campos dinámicos...')
      const fields = await contactsService.getFields()
      console.log('🔧 Campos dinámicos recibidos:', fields)
      
      // Verificar si fields es un array o un objeto
      let fieldsArray = []
      if (Array.isArray(fields)) {
        fieldsArray = fields
      } else if (fields && typeof fields === 'object') {
        // Si es un objeto, convertir a array
        fieldsArray = Object.values(fields).filter(field => field && typeof field === 'object')
      }
      console.log('🔧 Campos procesados como array:', fieldsArray)
      
      setDynamicFieldDefs(fieldsArray.map(f => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options
      })))
    } catch (error) {
      console.error('Error loading dynamic fields:', error)
    }
  }

  // Manejadores de eventos
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (!contact.can_delete) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para eliminar este contacto",
        variant: "destructive",
      })
      return
    }

    try {
      await contactsService.deleteContact(clientId, contact.id)
      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado exitosamente",
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

  const handleExport = async () => {
    try {
      setExporting(true)
      const filters: ContactFilters = {}
      if (searchTerm) filters.search = searchTerm
      if (estadoFilter && estadoFilter !== "all") filters.estado = estadoFilter

      const blob = await contactsService.exportContacts(clientId, {
        ...filters,
        format: 'excel',
        include_fields: true,
        columns: exportColumns.length ? exportColumns : renderColumns.map(c => c.id)
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contactos-${clientName}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: "Los contactos han sido exportados a Excel",
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

  const formatCellValue = (column: ColumnDef, contact: Contact) => {
    const value = column.accessor(contact)
    
    // Formateo especial para ciertas columnas
    if (column.id === 'estado') {
      return (
        <Badge variant={getEstadoBadgeVariant(value)}>
          <div className="flex items-center gap-1">
            {getEstadoIcon(value)}
            {ESTADOS_OPTIONS.find(e => e.value === value)?.label || value}
          </div>
        </Badge>
      )
    }

    if (column.id === 'fecha_insercion' || column.id === 'updated_at') {
      const date = new Date(value)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return value || '-'
  }

  const beginInlineEdit = (contact: Contact, column: ColumnDef) => {
    if (!EDITABLE_COLUMNS.has(column.id)) return
    setEditingCell({ contactId: contact.id, columnId: column.id })
    setEditingValue(column.accessor(contact) || "")
  }

  const saveInlineEdit = async (contact: Contact, column: ColumnDef) => {
    try {
      const payload: Partial<Contact> = {}
      ;(payload as any)[column.id] = editingValue
      // Normalización de tipos simples
      if (column.id === 'telefono' || column.id === 'telefono_whatsapp') {
        ;(payload as any)[column.id] = editingValue?.trim()
      }
      await contactsService.updateContact(clientId, contact.id, payload)
      // Refrescar en memoria
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, ...(payload as any) } : c))
      setEditingCell(null)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats?.total_contacts || 0}</div>
            <div className="text-sm text-muted-foreground">Total Contactos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats?.ganado || 0}</div>
            <div className="text-sm text-muted-foreground">Ganados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {(stats?.interesado || 0) + (stats?.seguimiento || 0) + (stats?.propuesta || 0) + (stats?.negociacion || 0)}
            </div>
            <div className="text-sm text-muted-foreground">En Proceso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats?.no_contactado || 0}</div>
            <div className="text-sm text-muted-foreground">Sin Contactar</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Contactos de {clientName}</CardTitle>
              <CardDescription>
                Gestiona los contactos y su información
              </CardDescription>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-[200px]"
                />
              </div>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ESTADOS_OPTIONS.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setManageColumnsOpen(true)}
                title="Gestionar columnas"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportColumns(renderColumns.map(c => c.id))
                  setExportDialogOpen(true)
                }}
                disabled={exporting}
                title="Exportar contactos"
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                title="Importar contactos"
              >
                <Upload className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                title="Crear nuevo contacto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {renderColumns.map((column) => (
                    <TableHead 
                      key={column.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort(column.id)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {sortBy === column.id && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={renderColumns.length + 1} className="text-center py-8">
                      Cargando contactos...
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={renderColumns.length + 1} className="text-center py-8">
                      No se encontraron contactos
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      {renderColumns.map((column) => (
                        <TableCell 
                          key={column.id}
                          className={`${EDITABLE_COLUMNS.has(column.id) ? 'group/td relative' : ''}`}
                          onClick={() => beginInlineEdit(contact, column)}
                        >
                          {editingCell && editingCell.contactId === contact.id && editingCell.columnId === column.id ? (
                            column.id === 'estado' ? (
                              <Select 
                                value={editingValue}
                                onValueChange={(v) => { 
                                  setEditingValue(v);
                                  // Guardar inmediatamente al elegir opción
                                  setTimeout(() => saveInlineEdit(contact, column), 0)
                                }}
                              >
                                <SelectTrigger className="h-8 w-[160px]" />
                                <SelectContent>
                                  {ESTADOS_OPTIONS.map(e => (
                                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={editingValue}
                                autoFocus
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => saveInlineEdit(contact, column)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(contact, column)
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className="h-8"
                              />
                            )
                          ) : (
                            <div 
                              className={`${EDITABLE_COLUMNS.has(column.id) ? 'pr-6' : ''}`}
                              onMouseDown={(e) => {
                                // Evitar seleccionar texto al intentar editar
                                if (EDITABLE_COLUMNS.has(column.id)) e.preventDefault()
                              }}
                            >
                              {formatCellValue(column, contact)}
                              {EDITABLE_COLUMNS.has(column.id) && (
                                <button
                                  className="opacity-0 group-hover/td:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  onClick={() => beginInlineEdit(contact, column)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingContact(contact)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            {contact.can_edit && (
                              <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setManagingFieldsContact(contact)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Campos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {contact.can_delete && (
                              <DropdownMenuItem 
                                onClick={() => setDeletingContact(contact)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
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
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Select value={perPage} onValueChange={setPerPage}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de exportación */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar contactos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Selecciona las columnas a incluir en el archivo.</div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-auto border rounded-md p-2">
              {renderColumns.map(col => (
                <label key={col.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={exportColumns.includes(col.id)}
                    onCheckedChange={(v: any) => {
                      setExportColumns(prev => v ? [...new Set([...prev, col.id])] : prev.filter(id => id !== col.id))
                    }}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setExportDialogOpen(false); handleExport(); }} disabled={exporting}>
              {exporting ? 'Exportando…' : 'Exportar XLSX'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestión de columnas */}
      <Dialog open={manageColumnsOpen} onOpenChange={setManageColumnsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Columnas</DialogTitle>
            <DialogDescription>
              Selecciona qué columnas mostrar y configura su orden
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Configuración de Columnas</span>
              <Button variant="outline" size="sm" onClick={resetColumnPreferences}>
                Restablecer
              </Button>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {dialogOrder.map((columnId, index) => {
                const column = ALL_COLUMNS.find(c => c.id === columnId)
                if (!column) return null

                const isVisible = dialogVisible.includes(columnId)
                const isFirst = index === 0
                const isLast = index === dialogOrder.length - 1

                return (
                  <div key={columnId} className="flex items-center gap-2 p-2 border rounded">
                    <Checkbox
                      checked={isVisible}
                      onCheckedChange={() => toggleColumnVisibility(columnId)}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{column.label}</span>
                      {column.isCustom && (
                        <Badge variant="outline" className="ml-2 text-xs">Custom</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isFirst}
                        onClick={() => moveColumn(columnId, "up")}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLast}
                        onClick={() => moveColumn(columnId, "down")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    {isVisible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageColumnsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveColumnPreferences}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogos */}
      {showCreateDialog && (
        <CreateContactDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          clientId={clientId}
          onSuccess={() => {
            loadContacts()
            loadStats()
            setShowCreateDialog(false)
          }}
        />
      )}

      {editingContact && (
        <EditContactDialog
          open={!!editingContact}
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          clientId={clientId}
          onSuccess={() => {
            loadContacts()
            loadStats()
            setEditingContact(null)
          }}
        />
      )}

      {showImportDialog && (
        <ImportContactsDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          clientId={clientId}
          onSuccess={() => {
            loadContacts()
            loadStats()
            setShowImportDialog(false)
          }}
        />
      )}

      {managingFieldsContact && (
        <ContactFieldsDialog
          open={!!managingFieldsContact}
          contact={managingFieldsContact}
          onClose={() => setManagingFieldsContact(null)}
          onSuccess={() => {
            loadContacts()
            setManagingFieldsContact(null)
          }}
        />
      )}

      {/* Dialog de crear contacto */}
      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        clientId={clientId}
        onContactCreated={() => {
          loadContacts()
          loadStats()
          setShowCreateDialog(false)
        }}
      />

      {/* Dialog de editar contacto */}
      {editingContact && (
        <EditContactDialog
          open={!!editingContact}
          onOpenChange={() => setEditingContact(null)}
          contact={editingContact}
          clientId={clientId}
          onContactUpdated={() => {
            loadContacts()
            loadStats()
            setEditingContact(null)
          }}
        />
      )}

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deletingContact} onOpenChange={() => setDeletingContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto "{deletingContact?.nombre} {deletingContact?.apellido}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContact && handleDeleteContact(deletingContact)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vista detallada del contacto */}
      {viewingContact && (
        <ContactDetailView
          contact={viewingContact}
          clientId={clientId}
          onClose={() => setViewingContact(null)}
          onUpdate={(updatedContact) => {
            setContacts(prev => 
              prev.map(c => c.id === updatedContact.id ? updatedContact : c)
            )
            setViewingContact(updatedContact)
          }}
        />
      )}
    </div>
  )
}
