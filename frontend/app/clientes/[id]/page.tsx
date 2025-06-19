export const dynamic = "force-dynamic";
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VentasStats } from "@/components/dashboard/ventas-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ClienteVentasStats } from "@/components/cliente-ventas-stats";
import { ClienteVentasCharts } from "@/components/cliente-ventas-charts";
import { ClienteVentasTable } from "@/components/cliente-ventas-table";
import { DashboardHeader } from "@/components/dashboard-header";

interface Client {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  assignedUsers: number[];
  formConfig: any[];
}

export default function ClienteDashboardPage() {
  const params = useParams();
  const clientId = params.id;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/clientes`)
      .then(res => res.json())
      .then((clients: Client[]) => {
        const found = clients.find(c => String(c.id) === String(clientId));
        setClient(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-white">Cargando cliente...</div>;
  }

  if (!client) {
    return <div className="flex items-center justify-center h-full text-red-400">Cliente no encontrado</div>;
  }

  return (
    <div className="flex-1 bg-gray-900 text-white overflow-auto">
      <DashboardHeader cliente={client.name} />
      <div className="p-6 space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>{client.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-300">ID: {client.id}</div>
            <div className="text-sm text-gray-300">Creado: {new Date(client.createdAt).toLocaleString()}</div>
          </CardContent>
        </Card>
        <ClienteVentasStats cliente={String(client.id)} />
        <ClienteVentasCharts cliente={String(client.id)} nombreCliente={client.name} />
        <ClienteVentasTable cliente={String(client.id)} />
      </div>
    </div>
  );
} 