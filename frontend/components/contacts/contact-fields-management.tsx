"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { contactFieldsService, type ContactFieldDef } from "@/services/contact-fields-service"
import { useToast } from "@/hooks/use-toast"

interface Props {
  clientId: number
  clientName: string
}

type NewField = Omit<ContactFieldDef, 'order'>

export function ContactFieldsManagement({ clientId, clientName }: Props) {
  const { toast } = useToast()
  const [fields, setFields] = useState<ContactFieldDef[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ContactFieldDef | null>(null)
  const [form, setForm] = useState<NewField>({ id: "", label: "", type: "text", required: false })

  const load = async () => {
    const res = await contactFieldsService.list(clientId)
    setFields(res.fields || [])
  }

  useEffect(() => { load() }, [clientId])

  const startNew = () => {
    setEditing(null)
    setForm({ id: "", label: "", type: "text", required: false })
    setOpen(true)
  }

  const startEdit = (f: ContactFieldDef) => {
    setEditing(f)
    const { order, ...rest } = f
    setForm(rest)
    setOpen(true)
  }

  const submit = async () => {
    try {
      if (!form.id || !form.label) {
        toast({ title: "Faltan datos", description: "ID y etiqueta son requeridos", variant: "destructive" })
        return
      }
      if (editing) {
        await contactFieldsService.update(clientId, editing.id, form)
        toast({ title: "Campo actualizado" })
      } else {
        await contactFieldsService.create(clientId, form)
        toast({ title: "Campo creado" })
      }
      setOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || 'No se pudo guardar', variant: "destructive" })
    }
  }

  const remove = async (f: ContactFieldDef) => {
    await contactFieldsService.remove(clientId, f.id)
    toast({ title: "Campo eliminado" })
    await load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos de Contactos</CardTitle>
        <CardDescription>Definiciones para {clientName}. Se aplican solo a este cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div className="text-sm text-muted-foreground">{fields.length} campos</div>
          <Button size="sm" onClick={startNew}>Nuevo campo</Button>
        </div>

        <div className="space-y-2">
          {fields.map(f => (
            <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{f.type}</Badge>
                <div>
                  <div className="font-medium">{f.label} <span className="text-muted-foreground">({f.id})</span></div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    {f.required && <span>Requerido</span>}
                    {f.placeholder && <span>placeholder: {f.placeholder}</span>}
                    {f.options && f.options.length > 0 && <span>opciones: {f.options.length}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(f)}>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => remove(f)}>Eliminar</Button>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-sm text-muted-foreground">Aún no hay campos definidos.</div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar campo' : 'Nuevo campo'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">ID</label>
                  <Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} disabled={!!editing} />
                </div>
                <div>
                  <label className="text-sm">Etiqueta</label>
                  <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Tipo</label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      {['text','number','email','tel','date','textarea','select','checkbox','radio'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Checkbox checked={!!form.required} onCheckedChange={(v: any) => setForm({ ...form, required: !!v })} />
                  <span>Requerido</span>
                </div>
              </div>
              <div>
                <label className="text-sm">Placeholder</label>
                <Input value={form.placeholder || ''} onChange={e => setForm({ ...form, placeholder: e.target.value })} />
              </div>
              {(form.type === 'select' || form.type === 'radio') && (
                <div>
                  <label className="text-sm">Opciones (separadas por coma)</label>
                  <Input value={(form.options || []).join(', ')} onChange={e => setForm({ ...form, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={submit}>{editing ? 'Guardar cambios' : 'Crear campo'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}


