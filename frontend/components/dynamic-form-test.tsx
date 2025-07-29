"use client"

import { useState } from "react"
import { DynamicField } from "@/components/ui/dynamic-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"

export function DynamicFormTest() {
  const [clickLog, setClickLog] = useState<string[]>([])

  const form = useForm({
    defaultValues: {
      fecha_venta: '',
      asesor: '',
      nombre: '',
      email: ''
    }
  })

  const handleDateChange = (date: Date | undefined) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] DynamicForm - Fecha seleccionada: ${date ? date.toLocaleDateString('es-ES') : 'Ninguna'} (Día: ${date?.getDate()}, Mes: ${date ? date.getMonth() + 1 : 'N/A'}, Año: ${date?.getFullYear()})`
    
    console.log("DynamicFormTest - handleDateChange:", date)
    console.log("DynamicFormTest - Día del mes:", date?.getDate())
    console.log("DynamicFormTest - Mes:", date ? date.getMonth() + 1 : 'N/A')
    console.log("DynamicFormTest - Año:", date?.getFullYear())
    
    setClickLog(prev => [logEntry, ...prev.slice(0, 9)])
  }

  const clearLogs = () => {
    setClickLog([])
  }

  const onSubmit = (values: any) => {
    console.log("DynamicFormTest - onSubmit:", values)
    console.log("DynamicFormTest - fecha_venta:", values.fecha_venta)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba - Formulario Dinámico (Simula Nueva Venta)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instrucciones específicas */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-900">Instrucciones de Prueba:</h4>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. Abre la consola del navegador (F12)</li>
              <li>2. Haz clic en el campo "Fecha de Venta"</li>
              <li>3. <strong>Selecciona el día 21 de julio</strong></li>
              <li>4. Verifica en la consola que se muestre "Día: 21"</li>
              <li>5. Haz clic en "Enviar" para ver el valor final</li>
            </ol>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
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
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <DynamicField
                  field={{
                    id: 'nombre',
                    label: 'Nombre',
                    type: 'text',
                    required: true,
                    default: false,
                    order: 1,
                    placeholder: 'Ingrese nombre'
                  }}
                  control={form.control}
                  disabled={false}
                />

                <DynamicField
                  field={{
                    id: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    default: false,
                    order: 2,
                    placeholder: 'correo@ejemplo.com'
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
                  <h4 className="font-medium text-gray-900">Log de Selecciones:</h4>
                  <Button onClick={clearLogs} size="sm" variant="outline">
                    Limpiar
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {clickLog.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay selecciones registradas</p>
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
                  Enviar Formulario
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 