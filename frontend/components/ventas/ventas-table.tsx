"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { Venta } from "@/lib/api"

interface VentasTableProps {
  ventas: Venta[]
  loading: boolean
}

export function VentasTable({ ventas, loading }: VentasTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Apellido</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Asesor</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas.map((venta) => (
                            <TableRow key={venta.id}>
                  <TableCell>{venta.id}</TableCell>
                  <TableCell>{typeof venta.nombre === 'string' ? venta.nombre : JSON.stringify(venta.nombre)}</TableCell>
                  <TableCell>{typeof venta.apellido === 'string' ? venta.apellido : JSON.stringify(venta.apellido)}</TableCell>
                  <TableCell>{typeof venta.email === 'string' ? venta.email : JSON.stringify(venta.email)}</TableCell>
                  <TableCell>{typeof venta.telefono === 'string' ? venta.telefono : JSON.stringify(venta.telefono)}</TableCell>
                  <TableCell>{typeof venta.asesor === 'string' ? venta.asesor : JSON.stringify(venta.asesor)}</TableCell>
                  <TableCell>{typeof venta.fecha_venta === 'string' ? venta.fecha_venta : JSON.stringify(venta.fecha_venta)}</TableCell>
                  <TableCell>{typeof venta.cliente === 'string' ? venta.cliente : JSON.stringify(venta.cliente)}</TableCell>
                </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 