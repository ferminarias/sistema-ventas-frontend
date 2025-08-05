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
  accept = "image/*",
  maxSize = 2, // 2MB por defecto para evitar errores del backend
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
              "w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group",
              disabled
                ? "border-gray-600 bg-gray-800/50 cursor-not-allowed"
                : "border-purple-400/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 hover:border-purple-400 hover:from-purple-900/20 hover:to-purple-800/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20",
              error && "border-red-400/50 bg-red-900/20 hover:border-red-400"
            )}
            onClick={handleClick}
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-2" />
                <p className="text-sm text-gray-300">Subiendo archivo...</p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                    <Image className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
                    <Upload className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-200 text-center font-medium mb-1">
                  {placeholder}
                </p>
                <p className="text-xs text-gray-400">
                  Máximo {maxSize}MB
                </p>
                <div className="mt-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-400/30">
                  <p className="text-xs text-purple-300">Haz clic para seleccionar</p>
                </div>
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
            className="w-full bg-gradient-to-r from-purple-600/20 to-purple-700/20 border-purple-400/50 text-purple-200 hover:from-purple-600/30 hover:to-purple-700/30 hover:border-purple-400 hover:text-purple-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20"
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
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-300 mb-2">
            <span className="font-medium text-purple-300">Formatos soportados:</span> JPG, PNG, GIF
          </p>
          <p className="text-xs text-gray-300 mb-2">
            <span className="font-medium text-purple-300">Tamaño máximo:</span> {maxSize}MB
          </p>
          {maxSize <= 2 && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
              <span className="text-amber-400 text-sm">💡</span>
              <p className="text-xs text-amber-200">
                Si tu imagen es muy grande, comprímela usando <span className="font-medium">TinyPNG</span> o similar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 