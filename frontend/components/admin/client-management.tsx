"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Settings, Building2, Users, Loader2, Shield, FileText, MoreHorizontal, ExternalLink, Calendar, UserCheck } from "lucide-react"
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

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (user) {
      clientService.setCurrentUser(user);
    }
  }, [user]);

  // Validar que user existe y tiene las propiedades necesarias
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error: No se encontró información del usuario
          </div>
        </CardContent>
      </Card>
    );
  }

  const canCreateClients = user.role === "admin";
  const canDeleteClients = user.role === "admin";

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

  // ✅ HANDLER REAL para configurar formulario y logo
  const handleUpdateFormConfig = async (clientId: number, formConfig: any, logo?: string) => {
    try {
      console.log("🔍 handleUpdateFormConfig called with:", {
        clientId,
        formConfigLength: formConfig.length,
        logoType: typeof logo,
        logoStartsWithData: logo?.startsWith('data:image/'),
        logoPreview: logo?.substring(0, 50) + "..."
      });

      // Si hay un logo nuevo (base64), subirlo primero
      if (logo && logo.startsWith('data:image/')) {
        console.log("🚀 Subiendo logo a Cloudinary...");
        const updatedClientWithLogo = await clientService.uploadClientLogo(clientId, logo);
        console.log("✅ Logo subido exitosamente:", updatedClientWithLogo);
        setClients(prev => prev.map(c => c.id === clientId ? updatedClientWithLogo : c));
      } else {
        console.log("⚠️ No hay logo base64 para subir");
      }

      // Actualizar configuración del formulario
      console.log("📝 Actualizando configuración del formulario...");
      const updateData: UpdateClientRequest = {
        id: clientId,
        formConfig
      };
      const updatedClient = await clientService.updateClient(clientId, updateData);
      console.log("✅ Formulario actualizado:", updatedClient);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      setShowFormDialog(false);
    } catch (error) {
      console.error("❌ Error updating form config:", error);
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
      <div className="flex-1 bg-background text-foreground overflow-auto">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Cargando clientes...</span>
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
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadInitialData} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background text-foreground overflow-auto">
      {/* Header Rediseñado */}
      <div className="px-8 py-6 border-b border-border/50">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-display text-2xl md:text-3xl font-semibold tracking-tight">
                Gestión de Clientes
              </h1>
              {user.role === "supervisor" && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Vista limitada
                </Badge>
              )}
            </div>
            <p className="text-body text-muted-foreground">
              {user.role === "admin"
                ? "Administra y configura todos los clientes del sistema"
                : `Gestiona tus ${clients.length} clientes asignados`}
            </p>
          </div>
          {canCreateClients && (
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-8">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Total Clientes</p>
                  <p className="text-heading text-2xl font-semibold">{clients.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Activos</p>
                  <p className="text-heading text-2xl font-semibold text-green-600">
                    {clients.filter(c => c.id !== null && c.id !== undefined).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption text-muted-foreground">Configurados</p>
                  <p className="text-heading text-2xl font-semibold text-blue-600">
                    {clients.filter(c => c.formConfig).length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-blue-600/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Clientes Rediseñada */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-heading text-lg font-medium flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Clientes del Sistema
                </CardTitle>
                <CardDescription className="text-caption text-muted-foreground mt-1">
                  {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {clients.filter(c => c.id !== null && c.id !== undefined).length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-heading text-lg font-medium mb-2">No hay clientes registrados</h3>
                <p className="text-body text-muted-foreground mb-4">
                  Comienza creando tu primer cliente para gestionar ventas
                </p>
                {canCreateClients && (
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Cliente
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {clients.filter(c => c.id !== null && c.id !== undefined).map((cliente, index) => (
                  <div
                    key={cliente.id}
                    className="group hover:bg-muted/30 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between p-6">
                      {/* Información del Cliente */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {cliente.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-heading text-base font-medium truncate">
                              {cliente.name}
                            </h3>
                            {cliente.formConfig && (
                              <Badge variant="outline" className="text-xs">
                                <Settings className="h-3 w-3 mr-1" />
                                Configurado
                              </Badge>
                            )}
                          </div>
                          <p className="text-body text-sm text-muted-foreground line-clamp-1">
                            {cliente.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/clientes/${cliente.id}`)}
                          className="h-8 w-8 p-0 hover:bg-muted"
                          title="Ver dashboard"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/clientes/${cliente.id}/campos`)}
                          className="h-8 w-8 p-0 hover:bg-muted"
                          title="Configurar campos"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(cliente);
                            setShowFormDialog(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-muted"
                          title="Configurar formulario"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(cliente);
                            setShowEditDialog(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-muted"
                          title="Editar cliente"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {canDeleteClients && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClient(cliente.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
