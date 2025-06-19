"use client"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClienteVentasStats } from "@/components/cliente-ventas-stats"
import { ClienteVentasCharts } from "@/components/cliente-ventas-charts"
import { ClienteVentasTable } from "@/components/cliente-ventas-table"
import { ClienteBreadcrumb } from "@/components/cliente-breadcrumb"

export default function AliatDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <ClienteBreadcrumb cliente="Aliat" />
      <DashboardHeader cliente="Aliat" />
      <ClienteVentasStats cliente="Aliat" />
      <ClienteVentasCharts cliente="Aliat" />
      <ClienteVentasTable cliente="Aliat" />
    </div>
  )
}
