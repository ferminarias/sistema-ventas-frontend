"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BarChart3, FileSpreadsheet, Home, Menu, Plus, Settings, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

export function MobileHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
                <BarChart3 className="h-6 w-6" />
                <span className="text-lg font-bold">SISTEMA VENTAS NODS</span>
              </Link>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid gap-1 px-2">
                <Button
                  asChild
                  variant={pathname === "/" ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <div className="py-2">
                  <div className="px-3 text-sm font-medium">Clientes</div>
                  <div className="grid gap-1 pl-1 pt-1">
                    <Button
                      asChild
                      variant={pathname === "/clientes/aliat" ? "default" : "ghost"}
                      className="justify-start pl-6"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/clientes/aliat">Aliat</Link>
                    </Button>
                    <Button
                      asChild
                      variant={pathname === "/clientes/anahuac" ? "default" : "ghost"}
                      className="justify-start pl-6"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/clientes/anahuac">Anahuac</Link>
                    </Button>
                    <Button
                      asChild
                      variant={pathname === "/clientes/cesa" ? "default" : "ghost"}
                      className="justify-start pl-6"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/clientes/cesa">Cesa</Link>
                    </Button>
                    <Button
                      asChild
                      variant={pathname === "/clientes/faro" ? "default" : "ghost"}
                      className="justify-start pl-6"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/clientes/faro">Faro</Link>
                    </Button>
                  </div>
                </div>
                <Button
                  asChild
                  variant={pathname === "/nueva-venta" ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/nueva-venta">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Venta
                  </Link>
                </Button>
                {/* Administrador de Ventas */}
                {user && (user.role === "admin" || user.role === "supervisor") && (
                  <Button
                    asChild
                    variant={pathname === "/admin-ventas" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/admin-ventas">
                      <Shield className="mr-2 h-4 w-4" />
                      Administrador de Ventas
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/reportes">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Reportes
                  </Link>
                </Button>
              </nav>
            </div>
            <div className="flex items-center justify-between border-t p-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="#">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Configuración</span>
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1 items-center justify-center text-center">
        <Link href="/" className="flex items-center justify-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span className="font-bold">SISTEMA VENTAS NODS</span>
        </Link>
      </div>
    </header>
  )
} 