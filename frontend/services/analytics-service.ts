const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const analyticsService = {
  async getMetrics() {
    const response = await fetch(`${API_BASE}/api/analytics/metrics`, { credentials: 'include' });
    return response.json();
  },

  async getSalesTrend(period: string) {
    const response = await fetch(`${API_BASE}/api/analytics/sales-trend?period=${period}`, { credentials: 'include' });
    return response.json();
  },

  async getTopAdvisors() {
    const response = await fetch(`${API_BASE}/api/analytics/top-advisors`, { credentials: 'include' });
    return response.json();
  },

  async getTopClients() {
    const response = await fetch(`${API_BASE}/api/analytics/top-clients`, { credentials: 'include' });
    return response.json();
  },

  async getHourlyDistribution() {
    const response = await fetch(`${API_BASE}/api/analytics/hourly-distribution`, { credentials: 'include' });
    return response.json();
  },

  async getPipeline() {
    const response = await fetch(`${API_BASE}/api/analytics/pipeline`, { credentials: 'include' });
    return response.json();
  },

  async getHeatmap() {
    const response = await fetch(`${API_BASE}/api/analytics/heatmap`, { credentials: 'include' });
    return response.json();
  },

  async exportData(filters: any) {
    const response = await fetch(`${API_BASE}/api/analytics/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
      credentials: 'include',
    });
    return response.json();
  }
};
