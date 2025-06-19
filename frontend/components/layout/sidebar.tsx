"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, FileSpreadsheet, Home, Plus, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

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
            <Button asChild variant={pathname === "/" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/">
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
              <CollapsibleContent className="space-y-1">
                <Button asChild variant="ghost" className="w-full justify-start pl-8">
                  <Link href="/clientes/anahuac">Anahuac</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start pl-8">
                  <Link href="/clientes/cesa">Cesa</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start pl-8">
                  <Link href="/clientes/faro">Faro</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start pl-8">
                  <Link href="/clientes/aliat">Aliat</Link>
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Button asChild variant={pathname === "/nueva-venta" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/nueva-venta">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Venta
              </Link>
            </Button>

            <Button asChild variant={pathname === "/exportar" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/exportar">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Link>
            </Button>

            <Button asChild variant={pathname === "/configuracion" ? "default" : "ghost"} className="w-full justify-start">
              <Link href="/configuracion">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </Button>
          </div>
        </ScrollArea>
        <div className="mt-auto p-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
} 