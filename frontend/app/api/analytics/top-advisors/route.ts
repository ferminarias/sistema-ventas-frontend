import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener parámetros según la documentación del backend (LEGACY)
    const client_id = searchParams.get('client_id')
    
    // Obtener token de autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    console.log('👥 Calling backend top-advisors (LEGACY) API with client_id:', client_id)

    // Construir URL del backend
    const backendUrl = new URL('/api/analytics/top-advisors', API_BASE)
    if (client_id) backendUrl.searchParams.set('client_id', client_id)

    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Backend top-advisors API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend top-advisors data received:', data)
    
    // La respuesta debe tener (legacy):
    // {
    //   general: [{ id, name, sales, percentage }],
    //   byClient: [{ id, name, sales, client }]
    // }
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en top-advisors API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}