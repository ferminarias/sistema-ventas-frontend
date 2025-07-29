"use client";
export const dynamic = "force-dynamic";
// Force redeploy: carpeta [id] corregida para rutas dinámicas
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VentasStats } from "@/components/dashboard/ventas-stats";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
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
  logo?: string;
}

export default function ClienteDashboardPage() {
  const params = useParams();
  const clientId = params.id;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    fetch(`https://sistemas-de-ventas-production.up.railway.app/api/clientes`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      credentials: 'include'
    })
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
      <DashboardHeader cliente={client.name} clienteLogo={client.logo} />
      <div className="p-6 space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-4">
              {/* Logo del cliente en la tarjeta de información */}
              {client.logo && (
                <div className="w-16 h-16 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
                  <img 
                    src={client.logo} 
                    alt={`Logo de ${client.name}`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-white/60 text-2xl font-bold">
                          ${client.name.charAt(0).toUpperCase()}
                        </div>
                      `
                    }}
                  />
                </div>
              )}
              <div>
                <CardTitle>Cliente {client.name} - Universidad</CardTitle>
                <CardDescription>{client.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-300">ID: {client.id}</div>
            <div className="text-sm text-gray-300">Creado: {new Date(client.createdAt).toLocaleString()}</div>
          </CardContent>
        </Card>
        <ClienteVentasCharts cliente={String(client.id)} nombreCliente={client.name} />
        <ClienteVentasTable cliente={client.name || String(client.id)} />
      </div>
    </div>
  );
} 