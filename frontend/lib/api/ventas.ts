const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sistemas-de-ventas-production.up.railway.app';

// Función para obtener el token
function getToken(): string | null {
    if (typeof window === 'undefined') return null;
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
    fecha_venta: string;
    cliente: string;
}

export const ventasApi = {
    // Obtener todas las ventas o filtrar por cliente
    async getVentas(cliente?: string): Promise<Venta[]> {
        try {
            const url = cliente ? `${API_BASE}/api/ventas?cliente=${cliente}` : `${API_BASE}/api/ventas`;
            console.log('Haciendo petición GET a:', url);
            
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

        const response = await fetch(`${API_BASE}/api/ventas`, {
            method: 'POST',
            headers,
            body: JSON.stringify(venta),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la venta');
        }
        return response.json();
    },

    // Exportar a Excel
    async exportarExcel(cliente?: string): Promise<void> {
        try {
            const token = getToken();
            const headers: HeadersInit = {
                'Accept': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            console.log('Iniciando exportación a Excel...');
            const url = cliente ? `${API_BASE}/api/exportar-excel?cliente=${encodeURIComponent(cliente)}` : `${API_BASE}/api/exportar-excel`;
            console.log('URL de exportación:', url);
            
            const response = await fetch(url, {
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error en la respuesta:', errorData);
                throw new Error(errorData.error || 'Error al exportar a Excel');
            }

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (!data.path) {
                throw new Error('No se recibió la ruta del archivo');
            }

            // Construir la URL completa para la descarga
            const downloadUrl = `${API_BASE}/${data.path}`;
            console.log('URL de descarga:', downloadUrl);

            // Crear un enlace temporal y hacer clic en él
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = data.path.split('/').pop() || 'ventas.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Descarga iniciada');
            return data;
        } catch (error) {
            console.error('Error en exportarExcel:', error);
            throw error;
        }
    }
}; 