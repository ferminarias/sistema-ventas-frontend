import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  return handleExport(request)
}

export async function POST(request: NextRequest) {
  return handleExport(request)
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

async function handleExport(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener token de autenticación (flexible según documentación)
    let token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.cookies.get('token')?.value ||
                searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    let params: any = {}

    if (request.method === 'POST') {
      // Obtener parámetros del body para POST
      try {
        params = await request.json()
      } catch {
        params = {}
      }
    } else {
      // Obtener parámetros de query para GET
      params = {
        client: searchParams.get('client') || searchParams.get('cliente'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        format: searchParams.get('format') || 'excel'
      }
    }

    console.log('📊 Calling backend export API with params:', params)

    // Construir URL del backend
    const backendUrl = new URL('/api/analytics/export', API_BASE)
    
    let response: Response

    if (request.method === 'POST') {
      // POST request
      response = await fetch(backendUrl.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
    } else {
      // GET request
      if (params.client) backendUrl.searchParams.set('client', params.client)
      if (params.startDate) backendUrl.searchParams.set('startDate', params.startDate)
      if (params.endDate) backendUrl.searchParams.set('endDate', params.endDate)
      if (params.format) backendUrl.searchParams.set('format', params.format)
      if (token) backendUrl.searchParams.set('token', token)

      response = await fetch(backendUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    if (!response.ok) {
      console.error('❌ Backend export API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend export data received:', data)
    
    // La respuesta debe tener: { path, records?, message? }
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en export API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}