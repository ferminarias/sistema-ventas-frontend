"use client"

import { useState } from "react"
import { BarChart3, Home, Users, Plus, FileText, Settings, Moon, LogOut, ChevronDown, ChevronRight, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@/types/auth"

interface SidebarProps {
  user: User
  selectedClient: string | null
  onClientSelect: (client: string | null) => void
  onLogout: () => void
}

export function Sidebar({ user, selectedClient, onClientSelect, onLogout }: SidebarProps) {
  const router = useRouter()
  const [clientsExpanded, setClientsExpanded] = useState(false)

  // Filtrar clientes según el rol del usuario
  const allClients = ["Aliat", "Anahuac", "Cesa", "Faro"]
  const availableClients = user.role === "admin" ? allClients : user.assignedClients || allClients

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-lg font-bold">SISTEMA VENTAS</h1>
            <p className="text-sm text-gray-400">NODS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start text-white hover:bg-purple-600 ${
            selectedClient === null ? "bg-purple-600" : ""
          }`}
          onClick={() => {
            onClientSelect(null)
            handleNavigation("/dashboard")
          }}
        >
          <Home className="h-5 w-5 mr-3" />
          Dashboard
        </Button>

        {/* Clientes */}
        <div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-700"
            onClick={() => setClientsExpanded(!clientsExpanded)}
          >
            <Users className="h-5 w-5 mr-3" />
            Clientes
            {clientsExpanded ? (
              <ChevronDown className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </Button>

          {clientsExpanded && (
            <div className="ml-8 mt-2 space-y-1">
              {availableClients.map((client) => (
                <Button
                  key={client}
                  variant="ghost"
                  className={`w-full justify-start text-sm text-gray-300 hover:bg-gray-700 ${
                    selectedClient === client ? "bg-gray-700 text-white" : ""
                  }`}
                  onClick={() => {
                    onClientSelect(client)
                    handleNavigation(`/clientes/${client.toLowerCase()}`)
                  }}
                >
                  {client}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-gray-700"
          onClick={() => handleNavigation("/nueva-venta")}
        >
          <Plus className="h-5 w-5 mr-3" />
          Nueva Venta
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-gray-700"
          onClick={() => handleNavigation("/reportes")}
        >
          <FileText className="h-5 w-5 mr-3" />
          Reportes
        </Button>

        {/* Gestión de Usuarios - Solo para Admin */}
        {user.role === "admin" && (
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-700"
            onClick={() => handleNavigation("/admin/usuarios")}
          >
            <UserCog className="h-5 w-5 mr-3" />
            Gestión de Usuarios
          </Button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <div className="text-sm text-gray-400 mb-2">
          <p className="text-white">{user.username}</p>
          <p className="text-xs">{user.role === "admin" ? "Administrador" : "Supervisor"}</p>
          {user.assignedClients && (
            <p className="text-xs text-purple-400">Clientes: {user.assignedClients.join(", ")}</p>
          )}
        </div>

        <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700">
          <Settings className="h-5 w-5 mr-3" />
          Configuración
        </Button>

        <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700">
          <Moon className="h-5 w-5 mr-3" />
          Modo Oscuro
        </Button>

        <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700" onClick={onLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
} 