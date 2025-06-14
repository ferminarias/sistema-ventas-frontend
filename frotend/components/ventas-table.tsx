"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

// Datos de ejemplo
const ventasData = [
  {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@example.com",
    telefono: "123-456-7890",
    asesor: "María González",
    fecha: "2023-05-15",
  },
  {
    id: 2,
    nombre: "Ana",
    apellido: "López",
    email: "ana.lopez@example.com",
    telefono: "234-567-8901",
    asesor: "Carlos Rodríguez",
    fecha: "2023-05-16",
  },
  {
    id: 3,
    nombre: "Pedro",
    apellido: "Martínez",
    email: "pedro.martinez@example.com",
    telefono: "345-678-9012",
    asesor: "María González",
    fecha: "2023-05-17",
  },
  {
    id: 4,
    nombre: "Laura",
    apellido: "García",
    email: "laura.garcia@example.com",
    telefono: "456-789-0123",
    asesor: "José Fernández",
    fecha: "2023-05-18",
  },
  {
    id: 5,
    nombre: "Miguel",
    apellido: "Sánchez",
    email: "miguel.sanchez@example.com",
    telefono: "567-890-1234",
    asesor: "Carlos Rodríguez",
    fecha: "2023-05-19",
  },
  {
    id: 6,
    nombre: "Carmen",
    apellido: "Díaz",
    email: "carmen.diaz@example.com",
    telefono: "678-901-2345",
    asesor: "María González",
    fecha: "2023-05-20",
  },
  {
    id: 7,
    nombre: "Roberto",
    apellido: "Fernández",
    email: "roberto.fernandez@example.com",
    telefono: "789-012-3456",
    asesor: "José Fernández",
    fecha: "2023-05-21",
  },
  {
    id: 8,
    nombre: "Sofía",
    apellido: "Ruiz",
    email: "sofia.ruiz@example.com",
    telefono: "890-123-4567",
    asesor: "Carlos Rodríguez",
    fecha: "2023-05-22",
  },
  {
    id: 9,
    nombre: "Javier",
    apellido: "Torres",
    email: "javier.torres@example.com",
    telefono: "901-234-5678",
    asesor: "María González",
    fecha: "2023-05-23",
  },
  {
    id: 10,
    nombre: "Elena",
    apellido: "Morales",
    email: "elena.morales@example.com",
    telefono: "012-345-6789",
    asesor: "José Fernández",
    fecha: "2023-05-24",
  },
]

export function VentasTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")
  const [sortBy, setSortBy] = useState("fecha")
  const [sortOrder, setSortOrder] = useState("desc")

  // Filtrar ventas por término de búsqueda
  const filteredVentas = ventasData.filter(
    (venta) =>
      venta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.asesor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Ordenar ventas
  const sortedVentas = [...filteredVentas].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a]
    const bValue = b[sortBy as keyof typeof b]

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Ventas</CardTitle>
        <CardDescription>Lista completa de todas las ventas registradas</CardDescription>
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
                <TableHead className="w-12">ID</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("nombre")}>
                  Nombre {sortBy === "nombre" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("apellido")}>
                  Apellido {sortBy === "apellido" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("asesor")}>
                  Asesor {sortBy === "asesor" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("fecha")}>
                  Fecha {sortBy === "fecha" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVentas.length > 0 ? (
                paginatedVentas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell>{venta.id}</TableCell>
                    <TableCell>{venta.nombre}</TableCell>
                    <TableCell>{venta.apellido}</TableCell>
                    <TableCell className="hidden md:table-cell">{venta.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{venta.telefono}</TableCell>
                    <TableCell>{venta.asesor}</TableCell>
                    <TableCell>{venta.fecha}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
