"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Edit, Save } from "lucide-react"
import type { User, UpdateUserRequest } from "@/types/auth"
import type { UserRole } from "@/types/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditUserDialogProps {
  open: boolean
  user: User | null
  onClose: () => void
  onSubmit: (userData: UpdateUserRequest) => void
  availableClients: Array<{ id: number, name: string }> // <-- agregar prop
}

// Elimina la interfaz extendida y usa un tipo local para el estado
export function EditUserDialog({ open, user, onClose, onSubmit, availableClients = [] }: EditUserDialogProps) {
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    role: string;
    assignedClients: number[];
  }>({
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "admin",
    assignedClients: (user?.assignedClients || []).map((c: any) => Number(c)),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFormData({
        username: user.username || "",
        email: user.email,
        role: user.role,
        assignedClients: (user.assignedClients || []).map((c: any) => Number(c)),
      });
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const payload = {
      username: formData.username,
      email: formData.email,
      role: formData.role as UserRole,
      allowedClients: formData.assignedClients.map(String),
    };
    onSubmit(payload);
    setLoading(false);
  };

  const handleClientToggle = (clientId: number) => {
    setFormData(prev => {
      const newClients = prev.assignedClients.includes(clientId)
        ? prev.assignedClients.filter(c => c !== clientId)
        : [...prev.assignedClients, clientId];
      return { ...prev, assignedClients: newClients };
    });
  };

  if (!open || !user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nombre de Usuario</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Rol</label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "supervisor") => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clientes Asignados - Solo para supervisores */}
          {formData.role === "supervisor" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Clientes Asignados</label>
              <p className="text-xs text-gray-400">Selecciona los clientes que podrá gestionar</p>
              <div className="grid grid-cols-2 gap-2">
                {availableClients.map((client) => (
                  <Button
                    key={client.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleClientToggle(client.id)}
                    className={`justify-start ${
                      formData.assignedClients?.includes(client.id)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {client.name}
                  </Button>
                ))}
              </div>
              {formData.assignedClients && formData.assignedClients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.assignedClients.map((clientId) => (
                    <Badge key={clientId} variant="secondary" className="text-xs">
                      {availableClients.find(c => c.id === clientId)?.name || clientId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-gray-700 p-3 rounded-md">
            <p className="text-xs text-gray-400">
              <strong>Creado:</strong> {user.createdAt}
            </p>
            <p className="text-xs text-gray-400">
              <strong>Último login:</strong> {user.lastLogin}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 