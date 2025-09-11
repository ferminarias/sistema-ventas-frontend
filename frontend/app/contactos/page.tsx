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
      // Validar que la respuesta tenga la estructura esperada
      setAvailableClients(response.available_clients || [])
      setUserInfo(response.user_info || null)
      
      // No auto-seleccionar ningún cliente - que el usuario elija
    } catch (error) {
      console.error('Error loading available clients:', error)
      // Asegurar que availableClients siempre sea un array válido
      setAvailableClients([])
      setUserInfo(null)
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
    <div className="space-y-4" style={{ zoom: 0.8, transformOrigin: 'top left' }}>
      {/* Header - Solo título cuando no hay cliente seleccionado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sistema de Contactos</h1>
          <p className="text-muted-foreground">
            Gestiona contactos y leads organizados por cliente
          </p>
        </div>
        
        {/* Selector compacto solo cuando hay cliente seleccionado */}
        {selectedClient && availableClients.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedClient.name}</span>
              {selectedClient.total_contacts > 0 && (
                <> • {selectedClient.total_contacts} contactos</>
              )}
            </div>
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


      {/* Contenido principal */}
      {selectedClient ? (
        <ContactsList
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      ) : availableClients && availableClients.length > 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="text-3xl font-bold text-foreground">
                🏢 Selecciona un Cliente
              </div>
              <div className="text-lg text-muted-foreground max-w-md">
                Elige un cliente para ver y gestionar sus contactos
              </div>
            </div>
            
            <div className="flex justify-center">
              <ClientSelector
                clients={availableClients}
                selectedClient={selectedClient}
                onSelectClient={handleSelectClient}
                userInfo={userInfo}
                compact={true}
                centered={true}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Los contactos se cargarán automáticamente al seleccionar un cliente
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-xl font-medium text-muted-foreground mb-2">
              No hay clientes disponibles
            </div>
            <div className="text-sm text-muted-foreground">
              No tienes acceso a ningún cliente con sistema de contactos
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
