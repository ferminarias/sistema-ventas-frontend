"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { contactsService } from "@/services/contacts-service"
import { useAuth } from "@/contexts/auth-context"
import { ClientSelector } from "@/components/contacts/client-selector"
import { ContactsList } from "@/components/contacts/contacts-list"

interface ClientForContacts {
  id: number
  name: string
  description: string
  total_contacts: number
  has_contacts_table: boolean
  contacts_by_estado: Record<string, number>
}

export default function ContactosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [availableClients, setAvailableClients] = useState<ClientForContacts[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientForContacts | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Cargar clientes disponibles al iniciar
  useEffect(() => {
    loadAvailableClients()
  }, [])

  const loadAvailableClients = async () => {
    try {
      setLoading(true)
      const response = await contactsService.getAvailableClients()
      setAvailableClients(response.available_clients)
      setUserInfo(response.user_info)
      
      // Auto-seleccionar cliente si solo hay uno disponible
      if (response.available_clients.length === 1) {
        setSelectedClient(response.available_clients[0])
      }
    } catch (error) {
      console.error('Error loading available clients:', error)
      toast({
        title: "Error",
        description: "Error al cargar clientes disponibles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClient = (client: ClientForContacts) => {
    setSelectedClient(client)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg font-medium">Cargando clientes disponibles...</div>
          <div className="text-sm text-muted-foreground mt-2">
            Obteniendo información de acceso y permisos
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sistema de Contactos</h1>
          <p className="text-muted-foreground">
            Gestiona contactos y leads organizados por cliente con total aislamiento de datos
          </p>
        </div>
      </div>

      {/* Selector de Clientes */}
      <ClientSelector
        clients={availableClients}
        selectedClient={selectedClient}
        onSelectClient={handleSelectClient}
        userInfo={userInfo}
      />

      {/* Lista de Contactos del Cliente Seleccionado */}
      {selectedClient && (
        <ContactsList
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}
    </div>
  )
}
