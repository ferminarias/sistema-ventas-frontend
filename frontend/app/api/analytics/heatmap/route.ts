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

    console.log('🔥 Fetching ventas for heatmap from:', ventasUrl.toString());

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
    console.log('✅ Ventas data received for heatmap:', ventas.length, 'records');

    // Calcular heatmap
    const heatmapData = calculateHeatmap(ventas);
    console.log('📊 Calculated heatmap:', heatmapData.length, 'data points');
    
    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error('❌ Heatmap API error:', error);
    
    // Fallback - heatmap vacío
    return NextResponse.json([]);
  }
}

function calculateHeatmap(ventas: any[]) {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return [];
  }

  // Crear heatmap de las últimas 4 semanas
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Filtrar ventas de las últimas 4 semanas
  const ventasRecientes = ventas.filter(v => {
    const fecha = new Date(v.fecha_venta);
    return fecha >= fourWeeksAgo && fecha <= now;
  });

  // Agrupar por día de la semana y semana
  const heatmapData: any[] = [];
  
  // Crear grid de 4 semanas x 7 días
  for (let week = 0; week < 4; week++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      // Calcular la fecha específica
      const fecha = new Date(fourWeeksAgo);
      fecha.setDate(fecha.getDate() + (week * 7) + dayOfWeek);
      
      // Contar ventas para este día específico
      const ventasDelDia = ventasRecientes.filter(v => {
        const fechaVenta = new Date(v.fecha_venta);
        return fechaVenta.toDateString() === fecha.toDateString();
      }).length;

      // Solo agregar si hay datos o si queremos mostrar el grid completo
      heatmapData.push({
        dayOfWeek,           // 0 = Lunes, 1 = Martes, ..., 6 = Domingo
        week,                // 0 = Primera semana, 1 = Segunda, etc.
        date: fecha.toISOString().split('T')[0], // YYYY-MM-DD
        sales: ventasDelDia
      });
    }
  }

  return heatmapData;
}