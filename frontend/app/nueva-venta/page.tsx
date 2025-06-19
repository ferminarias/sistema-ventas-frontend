"use client"
import { NuevaVentaForm } from "@/components/nueva-venta-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home, Plus } from "lucide-react"
import Link from "next/link"

export default function NuevaVentaPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Venta
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Registrar Nueva Venta</CardTitle>
          <CardDescription>Ingresa los datos del cliente y la información de la venta</CardDescription>
        </CardHeader>
        <CardContent>
          <NuevaVentaForm />
        </CardContent>
      </Card>
    </div>
  )
}
