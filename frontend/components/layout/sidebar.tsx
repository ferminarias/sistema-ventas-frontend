"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileSpreadsheet, Home, Plus, Settings, Users, Search, FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const [isClientsOpen, setIsClientsOpen] = useState(true)
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-64">
      <div className="flex h-screen max-h-screen flex-col">
        {/* Header fijo */}
        <div className="flex h-16 items-center justify-center border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm font-bold">SISTEMA VENTAS NODS</span>
          </Link>
        </div>
        
        {/* Área de navegación con scroll */}
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-2 py-2">
            {/* Dashboard */}
            <Button 
              asChild 
              variant={pathname === "/" || pathname === "/dashboard" ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            {/* Clientes desplegable */}
            <Collapsible open={isClientsOpen} onOpenChange={setIsClientsOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Clientes
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isClientsOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-2 mt-1">
                <Button 
                  asChild 
                  variant={pathname === "/clientes/anahuac" ? "default" : "ghost"} 
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Link href="/clientes/anahuac">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                    Anahuac
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant={pathname === "/clientes/cesa" ? "default" : "ghost"} 
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Link href="/clientes/cesa">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                    Cesa
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant={pathname === "/clientes/faro" ? "default" : "ghost"} 
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Link href="/clientes/faro">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                    Faro
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant={pathname === "/clientes/aliat" ? "default" : "ghost"} 
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Link href="/clientes/aliat">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-3"></div>
                    Aliat
                  </Link>
                </Button>
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

            {/* Administración desplegable */}
            <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Administración
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAdminOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-2 mt-1">
                <Button 
                  asChild 
                  variant={pathname === "/admin/usuarios" ? "default" : "ghost"} 
                  className="w-full justify-start text-sm"
                  size="sm"
                >
                  <Link href="/admin/usuarios">
                    <Users className="mr-2 h-3 w-3" />
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
                    <FileText className="mr-2 h-3 w-3" />
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
                    <Users className="mr-2 h-3 w-3" />
                    Gestión de Asesores
                  </Link>
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Búsqueda de Comprobante */}
            <Button 
              asChild 
              variant={pathname === "/comprobantes" ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <Link href="/comprobantes">
                <Search className="mr-2 h-4 w-4" />
                Búsqueda de Comprobante
              </Link>
            </Button>

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
        </ScrollArea>
        
        {/* Footer fijo */}
        <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
} 