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
import { RailwayLoader } from "@/components/ui/railway-loader"
import type { Venta } from "@/lib/api/ventas"

interface VentasTableProps {
  ventas: Venta[]
  loading: boolean
}

export function VentasTable({ ventas, loading }: VentasTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Encabezado de la tabla con skeleton */}
        <div className="rounded-md border border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 bg-gray-700" />
              <Skeleton className="h-4 w-48 bg-gray-600" />
            </div>
            <RailwayLoader size="sm" showText={false} />
          </div>
          
          {/* Filas de skeleton */}
          <div className="space-y-1 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3 border-b border-gray-700/50 last:border-b-0">
                <Skeleton className="h-4 w-12 bg-gray-700" />
                <Skeleton className="h-4 w-24 bg-gray-700" />
                <Skeleton className="h-4 w-24 bg-gray-700" />
                <Skeleton className="h-4 w-32 bg-gray-700" />
                <Skeleton className="h-4 w-20 bg-gray-700" />
                <Skeleton className="h-4 w-20 bg-gray-700" />
                <Skeleton className="h-4 w-16 bg-gray-700" />
                <Skeleton className="h-4 w-16 bg-gray-700" />
              </div>
            ))}
          </div>
          
          {/* Footer con loader principal */}
          <div className="flex justify-center py-6 border-t border-gray-700">
            <RailwayLoader size="md" text="Cargando ventas..." />
          </div>
        </div>
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