"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClienteVentasCharts } from "@/components/cliente-ventas-charts"
import { ClienteVentasTable } from "@/components/cliente-ventas-table"
import { ClienteBreadcrumb } from "@/components/cliente-breadcrumb"

export default function AnahuacDashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-none">
      <ClienteBreadcrumb cliente="Anahuac" />
      <DashboardHeader cliente="Anahuac" />
      <div className="w-full">
        <ClienteVentasCharts cliente="Anahuac" />
      </div>
      <ClienteVentasTable cliente="Anahuac" />
    </div>
  )
}
