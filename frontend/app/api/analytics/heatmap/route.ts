import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener parámetros según la documentación del backend
    const client_id = searchParams.get('client_id')
    
    // Obtener token de autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    console.log('🗓️ Calling backend heatmap API with client_id:', client_id)

    // Construir URL del backend
    const backendUrl = new URL('/api/analytics/heatmap', API_BASE)
    if (client_id) backendUrl.searchParams.set('client_id', client_id)

    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Backend heatmap API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend heatmap data received:', data)
    
    // La respuesta debe tener: [{ date, sales, dayOfWeek, week }]
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en heatmap API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}