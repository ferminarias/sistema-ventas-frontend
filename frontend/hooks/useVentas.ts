import { useState, useEffect } from 'react';
import { ventasApi, Venta, NuevaVenta } from '@/lib/api/ventas';

export function useVentas(cliente?: string) {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarVentas = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Iniciando carga de ventas...');
            const data = await ventasApi.getVentas(cliente);
            console.log('Ventas cargadas exitosamente:', data);
            setVentas(data);
        } catch (err) {
            console.error('Error en useVentas:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
        } finally {
            setLoading(false);
        }
    };

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
        console.log('useEffect triggered, cliente:', cliente);
        cargarVentas();
    }, [cliente]);

    return {
        ventas,
        loading,
        error,
        crearVenta,
        exportarExcel,
        recargarVentas: cargarVentas
    };
} 