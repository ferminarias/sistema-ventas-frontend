const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}`;

export const clientsApi = {
  async getClients(token: string | null) {
    if (!token) throw new Error("Token requerido");
    const res = await fetch(`${API_URL}/api/clientes`, {
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
    const res = await fetch(`${API_URL}/api/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(client),
    });
    if (!res.ok) throw new Error("Error al crear cliente");
    return res.json();
  },
}; 