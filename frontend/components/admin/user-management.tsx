"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Key, Users } from "lucide-react"
import { CreateUserDialog } from "./create-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { ChangePasswordDialog } from "./change-password-dialog"
import { usersApi } from "@/lib/api/users"
import type { User } from "@/types/auth"
import { clientService } from "@/services/client-service"

interface UserManagementProps {
  user: User
}

export function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableClients, setAvailableClients] = useState([])

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const fetchUsers = async () => {
    if (!token) {
      setError("No hay token de autenticación")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await usersApi.getUsers(token)
      // Normaliza los campos para que assignedClients siempre esté presente
      const normalized = data.map((u: any) => ({
        ...u,
        assignedClients: u.assignedClients ?? u.allowedClients ?? [],
      }))
      setUsers(normalized)
    } catch (err: any) {
      setError(err.message || "Error al obtener usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line
  }, [])

  // Obtener clientes cada vez que se abre el modal de edición
  useEffect(() => {
    if (showEditDialog) {
      clientService.getAllClients().then(setAvailableClients).catch(() => setAvailableClients([]))
    }
  }, [showEditDialog])

  const handleCreateUser = async (userData: any) => {
    if (!token) {
      setError("No hay token de autenticación")
      return
    }
    try {
      await usersApi.createUser(userData, token)
      setShowCreateDialog(false)
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleEditUser = async (userData: any) => {
    if (!token || !selectedUser) return
    try {
      await usersApi.updateUser(Number(selectedUser.id), userData, token)
      setShowEditDialog(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!token) {
      setError("No hay token de autenticación")
      return
    }
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await usersApi.deleteUser(Number(userId), token)
        fetchUsers()
      } catch (err: any) {
        alert(err.message)
      }
    }
  }

  const handleChangePassword = async (newPassword: string) => {
    if (!selectedUser) return
    try {
      await usersApi.changePassword(Number(selectedUser.id), newPassword, token)
      setShowPasswordDialog(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="flex-1 bg-background text-foreground overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">Administra usuarios y sus permisos</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Lista de Usuarios
          </CardTitle>
          <CardDescription className="text-muted-foreground">Gestiona todos los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-400">Cargando usuarios...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-300">Nombre</th>
                    <th className="text-left p-3 text-gray-300">Email</th>
                    <th className="text-left p-3 text-gray-300">Rol</th>
                    <th className="text-left p-3 text-gray-300">Clientes Asignados</th>
                    <th className="text-left p-3 text-gray-300">Último Login</th>
                    <th className="text-left p-3 text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="border-b border-border hover:bg-muted">
                      <td className="p-3">{userItem.username || userItem.name}</td>
                      <td className="p-3">{userItem.email}</td>
                      <td className="p-3">{userItem.role}</td>
                      <td className="p-3">{userItem.assignedClients?.join(", ") || "-"}</td>
                      <td className="p-3">{userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleString() : "-"}</td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(userItem)
                              setShowEditDialog(true)
                            }}
                            className="border-border text-muted-foreground hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(userItem)
                              setShowPasswordDialog(true)
                            }}
                            className="border-border text-muted-foreground hover:bg-muted"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          {userItem.id !== user.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(String(userItem.id))}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateUser}
      />

      <EditUserDialog
        open={showEditDialog}
        user={selectedUser}
        onClose={() => {
          setShowEditDialog(false)
          setSelectedUser(null)
        }}
        onSubmit={handleEditUser}
        availableClients={availableClients}
      />

      <ChangePasswordDialog
        open={showPasswordDialog}
        user={selectedUser}
        onClose={() => {
          setShowPasswordDialog(false)
          setSelectedUser(null)
        }}
        onSubmit={handleChangePassword}
      />
    </div>
  )
}
