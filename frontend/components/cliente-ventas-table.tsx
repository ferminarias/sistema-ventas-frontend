"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useVentas } from "@/hooks/useVentas"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { API_BASE, getAuthHeaders } from "@/lib/api"

interface ClienteVentasTableProps {
  cliente: string
  clientId?: number
}

export function ClienteVentasTable({ cliente, clientId }: ClienteVentasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("10")
  const [sortBy, setSortBy] = useState("fecha_venta")
  const [sortOrder, setSortOrder] = useState("desc")
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false)
  const [exportMode, setExportMode] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [useBasicColumns, setUseBasicColumns] = useState(false)
  const [dynamicFieldDefs, setDynamicFieldDefs] = useState<Array<{id:string;label:string;type:string;options?:string[]}>>([])

  // Cargar campos dinámicos al montar el componente
  useEffect(() => {
    if (clientId) {
      console.log(`🚀 Montando componente con clientId: ${clientId}`)
      loadDynamicDefs()
    }
  }, [clientId])

  // Validación defensiva para cliente
  if (!cliente || cliente === "null" || cliente === "undefined") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando información del cliente...</div>
        </CardContent>
      </Card>
    )
  }

  const { ventas, loading, error, exportarExcel } = useVentas((clientId ? String(clientId) : cliente).toLowerCase())
  const { user } = useAuth()
  const { toast } = useToast()

  type ColumnDef = {
    id: string
    label: string
    accessor: (venta: any) => string
    isCustom?: boolean
  }

  const storageKey = `salesTable:columns:v1:${user?.id || "anonymous"}:${cliente}`
  const loadPrefs = (): { visible: string[]; order: string[] } | null => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const savePrefs = (visible: string[], order: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ visible, order }))
    } catch {}
  }

  const BASE_COLUMNS: ColumnDef[] = [
    { id: "id", label: "ID", accessor: v => String(v.id ?? "") },
    { id: "nombre", label: "Nombre", accessor: v => String(v.nombre ?? "") },
    { id: "apellido", label: "Apellido", accessor: v => String(v.apellido ?? "") },
    { id: "email", label: "Email", accessor: v => String(v.email ?? "") },
    { id: "telefono", label: "Teléfono", accessor: v => String(v.telefono ?? "") },
    { id: "asesor", label: "Asesor", accessor: v => String(v.asesor ?? "") },
    { id: "fecha_venta", label: "Fecha", accessor: v => String(v.fecha_venta ?? "") },
    { id: "cliente", label: "Cliente", accessor: v => String(v.cliente ?? "") },
  ]

  // Columnas dinámicas según definición del cliente (GET /api/clientes/:id/campos)
  const CUSTOM_COLUMNS: ColumnDef[] = dynamicFieldDefs
    .filter(def => !["nombre","apellido","email","telefono","asesor","fecha_venta","cliente","id"].includes(def.id))
    .map(def => ({
      id: `campos_adicionales.${def.id}`,
      label: def.label || def.id,
      accessor: v => {
        const top = v?.[def.id]
        const raw = top != null ? top : (v.campos_adicionales || {})[def.id]
        if (raw == null) return ""
        if (def.type === 'date') return String(raw)
        if (def.type === 'select' && def.options && def.options.length) return String(raw)
        return typeof raw === 'string' ? raw : String(raw)
      },
      isCustom: true,
    }))

  const ALL_COLUMNS: ColumnDef[] = [...BASE_COLUMNS, ...CUSTOM_COLUMNS]

  const prefs = loadPrefs()
  const defaultVisible = prefs?.visible || BASE_COLUMNS.map(c => c.id)
  const defaultOrder = prefs?.order || ALL_COLUMNS.map(c => c.id)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder)
  const [dialogVisible, setDialogVisible] = useState<string[]>(defaultVisible)
  const [dialogOrder, setDialogOrder] = useState<string[]>(defaultOrder)

  const moveColumn = (id: string, direction: "up" | "down") => {
    setColumnOrder(prev => {
      const idx = prev.indexOf(id)
      if (idx === -1) return prev
      const next = [...prev]
      const swapWith = direction === "up" ? idx - 1 : idx + 1
      if (swapWith < 0 || swapWith >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[swapWith]
      next[swapWith] = tmp
      return next
    })
  }

  const orderedColumns = columnOrder
    .map(id => ALL_COLUMNS.find(c => c.id === id))
    .filter((c): c is ColumnDef => !!c)
  const renderColumns = orderedColumns.filter(c => visibleColumns.includes(c.id))

  // Cargar definiciones de campos dinámicos al abrir el gestor
  const loadDynamicDefs = async () => {
    try {
      const id = clientId ? String(clientId) : undefined
      if (!id) {
        console.log('❌ No hay clientId para cargar campos dinámicos')
        return
      }
      
      console.log(`🔄 Cargando campos dinámicos para cliente ${id}...`)
      const res = await fetch(`${API_BASE}/api/clientes/${id}/campos`, { 
        headers: getAuthHeaders(false), 
        credentials: 'include' 
      })
      
      console.log(`📡 Response status: ${res.status}`)
      
      if (!res.ok) {
        console.error(`❌ Error en la respuesta: ${res.status} ${res.statusText}`)
        const errorText = await res.text().catch(() => 'No se pudo leer el error')
        console.error(`❌ Error details:`, errorText)
        return
      }
      
      const data = await res.json()
      console.log(`📊 Datos recibidos del backend:`, data)
      
      const defs = Array.isArray(data?.fields) ? data.fields : data
      console.log(`📋 Campos procesados:`, defs)
      
      const mapped = defs.map((f: any) => ({ 
        id: String(f.id), 
        label: String(f.label ?? f.id), 
        type: String(f.type || 'text'), 
        options: Array.isArray(f.options) ? f.options : undefined 
      }))
      
      console.log(`🎯 Campos mapeados:`, mapped)
      setDynamicFieldDefs(mapped)

      // Asegurar que las nuevas columnas dinámicas existan en el orden del diálogo y global
      const baseIds = new Set(["id","nombre","apellido","email","telefono","asesor","fecha_venta","cliente"])
      const newDynamicIds = mapped
        .filter((def: {id:string}) => !baseIds.has(def.id))
        .map((def: {id:string}) => `campos_adicionales.${def.id}`)

      console.log(`🔧 Nuevas columnas dinámicas:`, newDynamicIds)

      setDialogOrder((prev: string[]) => {
        const setPrev = new Set(prev)
        const merged = [...prev]
        newDynamicIds.forEach((id: string) => { if (!setPrev.has(id)) merged.push(id) })
        console.log(`📝 Dialog order actualizado:`, merged)
        return merged
      })

      setColumnOrder((prev: string[]) => {
        const setPrev = new Set(prev)
        const merged = [...prev]
        newDynamicIds.forEach((id: string) => { if (!setPrev.has(id)) merged.push(id) })
        console.log(`📝 Column order actualizado:`, merged)
        return merged
      })
      
      console.log(`✅ Campos dinámicos cargados exitosamente: ${mapped.length} campos`)
    } catch (error) {
      console.error('❌ Error cargando campos dinámicos:', error)
    }
  }

  // Filtrar ventas por término de búsqueda
  const filteredVentas = ventas.filter(
    (venta) =>
      (venta.nombre?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.apellido?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.email?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.asesor?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (venta.cliente?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  // Ordenar ventas
  const sortedVentas = [...filteredVentas].sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a]
    const bValue = b[sortBy as keyof typeof b]
    if (aValue === undefined || bValue === undefined) return 0
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Paginación
  const totalPages = Math.ceil(sortedVentas.length / Number.parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * Number.parseInt(itemsPerPage)
  const paginatedVentas = sortedVentas.slice(startIndex, startIndex + Number.parseInt(itemsPerPage))

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando ventas...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Ventas - {cliente}</CardTitle>
        <CardDescription>Lista completa de todas las ventas registradas para {cliente}</CardDescription>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ventas..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={async () => {
              setDialogVisible(visibleColumns)
              setDialogOrder(columnOrder)
              await loadDynamicDefs()
              setManageColumnsOpen(true)
            }}>
              Editar columnas
            </Button>
            <Button variant="outline" onClick={async () => {
              // Asegurar que los campos dinámicos estén cargados
              await loadDynamicDefs()
              
              const cols = renderColumns
              const header = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(",")
              const rows = sortedVentas.map(v => cols.map(c => `"${String(c.accessor(v) ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(","))
              const csv = [header, ...rows].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `ventas_${cliente}_personalizado.csv`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}>
              Exportar CSV personalizado
            </Button>
            <Button onClick={async () => { 
              // Cargar campos dinámicos ANTES de abrir el diálogo
              await loadDynamicDefs()
              
              setExportMode(true)
              setDialogVisible(visibleColumns)
              setDialogOrder(columnOrder)
              setManageColumnsOpen(true) 
            }}>
              Exportar Excel
            </Button>
            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="10 por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 por página</SelectItem>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                {renderColumns.map(col => (
                  <TableHead key={col.id} onClick={() => handleSort(col.id)}>
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVentas.length > 0 ? (
                paginatedVentas.map((venta) => (
                  <TableRow key={venta.id}>
                    {renderColumns.map(col => (
                      <TableCell key={col.id}>{col.accessor(venta)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={renderColumns.length || 1} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{startIndex + 1}</span> a{" "}
              <span className="font-medium">
                {Math.min(startIndex + Number.parseInt(itemsPerPage), filteredVentas.length)}
              </span>{" "}
              de <span className="font-medium">{filteredVentas.length}</span> resultados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Página anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Página siguiente</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {/* Gestor de columnas */}
      <Dialog open={manageColumnsOpen} onOpenChange={(open) => { setManageColumnsOpen(open); if (!open) setExportMode(false) }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{exportMode ? 'Exportar Excel personalizado' : 'Configurar columnas'}</DialogTitle>
            <DialogDescription>
              Selecciona y reordena las columnas que quieres ver en la tabla.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 overflow-hidden">
            {exportMode && (
              <div className="mb-1 flex items-center gap-2 text-sm">
                <Checkbox id="basic-cols" checked={useBasicColumns} onCheckedChange={(v) => setUseBasicColumns(!!v)} />
                <label htmlFor="basic-cols" className="cursor-pointer select-none">Usar columnas básicas (ignorar selección de la vista)</label>
              </div>
            )}
            <div className="space-y-2 text-xs text-muted-foreground">
              Seleccionadas: {dialogVisible.length}
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[58vh] pr-1">
              {dialogOrder
                .map((id: string) => ALL_COLUMNS.find(c => c.id === id))
                .filter((c): c is ColumnDef => !!c)
                .map((col: ColumnDef) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between gap-2"
                  draggable
                  onDragStart={() => setDraggingId(col.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!draggingId || draggingId === col.id) return
                    setDialogOrder((prev: string[]) => {
                      const next = [...prev]
                      const from = next.indexOf(draggingId)
                      const to = next.indexOf(col.id)
                      if (from === -1 || to === -1) return prev
                      next.splice(to, 0, next.splice(from, 1)[0])
                      return next
                    })
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={dialogVisible.includes(col.id)}
                      onCheckedChange={(checked) => {
                        setDialogVisible((prev: string[]) => {
                          const next = new Set(prev)
                          if (checked) {
                            next.add(col.id)
                          } else {
                            next.delete(col.id)
                          }
                          return Array.from(next)
                        })
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium">{col.label}</div>
                      <div className="text-xs text-muted-foreground">{col.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDialogOrder((prev: string[]) => { const idx = prev.indexOf(col.id); if (idx <= 0) return prev; const nx = [...prev]; const t = nx[idx-1]; nx[idx-1] = nx[idx]; nx[idx] = t; return nx })}>↑</Button>
                    <Button variant="outline" size="sm" onClick={() => setDialogOrder((prev: string[]) => { const idx = prev.indexOf(col.id); if (idx === -1 || idx === prev.length-1) return prev; const nx = [...prev]; const t = nx[idx+1]; nx[idx+1] = nx[idx]; nx[idx] = t; return nx })}>↓</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {!exportMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const defVisible = BASE_COLUMNS.map(c => c.id)
                    const defOrder = ALL_COLUMNS.map(c => c.id)
                    setVisibleColumns(defVisible)
                    setColumnOrder(defOrder)
                    savePrefs(defVisible, defOrder)
                    setManageColumnsOpen(false)
                  }}
                >
                  Restablecer
                </Button>
                <Button
                  onClick={() => {
                    // Aplicar cambios del diálogo
                    setVisibleColumns(dialogVisible)
                    setColumnOrder(dialogOrder)
                    savePrefs(dialogVisible, dialogOrder)
                    setManageColumnsOpen(false)
                  }}
                >
                  Aceptar
                </Button>
              </>
            )}
            {exportMode && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Exportar Excel personalizado como .xls (HTML table)
                    const cols = useBasicColumns
                      ? BASE_COLUMNS
                      : dialogOrder
                          .map(id => ALL_COLUMNS.find(c => c.id === id))
                          .filter((c): c is ColumnDef => !!c)
                          .filter(c => dialogVisible.includes(c.id))
                    const header = cols.map(c => `<th>${c.label}</th>`).join("")
                    const rows = sortedVentas.map(v => {
                      const tds = cols.map(c => `<td>${(c.accessor(v) || '').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td>`).join("")
                      return `<tr>${tds}</tr>`
                    }).join("")
                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table>${`<thead><tr>${header}</tr></thead><tbody>${rows}</tbody>`}</table></body></html>`
                    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `ventas_${cliente}_personalizado.xls`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    setManageColumnsOpen(false)
                    setExportMode(false)
                  }}
                >
                  Exportar Excel personalizado
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Exportar CSV personalizado desde el modal
                    const cols = useBasicColumns
                      ? BASE_COLUMNS
                      : dialogOrder
                          .map(id => ALL_COLUMNS.find(c => c.id === id))
                          .filter((c): c is ColumnDef => !!c)
                          .filter(c => dialogVisible.includes(c.id))
                    const header = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(",")
                    const rows = sortedVentas.map(v => cols.map(c => `"${String(c.accessor(v) ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(","))
                    const csv = [header, ...rows].join("\n")
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `ventas_${cliente}_personalizado.csv`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    setManageColumnsOpen(false)
                    setExportMode(false)
                  }}
                >
                  Exportar CSV personalizado
                </Button>
                <Button
                  onClick={() => {
                    exportarExcel()
                    setManageColumnsOpen(false)
                    setExportMode(false)
                  }}
                >
                  Exportar Excel (backend)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
