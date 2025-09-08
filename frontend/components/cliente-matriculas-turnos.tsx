"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useVentas } from "@/hooks/useVentas"
import { Badge } from "@/components/ui/badge"
import { ImageDown } from "lucide-react"

type Turno = "manana" | "tarde" | ""
const OBJETIVO_DIA = 3

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function sameDayStr(dateStr?: string, target?: string) {
  if (!dateStr || !target) return false
  // admite ISO o YYYY-MM-DD
  const only = dateStr.slice(0, 10)
  return only === target
}

interface Props {
  clientId: number
  clientName?: string
}

export function ClienteMatriculasTurnos({ clientId, clientName }: Props) {
  // Cargamos ventas filtrando por clientId
  const { ventas, loading } = useVentas(String(clientId))
  const [open, setOpen] = useState(false)
  const [editingDate, setEditingDate] = useState<"today" | "yesterday">("today")
  const today = useMemo(() => formatDate(new Date()), [])
  const yesterday = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return formatDate(d)
  }, [])

  const storageKey = (dayKey: "today" | "yesterday") =>
    `matriculas:turnos:v1:client:${clientId}:date:${dayKey === "today" ? today : yesterday}`

  // Cargar asignaciones desde localStorage
  const [turnosToday, setTurnosToday] = useState<Record<string, Turno>>({})
  const [turnosYesterday, setTurnosYesterday] = useState<Record<string, Turno>>({})

  useEffect(() => {
    try {
      const t = localStorage.getItem(storageKey("today"))
      const y = localStorage.getItem(storageKey("yesterday"))
      setTurnosToday(t ? JSON.parse(t) : {})
      setTurnosYesterday(y ? JSON.parse(y) : {})
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const ventasToday = useMemo(() => ventas.filter(v => sameDayStr(v.fecha_venta, today)), [ventas, today])
  const ventasYesterday = useMemo(() => ventas.filter(v => sameDayStr(v.fecha_venta, yesterday)), [ventas, yesterday])

  // Auto-asignar por defecto a mañana si no tiene turno asignado
  useEffect(() => {
    const autoAssignTurno = (ventasList: typeof ventas, turnos: Record<string, Turno>, setTurnos: React.Dispatch<React.SetStateAction<Record<string, Turno>>>) => {
      let hasChanges = false
      const newTurnos = { ...turnos }
      
      ventasList.forEach(v => {
        const id = String(v.id)
        if (!newTurnos[id]) {
          newTurnos[id] = "manana" // Por defecto a mañana
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        setTurnos(newTurnos)
      }
    }

    if (ventasToday.length > 0) {
      autoAssignTurno(ventasToday, turnosToday, setTurnosToday)
    }
    if (ventasYesterday.length > 0) {
      autoAssignTurno(ventasYesterday, turnosYesterday, setTurnosYesterday)
    }
  }, [ventasToday, ventasYesterday, turnosToday, turnosYesterday])

  // Dataset que se está editando en el modal
  const ventasEditing = editingDate === "today" ? ventasToday : ventasYesterday
  const turnosEditing = editingDate === "today" ? turnosToday : turnosYesterday
  const setTurnosEditing = editingDate === "today" ? setTurnosToday : setTurnosYesterday

  const countByTurno = (asigs: Record<string, Turno>, ventasList: typeof ventas) => {
    let manana = 0, tarde = 0
    ventasList.forEach(v => {
      const t = asigs[String(v.id)] || ""
      if (t === "manana") manana++
      if (t === "tarde") tarde++
    })
    return { manana, tarde, total: manana + tarde }
  }

  const resToday = countByTurno(turnosToday, ventasToday)
  const resYesterday = countByTurno(turnosYesterday, ventasYesterday)

  const pct = (val: number, objetivo: number) => `${Math.round((objetivo ? (val / objetivo) : 0) * 100)}%`

  const guardar = () => {
    const key = storageKey(editingDate)
    localStorage.setItem(key, JSON.stringify(turnosEditing))
    setOpen(false)
  }

  const abrirEdicion = (day: "today" | "yesterday") => {
    setEditingDate(day)
    setOpen(true)
  }

  // Exportar tabla como imagen PNG (sin dependencias)
  const downloadTableAsImage = (
    titulo: string,
    data: {manana: number; tarde: number; total: number},
    objetivo: number,
    opts?: { filename?: string }
  ) => {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3))
    const width = 720
    const rowH = 40
    const headerH = 46
    const footerH = 10
    const rows = 3
    const height = headerH + rows * rowH + footerH

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // Fondo
    ctx.fillStyle = '#0f172a' // slate-900
    ctx.fillRect(0, 0, width, height)

    // Header
    ctx.fillStyle = '#1e3a8a' // blue-800
    ctx.fillRect(0, 0, width, headerH)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Inter, system-ui, -apple-system, Segoe UI, Roboto'
    ctx.textBaseline = 'middle'
    ctx.fillText(titulo, 16, headerH / 2)

    // Column titles
    const cols = [
      { label: 'Detalle', w: 280 },
      { label: 'Objetivo', w: 140 },
      { label: 'Real', w: 140 },
      { label: 'Alcance', w: 160 },
    ]
    let x = 0
    let y = headerH
    ctx.fillStyle = '#1e3a8a'
    ctx.fillRect(0, y, width, 32)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 12px Inter, system-ui, -apple-system, Segoe UI, Roboto'
    x = 16
    const colXs: number[] = []
    cols.forEach((c, i) => {
      colXs.push(x)
      ctx.fillText(c.label, x, y + 16)
      x += c.w
    })

    // Rows helper
    const drawRow = (cells: string[], idx: number, isTotal = false) => {
      const ry = headerH + 32 + idx * rowH
      // background
      ctx.fillStyle = isTotal ? '#1e3a8a' : (idx % 2 === 0 ? '#0b1220' : '#0e1626')
      ctx.fillRect(0, ry, width, rowH)
      // text
      ctx.fillStyle = isTotal ? '#ffffff' : '#e5e7eb'
      ctx.font = `${isTotal ? 'bold' : '600'} 13px Inter, system-ui, -apple-system, Segoe UI, Roboto`
      cells.forEach((text, i) => {
        const tx = colXs[i]
        ctx.fillText(text, tx, ry + rowH / 2)
      })
    }

    const objetivoManiana = Math.floor(objetivo / 2)
    const objetivoTarde = Math.ceil(objetivo / 2)

    drawRow([
      'Turno mañana',
      String(objetivoManiana),
      String(data.manana),
      pct(data.manana, objetivoManiana)
    ], 0)

    drawRow([
      'Turno tarde',
      String(objetivoTarde),
      String(data.tarde),
      pct(data.tarde, objetivoTarde)
    ], 1)

    drawRow([
      'Total',
      String(objetivo),
      String(data.total),
      pct(data.total, objetivo)
    ], 2, true)

    // Download
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    const fallbackName = `${titulo.replace(/\s+/g, '_').toLowerCase()}.png`
    a.download = opts?.filename || fallbackName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const moverVenta = (ventaId: string, nuevoTurno: Turno) => {
    const setTurnos = editingDate === "today" ? setTurnosToday : setTurnosYesterday
    setTurnos(prev => ({ ...prev, [ventaId]: nuevoTurno }))
    
    // Auto-guardar inmediatamente
    const key = storageKey(editingDate)
    const updated = { ...turnosEditing, [ventaId]: nuevoTurno }
    localStorage.setItem(key, JSON.stringify(updated))
  }

  const MiniTabla = ({
    titulo,
    data,
    objetivo,
    isToday = false
  }: {
    titulo: string
    data: { manana: number; tarde: number; total: number }
    objetivo: number
    isToday?: boolean
  }) => (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/40 text-white hover:bg-white/10"
            onClick={() => {
              const day = isToday ? today : yesterday
              const name = `${(clientName || `cliente-${clientId}`).replace(/\s+/g,'_').toLowerCase()}_${day}_${titulo.replace(/\s+/g,'_').toLowerCase()}.png`
              downloadTableAsImage(titulo, data, objetivo, { filename: name })
            }}
            title="Descargar imagen"
          >
            <ImageDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-0">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-800 hover:bg-blue-800">
                <TableHead className="text-white font-semibold text-center py-2">Detalle</TableHead>
                <TableHead className="text-white font-semibold text-center py-2">Objetivo</TableHead>
                <TableHead className="text-white font-semibold text-center py-2">Real</TableHead>
                <TableHead className="text-white font-semibold text-center py-2">Alcance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium text-center">Turno mañana</TableCell>
                <TableCell className="text-center">{Math.floor(objetivo / 2)}</TableCell>
                <TableCell className="text-center font-semibold">{data.manana}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={data.manana >= Math.floor(objetivo / 2) ? "default" : "secondary"}>
                    {pct(data.manana, Math.floor(objetivo / 2))}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium text-center">Turno tarde</TableCell>
                <TableCell className="text-center">{Math.ceil(objetivo / 2)}</TableCell>
                <TableCell className="text-center font-semibold">{data.tarde}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={data.tarde >= Math.ceil(objetivo / 2) ? "default" : "secondary"}>
                    {pct(data.tarde, Math.ceil(objetivo / 2))}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow className="bg-blue-800 hover:bg-blue-800">
                <TableCell className="font-bold text-white text-center">Total</TableCell>
                <TableCell className="font-bold text-white text-center">{objetivo}</TableCell>
                <TableCell className="font-bold text-white text-center">{data.total}</TableCell>
                <TableCell className="font-bold text-white text-center">
                  <Badge variant={data.total >= objetivo ? "default" : "destructive"} className="text-white">
                    {pct(data.total, objetivo)}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="p-3 bg-muted/30">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => abrirEdicion(isToday ? "today" : "yesterday")}
            className="w-full"
          >
            Gestionar turnos
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Panel de Matrículas por Turnos</h3>
          <p className="text-sm text-muted-foreground">
            {clientName || `Cliente #${clientId}`} • Objetivo diario: {OBJETIVO_DIA} matrículas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniTabla 
          titulo="Matrículas (cierre parcial)" 
          data={resToday} 
          objetivo={OBJETIVO_DIA} 
          isToday={true}
        />
        <MiniTabla 
          titulo="Matrículas (cierre día anterior)" 
          data={resYesterday} 
          objetivo={OBJETIVO_DIA} 
          isToday={false}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center">
              {editingDate === "today" ? "Gestionar Turnos - HOY" : "Gestionar Turnos - AYER"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-hidden">
            {loading && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">Cargando ventas...</div>
              </div>
            )}

            {!loading && ventasEditing.length === 0 && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">No hay ventas para este día.</div>
              </div>
            )}

            {!loading && ventasEditing.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[50vh]">
                {/* Columna Turno Mañana */}
                <Card>
                  <CardHeader className="py-3 bg-orange-100 dark:bg-orange-900">
                    <CardTitle className="text-sm font-semibold text-center">
                      🌅 Turno Mañana ({ventasEditing.filter(v => turnosEditing[String(v.id)] === "manana").length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-2 min-h-[200px]">
                    {ventasEditing
                      .filter(v => turnosEditing[String(v.id)] === "manana")
                      .map(v => (
                        <div 
                          key={v.id} 
                          className="p-2 bg-muted/50 rounded-md border cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => moverVenta(String(v.id), "tarde")}
                        >
                          <div className="text-sm font-medium">
                            {String(v.nombre || "")} {String(v.apellido || "")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Venta #{String(v.id)} • {String(v.email || "")}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Click para mover a tarde →
                          </div>
                        </div>
                      ))}
                    {ventasEditing.filter(v => turnosEditing[String(v.id)] === "manana").length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        No hay ventas asignadas a la mañana
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Columna Turno Tarde */}
                <Card>
                  <CardHeader className="py-3 bg-blue-100 dark:bg-blue-900">
                    <CardTitle className="text-sm font-semibold text-center">
                      🌆 Turno Tarde ({ventasEditing.filter(v => turnosEditing[String(v.id)] === "tarde").length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 space-y-2 min-h-[200px]">
                    {ventasEditing
                      .filter(v => turnosEditing[String(v.id)] === "tarde")
                      .map(v => (
                        <div 
                          key={v.id} 
                          className="p-2 bg-muted/50 rounded-md border cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => moverVenta(String(v.id), "manana")}
                        >
                          <div className="text-sm font-medium">
                            {String(v.nombre || "")} {String(v.apellido || "")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Venta #{String(v.id)} • {String(v.email || "")}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            ← Click para mover a mañana
                          </div>
                        </div>
                      ))}
                    {ventasEditing.filter(v => turnosEditing[String(v.id)] === "tarde").length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        No hay ventas asignadas a la tarde
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
