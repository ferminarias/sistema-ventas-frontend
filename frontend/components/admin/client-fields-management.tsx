"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Eye,
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  Upload,
  FileText,
  List
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { clientFieldsService, type ClientField } from "@/services/client-fields-service"
import { DynamicField } from "@/components/ui/dynamic-field"

interface ClientFieldsManagementProps {
  clientId: number
  clientName: string
}

const fieldSchema = z.object({
  id: z.string().min(1, "ID es requerido").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "ID debe comenzar con letra y contener solo letras, números y _"),
  label: z.string().min(1, "Label es requerido"),
  type: z.enum(['text', 'number', 'email', 'tel', 'date', 'file', 'textarea', 'select']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  help_text: z.string().optional(),
  options: z.string().optional(), // Para campos select, separados por comas
})

type FieldFormData = z.infer<typeof fieldSchema>

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  email: Mail,
  tel: Phone,
  date: Calendar,
  file: Upload,
  textarea: FileText,
  select: List,
}

const fieldTypeLabels = {
  text: 'Texto',
  number: 'Número',
  email: 'Email',
  tel: 'Teléfono',
  date: 'Fecha',
  file: 'Archivo',
  textarea: 'Texto largo',
  select: 'Lista desplegable',
}

export function ClientFieldsManagement({ clientId, clientName }: ClientFieldsManagementProps) {
  const [fields, setFields] = useState<ClientField[]>([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<ClientField | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      id: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      help_text: '',
      options: '',
    }
  })

  // Cargar campos al montar el componente
  useEffect(() => {
    loadFields()
  }, [clientId])

  const loadFields = async () => {
    try {
      setLoading(true)
      const clientFields = await clientFieldsService.getClientFields(clientId)
      setFields(clientFields)
    } catch (error) {
      console.error('Error loading fields:', error)
      toast({
        title: "Error",
        description: "Error al cargar los campos del cliente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddField = () => {
    setEditingField(null)
    form.reset({
      id: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      help_text: '',
      options: '',
    })
    setIsDialogOpen(true)
  }

  const handleEditField = (field: ClientField) => {
    if (field.default) {
      toast({
        title: "Campo no editable",
        description: "Los campos por defecto no se pueden editar completamente",
        variant: "destructive",
      })
      return
    }
    
    setEditingField(field)
    form.reset({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      options: field.options?.join(', ') || '',
    })
    setIsDialogOpen(true)
  }

  const handleDeleteField = async (field: ClientField) => {
    if (field.default) {
      toast({
        title: "Campo no eliminable",
        description: "Los campos por defecto no se pueden eliminar",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`¿Está seguro de eliminar el campo "${field.label}"?`)) {
      return
    }

    try {
      await clientFieldsService.deleteClientField(clientId, field.id)
      toast({
        title: "Campo eliminado",
        description: `El campo "${field.label}" ha sido eliminado`,
      })
      loadFields()
    } catch (error) {
      console.error('Error deleting field:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el campo",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: FieldFormData) => {
    try {
      const fieldData = {
        ...data,
        options: data.type === 'select' && data.options 
          ? data.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
          : undefined
      }

      if (editingField) {
        await clientFieldsService.updateClientField(clientId, editingField.id, fieldData)
        toast({
          title: "Campo actualizado",
          description: `El campo "${data.label}" ha sido actualizado`,
        })
      } else {
        await clientFieldsService.addClientField(clientId, fieldData)
        toast({
          title: "Campo agregado",
          description: `El campo "${data.label}" ha sido agregado`,
        })
      }

      setIsDialogOpen(false)
      loadFields()
    } catch (error) {
      console.error('Error saving field:', error)
      toast({
        title: "Error",
        description: "Error al guardar el campo",
        variant: "destructive",
      })
    }
  }

  const renderFieldPreview = () => {
    const watchedValues = form.watch()
    if (!watchedValues.id || !watchedValues.label) return null

    const previewField: ClientField = {
      id: watchedValues.id,
      label: watchedValues.label,
      type: watchedValues.type,
      required: watchedValues.required,
      default: false,
      order: 999,
      placeholder: watchedValues.placeholder,
      help_text: watchedValues.help_text,
      options: watchedValues.type === 'select' && watchedValues.options 
        ? watchedValues.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
        : undefined
    }

    return (
      <div className="mt-4 p-4 border rounded-lg bg-muted/50">
        <h4 className="text-sm font-medium mb-2">Vista previa:</h4>
        <DynamicField 
          field={previewField} 
          control={form.control}
          disabled={true}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Cargando campos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Campos de {clientName}</h2>
        <p>Gestión de campos dinámicos</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campos de {clientName}</h2>
          <p className="text-muted-foreground">
            Gestiona los campos personalizados para las ventas de este cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Ocultar' : 'Mostrar'} Preview
          </Button>
          <Button onClick={handleAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Campo
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {fields.map((field, index) => {
          const IconComponent = fieldTypeIcons[field.type]
          return (
            <Card key={field.id} className={field.default ? 'bg-muted/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">Requerido</Badge>
                        )}
                        {field.default && (
                          <Badge variant="secondary" className="text-xs">Por defecto</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {fieldTypeLabels[field.type]} • ID: {field.id}
                      </div>
                      {field.help_text && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {field.help_text}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditField(field)}
                      disabled={field.default}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field)}
                      disabled={field.default}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {fields.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No hay campos configurados para este cliente.
            </p>
            <Button className="mt-4" onClick={handleAddField}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer campo
            </Button>
          </CardContent>
        </Card>
      )}

      {showPreview && fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Formulario</CardTitle>
            <CardDescription>
              Así se verá el formulario de Nueva Venta para este cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map(field => (
                <DynamicField
                  key={field.id}
                  field={field}
                  control={form.control}
                  disabled={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Editar Campo' : 'Agregar Campo'}
            </DialogTitle>
            <DialogDescription>
              {editingField 
                ? 'Modifica la configuración del campo existente'
                : 'Configura un nuevo campo personalizado para este cliente'
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID del Campo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ej: legajo, dni, codigo" 
                          disabled={!!editingField}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiqueta</FormLabel>
                      <FormControl>
                        <Input placeholder="ej: Número de Legajo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Campo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(fieldTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Campo Requerido</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          El usuario debe completar este campo
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="placeholder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ej: Ingrese su número de legajo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="help_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Ayuda (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Texto adicional para ayudar al usuario a completar el campo"
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'select' && (
                <FormField
                  control={form.control}
                  name="options"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opciones (separadas por comas)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Opción 1, Opción 2, Opción 3"
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {renderFieldPreview()}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingField ? 'Actualizar' : 'Agregar'} Campo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 