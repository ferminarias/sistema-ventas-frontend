"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClienteVentasCharts } from "@/components/cliente-ventas-charts"
import { ClienteVentasTable } from "@/components/cliente-ventas-table"
import { ClienteBreadcrumb } from "@/components/cliente-breadcrumb"

export default function CesaDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <ClienteBreadcrumb cliente="Cesa" />
      <DashboardHeader cliente="Cesa" />
      <ClienteVentasCharts cliente="Cesa" />
      <ClienteVentasTable cliente="Cesa" />
    </div>
  )
}
