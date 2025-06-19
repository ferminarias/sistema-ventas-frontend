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
              <TableCell>{venta.nombre}</TableCell>
              <TableCell>{venta.apellido}</TableCell>
              <TableCell>{venta.email}</TableCell>
              <TableCell>{venta.telefono}</TableCell>
              <TableCell>{venta.asesor}</TableCell>
              <TableCell>{venta.fecha_venta}</TableCell>
              <TableCell>{venta.cliente}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 