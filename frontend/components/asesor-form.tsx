"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  client_ids: z.array(z.number()).min(1, "Debe seleccionar al menos un cliente"),
})

interface Cliente {
  id: number
  name: string
}

interface AsesorFormProps {
  onSuccess?: () => void
  asesorExistente?: {
    id: number
    name: string
    client_ids: number[]
  }
}

export function AsesorForm({ onSuccess, asesorExistente }: AsesorFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asesorExistente?.name || "",
      client_ids: asesorExistente?.client_ids || [],
    },
  })

  useEffect(() => {
    fetch("/api/clientes", { credentials: "include" })
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClientes(data)
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        })
      })
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const url = asesorExistente 
        ? `/api/advisors/${asesorExistente.id}`
        : "/api/advisors"
      
      const method = asesorExistente ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      })

      if (!response.ok) throw new Error("Error al guardar el asesor")

      toast({
        title: "Éxito",
        description: asesorExistente 
          ? "Asesor actualizado correctamente"
          : "Asesor creado correctamente",
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el asesor",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Asesor</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese el nombre del asesor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_ids"
          render={() => (
            <FormItem>
              <FormLabel>Clientes Asignados</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                {clientes.map((cliente) => (
                  <FormField
                    key={cliente.id}
                    control={form.control}
                    name="client_ids"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={cliente.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(cliente.id)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || []
                                if (checked) {
                                  field.onChange([...currentValue, cliente.id])
                                } else {
                                  field.onChange(
                                    currentValue.filter((id) => id !== cliente.id)
                                  )
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {cliente.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {asesorExistente ? "Actualizar Asesor" : "Crear Asesor"}
        </Button>
      </form>
    </Form>
  )
} 