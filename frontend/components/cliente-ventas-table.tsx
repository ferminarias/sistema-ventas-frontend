"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useVentas } from "@/hooks/useVentas"

interface ClienteVentasTableProps {
  cliente: string
}

export function ClienteVentasTable({ cliente }: ClienteVentasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")
  const [sortBy, setSortBy] = useState("fecha_venta")
  const [sortOrder, setSortOrder] = useState("desc")

  const { ventas, loading, error } = useVentas(cliente.toLowerCase())

  // Filtrar ventas por término de búsqueda
  const filteredVentas = ventas.filter(
    (venta) =>
      (venta.nombre?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.apellido?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.email?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.asesor?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.cliente?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  // Ordenar ventas
  const sortedVentas = [...filteredVentas].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a]
    const bValue = b[sortBy as keyof typeof b]
    if (aValue === undefined || bValue === undefined) return 0
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Paginación
  const totalPages = Math.ceil(sortedVentas.length / Number.parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * Number.parseInt(itemsPerPage)
  const paginatedVentas = sortedVentas.slice(startIndex, startIndex + Number.parseInt(itemsPerPage))

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando ventas...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Ventas - {cliente.charAt(0).toUpperCase() + cliente.slice(1)}</CardTitle>
        <CardDescription>Lista completa de todas las ventas registradas para {cliente.charAt(0).toUpperCase() + cliente.slice(1)}</CardDescription>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ventas..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 por página</SelectItem>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
              {paginatedVentas.length > 0 ? (
                paginatedVentas.map((venta) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{" "}
              <span className="font-medium">
                {Math.min(startIndex + Number.parseInt(itemsPerPage), filteredVentas.length)}
              </span>{" "}
              de <span className="font-medium">{filteredVentas.length}</span> resultados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Página anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Página siguiente</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
