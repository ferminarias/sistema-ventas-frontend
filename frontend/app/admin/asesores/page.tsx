"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { AsesorForm } from "@/components/asesor-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Advisor {
  id: number
  name: string
  client_id: number
  client_name: string
  client_ids: number[]
}

export default function AsesoresPage() {
  const [asesores, setAsesores] = useState<Advisor[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [asesorEditando, setAsesorEditando] = useState<Advisor | null>(null)
  const { toast } = useToast()

  const cargarAsesores = async () => {
    try {
      const response = await fetch("/api/advisors", { credentials: "include" })
      if (!response.ok) throw new Error("Error al cargar asesores")
      const data = await response.json()
      setAsesores(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los asesores",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    cargarAsesores()
  }, [])

  const handleEditar = (asesor: Advisor) => {
    setAsesorEditando(asesor)
    setIsDialogOpen(true)
  }

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este asesor?")) return

    try {
      const response = await fetch(`/api/advisors/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Error al eliminar el asesor")

      toast({
        title: "Éxito",
        description: "Asesor eliminado correctamente",
      })

      cargarAsesores()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el asesor",
        variant: "destructive",
      })
    }
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    setAsesorEditando(null)
    cargarAsesores()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Asesores</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setAsesorEditando(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Asesor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {asesorEditando ? "Editar Asesor" : "Nuevo Asesor"}
              </DialogTitle>
            </DialogHeader>
            <AsesorForm
              onSuccess={handleSuccess}
              asesorExistente={asesorEditando || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Asesores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asesores.map((asesor) => (
                <TableRow key={asesor.id}>
                  <TableCell>{asesor.id}</TableCell>
                                      <TableCell>{typeof asesor.name === 'string' ? asesor.name : JSON.stringify(asesor.name)}</TableCell>
                  <TableCell>{asesor.client_name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditar(asesor)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleEliminar(asesor.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 