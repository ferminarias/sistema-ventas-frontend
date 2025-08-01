"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { RailwayLoader } from "@/components/ui/railway-loader"
import { ClientFieldsManagement } from "@/components/admin/client-fields-management"

export default function ClientFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<{ id: number, name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const clientId = parseInt(params.id as string)

  useEffect(() => {
    const loadCliente = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';
        
        // Obtener token para autenticación
        const token = localStorage.getItem("token")
        const headers: HeadersInit = {
          'Accept': 'application/json'
        }
        
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        
        const response = await fetch(`${API_BASE}/api/clientes/${clientId}`, {
          headers,
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setCliente(data)
        }
      } catch (error) {
        console.error('Error loading client:', error)
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      loadCliente()
    }
  }, [clientId])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <RailwayLoader size="md" text="Cargando configuración del cliente..." />
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Cliente no encontrado</p>
            <Button onClick={() => router.push('/admin/clientes')}>
              Volver a clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configuración de Campos</h1>
          <p className="text-muted-foreground">
            Gestiona los campos personalizados para {cliente.name}
          </p>
        </div>
      </div>

      <ClientFieldsManagement 
        clientId={cliente.id} 
        clientName={cliente.name} 
      />
    </div>
  )
} 