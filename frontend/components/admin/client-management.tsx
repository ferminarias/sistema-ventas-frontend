"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Settings, Building2, Users, Loader2, Shield, FileText, MoreHorizontal } from "lucide-react"
import { CreateClientDialog } from "./create-client-dialog"
import { EditClientDialog } from "./edit-client-dialog"
import { ConfigureFormDialog } from "./configure-form-dialog"
import type { User } from "@/types/auth"
import type { Client, CreateClientRequest, UpdateClientRequest } from "@/types/client"
import { clientService, getClientsByUser, canAccessClient } from "@/services/client-service"
import { authService } from "@/services/auth-service"
import { useAuth } from "@/contexts/auth-context"

interface ClientManagementProps {
  user: User
}

export function ClientManagement({ user }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  // Validar que user existe y tiene las propiedades necesarias
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error: No se encontró información del usuario
          </div>
        </CardContent>
      </Card>
    );
  }

  const canCreateClients = user.role === "admin";
  const canDeleteClients = user.role === "admin";

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (user) {
      clientService.setCurrentUser(user);
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar clientes y usuarios en paralelo
      const [clientsData, usersData] = await Promise.all([
        clientService.getAllClients(),
        user.role === "admin" ? authService.getAllUsers() : Promise.resolve([])
      ]);

      const filteredClients = getClientsByUser(user, clientsData);
      setClients(filteredClients);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Error al cargar los datos. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ HANDLER REAL para crear cliente
  const handleCreateClient = async (clientData: CreateClientRequest) => {
    if (!canCreateClients) {
      alert("No tienes permisos para crear clientes");
      return;
    }
    try {
      const newClient = await clientService.createClient(clientData)
      setClients([...clients, newClient])
      setShowCreateDialog(false)
      // Redirigir automáticamente a la página del cliente recién creado
      router.push(`/clientes/${newClient.id}`)
      // Mostrar notificación de éxito (opcional)
      console.log("Cliente creado exitosamente:", newClient)
    } catch (error) {
      console.error("Error creating client:", error)
      // Aquí podrías mostrar un toast de error
      alert("Error al crear el cliente. Por favor, intenta de nuevo.")
    }
  }

  // ✅ HANDLER REAL para editar cliente
  const handleUpdateClient = async (clientId: number, clientData: Partial<CreateClientRequest>) => {
    try {
      const updateData: UpdateClientRequest = {
        id: clientId,
        name: clientData.name,
        description: clientData.description,
        assignedUsers: clientData.assignedUsers,
        formConfig: clientData.formConfig
      };
      const updatedClient = await clientService.updateClient(clientId, updateData);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating client:", error);
      setError("Error al actualizar el cliente. Por favor, intenta de nuevo.");
    }
  }

  // ✅ HANDLER REAL para eliminar cliente
  const handleDeleteClient = async (clientId: number) => {
    if (!canDeleteClients) {
      alert("No tienes permisos para eliminar clientes");
      return;
    }
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return

    try {
      await clientService.deleteClient(clientId)
      setClients(clients.filter((c) => c.id !== clientId))

      console.log("Cliente eliminado exitosamente")
    } catch (error) {
      console.error("Error deleting client:", error)
      alert("Error al eliminar el cliente. Por favor, intenta de nuevo.")
    }
  }

  // ✅ HANDLER REAL para configurar formulario
  const handleUpdateFormConfig = async (clientId: number, formConfig: any) => {
    try {
      const updateData: UpdateClientRequest = {
        id: clientId,
        formConfig
      };
      const updatedClient = await clientService.updateClient(clientId, updateData);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      setShowFormDialog(false);
    } catch (error) {
      console.error("Error updating form config:", error);
      setError("Error al actualizar la configuración del formulario. Por favor, intenta de nuevo.");
    }
  }

  const getUserNames = (userIds: string[]) => {
    return userIds
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  // Filtrar solo supervisores para el diálogo
  const supervisors = users.filter((user) => user.role === "supervisor")

  if (loading) {
    return (
      <div className="flex-1 bg-gray-900 text-white overflow-auto">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando clientes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 bg-background text-foreground overflow-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadInitialData} className="bg-purple-600 hover:bg-purple-700">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  

  return (
    <div className="flex-1 bg-background text-foreground overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
              {user.role === "supervisor" && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Vista limitada
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {user.role === "admin"
                ? "Administra todos los clientes del sistema"
                : `Gestiona tus ${clients.length} clientes asignados`}
            </p>
          </div>
          {canCreateClients && (
            <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Lista de Clientes ({clients.length})
          </CardTitle>
          <CardDescription className="text-muted-foreground">Gestiona todos los clientes del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.filter(c => c.id !== null && c.id !== undefined).length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No hay clientes registrados</p>
              <p className="text-gray-500 text-sm">Crea tu primer cliente para comenzar</p>
            </div>
          ) :
            <div className="space-y-4">
              {clients.filter(c => c.id !== null && c.id !== undefined).map(cliente => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div>
                    <h3 className="text-foreground font-medium">{cliente.name}</h3>
                    <p className="text-muted-foreground text-sm">{cliente.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/clientes/${cliente.id}/campos`)}
                      title="Configurar campos personalizados"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Campos
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedClient(cliente);
                        setShowFormDialog(true);
                      }}
                      title="Configurar formulario"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedClient(cliente);
                        setShowEditDialog(true);
                      }}
                      title="Editar cliente"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {canDeleteClients && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(cliente.id)}
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs con handlers reales */}
      {canCreateClients && (
        <CreateClientDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateClient}
          availableUsers={supervisors}
        />
      )}

      <EditClientDialog
        open={showEditDialog}
        client={selectedClient}
        onClose={() => {
          setShowEditDialog(false)
          setSelectedClient(null)
        }}
        onSubmit={(clientData) => handleUpdateClient(selectedClient!.id, clientData)}
        availableUsers={supervisors}
      />

      {showFormDialog && selectedClient && (
        <ConfigureFormDialog
          open={showFormDialog}
          onClose={() => setShowFormDialog(false)}
          onSubmit={(formConfig) => handleUpdateFormConfig(selectedClient.id, formConfig)}
          client={selectedClient}
        />
      )}
    </div>
  )
}
