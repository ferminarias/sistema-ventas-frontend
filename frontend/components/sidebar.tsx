"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, FileSpreadsheet, Home, Plus, Settings, Users, LogOut, UserCog, Building2, Moon, UserPlus, FileSearch, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { authService } from "@/services/auth-service"
import type { User } from "@/types/auth"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getClientsByUser } from "@/services/client-service"

interface SidebarProps {
  user: User
  onLogout: () => void
}

interface Client {
  id: number
  name: string
  description: string
  createdAt: string
  assignedUsers: number[]
  formConfig: any[]
}

// Mapeo de colores por cliente
const CLIENT_COLORS: Record<string, string> = {
  'Anahuac': 'bg-purple-500',
  'Cesa': 'bg-blue-500', 
  'Faro': 'bg-green-500',
  'Aliat': 'bg-orange-500',
  '1': 'bg-purple-500', // ID numérico para Anahuac
  '2': 'bg-blue-500',   // ID numérico para Cesa
  '3': 'bg-green-500',  // ID numérico para Faro
  '4': 'bg-orange-500', // ID numérico para Aliat
}

const getClientColor = (clientName: string, clientId: number) => {
  // Intentar por nombre primero
  if (CLIENT_COLORS[clientName]) {
    return CLIENT_COLORS[clientName]
  }
  // Luego por ID
  if (CLIENT_COLORS[String(clientId)]) {
    return CLIENT_COLORS[String(clientId)]
  }
  // Color por defecto basado en ID
  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500']
  return colors[clientId % colors.length]
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

  // Obtener clientes al montar el sidebar
  useEffect(() => {
    fetch("https://sistemas-de-ventas-production.up.railway.app/api/clientes", { 
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      credentials: "include" 
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
        else setClients([]);
      })
      .catch(() => setClients([]))
  }, [])

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-64 fixed left-0 top-0 z-40">
      <div className="flex flex-col" style={{ height: '100vh' }}>
        {/* Header fijo */}
        <div className="flex h-16 items-center justify-center border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm font-bold">SISTEMA VENTAS NODS</span>
          </Link>
        </div>
        
        {/* Área de navegación con scroll */}
        <div className="flex-1 overflow-y-auto px-3 py-2" style={{ minHeight: 0 }}>
          <div className="space-y-2 py-2">
            {/* Dashboard */}
            <Button 
              asChild 
              variant={pathname === "/dashboard" ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            {/* Clientes desplegable */}
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between group hover:bg-accent px-3 py-2 h-auto min-h-[2.5rem]">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Clientes</span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-300 shrink-0 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-2 mt-1">
                <div className="flex flex-col space-y-1">
                  {(() => {
                    const filteredClients = getClientsByUser(user, clients)
                    return Array.isArray(filteredClients) && filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <Button
                          asChild
                          key={String(client.id)}
                          variant={pathname === `/clientes/${client.id}` ? "default" : "ghost"}
                          className="w-full justify-start text-sm"
                          size="sm"
                        >
                          <Link href={`/clientes/${client.id}`}>
                            <div className={`w-2 h-2 rounded-full mr-3 ${getClientColor(client.name, client.id)}`}></div>
                            <span className="truncate">{typeof client.name === 'string' ? client.name : JSON.stringify(client.name)}</span>
                          </Link>
                        </Button>
                      ))
                    ) : (
                      <div className="text-gray-400 pl-2 text-sm">No hay clientes disponibles</div>
                    )
                  })()}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Nueva Venta */}
            <Button 
              asChild 
              variant={pathname === "/nueva-venta" ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <Link href="/nueva-venta">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Link>
            </Button>

            {/* Administrador de Ventas */}
            {(user.role === "admin" || user.role === "supervisor") && (
              <Button 
                asChild 
                variant={pathname === "/admin-ventas" ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Link href="/admin-ventas">
                  <Shield className="mr-2 h-4 w-4" />
                  Administrador de Ventas
                </Link>
              </Button>
            )}

            {/* Administración desplegable */}
            {user.role === "admin" && (
              <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen} className="w-full">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between group hover:bg-accent px-3 py-2 h-auto min-h-[2.5rem]">
                    <div className="flex items-center">
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Administración</span>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-300 shrink-0 ${isAdminOpen ? "rotate-180" : "rotate-0"}`}
                      style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 mt-1">
                  <div className="flex flex-col space-y-1">
                    <Button 
                      asChild 
                      variant={pathname === "/admin/usuarios" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      <Link href="/admin/usuarios">
                        <UserCog className="mr-2 h-3 w-3" />
                        Gestión de Usuarios
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant={pathname === "/admin/clientes" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      <Link href="/admin/clientes">
                        <Building2 className="mr-2 h-3 w-3" />
                        Gestión de Clientes
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant={pathname === "/admin/asesores" ? "default" : "ghost"} 
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      <Link href="/admin/asesores">
                        <UserCog className="mr-2 h-3 w-3" />
                        Gestión de Asesores
                      </Link>
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Búsqueda de Comprobantes */}
            {(user.role === "admin" || user.role === "supervisor") && (
              <Button 
                asChild 
                variant={pathname === "/comprobantes" ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Link href="/comprobantes">
                  <FileSearch className="mr-2 h-4 w-4" />
                  Búsqueda de Comprobantes
                </Link>
              </Button>
            )}

            {/* Reportes */}
            <Button 
              asChild 
              variant={pathname === "/reportes" ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <Link href="/reportes">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Reportes
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Footer fijo */}
        <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{String(user.username || user.name || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user.username || "Usuario"}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
