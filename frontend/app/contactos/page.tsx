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
      
      // No auto-seleccionar ningún cliente - que el usuario elija
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
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sistema de Contactos</h1>
            <p className="text-muted-foreground">
              Gestiona contactos y leads organizados por cliente
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Cargando clientes...</div>
            <div className="w-[200px] h-9 bg-muted rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con selector compacto */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sistema de Contactos</h1>
          <p className="text-muted-foreground">
            Gestiona contactos y leads organizados por cliente
          </p>
        </div>
        
        {/* Selector de Cliente Compacto - Siempre visible */}
        {availableClients.length > 0 && (
          <div className="flex items-center gap-4">
            {selectedClient && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{selectedClient.name}</span> • {selectedClient.total_contacts} contactos
              </div>
            )}
            <ClientSelector
              clients={availableClients}
              selectedClient={selectedClient}
              onSelectClient={handleSelectClient}
              userInfo={userInfo}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Lista de Contactos del Cliente Seleccionado */}
      {selectedClient ? (
        <ContactsList
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      ) : availableClients.length > 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-xl font-medium text-muted-foreground mb-2">
              👆 Selecciona un cliente en la lista desplegable
            </div>
            <div className="text-sm text-muted-foreground">
              Los contactos se cargarán dinámicamente al seleccionar un cliente
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
