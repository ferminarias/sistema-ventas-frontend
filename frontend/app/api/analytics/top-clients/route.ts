import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clienteFiltro = searchParams.get('cliente');
  
  try {
    // Obtener datos reales de ventas
    const ventasUrl = new URL('/api/ventas', API_BASE);
    if (clienteFiltro) {
      ventasUrl.searchParams.append('cliente', clienteFiltro);
    }

    console.log('🏢 Fetching ventas for top clients from:', ventasUrl.toString());

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
    console.log('✅ Ventas data received for top clients:', ventas.length, 'records');

    // Obtener información de clientes
    const clientesUrl = new URL('/api/clientes', API_BASE);
    const clientesResponse = await fetch(clientesUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    let clientes = [];
    if (clientesResponse.ok) {
      clientes = await clientesResponse.json();
    }

    // Calcular top clients
    const topClientsData = calculateTopClients(ventas, clientes);
    console.log('🎯 Calculated top clients:', topClientsData.length);
    
    return NextResponse.json(topClientsData);
  } catch (error) {
    console.error('❌ Top clients API error:', error);
    
    // Fallback - clients vacíos
    return NextResponse.json([]);
  }
}

function calculateTopClients(ventas: any[], clientes: any[]) {
  if (!Array.isArray(ventas) || ventas.length === 0) {
    return [];
  }

  // Contar ventas por cliente
  const ventasPorCliente: { [key: string]: { 
    sales: number, 
    asesores: Set<string>,
    fechas: Date[]
  } } = {};
  
  ventas.forEach(v => {
    if (v.cliente_id) {
      const clienteId = String(v.cliente_id);
      if (!ventasPorCliente[clienteId]) {
        ventasPorCliente[clienteId] = {
          sales: 0,
          asesores: new Set(),
          fechas: []
        };
      }
      
      ventasPorCliente[clienteId].sales++;
      if (v.asesor) {
        ventasPorCliente[clienteId].asesores.add(v.asesor);
      }
      ventasPorCliente[clienteId].fechas.push(new Date(v.fecha_venta));
    }
  });

  // Crear mapa de nombres de clientes
  const clienteNombres: { [key: string]: string } = {};
  clientes.forEach((c: any) => {
    clienteNombres[String(c.id)] = c.name || c.nombre || `Cliente ${c.id}`;
  });

  // Crear ranking de clientes
  const topClients = Object.entries(ventasPorCliente)
    .map(([clienteId, data]) => {
      // Calcular frecuencia promedio (días entre ventas)
      const fechasOrdenadas = data.fechas.sort((a, b) => a.getTime() - b.getTime());
      let frequency = 0;
      
      if (fechasOrdenadas.length > 1) {
        const totalDias = fechasOrdenadas.reduce((acc, fecha, index) => {
          if (index === 0) return 0;
          const diasEntre = Math.abs(fecha.getTime() - fechasOrdenadas[index - 1].getTime()) / (1000 * 60 * 60 * 24);
          return acc + diasEntre;
        }, 0);
        frequency = Math.round((totalDias / (fechasOrdenadas.length - 1)) * 10) / 10;
      } else {
        frequency = 0; // Solo una venta
      }

      // Obtener asesor principal (el que más ventas hizo para este cliente)
      const asesoresList = Array.from(data.asesores);
      const asesorPrincipal = asesoresList[0] || 'Sin asesor';

      return {
        name: clienteId, // ID del cliente
        sales: data.sales,
        frequency,
        advisor: asesorPrincipal
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10); // Top 10

  return topClients;
}