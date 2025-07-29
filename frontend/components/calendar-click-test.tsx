"use client"

import { useState } from "react"
import { RailwayCalendar } from "@/components/ui/railway-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalendarClickTest() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const handleDateChange = (date: Date | undefined) => {
    console.log("CalendarClickTest - Fecha seleccionada:", date)
    setSelectedDate(date)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Clics en Calendario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Calendario</label>
            <RailwayCalendar
              date={selectedDate}
              onDateChange={handleDateChange}
              placeholder="Haz clic en un día"
            />
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium mb-2">Estado actual:</h4>
            <p className="text-sm">
              Fecha seleccionada: {selectedDate ? selectedDate.toLocaleDateString('es-ES') : 'Ninguna'}
            </p>
            <p className="text-sm">
              Timestamp: {selectedDate ? selectedDate.getTime() : 'N/A'}
            </p>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 