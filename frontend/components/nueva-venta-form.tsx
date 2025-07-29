"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ventasApi } from "@/lib/api/ventas"
import { useAuth } from "@/contexts/auth-context"
import { RailwayCalendar } from "@/components/ui/railway-calendar"

const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  apellido: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingrese un email válido.",
  }),
  telefono: z.string().min(6, {
    message: "El teléfono debe tener al menos 6 caracteres.",
  }),
  asesor: z.string().min(2, {
    message: "El nombre del asesor debe tener al menos 2 caracteres.",
  }),
  fecha_venta: z.date({
    required_error: "Por favor seleccione una fecha.",
  }),
})

export function NuevaVentaForm() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientes, setClientes] = useState<{ id: number, name: string }[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
  const [asesores, setAsesores] = useState<{ id: number, name: string }[]>([]);

  useEffect(() => {
    fetch("https://sistemas-de-ventas-production.up.railway.app/api/clientes", { 
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      credentials: "include" 
    })
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClientes(data);
        else setClientes([]);
      })
      .catch(() => setClientes([]));
  }, []);

  // Filtrar clientes según el usuario
  const clientesDisponibles = user?.role === "admin"
    ? clientes
    : clientes.filter(c => user?.allowedClients?.includes(String(c.id)));

  // Cargar asesores dinámicamente al cambiar el cliente seleccionado
  useEffect(() => {
    if (!selectedCliente) {
      setAsesores([]);
      return;
    }
    const clienteObj = clientes.find(c => c.id === selectedCliente);
    if (!clienteObj) {
      setAsesores([]);
      return;
    }
    fetch(`/api/advisors?client_id=${clienteObj.id}`, { credentials: "include" })
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAsesores(data);
        else setAsesores([]);
      })
      .catch(() => setAsesores([]));
  }, [selectedCliente, clientes]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      asesor: "",
      fecha_venta: new Date(),
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // Enviar la fecha como Date object y dejar que el backend la procese
      const ventaData = {
        ...values,
        fecha_venta: values.fecha_venta, // Enviar como Date object
        asesor: values.asesor,
        cliente: String(selectedCliente),
      }
      console.log("Enviando datos al backend:", ventaData)
      const response = await ventasApi.createVenta(ventaData)
      console.log("Respuesta del backend:", response)
      toast({
        title: "Venta registrada",
        description: `La venta ha sido registrada exitosamente para el cliente seleccionado.`,
      })
      router.push(`/clientes/${selectedCliente}`)
    } catch (error) {
      console.error("Error al crear venta:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la venta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Cliente Seleccionado</label>
          <Select value={selectedCliente ? String(selectedCliente) : ""} onValueChange={v => setSelectedCliente(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientesDisponibles.map((cliente) => (
                <SelectItem key={cliente.id} value={String(cliente.id)}>{typeof cliente.name === 'string' ? cliente.name : JSON.stringify(cliente.name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label">Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label">Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label">Email</FormLabel>
                <FormControl>
                  <Input placeholder="correo@ejemplo.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label">Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="asesor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label">Asesor</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar asesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {asesores.length > 0 ? (
                        asesores.map((asesor) => (
                          <SelectItem key={asesor.id} value={asesor.name}>{typeof asesor.name === 'string' ? asesor.name : JSON.stringify(asesor.name)}</SelectItem>
                        ))
                      ) : (
                        <div className="text-caption px-4 py-2">No hay asesores para este cliente</div>
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fecha_venta"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-label">Fecha de Venta</FormLabel>
                <FormControl>
                  <RailwayCalendar
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="Seleccionar fecha de venta"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push(`/clientes/${selectedCliente}`)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Venta"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
