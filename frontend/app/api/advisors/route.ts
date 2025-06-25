import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';
const BACKEND_URL = `${API_BASE}/api/advisors`;

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  const url = `${BACKEND_URL}${search}`;
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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
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

export async function DELETE(req: NextRequest) {
  const { search } = new URL(req.url);
  const url = `${BACKEND_URL}${search}`;
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