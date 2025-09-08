"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useVentas } from "@/hooks/useVentas"
import { Badge } from "@/components/ui/badge"

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
        <CardTitle className="text-sm font-semibold text-center">{titulo}</CardTitle>
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
