const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const usersApi = {
  async getUsers(token: string | null) {
    if (!token) throw new Error("Token requerido");
    console.log("Token enviado:", token); // Debug log
    const res = await fetch(`${API_BASE}/api/users`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Error response:", errorData); // Debug log
      throw new Error(errorData.message || "Error al obtener usuarios");
    }
    return res.json();
  },
  async createUser(user: any, token: string | null) {
    if (!token) throw new Error("Token requerido");
    console.log("[DEBUG] Creando usuario:", user); // Debug log
    const res = await fetch(`${API_BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[ERROR] Error al crear usuario:", errorData); // Debug log
      throw new Error(errorData.message || "Error al crear usuario");
    }
    return res.json();
  },
  async updateUser(id: number, user: any, token: string | null) {
    if (!token) throw new Error("Token requerido");
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error("Error al actualizar usuario");
    return res.json();
  },
  async deleteUser(id: number, token: string | null) {
    if (!token) throw new Error("Token requerido");
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al eliminar usuario");
  },
  async changePassword(id: number, password: string, token: string | null) {
    if (!token) throw new Error("Token requerido");
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error("Error al cambiar contraseña");
    return res.json();
  },
}; 