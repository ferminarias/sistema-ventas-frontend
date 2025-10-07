import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener parámetros según la documentación del backend
    const cliente = searchParams.get('cliente') || searchParams.get('client_id')
    
    // Este endpoint requiere cliente según la documentación
    if (!cliente) {
      return NextResponse.json({ error: 'Parámetro cliente es requerido' }, { status: 400 })
    }
    
    // Obtener token de autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    console.log('📚 Calling backend programa-distribution API with cliente:', cliente)

    // Construir URL del backend
    const backendUrl = new URL('/api/analytics/programa-distribution', API_BASE)
    backendUrl.searchParams.set('cliente', cliente)

    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Backend programa-distribution API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend programa-distribution data received:', data)
    
    // La respuesta debe tener: { labels: string[], data: number[], total: number }
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en programa-distribution API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
