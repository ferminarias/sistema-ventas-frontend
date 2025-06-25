import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';
const BACKEND_URL = `${API_BASE}/api/advisors`;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const url = `${BACKEND_URL}/${id}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.get('cookie') ? { 'Cookie': req.headers.get('cookie')! } : {}),
      ...(req.headers.get('authorization') ? { 'Authorization': req.headers.get('authorization')! } : {}),
    },
    credentials: 'include',
  });
  
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.text();
  const url = `${BACKEND_URL}/${id}`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.get('cookie') ? { 'Cookie': req.headers.get('cookie')! } : {}),
      ...(req.headers.get('authorization') ? { 'Authorization': req.headers.get('authorization')! } : {}),
    },
    body,
    credentials: 'include',
  });
  
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const url = `${BACKEND_URL}/${id}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.get('cookie') ? { 'Cookie': req.headers.get('cookie')! } : {}),
      ...(req.headers.get('authorization') ? { 'Authorization': req.headers.get('authorization')! } : {}),
    },
    credentials: 'include',
  });
  
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 