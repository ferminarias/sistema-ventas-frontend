import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener parámetros según la documentación del backend
    const cliente = searchParams.get('cliente') || searchParams.get('client_id')
    const month = searchParams.get('month') // '01'..'12' | 'all' | omitido
    const year = searchParams.get('year')   // '2024'..'2030' | 'all' | omitido
    
    // Obtener token de autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    console.log('👥 Calling backend top-advisors-with-icons API with params:', { cliente, month, year })

    // Construir URL del backend con parámetros correctos
    const backendUrl = new URL('/api/analytics/top-advisors-with-icons', API_BASE)
    
    if (cliente) backendUrl.searchParams.set('cliente', cliente)
    if (month) backendUrl.searchParams.set('month', month)
    if (year) backendUrl.searchParams.set('year', year)

    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ Backend top-advisors-with-icons API failed:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Backend top-advisors-with-icons data received:', data)
    
    // La respuesta debe tener:
    // {
    //   period: { month: number|null, year: number|null } | null,
    //   items: [{ name, sales, iconUrl, icon_url, publicId }],
    //   general: [{ id, name, sales, percentage }],
    //   byClient: [{ id, name, sales, client }]
    // }
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('❌ Error en top-advisors-with-icons API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}