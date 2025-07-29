"use client"

import { useState } from "react"
import { SimpleCalendar } from "@/components/ui/simple-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalendarTest() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [testDate, setTestDate] = useState<Date | undefined>()

  const handleDateChange = (date: Date | undefined) => {
    console.log("CalendarTest - Fecha seleccionada:", date)
    setSelectedDate(date)
  }

  const handleTestDateChange = (date: Date | undefined) => {
    console.log("CalendarTest - Test fecha seleccionada:", date)
    setTestDate(date)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Calendario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Fecha con valor inicial</label>
            <SimpleCalendar
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
            <SimpleCalendar
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
        </CardContent>
      </Card>
    </div>
  )
} 