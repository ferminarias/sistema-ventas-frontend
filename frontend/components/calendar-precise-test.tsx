"use client"

import { useState } from "react"
import { RailwayCalendar } from "@/components/ui/railway-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalendarPreciseTest() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [clickLog, setClickLog] = useState<string[]>([])

  const handleDateChange = (date: Date | undefined) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] Fecha seleccionada: ${date ? date.toLocaleDateString('es-ES') : 'Ninguna'} (Día: ${date?.getDate()}, Mes: ${date ? date.getMonth() + 1 : 'N/A'}, Año: ${date?.getFullYear()})`
    
    console.log("CalendarPreciseTest - handleDateChange:", date)
    console.log("CalendarPreciseTest - Día del mes:", date?.getDate())
    console.log("CalendarPreciseTest - Mes:", date ? date.getMonth() + 1 : 'N/A')
    console.log("CalendarPreciseTest - Año:", date?.getFullYear())
    
    setClickLog(prev => [logEntry, ...prev.slice(0, 9)])
    setSelectedDate(date)
  }

  const clearLogs = () => {
    setClickLog([])
  }

  const testSpecificDate = (day: number, month: number, year: number) => {
    const testDate = new Date()
    testDate.setFullYear(year)
    testDate.setMonth(month - 1)
    testDate.setDate(day)
    testDate.setHours(0, 0, 0, 0)
    
    console.log(`Test - Estableciendo fecha: ${testDate.toLocaleDateString('es-ES')}`)
    console.log(`Test - Día: ${testDate.getDate()}, Mes: ${testDate.getMonth() + 1}, Año: ${testDate.getFullYear()}`)
    
    setSelectedDate(testDate)
    handleDateChange(testDate)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Precisión - Calendario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instrucciones específicas */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-900">Instrucciones de Prueba:</h4>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. Abre la consola del navegador (F12)</li>
              <li>2. Haz clic en el calendario para abrirlo</li>
              <li>3. <strong>Selecciona el día 21 de julio</strong></li>
              <li>4. Verifica en la consola que se muestre "Día: 21"</li>
              <li>5. Si se muestra "Día: 20", hay un bug</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendario */}
            <div className="space-y-4">
              <label className="block text-sm font-medium">Calendario (Selecciona el día 21)</label>
              <RailwayCalendar
                date={selectedDate}
                onDateChange={handleDateChange}
                placeholder="Haz clic en el día 21"
              />
            </div>

            {/* Información de debug */}
            <div className="space-y-4">
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

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Log de Clics:</h4>
                  <Button onClick={clearLogs} size="sm" variant="outline">
                    Limpiar
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {clickLog.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay clics registrados</p>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 