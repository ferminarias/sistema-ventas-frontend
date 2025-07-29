"use client"

import { RailwayCalendarTest } from "@/components/railway-calendar-test"
import { CalendarClickTest } from "@/components/calendar-click-test"
import { CalendarDebugTest } from "@/components/calendar-debug-test"
import { NuevaVentaDebug } from "@/components/nueva-venta-debug"
import { CalendarPreciseTest } from "@/components/calendar-precise-test"
import { DynamicFormTest } from "@/components/dynamic-form-test"
import { RealNuevaVentaTest } from "@/components/real-nueva-venta-test"
import { ProductionNuevaVentaTest } from "@/components/production-nueva-venta-test"

export default function TestCalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Prueba de Calendario para Railway</h1>
        
        <div className="space-y-8">
          <ProductionNuevaVentaTest />
          <RealNuevaVentaTest />
          <DynamicFormTest />
          <CalendarPreciseTest />
          <NuevaVentaDebug />
          <CalendarDebugTest />
          <CalendarClickTest />
          <RailwayCalendarTest />
        </div>
      </div>
    </div>
  )
} 