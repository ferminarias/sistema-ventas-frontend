import { API_BASE } from './index';

function getToken(): string | null {
    return localStorage.getItem('token');
}

export interface Venta {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    asesor: string;
    fecha_venta: string;
    cliente: string;
}

export interface NuevaVenta {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    asesor: string;
    fecha_venta: Date | string; // Permitir tanto Date como string para que el backend maneje la conversión
    cliente: string;
}

export const ventasApi = {
    // Obtener todas las ventas o filtrar por cliente
    async getVentas(cliente?: string): Promise<Venta[]> {
        try {
            // Si cliente es "general", no enviar parámetro para obtener datos de todos los clientes
            const shouldFilterByClient = cliente && cliente !== 'general' && cliente !== 'all';
            const url = shouldFilterByClient ? `${API_BASE}/api/ventas?cliente=${cliente}` : `${API_BASE}/api/ventas`;
            console.log('Haciendo petición GET a:', url);
            console.log('Filtrar por cliente:', shouldFilterByClient ? cliente : 'NO (datos de todos los clientes)');
            
            const token = getToken();
            console.log('Token disponible:', !!token);
            
            const headers: HeadersInit = {
                'Accept': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            console.log('Headers enviados:', headers);
            
            const response = await fetch(url, { 
                method: 'GET',
                headers,
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en getVentas:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    errorText
                });
                throw new Error(`Error al obtener las ventas: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Datos recibidos:', data);
            return data;
        } catch (error) {
            console.error('Error completo en getVentas:', error);
            throw error;
        }
    },

    // Crear una nueva venta
    async createVenta(venta: NuevaVenta): Promise<Venta> {
        const token = getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Preparar los datos para enviar al backend
        const ventaData = {
            ...venta,
            // El backend debería manejar la conversión de fecha
            fecha_venta: venta.fecha_venta
        };

        console.log('Enviando venta al backend:', ventaData);

        const response = await fetch(`${API_BASE}/api/ventas`, {
            method: 'POST',
            headers,
            body: JSON.stringify(ventaData),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la venta');
        }
        return response.json();
    },

    // Exportar a Excel con fallback de ruta y CORS simplificado
    async exportarExcel(cliente?: string): Promise<void> {
        try {
            // Si cliente es "general", no enviar parámetro para exportar datos de todos los clientes
            const shouldFilterByClient = cliente && cliente !== 'general' && cliente !== 'all';
            const primaryUrl = shouldFilterByClient
                ? `${API_BASE}/api/ventas/exportar?cliente=${encodeURIComponent(String(cliente))}`
                : `${API_BASE}/api/ventas/exportar`;

            const token = getToken();
            const headers: HeadersInit = {
                // Accept es un header "simple", no dispara preflight
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

            // Helper para agregar token por query
            const withToken = (url: string): string => {
                if (!token) return url;
                const sep = url.includes('?') ? '&' : '?';
                return `${url}${sep}token=${encodeURIComponent(token)}`;
            };

            // Intento 1: endpoint primario sin Authorization (evita preflight)
            let response = await fetch(primaryUrl, {
                method: 'GET',
                headers,
                credentials: 'omit'
            });

            // Si no autorizado, reintentar con token en query
            if (response.status === 401 || response.status === 403) {
                response = await fetch(withToken(primaryUrl), {
                    method: 'GET',
                    headers,
                    credentials: 'omit'
                });
            }

            // Fallback: algunos backends exponen /api/exportar-excel
            if (response.status === 404) {
                const fallbackUrlBase = shouldFilterByClient
                    ? `${API_BASE}/api/exportar-excel?cliente=${encodeURIComponent(String(cliente))}`
                    : `${API_BASE}/api/exportar-excel`;
                // Primero sin token
                response = await fetch(fallbackUrlBase, {
                    method: 'GET',
                    headers,
                    credentials: 'omit'
                });
                // Luego con token si sigue 401/403
                if (response.status === 401 || response.status === 403) {
                    response = await fetch(withToken(fallbackUrlBase), {
                        method: 'GET',
                        headers,
                        credentials: 'omit'
                    });
                }
            }

            if (!response.ok) {
                throw new Error(`Error al exportar: ${response.status} ${response.statusText}`);
            }

            // Obtener el blob del archivo
            const blob = await response.blob();

            // Crear URL del blob
            const url_blob = window.URL.createObjectURL(blob);

            // Crear elemento de descarga
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url_blob;

            // Obtener nombre del archivo del header Content-Disposition
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'ventas.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            a.download = filename;

            // Agregar al DOM y hacer clic
            document.body.appendChild(a);
            a.click();

            // Limpiar
            window.URL.revokeObjectURL(url_blob);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error en exportarExcel:', error);
            throw error;
        }
    }
}; 