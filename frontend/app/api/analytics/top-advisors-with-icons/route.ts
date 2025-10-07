import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cliente = searchParams.get('cliente');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  
  try {
    // Obtener datos de top advisors
    const advisorsUrl = new URL('/api/analytics/top-advisors', API_BASE);
    searchParams.forEach((value, key) => {
      advisorsUrl.searchParams.append(key, value);
    });

    console.log('🏆 Calling top-advisors API for icons:', advisorsUrl.toString());

    const advisorsResponse = await fetch(advisorsUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!advisorsResponse.ok) {
      throw new Error(`Top advisors API responded with ${advisorsResponse.status}`);
    }

    const advisorsData = await advisorsResponse.json();
    console.log('✅ Top advisors data received:', advisorsData);

    // Intentar obtener iconos de asesores (si existe la API)
    try {
      const iconUrl = new URL('/api/advisors', API_BASE);
      const iconResponse = await fetch(iconUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
      });

      let iconData = {};
      if (iconResponse.ok) {
        const advisorsWithIcons = await iconResponse.json();
        // Crear mapa de iconos por nombre
        if (Array.isArray(advisorsWithIcons)) {
          advisorsWithIcons.forEach((advisor: any) => {
            if (advisor.nombre && advisor.iconUrl) {
              iconData[advisor.nombre] = advisor.iconUrl;
            }
          });
        }
      }

      // Combinar datos de advisors con iconos
      const general = advisorsData.general?.map((advisor: any) => ({
        ...advisor,
        iconUrl: iconData[advisor.name] || null
      })) || [];

      const byClient = advisorsData.byClient?.map((advisor: any) => ({
        ...advisor,
        iconUrl: iconData[advisor.name] || null
      })) || [];

      const result = {
        general,
        byClient,
        items: general, // Para compatibilidad
        period: month && year ? `${month}/${year}` : null
      };

      console.log('🎨 Combined advisors with icons:', result);
      return NextResponse.json(result);

    } catch (iconError) {
      console.warn('⚠️ Could not fetch advisor icons:', iconError);
      
      // Devolver datos sin iconos
      const result = {
        general: advisorsData.general || [],
        byClient: advisorsData.byClient || [],
        items: advisorsData.general || [],
        period: month && year ? `${month}/${year}` : null
      };

      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('❌ Top advisors with icons API error:', error);
    
    // Fallback - advisors vacíos
    const fallbackResult = {
      general: [],
      byClient: [],
      items: [],
      period: null
    };
    
    return NextResponse.json(fallbackResult);
  }
}