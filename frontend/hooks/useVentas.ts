import { useState, useEffect, useRef, useCallback } from 'react';
import { ventasApi, Venta, NuevaVenta } from '@/lib/api/ventas';

export function useVentas(cliente?: string) {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Referencias para evitar llamadas duplicadas
    const lastClienteRef = useRef<string | undefined>(undefined);
    const loadingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const cargarVentas = useCallback(async (clienteParam?: string) => {
        // Evitar llamadas duplicadas
        if (loadingRef.current && lastClienteRef.current === clienteParam) {
            console.log('⚠️ Llamada duplicada evitada para cliente:', clienteParam);
            return;
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        try {
            loadingRef.current = true;
            setLoading(true);
            setError(null);
            
            // Crear nuevo AbortController
            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            
            console.log('🔄 Iniciando carga de ventas para cliente:', clienteParam);
            const data = await ventasApi.getVentas(clienteParam);
            
            // Verificar si la operación fue cancelada
            if (abortController.signal.aborted) {
                console.log('🚫 Operación cancelada para cliente:', clienteParam);
                return;
            }
            
            console.log('✅ Ventas cargadas exitosamente:', data.length, 'registros');
            setVentas(data);
            lastClienteRef.current = clienteParam;
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('🚫 Request cancelado para cliente:', clienteParam);
                return;
            }
            console.error('❌ Error en useVentas:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
        } finally {
            loadingRef.current = false;
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, []);

    const crearVenta = async (venta: NuevaVenta) => {
        try {
            setError(null);
            console.log('Creando nueva venta:', venta);
            const nuevaVenta = await ventasApi.createVenta(venta);
            console.log('Venta creada exitosamente:', nuevaVenta);
            setVentas(prev => [nuevaVenta, ...prev]);
            return nuevaVenta;
        } catch (err) {
            console.error('Error en crearVenta:', err);
            setError(err instanceof Error ? err.message : 'Error al crear la venta');
            throw err;
        }
    };

    const exportarExcel = async () => {
        try {
            setError(null);
            console.log('Iniciando exportación a Excel...');
            await ventasApi.exportarExcel(cliente);
            console.log('Exportación a Excel completada');
        } catch (err) {
            console.error('Error en exportarExcel:', err);
            setError(err instanceof Error ? err.message : 'Error al exportar a Excel');
            throw err;
        }
    };

    useEffect(() => {
        console.log('📌 useEffect triggered, cliente:', cliente);
        cargarVentas(cliente);
        
        // Cleanup: cancelar request si el componente se desmonta o cliente cambia
        return () => {
            if (abortControllerRef.current) {
                console.log('🧹 Cleanup: cancelando request para cliente:', cliente);
                abortControllerRef.current.abort();
            }
        };
    }, [cliente, cargarVentas]);

    return {
        ventas,
        loading,
        error,
        crearVenta,
        exportarExcel,
        recargarVentas: () => cargarVentas(cliente)
    };
} 