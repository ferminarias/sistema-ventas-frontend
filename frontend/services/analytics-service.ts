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
    const response = await fetch(`${API_BASE}/api/analytics/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(filters),
      credentials: 'include',
    });
    return response.json();
  }
};
