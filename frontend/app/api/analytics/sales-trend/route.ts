import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cliente = searchParams.get('cliente');
  const period = searchParams.get('period') || '30d';
  
  try {
    // Obtener datos reales de ventas
    const ventasUrl = new URL('/api/ventas', API_BASE);
    if (cliente) {
      ventasUrl.searchParams.append('cliente', cliente);
    }

    console.log('📈 Fetching ventas for sales trend from:', ventasUrl.toString());

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
    console.log('✅ Ventas data received for trend:', ventas.length, 'records');

    // Calcular trend de ventas
    const trendData = calculateSalesTrend(ventas, period);
    console.log('📊 Calculated sales trend:', { period, labels: trendData.labels.length, sales: trendData.sales.length });
    
    return NextResponse.json(trendData);
  } catch (error) {
    console.error('❌ Sales trend API error:', error);
    
    // Fallback - trend vacío
    const fallbackTrend = {
      labels: [],
      sales: [],
      cumulative: []
    };
    
    return NextResponse.json(fallbackTrend);
  }
}

function calculateSalesTrend(ventas: any[], period: string) {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return {
      labels: [],
      sales: [],
      cumulative: []
    };
  }

  const now = new Date();
  let days = 30;
  
  switch (period) {
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    case '1y': days = 365; break;
  }

  // Crear arrays para los días
  const labels: string[] = [];
  const salesData: number[] = [];
  const cumulativeData: number[] = [];
  
  // Filtrar ventas del período
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  
  const ventasPeriodo = ventas.filter(v => {
    const fecha = new Date(v.fecha_venta);
    return fecha >= startDate && fecha <= now;
  });

  // Agrupar por día
  const ventasPorDia: { [key: string]: number } = {};
  
  for (let i = 0; i < days; i++) {
    const fecha = new Date(startDate);
    fecha.setDate(fecha.getDate() + i);
    const fechaStr = fecha.toISOString().split('T')[0];
    ventasPorDia[fechaStr] = 0;
  }

  // Contar ventas por día
  ventasPeriodo.forEach(v => {
    const fecha = new Date(v.fecha_venta);
    const fechaStr = fecha.toISOString().split('T')[0];
    if (ventasPorDia.hasOwnProperty(fechaStr)) {
      ventasPorDia[fechaStr]++;
    }
  });

  // Construir arrays finales
  let cumulative = 0;
  Object.keys(ventasPorDia).sort().forEach(fechaStr => {
    const fecha = new Date(fechaStr);
    
    // Formato de label según el período
    let label: string;
    if (days <= 7) {
      label = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    } else if (days <= 90) {
      label = fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    } else {
      label = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    }
    
    const ventasDelDia = ventasPorDia[fechaStr];
    cumulative += ventasDelDia;
    
    labels.push(label);
    salesData.push(ventasDelDia);
    cumulativeData.push(cumulative);
  });

  return {
    labels,
    sales: salesData,
    cumulative: cumulativeData
  };
}