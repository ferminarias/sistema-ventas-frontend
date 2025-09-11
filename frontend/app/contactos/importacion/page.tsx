"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ClientSelector } from "@/components/contacts/client-selector"
import { contactsService } from "@/services/contacts-service"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface ClientForContacts {
  id: number
  name: string
  description: string
  total_contacts: number
  has_contacts_table: boolean
  contacts_by_estado: Record<string, number>
}

interface ImportResult {
  message: string
  imported: number
  skipped: number
  updated: number
  errors: string[]
  total_processed: number
}

export default function ImportacionPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientForContacts[]>([])
  const [selected, setSelected] = useState<ClientForContacts | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importOptions, setImportOptions] = useState({
    skip_duplicates: true,
    update_existing: false,
    validate_emails: true
  })

  useEffect(() => {
    (async () => {
      const res = await contactsService.getAvailableClients()
      setClients(res.available_clients || [])
      setUserInfo(res.user_info || null)
    })()
  }, [])

  const downloadTemplate = async () => {
    if (!selected) {
      toast({ title: "Error", description: "Selecciona un cliente primero", variant: "destructive" })
      return
    }

    try {
      // Descargar plantilla desde el backend
      const response = await fetch(`/api/contacts/client/${selected.id}/import/template`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al generar plantilla')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `plantilla-contactos-${selected.name}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({ title: "Plantilla descargada", description: "Usa esta plantilla para importar contactos" })
    } catch (error) {
      toast({ title: "Error", description: "No se pudo generar la plantilla", variant: "destructive" })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|csv)$/i)) {
      toast({ title: "Error", description: "Solo se permiten archivos Excel (.xlsx) o CSV", variant: "destructive" })
      return
    }

    setFile(file)
    setResult(null)
    // Preview de primeras filas
    previewFile(file)
  }

  const [preview, setPreview] = useState<{ headers: string[]; rows: any[] } | null>(null)

  const previewFile = async (file: File) => {
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        if (lines.length === 0) return
        const headers = lines[0].split(',').map(h => h.trim())
        const rows = lines.slice(1, 6).map(l => {
          const cols = l.split(',')
          const obj: any = {}
          headers.forEach((h, i) => obj[h] = cols[i])
          return obj
        })
        setPreview({ headers, rows })
      } else {
        const XLSX = await import('xlsx')
        const data = await file.arrayBuffer()
        const wb = XLSX.read(data)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
        if (!json.length) return
        const headers = (json[0] || []).map((h: any) => String(h))
        const rows = json.slice(1, 6).map(r => {
          const obj: any = {}
          headers.forEach((h: string, i: number) => obj[h] = r[i])
          return obj
        })
        setPreview({ headers, rows })
      }
    } catch {
      setPreview(null)
    }
  }

  const handleImport = async () => {
    if (!selected || !file) return

    try {
      setImporting(true)
      setProgress(0)
      setResult(null)

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await contactsService.importContacts(selected.id, file, importOptions)
      
      clearInterval(progressInterval)
      setProgress(100)
      setResult(result)

      if (result.errors.length === 0) {
        toast({ 
          title: "Importación exitosa", 
          description: `Se importaron ${result.imported} contactos correctamente` 
        })
      } else {
        toast({ 
          title: "Importación con errores", 
          description: `${result.imported} contactos importados, ${result.errors.length} errores` 
        })
      }
    } catch (error: any) {
      setProgress(0)
      toast({ title: "Error", description: error.message || "Error al importar contactos", variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importación de Contactos</h1>
          <p className="text-muted-foreground">Importa contactos masivamente desde Excel o CSV</p>
        </div>
        <ClientSelector 
          clients={clients}
          selectedClient={selected}
          onSelectClient={setSelected as any}
          userInfo={userInfo}
          compact
        />
      </div>

      {selected ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Plantilla de ejemplo
              </CardTitle>
              <CardDescription>
                Descarga la plantilla con el formato correcto para {selected.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                La plantilla incluye todas las columnas necesarias y ejemplos de datos válidos.
              </div>
              <Button onClick={downloadTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla Excel
              </Button>
            </CardContent>
          </Card>

          {/* Importación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar archivo
              </CardTitle>
              <CardDescription>
                Selecciona tu archivo Excel o CSV para importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{file.name}</span>
                  <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
                </div>
              )}

              {/* Opciones de importación */}
              <div className="space-y-3 p-3 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings className="h-4 w-4" />
                  Opciones de importación
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={importOptions.skip_duplicates}
                      onCheckedChange={(v) => setImportOptions(prev => ({ ...prev, skip_duplicates: !!v }))}
                    />
                    <span>Saltar duplicados (por email)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={importOptions.update_existing}
                      onCheckedChange={(v) => setImportOptions(prev => ({ ...prev, update_existing: !!v }))}
                    />
                    <span>Actualizar contactos existentes</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={importOptions.validate_emails}
                      onCheckedChange={(v) => setImportOptions(prev => ({ ...prev, validate_emails: !!v }))}
                    />
                    <span>Validar formato de emails</span>
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="w-full"
              >
                {importing ? "Importando..." : "Importar contactos"}
              </Button>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Procesando archivo...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Selecciona un cliente para comenzar la importación.</div>
      )}

      {/* Resultados */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Resultado de la importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-muted-foreground">Importados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">Omitidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{result.updated}</div>
                <div className="text-sm text-muted-foreground">Actualizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Total procesados: {result.total_processed} filas
            </div>

            {result.errors.length > 0 && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errores encontrados:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                    {result.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
