"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { contactsService, ImportContactsError, ImportExecutionResponse } from "@/services/contacts-service"
import { API_BASE } from "@/lib/api"

interface ImportContactsDialogProps {
  clientId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactsImported: () => void
}

export function ImportContactsDialog({ clientId, open, onOpenChange, onContactsImported }: ImportContactsDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped?: number
    updated?: number
    errors?: string[]
    message: string
    status?: number
    errorsFile?: string | null
    importId?: number
  } | null>(null)

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setImportResult(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Selecciona un archivo para importar",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setImportResult(null)

      const { data, status } = await contactsService.importContacts(clientId, selectedFile, {
        skip_duplicates: true,
        update_existing: false,
        validate_emails: true,
      })

      const summary = data as ImportExecutionResponse
      const hasErrors = status === 207 || (summary.errors?.length ?? 0) > 0

      setImportResult({
        imported: summary.imported,
        skipped: summary.skipped,
        updated: summary.updated,
        errors: summary.errors,
        message: summary.message,
        status,
        importId: summary.import_id,
        errorsFile: null,
      })

      toast({
        title: hasErrors ? "Importacion completada con advertencias" : "Importacion completada",
        description: hasErrors
          ? `${summary.imported} importados, ${summary.updated} actualizados, ${summary.errors.length} errores`
          : `Se importaron ${summary.imported} contactos correctamente`,
        variant: hasErrors ? "default" : undefined,
      })

      if (summary.imported > 0) {
        onContactsImported()
      }
    } catch (error) {
      const importError = error as ImportContactsError
      console.error("Error importing contacts:", importError)
      const details = (importError.details ?? {}) as Record<string, any>
      const validationErrors = Array.isArray(importError.validationErrors)
        ? importError.validationErrors
        : (Array.isArray(details.validation_errors) ? details.validation_errors : undefined)
      const errorsFile = importError.errorsFile || details.errors_file || null
      const importId = importError.importId || details.import_id

      setImportResult({
        imported: 0,
        errors: validationErrors,
        message: importError.message || "Error al importar contactos",
        status: importError.status,
        errorsFile,
        importId,
      })

      toast({
        title: "Error de importacion",
        description: importError.message || "Error al importar contactos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resolveErrorsFileUrl = (path?: string | null) => {
    if (!path) return null
    if (/^https?:/i.test(path)) {
      return path
    }
    const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE
    const normalized = path.startsWith("/") ? path.slice(1) : path
    return `${base}/${normalized}`
  }




  const downloadTemplate = () => {
    // Crear CSV template
    const headers = [
      'nombre',
      'apellido', 
      'correo',
      'telefono',
      'telefono_whatsapp',
      'estado',
      'programa_interes',
      'utm_medio',
      'utm_source',
      'utm_campaign',
      'utm_content',
      'notas'
    ]
    
    const csvContent = headers.join(',') + '\n' +
      'Juan,Perez,juan.perez@ejemplo.com,123456789,987654321,no contactado,Maestria en Marketing,email,google,spring_sale,logolink,Contacto de ejemplo'
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'plantilla_contactos.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setImportResult(null)
    setDragActive(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Contactos</DialogTitle>
          <DialogDescription>
            Importa contactos desde un archivo Excel o CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" />
                Plantilla de Importacion
              </CardTitle>
              <CardDescription>
                Descarga la plantilla para ver el formato requerido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla CSV
              </Button>
            </CardContent>
          </Card>

          {/* Area de carga */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar Archivo</CardTitle>
              <CardDescription>
                Arrastra un archivo aqui o haz clic para seleccionar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Cambiar archivo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        Arrastra tu archivo aqui
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="mt-4">
                <Label className="text-sm text-muted-foreground">
                  Formatos soportados: Excel (.xlsx, .xls), CSV (.csv)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Resultado de importacion */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {(importResult.status && importResult.status !== 200) || (importResult.errors && importResult.errors.length > 0) ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  Resultado de importacion
                </CardTitle>
                {importResult.status && (
                  <CardDescription>Codigo de respuesta: {importResult.status}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>{importResult.message}</AlertDescription>
                </Alert>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-green-600">{importResult.imported}</div>
                    <div className="text-sm text-muted-foreground">Importados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-purple-600">{importResult.updated ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Actualizados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-blue-600">{importResult.skipped ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Omitidos</div>
                  </div>
                </div>

                {typeof importResult.importId === "number" && (
                  <div className="text-sm text-muted-foreground">
                    ID de importacion: {importResult.importId}
                  </div>
                )}

                {importResult.errorsFile && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={resolveErrorsFileUrl(importResult.errorsFile) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descargar archivo de errores
                    </a>
                  </Button>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-600 dark:text-red-400">
                      Errores encontrados:
                    </Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 dark:text-red-400">
                          - {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instrucciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <p><strong>Columnas requeridas:</strong> nombre, apellido</p>
                <p><strong>Columnas opcionales:</strong> correo, telefono, telefono_whatsapp, estado, programa_interes, utm_medio, utm_source, utm_campaign, utm_content, notas</p>
                <p><strong>Estados validos:</strong> no contactado, contactado, interesado, seguimiento, propuesta, negociacion, ganado, perdido, descartado</p>
                <p><strong>UTM tracking:</strong> utm_medio, utm_source, utm_campaign, utm_content para seguimiento de campanas</p>
                <p><strong>Nota:</strong> Los correos duplicados seran omitidos automaticamente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!importResult && (
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || loading}
            >
              {loading ? "Importando..." : "Importar Contactos"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
