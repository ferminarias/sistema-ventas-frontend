import { NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cliente = searchParams.get('cliente') || undefined;
    const token = searchParams.get('token') || '';

    const buildUrl = (basePath: string) => {
      const url = new URL(basePath, API_BASE);
      if (cliente) url.searchParams.set('cliente', cliente);
      return url.toString();
    };

    const headers: HeadersInit = {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    // Intento primario
    let backendRes = await fetch(buildUrl('/api/ventas/exportar'), {
      method: 'GET',
      headers,
      // Server-to-server; CORS no aplica
      cache: 'no-store',
    });

    // Fallback si la ruta no existe
    if (backendRes.status === 404) {
      backendRes = await fetch(buildUrl('/api/exportar-excel'), {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
    }

    if (!backendRes.ok) {
      const errBody = await backendRes.text().catch(() => '');
      return new Response(
        JSON.stringify({ message: 'Error al exportar', status: backendRes.status, body: errBody }),
        { status: backendRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await backendRes.arrayBuffer();

    const contentType = backendRes.headers.get('Content-Type')
      || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const contentDisposition = backendRes.headers.get('Content-Disposition')
      || 'attachment; filename="ventas.xlsx"';

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: err?.message || 'Error interno en exportación' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

