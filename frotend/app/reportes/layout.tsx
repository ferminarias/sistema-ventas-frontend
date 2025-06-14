import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "NODS - Analytics Público",
  description: "Dashboard de análisis de ventas sin autenticación",
}

// Layout que NO incluye AuthWrapper
export default function AnalyticsPublicoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 