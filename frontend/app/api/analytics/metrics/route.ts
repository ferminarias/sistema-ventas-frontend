import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    // Obtener token de autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    console.log('📊 Calling backend metrics API...')

    // Llamar directamente al backend real
    const response = await fetch(`${API_BASE}/api/analytics/metrics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Backend metrics API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend metrics data received:', data)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en metrics API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}