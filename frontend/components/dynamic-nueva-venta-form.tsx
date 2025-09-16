"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { DynamicField } from "@/components/ui/dynamic-field"
import { clientFieldsService, type ClientField } from "@/services/client-fields-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { RailwayLoader } from "@/components/ui/railway-loader"

export function DynamicNuevaVentaForm() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Estados principales
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientes, setClientes] = useState<{ id: number, name: string }[]>([])
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null)
  const [clientFields, setClientFields] = useState<ClientField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [asesores, setAsesores] = useState<{ id: number, name: string }[]>([])

  // Debug: Watch state changes for clientFields
  useEffect(() => {
    console.log(`🎨 NUEVA VENTA - clientFields cambió. Cantidad: ${clientFields.length}`)
    console.log(`🎨 Campos disponibles:`, clientFields.map(f => `${f.id}:${f.label}`))
  }, [clientFields])

  // Cargar clientes al montar el componente
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';
    
    // Obtener token para autenticación
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      'Accept': 'application/json'
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    fetch(`${API_BASE}/api/clientes`, { 
      headers,
      credentials: "include" 
    })
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClientes(data)
        else setClientes([])
      })
      .catch(() => setClientes([]))
  }, [])

  // Filtrar clientes según el usuario
  const clientesDisponibles = user?.role === "admin"
    ? clientes
    : clientes.filter(c => user?.allowedClients?.includes(String(c.id)))

  // Cargar campos dinámicos cuando se selecciona un cliente
  useEffect(() => {
    if (!selectedCliente) {
      setClientFields([])
      setAsesores([])
      return
    }

    const loadClientData = async () => {
      console.log(`🔄 Cargando datos para cliente ${selectedCliente}...`)
      setLoadingFields(true)
      try {
        // Cargar campos del cliente y asesores en paralelo
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';
        
        // Obtener token para autenticación
        const token = localStorage.getItem("token")
        const headers: HeadersInit = {
          'Accept': 'application/json'
        }
        
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        
        console.log(`📡 Llamando a clientFieldsService.getClientFields(${selectedCliente})`)
        const [fields, asesorRes] = await Promise.all([
          clientFieldsService.getClientFields(selectedCliente),
          fetch(`${API_BASE}/api/advisors?client_id=${selectedCliente}`, { 
            headers,
            credentials: "include" 
          })
        ])

        console.log(`📝 Campos recibidos en nueva venta:`, fields)
        console.log(`📊 Cantidad de campos:`, fields.length)
        setClientFields(fields)
        
        // Debug adicional después de setear los campos
        setTimeout(() => {
          console.log(`⏱️ Estado después de setClientFields:`, clientFields.length)
        }, 100)
        
        const asesoresData = await asesorRes.json()
        if (Array.isArray(asesoresData)) {
          setAsesores(asesoresData)
        } else {
          setAsesores([])
        }
        
        console.log(`✅ Datos cargados - Campos: ${fields.length}, Asesores: ${asesoresData.length || 0}`)
      } catch (error) {
        console.error('❌ Error loading client data:', error)
        toast({
          title: "Error",
          description: "Error al cargar los datos del cliente",
          variant: "destructive",
        })
      } finally {
        setLoadingFields(false)
      }
    }

    loadClientData()
  }, [selectedCliente, toast])

  // Crear esquema de validación dinámico basado en los campos
  const createDynamicSchema = (fields: ClientField[]) => {
    const schemaObj: Record<string, z.ZodTypeAny> = {}

    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email("Email inválido")
          break
        case 'number':
          fieldSchema = z.coerce.number()
          break
        case 'date':
          fieldSchema = z.string()
          break
        case 'file':
          fieldSchema = z.string().optional()
          break
        default:
          fieldSchema = z.string()
      }

      if (field.required) {
        if (field.type === 'file') {
          schemaObj[field.id] = fieldSchema.refine(val => val && val.length > 0, {
            message: `${field.label} es requerido`,
          })
        } else if (field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'textarea') {
          schemaObj[field.id] = z.string().min(1, `${field.label} es requerido`)
        } else {
          schemaObj[field.id] = fieldSchema.refine(val => val !== undefined && val !== null && val !== '', {
            message: `${field.label} es requerido`,
          })
        }
      } else {
        schemaObj[field.id] = fieldSchema.optional()
      }
    })

    // Campos obligatorios fijos
    schemaObj.nombre = z.string().min(1, "El nombre es requerido")
    schemaObj.apellido = z.string().min(1, "El apellido es requerido")
    schemaObj.email = z.string().email("Email inválido").min(1, "El email es requerido")
    schemaObj.telefono = z.string().min(1, "El teléfono es requerido")
    
    // Campos obligatorios adicionales
    schemaObj.asesor = z.string().min(1, "Debe seleccionar un asesor")
    schemaObj.fecha_venta = z.string().min(1, "Debe seleccionar una fecha")

    return z.object(schemaObj)
  }

  // Configurar el formulario con valores por defecto dinámicos
  const defaultValues = clientFields.reduce((acc, field) => {
    acc[field.id] = field.type === 'date' ? new Date().toISOString().split('T')[0] : ''
    return acc
  }, {} as Record<string, any>)

  // Valores por defecto para campos obligatorios fijos
  defaultValues.nombre = ''
  defaultValues.apellido = ''
  defaultValues.email = ''
  defaultValues.telefono = ''
  
  defaultValues.asesor = ''
  defaultValues.fecha_venta = new Date().toISOString().split('T')[0]

  const form = useForm({
    resolver: clientFields.length > 0 ? zodResolver(createDynamicSchema(clientFields)) : undefined,
    defaultValues,
  })

  // Resetear el formulario cuando cambien los campos
  useEffect(() => {
    if (clientFields.length > 0) {
      const newDefaultValues = clientFields.reduce((acc, field) => {
        acc[field.id] = field.type === 'date' ? new Date().toISOString().split('T')[0] : ''
        return acc
      }, {} as Record<string, any>)

      // Valores por defecto para campos obligatorios fijos
      newDefaultValues.nombre = ''
      newDefaultValues.apellido = ''
      newDefaultValues.email = ''
      newDefaultValues.telefono = ''
      
      newDefaultValues.asesor = ''
      newDefaultValues.fecha_venta = new Date().toISOString().split('T')[0]

      form.reset(newDefaultValues)
    }
  }, [clientFields, form])

  // Debug: Watch fecha_venta changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'fecha_venta') {
        // Log silencioso para debugging en producción si es necesario
        // console.log("DynamicNuevaVentaForm - fecha_venta cambió:", value.fecha_venta)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Utilidades para números tolerantes ("10%", "$1,234.50" => 1234.5)
  const parseTolerantNumber = (value: any): number => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    const str = String(value).trim()
    if (!str) return 0
    const cleaned = str
      .replace(/%/g, '')
      .replace(/\$/g, '')
      .replace(/,/g, '')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : 0
  }

  const roundToPrecision = (num: number, precision: number = 2): number => {
    const factor = Math.pow(10, precision)
    return Math.round((num + Number.EPSILON) * factor) / factor
  }

  // Evaluar fórmulas simples con + - * / y paréntesis
  const evaluateFormula = (formula: string, variables: Record<string, number>): number => {
    try {
      let expr = formula
      // Reemplazar variables por sus valores numéricos
      Object.entries(variables).forEach(([key, val]) => {
        const safeVal = Number.isFinite(val) ? val : 0
        const re = new RegExp(`\\b${key}\\b`, 'g')
        expr = expr.replace(re, String(safeVal))
      })
      // Solo permitir dígitos, operadores básicos, puntos y paréntesis
      if (/[^0-9+\-*/().\s]/.test(expr)) {
        return 0
      }
      // Evaluación controlada
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${expr})`)
      const result = fn()
      const num = typeof result === 'number' && Number.isFinite(result) ? result : 0
      return num
    } catch {
      return 0
    }
  }

  // Recalcular campos computed cuando cambian inputs declarados
  useEffect(() => {
    if (clientFields.length === 0) return

    const computedFields = clientFields.filter(f => !!f.computed)
    if (computedFields.length === 0) return

    const subscription = form.watch((_allValues, info) => {
      // Cuando cualquier campo cambie, intentamos recalcular los computados que dependan
      const values = form.getValues()

      computedFields.forEach(cf => {
        const cfg = cf.computed!
        const inputs = Array.isArray(cfg.inputs) ? cfg.inputs : []
        // Construir variables desde los valores actuales
        const vars: Record<string, number> = {}
        inputs.forEach(id => {
          const v = (values as any)[id]
          vars[id] = parseTolerantNumber(v)
        })
        const raw = evaluateFormula(cfg.formula || '', vars)
        const precision = cfg.precision ?? 2
        const computedValue = roundToPrecision(raw, precision)

        const currentValue = (values as any)[cf.id]
        const mode = cfg.mode || 'auto'

        const shouldAssign = mode === 'auto' || (mode === 'manualOverride' && (currentValue === undefined || currentValue === null || currentValue === ''))
        if (shouldAssign) {
          // Evitar loops: solo setear si cambia
          if (parseTolerantNumber(currentValue) !== computedValue) {
            form.setValue(cf.id, cf.valueType === 'number' || cf.type === 'number' ? computedValue : String(computedValue), { shouldValidate: false, shouldDirty: true, shouldTouch: false })
          }
        }
      })
    })

    // Inicializar una vez con valores por defecto
    const initValues = form.getValues()
    computedFields.forEach(cf => {
      const cfg = cf.computed!
      const inputs = Array.isArray(cfg.inputs) ? cfg.inputs : []
      const vars: Record<string, number> = {}
      inputs.forEach(id => {
        const v = (initValues as any)[id]
        vars[id] = parseTolerantNumber(v)
      })
      const raw = evaluateFormula(cfg.formula || '', vars)
      const precision = cfg.precision ?? 2
      const computedValue = roundToPrecision(raw, precision)
      form.setValue(cf.id, cf.valueType === 'number' || cf.type === 'number' ? computedValue : String(computedValue), { shouldValidate: false })
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFields, form])

  const onSubmit = async (values: any) => {
    if (!selectedCliente) return

    setIsSubmitting(true)
    try {
      // Preparar payload respetando valueType y tipos
      const payload: Record<string, any> = {
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email,
        telefono: values.telefono,
        asesor: values.asesor,
        fecha_venta: values.fecha_venta,
        cliente: selectedCliente,
      }

      clientFields.forEach(f => {
        let v = (values as any)[f.id]
        if (f.type === 'checkbox') {
          payload[f.id] = !!v
          return
        }
        if (f.valueType === 'number' || f.type === 'number') {
          payload[f.id] = parseTolerantNumber(v)
          return
        }
        // date ya viene string YYYY-MM-DD
        payload[f.id] = v
      })

      console.log("Enviando venta dinámica:", payload)

      const response = await clientFieldsService.createDynamicVenta(payload)

      toast({
        title: "Venta registrada",
        description: "La venta ha sido registrada exitosamente con todos los campos personalizados.",
      })

      router.push(`/clientes/${selectedCliente}`)
    } catch (error) {
      console.error("Error al crear venta:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la venta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Agrupar y ordenar campos por 'order' y por grupos
  const renderFields = () => {
    console.log(`🎨 Renderizando campos - Total: ${clientFields.length}`)
    const ordered = [...clientFields].sort((a, b) => a.order - b.order)

    // Construir índices de grupos y sus hijos
    const groups = ordered.filter(f => f.type === 'group')
    const nonGroupFields = ordered.filter(f => f.type !== 'group')

    const groupIdToChildren: Record<string, typeof nonGroupFields> = {}
    groups.forEach(g => { groupIdToChildren[g.id] = [] })

    const rootFields: typeof nonGroupFields = []
    nonGroupFields.forEach(f => {
      if (f.groupId && groupIdToChildren[f.groupId]) {
        groupIdToChildren[f.groupId].push(f)
      } else {
        rootFields.push(f)
      }
    })

    // Helper para renderizar una fila de campos (2-col cuando aplique)
    const renderRows = (fields: typeof nonGroupFields) => {
      const rows: typeof nonGroupFields[] = []
      let i = 0
      while (i < fields.length) {
        const current = fields[i]
        if (current.type === 'textarea' || current.type === 'file') {
          rows.push([current])
          i += 1
        } else {
          const next = fields[i + 1]
          if (next && next.type !== 'textarea' && next.type !== 'file') {
            rows.push([current, next])
            i += 2
          } else {
            rows.push([current])
            i += 1
          }
        }
      }

      return rows.map((row, idx) => (
        <div key={idx} className={`grid gap-6 ${row.length === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {row.map(field => (
            <DynamicField key={field.id} field={field} control={form.control} disabled={isSubmitting} />
          ))}
        </div>
      ))
    }

    // Render principal: primero grupos con sus hijos, luego campos raíz no agrupados
    return (
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.id} className="border rounded-md p-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">{typeof group.label === 'string' ? group.label : JSON.stringify(group.label)}</h3>
              {group.help_text && (
                <p className="text-sm text-muted-foreground">{group.help_text}</p>
              )}
            </div>
            {renderRows(groupIdToChildren[group.id] || [])}
          </div>
        ))}

        {rootFields.length > 0 && (
          <div className="space-y-4">
            {renderRows(rootFields)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selector de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cliente</CardTitle>
          <CardDescription>
            Los campos del formulario se adaptarán según el cliente seleccionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedCliente ? String(selectedCliente) : ""} 
            onValueChange={v => setSelectedCliente(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientesDisponibles.map((cliente) => (
                <SelectItem key={cliente.id} value={String(cliente.id)}>
                  {typeof cliente.name === 'string' ? cliente.name : JSON.stringify(cliente.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Formulario Dinámico */}
      {selectedCliente && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Venta</CardTitle>
            <CardDescription>
              Complete todos los campos requeridos para registrar la venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFields ? (
              <div className="flex items-center justify-center py-8">
                <RailwayLoader size="md" text="Cargando campos del formulario..." />
              </div>
            ) : (() => {
              console.log(`🔍 Decidiendo qué mostrar - clientFields.length: ${clientFields.length}`)
              console.log(`🔍 clientFields:`, clientFields)
              return clientFields.length > 0
            })() ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Campos obligatorios fijos */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DynamicField
                      field={{
                        id: 'nombre',
                        label: 'Nombre',
                        type: 'text',
                        required: true,
                        default: false,
                        order: 1,
                        placeholder: 'Ingrese el nombre'
                      }}
                      control={form.control}
                      disabled={isSubmitting}
                    />

                    <DynamicField
                      field={{
                        id: 'apellido',
                        label: 'Apellido',
                        type: 'text',
                        required: true,
                        default: false,
                        order: 2,
                        placeholder: 'Ingrese el apellido'
                      }}
                      control={form.control}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <DynamicField
                      field={{
                        id: 'email',
                        label: 'Email',
                        type: 'email',
                        required: true,
                        default: false,
                        order: 3,
                        placeholder: 'Ingrese el email'
                      }}
                      control={form.control}
                      disabled={isSubmitting}
                    />

                    <DynamicField
                      field={{
                        id: 'telefono',
                        label: 'Teléfono',
                        type: 'tel',
                        required: true,
                        default: false,
                        order: 4,
                        placeholder: 'Ingrese el teléfono'
                      }}
                      control={form.control}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Campos dinámicos del cliente */}
                  {renderFields()}

                  {/* Campos adicionales obligatorios */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DynamicField
                      field={{
                        id: 'asesor',
                        label: 'Asesor',
                        type: 'select',
                        required: true,
                        default: false,
                        order: 999,
                        options: asesores.map(a => a.name),
                        placeholder: 'Seleccionar asesor'
                      }}
                      control={form.control}
                      disabled={isSubmitting}
                    />

                    <DynamicField
                      field={{
                        id: 'fecha_venta',
                        label: 'Fecha de Venta',
                        type: 'date',
                        required: true,
                        default: false,
                        order: 1000,
                        placeholder: 'Seleccionar fecha'
                      }}
                      control={form.control}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push("/dashboard")}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Venta"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron campos configurados para este cliente
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 