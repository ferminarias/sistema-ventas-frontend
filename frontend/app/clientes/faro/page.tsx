"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClienteVentasCharts } from "@/components/cliente-ventas-charts"
import { ClienteVentasTable } from "@/components/cliente-ventas-table"
import { ClienteBreadcrumb } from "@/components/cliente-breadcrumb"

export default function FaroDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <ClienteBreadcrumb cliente="Faro" />
      <DashboardHeader cliente="Faro" />
      <ClienteVentasCharts cliente="Faro" />
      <ClienteVentasTable cliente="Faro" />
    </div>
  )
}
