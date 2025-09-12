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
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Settings, History, Eye, Calendar, User, Clock, TrendingUp } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_BASE } from "@/lib/api"

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

interface ImportHistoryItem {
  id: string
  created_at: string
  user: string
  file_name: string
  imported: number
  skipped: number
  updated: number
  errors: number
  // Campos adicionales que podrían venir del backend
  filename?: string
  file_size?: number
  file_type?: string
  status?: 'processing' | 'completed' | 'failed'
  imported_count?: number
  skipped_count?: number
  error_count?: number
  success_rate?: number
  duration_seconds?: number
  started_at?: string
  user_name?: string
}

interface ImportDetails {
  id: string
  created_at: string
  summary: any
  errors: string[]
  // Campos adicionales que podrían venir del backend
  filename?: string
  stats?: {
    success_rate: number
    duration_formatted: string
    file_size_formatted: string
    rows_per_second: number
  }
  validation_errors?: string[] | null
  processing_errors?: string[] | null
}

interface ImportHistoryResponse {
  imports: ImportHistoryItem[]
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
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

  useEffect(() => {
    if (selected) {
      loadImportHistory()
    }
  }, [selected])

  const loadImportHistory = async () => {
    if (!selected) return
    
    setHistoryLoading(true)
    try {
      const response = await contactsService.getImportHistory(selected.id) as ImportHistoryResponse | ImportHistoryItem[]
      // El backend puede devolver { imports: ImportHistoryItem[], pagination: {...} } o directamente ImportHistoryItem[]
      const data = Array.isArray(response) ? response : (response?.imports || [])
      setImportHistory(data)
    } catch (error: any) {
      console.error('Error loading import history:', error)
      
      // Manejar errores específicos del backend
      let errorMessage = "Error al cargar historial"
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      }
      
      // Si es el error de 'User' object has no attribute 'name', mostrar mensaje más claro
      if (errorMessage.includes("'User' object has no attribute 'name'")) {
        errorMessage = "Error en el servidor: problema con la información del usuario. Contacta al administrador."
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      })
      setImportHistory([]) // Asegurar que siempre sea un array
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadImportDetails = async (importId: string) => {
    if (!selected) return
    
    try {
      const data = await contactsService.getImportDetails(selected.id, importId)
      setSelectedImport(data)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al cargar detalles", variant: "destructive" })
    }
  }

  const downloadTemplate = async () => {
    if (!selected) {
      toast({ title: "Error", description: "Selecciona un cliente primero", variant: "destructive" })
      return
    }

    try {
      // Descargar plantilla desde el backend (URL absoluta)
      const response = await fetch(`${API_BASE}/api/contacts/client/${selected.id}/import/template`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        let description = 'Error al generar plantilla'
        try {
          const ct = response.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            const j = await response.json()
            description = j?.message || JSON.stringify(j)
          } else {
            const t = await response.text()
            if (t) description = t
          }
        } catch {}
        throw new Error(description)
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
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "No se pudo generar la plantilla", variant: "destructive" })
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
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([])
  const [selectedImport, setSelectedImport] = useState<ImportDetails | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const previewFile = async (file: File) => {
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        if (lines.length === 0) return
        
        // Mejor parsing de CSV que maneja comillas y comas dentro de campos
        const parseCSVLine = (line: string) => {
          const result = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }
        
        const headers = parseCSVLine(lines[0])
        const rows = lines.slice(1, 6).map(l => {
          const cols = parseCSVLine(l)
          const obj: any = {}
          headers.forEach((h, i) => obj[h] = cols[i] || '')
          return obj
        })
        setPreview({ headers, rows })
      } else {
        // Para archivos Excel, mostramos información del archivo
        setPreview({
          headers: ['Información del archivo'],
          rows: [
            { 'Información del archivo': `Nombre: ${file.name}` },
            { 'Información del archivo': `Tamaño: ${(file.size / 1024).toFixed(1)} KB` },
            { 'Información del archivo': `Tipo: ${file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}` },
            { 'Información del archivo': 'El archivo será procesado correctamente por el backend' }
          ]
        })
      }
    } catch (error) {
      console.error('Error previewing file:', error)
      setPreview({
        headers: ['Error'],
        rows: [
          { 'Error': 'No se pudo previsualizar el archivo. El archivo será procesado correctamente por el backend.' }
        ]
      })
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
      
      // Manejar errores específicos del backend
      let errorMessage = "Error al importar contactos"
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = error.error
      }
      
      // Si es un error de columnas, mostrar información más detallada
      if (errorMessage.includes("Faltan columnas obligatorias")) {
        const errorData = error
        if (errorData.found_columns && errorData.required_columns) {
          errorMessage = `Columnas requeridas: ${errorData.required_columns.join(", ")}\nColumnas encontradas: ${errorData.found_columns.join(", ")}`
        }
      }
      
      toast({ 
        title: "Error de importación", 
        description: errorMessage, 
        variant: "destructive" 
      })
      
      console.error("Error completo de importación:", error)
    } finally {
      setImporting(false)
      // Recargar historial después de importar
      if (selected) {
        loadImportHistory()
      }
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
              
              {/* Información sobre formato de columnas */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Formato de columnas requeridas:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>nombre</strong> - Nombre del contacto (sin asteriscos)</li>
                  <li>• <strong>apellido</strong> - Apellido del contacto (sin asteriscos)</li>
                  <li>• <strong>estado</strong> - Estado del contacto (sin asteriscos)</li>
                  <li>• Otras columnas opcionales: correo, telefono, telefono_whatsapp, programa_interes, etc.</li>
                </ul>
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

      {/* Historial de Importaciones */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Importaciones
                </CardTitle>
                <CardDescription>
                  Registro de todas las importaciones realizadas para {selected.name}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="failed">Fallidos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadImportHistory} disabled={historyLoading}>
                  <History className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando historial...
              </div>
            ) : !Array.isArray(importHistory) || importHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay importaciones registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Resultados</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Tasa de éxito</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(importHistory) ? importHistory : [])
                      .filter(item => statusFilter === 'all' || item.status === statusFilter)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(item.created_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{item.file_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.user}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                item.status === 'completed' ? 'default' :
                                item.status === 'processing' ? 'secondary' : 'destructive'
                              }
                            >
                              {item.status === 'completed' ? 'Completado' :
                               item.status === 'processing' ? 'Procesando' : 'Fallido'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex gap-4">
                                <span className="text-green-600 font-medium">{item.imported} importados</span>
                                <span className="text-blue-600">{item.skipped} omitidos</span>
                                <span className="text-red-600">{item.errors} errores</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.duration_seconds ? `${item.duration_seconds}s` : 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {item.success_rate ? `${item.success_rate.toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => loadImportDetails(item.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalles
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalles de Importación</DialogTitle>
                                  <DialogDescription>
                                    Información completa de la importación #{item.id}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedImport && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Resumen</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>Fecha:</span>
                                            <span className="font-medium">
                                              {new Date(selectedImport.created_at).toLocaleDateString('es-ES')}
                                            </span>
                                          </div>
                                          {selectedImport.stats && (
                                            <>
                                              <div className="flex justify-between">
                                                <span>Tasa de éxito:</span>
                                                <span className="font-medium">{selectedImport.stats.success_rate.toFixed(1)}%</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Duración:</span>
                                                <span className="font-medium">{selectedImport.stats.duration_formatted}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Tamaño del archivo:</span>
                                                <span className="font-medium">{selectedImport.stats.file_size_formatted}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Filas por segundo:</span>
                                                <span className="font-medium">{selectedImport.stats.rows_per_second.toFixed(1)}</span>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Archivo</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>Nombre:</span>
                                            <span className="font-medium">{selectedImport.filename || 'N/A'}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {selectedImport.errors && selectedImport.errors.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2 text-red-600">Errores</h4>
                                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                          <ul className="list-disc list-inside space-y-1 text-sm">
                                            {selectedImport.errors.map((error, i) => (
                                              <li key={i} className="text-red-700">{error}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {selectedImport.validation_errors && selectedImport.validation_errors.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2 text-red-600">Errores de Validación</h4>
                                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                          <ul className="list-disc list-inside space-y-1 text-sm">
                                            {selectedImport.validation_errors.map((error, i) => (
                                              <li key={i} className="text-red-700">{error}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {selectedImport.processing_errors && selectedImport.processing_errors.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2 text-orange-600">Errores de Procesamiento</h4>
                                        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                                          <ul className="list-disc list-inside space-y-1 text-sm">
                                            {selectedImport.processing_errors.map((error, i) => (
                                              <li key={i} className="text-orange-700">{error}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
