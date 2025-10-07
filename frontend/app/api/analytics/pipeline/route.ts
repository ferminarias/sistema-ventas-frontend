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

    console.log('🔄 Fetching ventas for pipeline from:', ventasUrl.toString());

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
    console.log('✅ Ventas data received for pipeline:', ventas.length, 'records');

    // Calcular pipeline
    const pipelineData = calculatePipeline(ventas);
    console.log('📊 Calculated pipeline:', pipelineData);
    
    return NextResponse.json(pipelineData);
  } catch (error) {
    console.error('❌ Pipeline API error:', error);
    
    // Fallback - pipeline vacío
    const fallbackPipeline = {
      prospects: 0,
      contacted: 0,
      interested: 0,
      proposals: 0,
      closed: 0
    };
    
    return NextResponse.json(fallbackPipeline);
  }
}

function calculatePipeline(ventas: any[]) {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return {
      prospects: 0,
      contacted: 0,
      interested: 0,
      proposals: 0,
      closed: 0
    };
  }

  // Contar ventas cerradas (las que están en la base de datos)
  const closed = ventas.length;
  
  // Estimar el pipeline basado en las ventas cerradas
  // Estas son estimaciones típicas de un embudo de ventas
  const prospects = Math.round(closed * 5);     // 5x más prospectos que ventas cerradas
  const contacted = Math.round(closed * 3.5);  // 3.5x más contactados
  const interested = Math.round(closed * 2.5); // 2.5x más interesados
  const proposals = Math.round(closed * 1.5);  // 1.5x más propuestas

  return {
    prospects,
    contacted,
    interested,
    proposals,
    closed
  };
}