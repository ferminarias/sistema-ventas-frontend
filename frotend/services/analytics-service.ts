const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const analyticsService = {
  async getMetrics() {
    const response = await fetch(`${API_BASE}/api/analytics/metrics`);
    return response.json();
  },

  async getSalesTrend(period: string) {
    const response = await fetch(`${API_BASE}/api/analytics/sales-trend?period=${period}`);
    return response.json();
  },

  async getTopAdvisors() {
    const response = await fetch(`${API_BASE}/api/analytics/top-advisors`);
    return response.json();
  },

  async getTopClients() {
    const response = await fetch(`${API_BASE}/api/analytics/top-clients`);
    return response.json();
  },

  async getHourlyDistribution() {
    const response = await fetch(`${API_BASE}/api/analytics/hourly-distribution`);
    return response.json();
  },

  async getPipeline() {
    const response = await fetch(`${API_BASE}/api/analytics/pipeline`);
    return response.json();
  },

  async getHeatmap() {
    const response = await fetch(`${API_BASE}/api/analytics/heatmap`);
    return response.json();
  },

  async exportData(filters: any) {
    const response = await fetch(`${API_BASE}/api/analytics/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters)
    });
    return response.json();
  }
}; 
