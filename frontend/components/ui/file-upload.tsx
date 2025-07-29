"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  value?: string
  onChange: (value: string) => void
  onFileChange?: (file: File) => void
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
  label = "Archivo",
  placeholder = "Seleccionar archivo...",
  accept = "image/*",
  maxSize = 5, // 5MB por defecto
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

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError("Solo se permiten archivos de imagen")
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
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
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
              "w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
              disabled
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
              error && "border-red-300 bg-red-50"
            )}
            onClick={handleClick}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <Image className="h-6 w-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 text-center">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500 mt-1">
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
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Subiendo..." : "Seleccionar Logo"}
          </Button>
        )}

        {/* Mensaje de error */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Información adicional */}
        <p className="text-xs text-gray-500">
          Formatos soportados: JPG, PNG, GIF. Tamaño máximo: {maxSize}MB
        </p>
      </div>
    </div>
  )
} 