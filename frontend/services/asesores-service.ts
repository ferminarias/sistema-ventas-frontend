const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Función para obtener headers de autenticación
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

export interface AsesorIcon {
  id: string
  nombre: string
  icon_url?: string
  ventas?: number
  percentage?: number
}

export interface TopAsesorData {
  name: string
  sales: number
  percentage: number
  icon_url?: string
  id?: string
}

export const asesoresService = {
  // Obtener top asesores con iconos (con filtro mensual)
  async getTopAsesoresWithIcons(cliente?: string, month?: string, year?: string): Promise<{general: TopAsesorData[]; byClient: TopAsesorData[]}> {
    const params = new URLSearchParams();
    if (cliente) params.append('cliente', cliente);
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    const response = await fetch(`${API_BASE}/api/analytics/top-advisors-with-icons?${params.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  // Subir icono para un asesor
  async uploadAsesorIcon(asesorNombre: string, imageBase64: string): Promise<{message: string; url: string; publicId: string}> {
    const response = await fetch(`${API_BASE}/api/advisors/upload-icon`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        name: asesorNombre,
        imageBase64: imageBase64
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Obtener icono de un asesor
  async getAsesorIcon(asesorNombre: string, size: number = 64): Promise<{url?: string; publicId?: string}> {
    const params = new URLSearchParams({
      asesor: asesorNombre,
      size: size.toString()
    });
    const response = await fetch(`${API_BASE}/api/advisors/icon?${params.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    
    if (!response.ok) {
      return { url: undefined };
    }
    
    return response.json();
  },

  // Eliminar icono de un asesor
  async deleteAsesorIcon(asesorNombre: string): Promise<{message: string}> {
    const response = await fetch(`${API_BASE}/api/advisors/icon`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        name: asesorNombre
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
};
