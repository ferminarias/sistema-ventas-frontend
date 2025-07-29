"use client"

import { RailwayCalendarTest } from "@/components/railway-calendar-test"

export default function TestCalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Prueba de Calendario para Railway</h1>
        <RailwayCalendarTest />
      </div>
    </div>
  )
} 