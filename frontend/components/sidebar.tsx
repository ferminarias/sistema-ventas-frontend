"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, FileSpreadsheet, Home, Plus, Settings, Users, LogOut, UserCog, Building2, Moon, UserPlus } from "lucide-react"
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

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [clients, setClients] = useState<Client[]>([])

  // Obtener clientes al montar el sidebar
  useEffect(() => {
    fetch("/api/clientes", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
        else setClients([]);
      })
      .catch(() => setClients([]))
  }, [])

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center justify-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6" />
            <span className="text-lg font-bold">SISTEMA VENTAS NODS</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1 p-2">
            <Button asChild variant={pathname === "/dashboard" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Clientes
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 pt-1">
                <div className="flex flex-col space-y-1">
                  {(() => {
                    const filteredClients = getClientsByUser(user, clients)
                    return Array.isArray(filteredClients) && filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <Button
                          asChild
                          key={String(client.id)}
                          variant={pathname === `/clientes/${client.id}` ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Link href={`/clientes/${client.id}`}>{client.name}</Link>
                        </Button>
                      ))
                    ) : (
                      <div className="text-gray-400 pl-2">No hay clientes disponibles</div>
                    )
                  })()}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button asChild variant={pathname === "/nueva-venta" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/nueva-venta">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Link>
            </Button>

            {user.role === "admin" && (
              <>
                <Button asChild variant={pathname === "/admin" ? "default" : "ghost"} className="w-full justify-start">
                  <Link href="/admin">
                    <UserCog className="mr-2 h-4 w-4" />
                    Administración
                  </Link>
                </Button>
                <Button asChild variant={pathname === "/admin/usuarios" ? "default" : "ghost"} className="w-full justify-start pl-8">
                  <Link href="/admin/usuarios">
                    <UserCog className="mr-2 h-4 w-4" />
                    Gestión de Usuarios
                  </Link>
                </Button>
                <Button asChild variant={pathname === "/admin/clientes" ? "default" : "ghost"} className="w-full justify-start pl-8">
                  <Link href="/admin/clientes">
                    <Building2 className="mr-2 h-4 w-4" />
                    Gestión de Clientes
                  </Link>
                </Button>
                <Button asChild variant={pathname === "/asesores" ? "default" : "ghost"} className="w-full justify-start pl-8">
                  <Link href="/asesores">
                    <UserCog className="mr-2 h-4 w-4" />
                    Gestión de Asesores
                  </Link>
                </Button>
              </>
            )}

            <Button asChild variant={pathname === "/reportes" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/reportes">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Reportes
              </Link>
            </Button>
          </div>
        </ScrollArea>
        <div className="mt-auto p-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.username}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
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
