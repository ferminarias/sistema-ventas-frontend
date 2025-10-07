import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cliente = searchParams.get('cliente');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  
  try {
    // Obtener datos reales de ventas
    const ventasUrl = new URL('/api/ventas', API_BASE);
    if (cliente) {
      ventasUrl.searchParams.append('cliente', cliente);
    }

    console.log('🏆 Fetching ventas for top advisors from:', ventasUrl.toString());

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
    console.log('✅ Ventas data received for advisors:', ventas.length, 'records');

    // Calcular top advisors
    const advisorsData = calculateTopAdvisors(ventas, cliente, month, year);
    console.log('🎯 Calculated top advisors:', { 
      general: advisorsData.general.length, 
      byClient: advisorsData.byClient.length 
    });
    
    return NextResponse.json(advisorsData);
  } catch (error) {
    console.error('❌ Top advisors API error:', error);
    
    // Fallback - advisors vacíos
    const fallbackAdvisors = {
      general: [],
      byClient: []
    };
    
    return NextResponse.json(fallbackAdvisors);
  }
}

function calculateTopAdvisors(ventas: any[], cliente?: string | null, month?: string | null, year?: string | null) {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return {
      general: [],
      byClient: []
    };
  }

  // Filtrar por período si se especifica
  let ventasFiltradas = ventas;
  
  if (month && year) {
    const targetMonth = parseInt(month) - 1; // JavaScript months are 0-based
    const targetYear = parseInt(year);
    
    ventasFiltradas = ventas.filter(v => {
      const fecha = new Date(v.fecha_venta);
      return fecha.getMonth() === targetMonth && fecha.getFullYear() === targetYear;
    });
  }

  // Contar ventas por asesor (general)
  const ventasPorAsesor: { [key: string]: number } = {};
  const clientePorAsesor: { [key: string]: string } = {};
  
  ventasFiltradas.forEach(v => {
    if (v.asesor) {
      ventasPorAsesor[v.asesor] = (ventasPorAsesor[v.asesor] || 0) + 1;
      if (v.cliente_id) {
        clientePorAsesor[v.asesor] = v.cliente_id;
      }
    }
  });

  const totalVentas = ventasFiltradas.length;

  // Crear ranking general
  const general = Object.entries(ventasPorAsesor)
    .map(([name, sales]) => ({
      name,
      sales,
      percentage: totalVentas > 0 ? Math.round((sales / totalVentas) * 100 * 100) / 100 : 0
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10); // Top 10

  // Crear ranking por cliente
  const byClient = Object.entries(ventasPorAsesor)
    .map(([name, sales]) => ({
      name,
      sales,
      client: clientePorAsesor[name] || 'Sin cliente',
      percentage: totalVentas > 0 ? Math.round((sales / totalVentas) * 100 * 100) / 100 : 0
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10); // Top 10

  return {
    general,
    byClient
  };
}