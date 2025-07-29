"use client"

import { useState } from "react"
import { RailwayCalendar } from "@/components/ui/railway-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalendarDebugTest() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [clickLog, setClickLog] = useState<string[]>([])

  const handleDateChange = (date: Date | undefined) => {
    const logEntry = `[${new Date().toLocaleTimeString()}] Fecha seleccionada: ${date ? date.toLocaleDateString('es-ES') : 'Ninguna'} (${date ? date.getTime() : 'N/A'})`
    console.log(logEntry)
    setClickLog(prev => [logEntry, ...prev.slice(0, 9)]) // Mantener solo los últimos 10 logs
    setSelectedDate(date)
  }

  const clearLogs = () => {
    setClickLog([])
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug de Clics en Calendario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendario */}
            <div>
              <label className="block text-sm font-medium mb-2">Calendario (Haz clic en días específicos)</label>
              <RailwayCalendar
                date={selectedDate}
                onDateChange={handleDateChange}
                placeholder="Selecciona un día"
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

          <div className="flex gap-2">
            <Button 
              onClick={() => setSelectedDate(undefined)}
              variant="outline"
            >
              Limpiar fecha
            </Button>
            <Button 
              onClick={() => setSelectedDate(new Date())}
              variant="outline"
            >
              Establecer hoy
            </Button>
            <Button 
              onClick={() => {
                const testDate = new Date(2024, 6, 15) // 15 de julio 2024
                setSelectedDate(testDate)
                handleDateChange(testDate)
              }}
              variant="outline"
            >
              Establecer 15 Julio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 