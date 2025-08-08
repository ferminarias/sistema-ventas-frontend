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
  async getMetrics() {
    const response = await fetch(`${API_BASE}/api/analytics/metrics`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getSalesTrend(period: string) {
    const response = await fetch(`${API_BASE}/api/analytics/sales-trend?period=${period}`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getTopAdvisors() {
    const response = await fetch(`${API_BASE}/api/analytics/top-advisors`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getTopClients() {
    const response = await fetch(`${API_BASE}/api/analytics/top-clients`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getHourlyDistribution() {
    const response = await fetch(`${API_BASE}/api/analytics/hourly-distribution`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getPipeline() {
    const response = await fetch(`${API_BASE}/api/analytics/pipeline`, { 
      headers: getAuthHeaders(),
      credentials: 'include' 
    });
    return response.json();
  },

  async getHeatmap() {
    const response = await fetch(`${API_BASE}/api/analytics/heatmap`, { 
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
