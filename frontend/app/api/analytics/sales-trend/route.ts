import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener parámetros según la documentación del backend
    const period = searchParams.get('period') || '30d' // '7d' | '30d' | '90d' | '1y'
    
    // Obtener token de autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    console.log('📈 Calling backend sales-trend API with period:', period)

    // Llamar al backend real con los parámetros correctos
    const backendUrl = new URL('/api/analytics/sales-trend', API_BASE)
    backendUrl.searchParams.set('period', period)

    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Backend sales-trend API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend sales-trend data received:', data)
    
    // La respuesta debe tener: { labels: string[], sales: number[], cumulative: number[] }
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en sales-trend API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}