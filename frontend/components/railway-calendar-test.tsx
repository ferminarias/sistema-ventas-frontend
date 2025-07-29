"use client"

import { useState } from "react"
import { RailwayCalendar } from "@/components/ui/railway-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RailwayCalendarTest() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [testDate, setTestDate] = useState<Date | undefined>()

  const handleDateChange = (date: Date | undefined) => {
    console.log("RailwayCalendarTest - Fecha seleccionada:", date)
    setSelectedDate(date)
  }

  const handleTestDateChange = (date: Date | undefined) => {
    console.log("RailwayCalendarTest - Test fecha seleccionada:", date)
    setTestDate(date)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Calendario Railway</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fecha con valor inicial</label>
            <RailwayCalendar
              date={selectedDate}
              onDateChange={handleDateChange}
              placeholder="Seleccionar fecha"
            />
            <p className="text-sm text-gray-500 mt-1">
              Fecha seleccionada: {selectedDate ? selectedDate.toISOString() : 'No seleccionada'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fecha sin valor inicial</label>
            <RailwayCalendar
              date={testDate}
              onDateChange={handleTestDateChange}
              placeholder="Seleccionar fecha de prueba"
            />
            <p className="text-sm text-gray-500 mt-1">
              Fecha seleccionada: {testDate ? testDate.toISOString() : 'No seleccionada'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => setSelectedDate(new Date())}
              variant="outline"
            >
              Establecer fecha actual
            </Button>
            <Button 
              onClick={() => setSelectedDate(undefined)}
              variant="outline"
            >
              Limpiar fecha
            </Button>
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium mb-2">Información de Debug:</h4>
            <ul className="text-sm space-y-1">
              <li>• Fecha 1: {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'No seleccionada'}</li>
              <li>• Fecha 2: {testDate ? testDate.toLocaleDateString('es-ES') : 'No seleccionada'}</li>
              <li>• Timestamp 1: {selectedDate ? selectedDate.getTime() : 'N/A'}</li>
              <li>• Timestamp 2: {testDate ? testDate.getTime() : 'N/A'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 