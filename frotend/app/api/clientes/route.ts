import { NextRequest, NextResponse } from "next/server";
import { clientsApi } from "@/lib/api/clients";

// Obtener el token desde la cookie o el header
function getToken(req: NextRequest): string | null {
  // Intenta desde cookie
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) return cookieToken;
  // Intenta desde header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const clients = await clientsApi.getClients(token);
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al obtener clientes" }, { status: 500 });
  }
} 