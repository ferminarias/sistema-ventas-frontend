"use client"

import { useState } from "react"
import { RailwayCalendar } from "@/components/ui/railway-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NuevaVentaDebug() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [clickLog, setClickLog] = useState<string[]>([])

  const handleDateChange = (date: Date | undefined) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] Fecha seleccionada: ${date ? date.toLocaleDateString('es-ES') : 'Ninguna'} (Día: ${date?.getDate()}, Mes: ${date ? date.getMonth() + 1 : 'N/A'}, Año: ${date?.getFullYear()})`
    
    console.log(logEntry)
    setClickLog(prev => [logEntry, ...prev.slice(0, 9)])
    setSelectedDate(date)
  }

  const clearLogs = () => {
    setClickLog([])
  }

  const testSpecificDate = (day: number, month: number, year: number) => {
    const testDate = new Date(year, month - 1, day)
    console.log(`Test - Estableciendo fecha: ${testDate.toLocaleDateString('es-ES')}`)
    setSelectedDate(testDate)
    handleDateChange(testDate)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Formulario de Nueva Venta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Simulación del formulario */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campo de fecha */}
            <div className="space-y-4">
              <Label className="text-label">Fecha de Venta *</Label>
              <RailwayCalendar
                date={selectedDate}
                onDateChange={handleDateChange}
                placeholder="Seleccionar fecha de venta"
              />
              
              {/* Información de debug */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">Estado Actual:</h4>
                <p className="text-sm text-blue-800">
                  <strong>Fecha seleccionada:</strong> {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'Ninguna'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Día del mes:</strong> {selectedDate ? selectedDate.getDate() : 'N/A'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Mes:</strong> {selectedDate ? selectedDate.getMonth() + 1 : 'N/A'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Año:</strong> {selectedDate ? selectedDate.getFullYear() : 'N/A'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Timestamp:</strong> {selectedDate ? selectedDate.getTime() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Log de clics */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Log de Selecciones:</h4>
                <Button onClick={clearLogs} size="sm" variant="outline">
                  Limpiar
                </Button>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
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
          </div>

          {/* Botones de prueba */}
          <div className="space-y-4">
            <h4 className="font-medium">Pruebas Específicas:</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setSelectedDate(undefined)}
                variant="outline"
                size="sm"
              >
                Limpiar fecha
              </Button>
              <Button 
                onClick={() => testSpecificDate(21, 7, 2025)}
                variant="outline"
                size="sm"
              >
                Establecer 21 Julio 2025
              </Button>
              <Button 
                onClick={() => testSpecificDate(15, 7, 2025)}
                variant="outline"
                size="sm"
              >
                Establecer 15 Julio 2025
              </Button>
              <Button 
                onClick={() => testSpecificDate(28, 7, 2025)}
                variant="outline"
                size="sm"
              >
                Establecer 28 Julio 2025
              </Button>
              <Button 
                onClick={() => testSpecificDate(1, 8, 2025)}
                variant="outline"
                size="sm"
              >
                Establecer 1 Agosto 2025
              </Button>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-900">Instrucciones de Prueba:</h4>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. Haz clic en el calendario para abrirlo</li>
              <li>2. Selecciona el día <strong>21 de julio</strong></li>
              <li>3. Verifica que se seleccione exactamente el día 21</li>
              <li>4. Revisa el log para confirmar la selección</li>
              <li>5. Si se selecciona el día 20, hay un bug</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 