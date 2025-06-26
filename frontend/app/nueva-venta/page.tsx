"use client"

import { DynamicNuevaVentaForm } from "@/components/dynamic-nueva-venta-form"

export default function NuevaVentaPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Venta</h1>
        <p className="text-muted-foreground">
          Registro una nueva venta con campos personalizados según el cliente
        </p>
      </div>
      
      <DynamicNuevaVentaForm />
    </div>
  )
}
