import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cliente = searchParams.get('cliente');
  
  try {
    // Obtener datos reales de ventas
    const ventasUrl = new URL('/api/ventas', API_BASE);
    if (cliente) {
      ventasUrl.searchParams.append('cliente', cliente);
    }

    console.log('⏰ Fetching ventas for hourly distribution from:', ventasUrl.toString());

    const ventasResponse = await fetch(ventasUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!ventasResponse.ok) {
      throw new Error(`Ventas API responded with ${ventasResponse.status}`);
    }

    const ventas = await ventasResponse.json();
    console.log('✅ Ventas data received for hourly distribution:', ventas.length, 'records');

    // Calcular distribución horaria
    const hourlyData = calculateHourlyDistribution(ventas);
    console.log('📊 Calculated hourly distribution:', hourlyData.sales.reduce((a, b) => a + b, 0), 'total sales');
    
    return NextResponse.json(hourlyData);
  } catch (error) {
    console.error('❌ Hourly distribution API error:', error);
    
    // Fallback - distribución vacía
    const fallbackDistribution = {
      labels: Array.from({length: 24}, (_, i) => i.toString()),
      sales: Array(24).fill(0)
    };
    
    return NextResponse.json(fallbackDistribution);
  }
}

function calculateHourlyDistribution(ventas: any[]) {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return {
      labels: Array.from({length: 24}, (_, i) => i.toString()),
      sales: Array(24).fill(0)
    };
  }

  // Inicializar array de 24 horas
  const ventasPorHora = Array(24).fill(0);
  
  // Contar ventas por hora
  ventas.forEach(v => {
    const fecha = new Date(v.fecha_venta);
    if (!isNaN(fecha.getTime())) {
      const hora = fecha.getHours();
      ventasPorHora[hora]++;
    }
  });

  // Crear labels de horas
  const labels = Array.from({length: 24}, (_, i) => {
    return i.toString().padStart(2, '0');
  });

  return {
    labels,
    sales: ventasPorHora
  };
}