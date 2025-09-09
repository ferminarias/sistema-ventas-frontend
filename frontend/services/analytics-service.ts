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

export const analyticsService = {
  async getMetrics(cliente?: string) {
    const params = cliente ? `?cliente=${encodeURIComponent(cliente)}` : '';
    const response = await fetch(`${API_BASE}/api/analytics/metrics${params}`, {
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getSalesTrend(period: string, cliente?: string) {
    const params = new URLSearchParams({ period });
    if (cliente) params.append('cliente', cliente);
    const response = await fetch(`${API_BASE}/api/analytics/sales-trend?${params.toString()}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getTopAdvisors(cliente?: string) {
    const params = cliente ? `?cliente=${encodeURIComponent(cliente)}` : '';
    const response = await fetch(`${API_BASE}/api/analytics/top-advisors${params}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getTopClients(cliente?: string) {
    const params = cliente ? `?cliente=${encodeURIComponent(cliente)}` : '';
    const response = await fetch(`${API_BASE}/api/analytics/top-clients${params}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getHourlyDistribution(cliente?: string) {
    const params = cliente ? `?cliente=${encodeURIComponent(cliente)}` : '';
    const response = await fetch(`${API_BASE}/api/analytics/hourly-distribution${params}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getPipeline(cliente?: string) {
    const params = cliente ? `?cliente=${encodeURIComponent(cliente)}` : '';
    const response = await fetch(`${API_BASE}/api/analytics/pipeline${params}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getHeatmap(cliente?: string) {
    const params = cliente ? `?cliente=${encodeURIComponent(cliente)}` : '';
    const response = await fetch(`${API_BASE}/api/analytics/heatmap${params}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async exportData(filters: any) {
    // Intento primario: POST con Bearer Token (puede disparar preflight)
    try {
      const response = await fetch(`${API_BASE}/api/analytics/export`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(filters),
        // Evitar cookies para reducir problemas CORS cuando el backend usa '*' en ACAO
        credentials: 'omit',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (_e) {
      // Fallback: GET con querystring y token en URL (si el backend lo soporta)
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams();
      if (filters?.client) params.set('client', String(filters.client));
      if (filters?.startDate) params.set('startDate', String(filters.startDate));
      if (filters?.endDate) params.set('endDate', String(filters.endDate));
      if (filters?.format) params.set('format', String(filters.format));
      if (token) params.set('token', token);
      const url = `${API_BASE}/api/analytics/export?${params.toString()}`;
      const resp = await fetch(url, { method: 'GET', credentials: 'omit' });
      return resp.json();
    }
  }
};
