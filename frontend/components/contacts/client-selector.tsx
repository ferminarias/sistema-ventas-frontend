"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, UserCheck, AlertTriangle, Eye } from "lucide-react"

interface ClientForContacts {
  id: number
  name: string
  description: string
  total_contacts: number
  has_contacts_table: boolean
  contacts_by_estado: Record<string, number>
}

interface ClientSelectorProps {
  clients: ClientForContacts[]
  selectedClient: ClientForContacts | null
  onSelectClient: (client: ClientForContacts) => void
  userInfo?: {
    id: number
    username: string
    role: string
    total_accessible_clients: number
  }
  compact?: boolean
}

export function ClientSelector({ clients, selectedClient, onSelectClient, userInfo, compact = false }: ClientSelectorProps) {
  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "ganado": return "default"
      case "contactado": return "default"
      case "interesado": return "secondary"
      case "seguimiento": return "secondary"
      case "propuesta": return "secondary"
      case "negociacion": return "secondary"
      case "perdido": return "destructive"
      case "descartado": return "outline"
      case "no contactado": return "outline"
      default: return "outline"
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "ganado": return <UserCheck className="h-3 w-3" />
      case "contactado": return <Users className="h-3 w-3" />
      case "interesado": return <AlertTriangle className="h-3 w-3" />
      default: return <Users className="h-3 w-3" />
    }
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay clientes disponibles</h3>
          <p className="text-muted-foreground">
            No tienes acceso a ningún cliente con sistema de contactos.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Modo compacto: solo dropdown
  if (compact) {
    return (
      <Select
        value={selectedClient?.id.toString() || ""}
        onValueChange={(value) => {
          const client = clients.find(c => c.id.toString() === value)
          if (client) onSelectClient(client)
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Elegir cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients
            .filter(client => client.has_contacts_table)
            .map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{client.name}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
                    {client.total_contacts}
                  </Badge>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    )
  }

  // Modo completo: cards
  return (
    <div className="space-y-6">
      {/* Información del usuario */}
      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Acceso de Usuario
            </CardTitle>
            <CardDescription>
              Usuario: <strong>{userInfo.username}</strong> | Rol: <Badge variant="outline">{userInfo.role}</Badge> | 
              Clientes accesibles: <strong>{userInfo.total_accessible_clients}</strong>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Selector de clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Seleccionar Cliente
          </CardTitle>
          <CardDescription>
            Selecciona un cliente para ver y gestionar sus contactos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card
                key={client.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedClient?.id === client.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelectClient(client)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    {selectedClient?.id === client.id && (
                      <Eye className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {client.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Total de contactos */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Contactos:</span>
                      <Badge variant="secondary">
                        {client.total_contacts}
                      </Badge>
                    </div>

                    {/* Estado de la tabla */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado:</span>
                      <Badge variant={client.has_contacts_table ? "default" : "destructive"}>
                        {client.has_contacts_table ? "Activo" : "Sin Tabla"}
                      </Badge>
                    </div>

                    {/* Estados del funnel */}
                    {client.has_contacts_table && client.total_contacts > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Por Estado:</span>
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(client.contacts_by_estado)
                            .filter(([_, count]) => count > 0)
                            .slice(0, 4) // Mostrar solo los primeros 4
                            .map(([estado, count]) => (
                              <div key={estado} className="flex items-center gap-1">
                                {getEstadoIcon(estado)}
                                <span className="text-xs">{estado.slice(0, 8)}:</span>
                                <Badge variant={getEstadoBadgeVariant(estado)} className="text-xs px-1">
                                  {count}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Botón de selección */}
                    <Button
                      variant={selectedClient?.id === client.id ? "default" : "outline"}
                      className="w-full mt-3"
                      size="sm"
                      disabled={!client.has_contacts_table}
                    >
                      {selectedClient?.id === client.id ? "Seleccionado" : "Seleccionar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cliente seleccionado */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Cliente Activo: {selectedClient.name}
            </CardTitle>
            <CardDescription>
              Gestión de contactos para {selectedClient.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedClient.total_contacts}</div>
                <div className="text-sm text-muted-foreground">Total Contactos</div>
              </div>
              {Object.entries(selectedClient.contacts_by_estado)
                .filter(([_, count]) => count > 0)
                .slice(0, 3)
                .map(([estado, count]) => (
                  <div key={estado} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{estado}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
