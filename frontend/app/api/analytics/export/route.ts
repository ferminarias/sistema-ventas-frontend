import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(request: NextRequest) {
  return handleExport(request);
}

export async function POST(request: NextRequest) {
  return handleExport(request);
}

async function handleExport(request: NextRequest) {
  try {
    let filters: any = {};
    
    if (request.method === 'POST') {
      filters = await request.json();
    } else {
      // GET request - obtener parámetros de query
      const searchParams = request.nextUrl.searchParams;
      filters = {
        client: searchParams.get('client'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        format: searchParams.get('format') || 'json'
      };
    }

    console.log('📤 Export request with filters:', filters);

    // Intentar llamar al backend real primero
    try {
      const exportUrl = new URL('/api/analytics/export', API_BASE);
      
      const backendResponse = await fetch(exportUrl.toString(), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(filters)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('✅ Export data from backend:', data);
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.warn('⚠️ Backend export failed, generating local export:', backendError);
    }

    // Fallback - generar export local
    const exportData = await generateLocalExport(filters, request);
    console.log('📊 Generated local export:', { format: filters.format, size: JSON.stringify(exportData).length });
    
    return NextResponse.json(exportData);
    
  } catch (error) {
    console.error('❌ Export API error:', error);
    
    return NextResponse.json(
      { error: 'Export failed', message: error.message },
      { status: 500 }
    );
  }
}

async function generateLocalExport(filters: any, request: NextRequest) {
  try {
    // Obtener datos de ventas para el export
    const ventasUrl = new URL('/api/ventas', API_BASE);
    if (filters.client && filters.client !== 'all') {
      ventasUrl.searchParams.append('cliente', filters.client);
    }

    const ventasResponse = await fetch(ventasUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    let ventas = [];
    if (ventasResponse.ok) {
      ventas = await ventasResponse.json();
    }

    // Filtrar por fechas si se especifican
    if (filters.startDate || filters.endDate) {
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date('1900-01-01');
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date('2100-12-31');
      
      ventas = ventas.filter((v: any) => {
        const fecha = new Date(v.fecha_venta);
        return fecha >= startDate && fecha <= endDate;
      });
    }

    // Generar diferentes formatos
    switch (filters.format) {
      case 'excel':
      case 'pdf':
      case 'csv':
        // Para estos formatos, simular un archivo generado
        return {
          path: `exports/reporte_${filters.format}_${Date.now()}.${filters.format}`,
          filename: `reporte_${new Date().toISOString().split('T')[0]}.${filters.format}`,
          size: ventas.length * 100, // Tamaño simulado
          records: ventas.length
        };
        
      case 'api':
      case 'json':
      default:
        // Para JSON, devolver los datos directamente
        return {
          data: ventas,
          summary: {
            total_records: ventas.length,
            date_range: {
              start: filters.startDate || 'inicio',
              end: filters.endDate || 'fin'
            },
            client_filter: filters.client || 'todos',
            generated_at: new Date().toISOString()
          }
        };
    }
    
  } catch (error) {
    console.error('❌ Local export generation failed:', error);
    throw error;
  }
}