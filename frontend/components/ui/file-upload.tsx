"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image, Loader2, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  value?: string
  onChange: (value: string) => void
  onFileChange?: (file: File) => void
  field?: { id: string; label: string; type: string } // Información del campo
  label?: string
  placeholder?: string
  accept?: string
  maxSize?: number // en MB
  className?: string
  disabled?: boolean
  required?: boolean
}

export function FileUpload({
  value,
  onChange,
  onFileChange,
  field,
  label = "Archivo",
  placeholder = "Seleccionar archivo...",
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  maxSize = 5, // 5MB para permitir PDFs y documentos
  className,
  disabled = false,
  required = false
}: FileUploadProps) {
  // Asegurar que value siempre sea un string
  const currentValue = typeof value === 'string' ? value : ""
  
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentValue || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Actualizar preview cuando cambie el value
  useEffect(() => {
    setPreview(currentValue || null)
  }, [currentValue])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipos permitidos
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de archivo no permitido. Solo imágenes, PDFs, Word y Excel")
      return
    }

    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo es demasiado grande. Máximo ${maxSize}MB`)
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          setPreview(result)
          // Asegurar que onChange reciba un string válido
          onChange(result)
        }
      }
      reader.onerror = () => {
        setError("Error al leer el archivo")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)

      // Llamar callback si existe
      if (onFileChange) {
        onFileChange(file)
      }
    } catch (error) {
      setError("Error al procesar el archivo")
      console.error("Error processing file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    // Asegurar que onChange reciba un string vacío
    onChange("")
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="space-y-3">
        {/* Preview del logo */}
        {preview && (
          <div className="relative">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
              {preview.startsWith('data:image/') ? (
                // Imagen
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                // PDF u otro documento
                <div className="flex flex-col items-center justify-center">
                  <FileIcon className="h-8 w-8 text-gray-500" />
                  <p className="text-xs text-gray-500 mt-1">
                    {preview.startsWith('data:application/pdf') ? 'PDF' : 'Documento'}
                  </p>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Área de carga */}
        {!preview && (
          <div
            className={cn(
              "w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
              disabled
                ? "border-gray-600 bg-gray-800/50 cursor-not-allowed"
                : "border-gray-500 bg-gray-800/30 hover:border-gray-400 hover:bg-gray-800/50",
              error && "border-red-400 bg-red-900/20"
            )}
            onClick={handleClick}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
                <p className="text-sm text-gray-300">Subiendo archivo...</p>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600">
                    <Image className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-200 text-center mb-1">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-400">
                  Máximo {maxSize}MB
                </p>
              </>
            )}
          </div>
        )}

        {/* Input oculto */}
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {/* Botón de carga alternativa */}
        {!preview && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="w-full border-gray-600 bg-gray-800/50 text-gray-200 hover:border-gray-500 hover:bg-gray-800/70 hover:text-gray-100 transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Subiendo..." : "Seleccionar Archivo"}
          </Button>
        )}

        {/* Mensaje de error */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Información adicional */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-300 mb-1">
            <span className="font-medium">Formatos soportados:</span> JPG, PNG, GIF, PDF, Word, Excel
          </p>
          <p className="text-xs text-gray-300 mb-2">
            <span className="font-medium">Tamaño máximo:</span> {maxSize}MB
          </p>
          {maxSize <= 2 && (
            <div className="flex items-start gap-2 p-2 bg-gray-700/50 border border-gray-600 rounded">
              <span className="text-gray-400 text-sm">💡</span>
              <p className="text-xs text-gray-300">
                Si tu archivo es muy grande, comprímelo usando <span className="font-medium">TinyPNG</span> o similar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 