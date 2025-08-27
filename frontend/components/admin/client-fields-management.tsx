"use client"

import React, { useState, useEffect } from "react"
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
  type: z.enum(['text', 'number', 'email', 'tel', 'date', 'file', 'textarea', 'select', 'checkbox', 'radio']),
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
  checkbox: Type,
  radio: List,
}

const fieldTypeLabels = {
  text: 'Texto',
  number: 'Número',
  email: 'Email',
  tel: 'Teléfono',
  date: 'Fecha',
  file: 'Archivo/Imagen',
  textarea: 'Texto largo',
  select: 'Lista desplegable',
  checkbox: 'Casilla de verificación',
  radio: 'Botones de radio',
}

export function ClientFieldsManagement({ clientId, clientName }: ClientFieldsManagementProps) {
  const [fields, setFields] = useState<ClientField[]>([])
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<ClientField | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  // Debug log cuando cambia el estado de fields
  React.useEffect(() => {
    console.log(`🎨 ESTADO ACTUALIZADO - fields.length: ${fields.length}`)
    console.log(`🎨 Campos en estado:`, fields.map(f => `${f.id}:${f.label}`))
  }, [fields])

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
      console.log(`🔄 Iniciando carga de campos para cliente ${clientId}`)
      const clientFields = await clientFieldsService.getClientFields(clientId)
      console.log(`📊 Campos obtenidos del backend:`, clientFields)
      console.log(`📈 Cantidad total de campos:`, clientFields.length)
      console.log(`🔍 DETALLE DE CADA CAMPO:`)
      clientFields.forEach((field, index) => {
        console.log(`  ${index + 1}. ID: ${field.id}, Label: ${field.label}, Type: ${field.type}, Default: ${field.default}`)
      })
      
      setFields(clientFields)
      console.log(`✅ Estado actualizado con ${clientFields.length} campos`)
      
      return clientFields // Retornar los campos para verificación
      
    } catch (error) {
      console.error('❌ Error loading fields:', error)
      toast({
        title: "Error",
        description: "Error al cargar los campos del cliente",
        variant: "destructive",
      })
      return []
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
      console.log('🗑️ Deleting fieldId=', field.id)
      await clientFieldsService.deleteClientField(clientId, field.id)
      toast({
        title: "Campo eliminado",
        description: `El campo "${field.label}" ha sido eliminado`,
      })
      loadFields()
    } catch (error: any) {
      console.error('Error deleting field:', error)
      if (error && error.available_ids) {
        console.log('Available IDs desde backend:', error.available_ids)
      }
      toast({
        title: "Error",
        description: error?.message || "Error al eliminar el campo",
        variant: "destructive",
      })
    }
  }

  const handleQuickAddField = async (fieldType: 'imagen' | 'documento' | 'firma') => {
    try {
      console.log(`🚀 Agregando campo rápido: ${fieldType} para cliente ${clientId}`)
      const newField = await clientFieldsService.addQuickField(clientId, fieldType)
      console.log('✅ Campo agregado exitosamente:', newField)
      console.log('🔍 CAMPO CREADO - Respuesta completa:', JSON.stringify(newField, null, 2))
      
      // FORZAR múltiples intentos de recarga
      console.log('🔄 Recarga #1...')
      const updatedFields1 = await loadFields()
      console.log(`🔄 Campos recargados #1 - Cantidad: ${updatedFields1.length}`)
      
      // Esperar un momento y volver a cargar
      setTimeout(async () => {
        console.log('🔄 Recarga #2 (después de 500ms)...')
        const updatedFields2 = await loadFields()
        console.log(`🔄 Campos recargados #2 - Cantidad: ${updatedFields2.length}`)
        
        // Forzar re-render usando key change
        setFields([...updatedFields2])
        console.log('🔄 FORZANDO RE-RENDER con spread operator')
      }, 500)
      
      toast({
        title: "Campo agregado",
        description: `Campo "${fieldType}" agregado exitosamente`,
      })
      
    } catch (error: any) {
      console.error('❌ Error completo al agregar campo rápido:', error)
      toast({
        title: "Error",
        description: error.message || `Error al agregar campo ${fieldType}`,
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: FieldFormData) => {
    try {
      console.log('📝 Datos del formulario recibidos:', data)
      
      // Validación manual
      if (!data.id || !data.label || !data.type) {
        console.error('❌ Faltan campos requeridos:', { id: data.id, label: data.label, type: data.type })
        toast({
          title: "Error de validación",
          description: "ID, etiqueta y tipo son requeridos",
          variant: "destructive",
        })
        return
      }

      const fieldData = {
        ...data,
        options: (data.type === 'select' || data.type === 'radio') && data.options 
          ? data.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0)
          : undefined
      }

      console.log('📝 Datos procesados para enviar:', fieldData)
      console.log('📝 Cliente ID:', clientId)

      if (editingField) {
        await clientFieldsService.updateClientField(clientId, editingField.id, fieldData)
        toast({
          title: "Campo actualizado",
          description: `El campo "${data.label}" ha sido actualizado`,
        })
      } else {
        const newField = await clientFieldsService.addClientField(clientId, fieldData)
        console.log('Campo agregado exitosamente:', newField)
        toast({
          title: "Campo agregado",
          description: `El campo "${data.label}" ha sido agregado`,
        })
      }

      setIsDialogOpen(false)
      await loadFields() // Esperar a que se recarguen los campos
    } catch (error: any) {
      console.error('Error completo al guardar campo:', error)
      toast({
        title: "Error",
        description: error.message || "Error al guardar el campo",
        variant: "destructive",
      })
    }
  }

  const renderFieldPreview = () => {
    try {
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{typeof previewField.label === 'string' ? previewField.label : JSON.stringify(previewField.label)}</span>
              {previewField.required && (
                <Badge variant="destructive" className="text-xs">Requerido</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Tipo: {fieldTypeLabels[previewField.type]} • ID: {previewField.id}
            </div>
            {previewField.placeholder && (
              <div className="text-xs text-muted-foreground">
                Placeholder: {previewField.placeholder}
              </div>
            )}
            {previewField.help_text && (
              <div className="text-xs text-muted-foreground">
                Ayuda: {previewField.help_text}
              </div>
            )}
            {previewField.options && previewField.options.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Opciones: {previewField.options.join(', ')}
              </div>
            )}
          </div>
        </div>
      )
    } catch (error) {
      console.error('Error in renderFieldPreview:', error)
      return null
    }
  }

  if (loading) {
    console.log(`⏳ COMPONENTE CARGANDO - clientId: ${clientId}`)
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

  console.log(`🎯 RENDERIZANDO COMPONENTE - Cliente: ${clientName}, Campos: ${fields.length}`)

  return (
    <div className="space-y-6">
      <div>
        <h2>Campos de {clientName}</h2>
        <p>Gestión de campos dinámicos</p>
      </div>

      <div className="space-y-4">
        {/* Campos fijos del sistema (solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle>Campos fijos del sistema</CardTitle>
            <CardDescription>Siempre presentes en el formulario, no son configurables aquí</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                { id: 'nombre', label: 'Nombre', type: 'text', required: true },
                { id: 'apellido', label: 'Apellido', type: 'text', required: true },
                { id: 'email', label: 'Email', type: 'email', required: true },
                { id: 'telefono', label: 'Teléfono', type: 'tel', required: true },
                { id: 'asesor', label: 'Asesor', type: 'select', required: true },
                { id: 'fecha_venta', label: 'Fecha de venta', type: 'date', required: true },
              ].map(fixed => (
                <div key={fixed.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{fixed.label}</div>
                    <div className="text-xs text-muted-foreground">Tipo: {fieldTypeLabels[fixed.type as keyof typeof fieldTypeLabels] || fixed.type} • ID: {fixed.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {fixed.required && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
                    <Badge variant="secondary" className="text-xs">Fijo</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">Campos de {clientName}</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona los campos personalizados para las ventas de este cliente
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 sm:flex-none"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? 'Ocultar' : 'Ver'} Preview
            </Button>
            <Button 
              onClick={handleAddField}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Campo
            </Button>
          </div>
        </div>

        {/* Sección de botones de acción rápida */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="text-sm font-medium text-muted-foreground mb-2 sm:mb-0 sm:mr-3 sm:self-center">
            Acceso rápido:
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAddField('imagen')}
              className="text-xs"
            >
              <Upload className="mr-1 h-3 w-3" />
              Imagen
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAddField('documento')}
              className="text-xs"
            >
              <FileText className="mr-1 h-3 w-3" />
              Documento
            </Button>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAddField('firma')}
              className="text-xs"
            >
              <Edit className="mr-1 h-3 w-3" />
              Test Firma
            </Button>
            <Button
              variant="outline"
              size="sm" 
              onClick={() => handleQuickAddField('firma')}
              className="text-xs"
            >
              <Edit className="mr-1 h-3 w-3" />
              Firma
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const debugInfo = await clientFieldsService.debugCheck();
                  console.log('🔍 Debug info:', debugInfo);
                  toast({
                    title: "Debug Info",
                    description: "Ver consola para detalles del debug",
                  });
                } catch (error) {
                  console.error('❌ Error en debug:', error);
                }
              }}
              className="text-xs"
            >
              🔍 Debug
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {fields.map((field, index) => {
          const IconComponent = fieldTypeIcons[field.type]
          return (
            <Card key={field.id} className={field.default ? 'bg-muted/30' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move shrink-0" />
                    <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium truncate">{typeof field.label === 'string' ? field.label : JSON.stringify(field.label)}</span>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs shrink-0">Requerido</Badge>
                        )}
                        {field.default && (
                          <Badge variant="secondary" className="text-xs shrink-0">Por defecto</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {fieldTypeLabels[field.type]} • ID: {field.id}
                      </div>
                      {field.help_text && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {field.help_text}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
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
                <div key={field.id} className="space-y-2 p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{typeof field.label === 'string' ? field.label : JSON.stringify(field.label)}</span>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">Requerido</Badge>
                    )}
                    {field.default && (
                      <Badge variant="secondary" className="text-xs">Por defecto</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tipo: {fieldTypeLabels[field.type]} • ID: {field.id}
                  </div>
                  {field.placeholder && (
                    <div className="text-xs text-muted-foreground">
                      Placeholder: {field.placeholder}
                    </div>
                  )}
                  {field.help_text && (
                    <div className="text-xs text-muted-foreground">
                      Ayuda: {field.help_text}
                    </div>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Opciones: {field.options.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid gap-4 md:grid-cols-2">
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

              <div className="grid gap-4 md:grid-cols-2">
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
                    <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 space-y-2 sm:space-y-0">
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
                        className="min-h-[60px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch('type') === 'select' || form.watch('type') === 'radio') && (
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

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 sm:flex-none order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 sm:flex-none order-1 sm:order-2"
                >
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