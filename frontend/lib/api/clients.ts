const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export const clientsApi = {
  async getClients(token: string | null) {
    if (!token) throw new Error("Token requerido");
    const res = await fetch(`${API_BASE}/api/clientes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    if (!res.ok) throw new Error("Error al obtener clientes");
    return res.json();
  },
  async createClient(client: any, token: string | null) {
    if (!token) throw new Error("Token requerido");
    const res = await fetch(`${API_BASE}/api/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error("Error al crear cliente");
    return res.json();
  },
}; 