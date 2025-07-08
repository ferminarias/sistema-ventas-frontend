"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface RailwayLoaderProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
  text?: string
}

export function RailwayLoader({ 
  className,
  size = "md", 
  showText = true,
  text = "Cargando..."
}: RailwayLoaderProps) {
  const sizeClasses = {
    sm: "h-1",
    md: "h-1.5", 
    lg: "h-2"
  }

  const containerSizes = {
    sm: "w-24",
    md: "w-32",
    lg: "w-40"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      {/* Contenedor principal de las barras */}
      <div className={cn("relative bg-gray-800 rounded-full overflow-hidden", containerSizes[size], sizeClasses[size])}>
        {/* Barra de fondo */}
        <div className="absolute inset-0 bg-gray-700/50" />
        
        {/* Barras animadas - múltiples para efecto más dinámico */}
        <div className="absolute inset-0 flex">
          {/* Barra principal que se mueve */}
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full w-[30%] animate-railway-slide" />
          
          {/* Barra secundaria con delay */}
          <div className="absolute h-full bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full w-[20%] animate-railway-slide-delayed" />
          
          {/* Barra terciaria más rápida */}
          <div className="absolute h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 rounded-full opacity-60 w-[25%] animate-railway-slide-fast" />
        </div>

        {/* Efecto de brillo que pasa por encima */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-railway-shine" />
      </div>

      {/* Texto de carga */}
      {showText && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-medium animate-pulse">
            {text}
          </span>
          {/* Puntos animados */}
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-railway-dot" />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-railway-dot-delayed-1" />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-railway-dot-delayed-2" />
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para métricas específicas con skeleton
export function RailwayMetricsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-800 rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <RailwayLoader size="sm" showText={false} />
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-8 w-8 bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-600 rounded w-20 animate-pulse" />
              <div className="h-3 bg-gray-700 rounded w-32 animate-pulse" />
            </div>
            {/* Barra animada de Railway en cada card */}
            <div className="mt-4">
              <RailwayLoader size="sm" showText={false} />
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-700 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-700 rounded w-24 animate-pulse" />
              </div>
              <div className="h-64 bg-gray-700/30 rounded-lg flex items-center justify-center">
                <RailwayLoader size="lg" text="Cargando gráfico..." />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 