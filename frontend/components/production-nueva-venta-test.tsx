"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DynamicField } from "@/components/ui/dynamic-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"

export function ProductionNuevaVentaTest() {
  const [clickLog, setClickLog] = useState<string[]>([])
  const [selectedCliente, setSelectedCliente] = useState<number | null>(1) // Simular cliente seleccionado

  // Esquema exacto del formulario real
  const createDynamicSchema = (fields: any[]) => {
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

    // Campos obligatorios adicionales (exacto como el formulario real)
    schemaObj.asesor = z.string().min(1, "Debe seleccionar un asesor")
    schemaObj.fecha_venta = z.string().min(1, "Debe seleccionar una fecha")

    return z.object(schemaObj)
  }

  // Campos simulados (como si vinieran del backend)
  const clientFields = [
    {
      id: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      default: false,
      order: 1,
      placeholder: 'Ingrese nombre'
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      default: false,
      order: 2,
      placeholder: 'correo@ejemplo.com'
    }
  ]

  // Valores por defecto exactos como el formulario real
  const defaultValues = clientFields.reduce((acc, field) => {
    acc[field.id] = field.type === 'date' ? new Date().toISOString().split('T')[0] : ''
    return acc
  }, {} as Record<string, any>)

  defaultValues.asesor = ''
  defaultValues.fecha_venta = new Date().toISOString().split('T')[0]

  const form = useForm({
    resolver: zodResolver(createDynamicSchema(clientFields)),
    defaultValues,
  })

  // Debug: Watch fecha_venta changes (exacto como el formulario real)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'fecha_venta') {
        const timestamp = new Date().toLocaleTimeString()
        const logEntry = `[${timestamp}] ProductionTest - fecha_venta cambió: ${value.fecha_venta} (tipo: ${typeof value.fecha_venta})`
        
        console.log("ProductionNuevaVentaTest - fecha_venta cambió:", value.fecha_venta)
        console.log("ProductionNuevaVentaTest - Tipo de fecha:", typeof value.fecha_venta)
        
        setClickLog(prev => [logEntry, ...prev.slice(0, 9)])
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const clearLogs = () => {
    setClickLog([])
  }

  const onSubmit = (values: any) => {
    console.log("ProductionNuevaVentaTest - onSubmit:", values)
    console.log("ProductionNuevaVentaTest - fecha_venta:", values.fecha_venta)
    console.log("ProductionNuevaVentaTest - Tipo de fecha:", typeof values.fecha_venta)
    
    // Simular envío al backend
    const ventaData = {
      ...values,
      cliente: selectedCliente,
    }
    console.log("ProductionNuevaVentaTest - Enviando al backend:", ventaData)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚨 PRUEBA - Formulario de Nueva Venta en Producción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instrucciones específicas */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-medium mb-2 text-red-900">⚠️ PROBLEMA A VERIFICAR:</h4>
            <ol className="text-sm text-red-800 space-y-1">
              <li>1. Abre la consola del navegador (F12)</li>
              <li>2. Haz clic en el campo "Fecha de Venta"</li>
              <li>3. <strong>Selecciona el día 21 de julio</strong></li>
              <li>4. Verifica en la consola si se selecciona el día 21 o el 20</li>
              <li>5. Haz clic en "Enviar" para ver el valor final</li>
              <li>6. <strong>Este es el formulario EXACTO que se usa en /nueva-venta</strong></li>
            </ol>
          </div>

          {/* Simular selector de cliente */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Cliente seleccionado:</strong> Cliente de prueba (ID: {selectedCliente})
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Campos dinámicos del cliente */}
              <div className="grid gap-6 sm:grid-cols-2">
                <DynamicField
                  field={clientFields[0]}
                  control={form.control}
                  disabled={false}
                />

                <DynamicField
                  field={clientFields[1]}
                  control={form.control}
                  disabled={false}
                />
              </div>

              {/* Campos adicionales obligatorios (exacto como el formulario real) */}
              <div className="grid gap-6 sm:grid-cols-2">
                <DynamicField
                  field={{
                    id: 'asesor',
                    label: 'Asesor',
                    type: 'select',
                    required: true,
                    default: false,
                    order: 999,
                    options: ['Juan Pérez', 'María García', 'Carlos López'],
                    placeholder: 'Seleccionar asesor'
                  }}
                  control={form.control}
                  disabled={false}
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
                  disabled={false}
                />
              </div>

              {/* Información de debug */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Estado del Formulario:</h4>
                <p className="text-sm text-blue-800">
                  <strong>fecha_venta:</strong> {form.watch("fecha_venta") || 'No seleccionada'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Tipo de fecha:</strong> {typeof form.watch("fecha_venta")}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>asesor:</strong> {form.watch("asesor") || 'No seleccionado'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>nombre:</strong> {form.watch("nombre") || 'No ingresado'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>email:</strong> {form.watch("email") || 'No ingresado'}
                </p>
              </div>

              {/* Log de clics */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Log de Cambios:</h4>
                  <Button onClick={clearLogs} size="sm" variant="outline">
                    Limpiar
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {clickLog.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay cambios registrados</p>
                  ) : (
                    clickLog.map((log, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="submit">
                  Guardar Venta
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 