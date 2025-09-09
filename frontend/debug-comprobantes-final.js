// Script final para debuggear el sistema de comprobantes mejorado
// Ejecutar en la consola del navegador en la página de comprobantes

console.log('🔍 DEBUG FINAL: Sistema de Comprobantes Mejorado');
console.log('=================================================');

async function testFiltersAndSearch() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token de autenticación');
    return;
  }

  const API_BASE = 'https://sistemas-de-ventas-production.up.railway.app';

  console.log('\n1️⃣ PROBANDO FILTROS MEJORADOS...');
  try {
    const filtersResponse = await fetch(`${API_BASE}/api/comprobantes/filtros`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (filtersResponse.ok) {
      const filters = await filtersResponse.json();
      console.log('✅ Filtros obtenidos:', filters);
      console.log('📁 Tipos de archivo disponibles:', filters.tipos_archivo);
      
      // Verificar si están los tipos legacy
      const hasImagenComprobante = filters.tipos_archivo?.includes('imagen_comprobante');
      const hasComprobantes = filters.tipos_archivo?.includes('comprobantes');
      
      console.log(`🎯 Tipo "imagen_comprobante": ${hasImagenComprobante ? '✅ PRESENTE' : '❌ FALTA'}`);
      console.log(`📋 Tipo "comprobantes": ${hasComprobantes ? '✅ PRESENTE' : '❌ FALTA'}`);
    }
  } catch (error) {
    console.error('❌ Error obteniendo filtros:', error);
  }

  console.log('\n2️⃣ PROBANDO BÚSQUEDA ESPECÍFICA DE ANAHUAC...');
  try {
    const searchResponse = await fetch(`${API_BASE}/api/comprobantes/search?tipo_archivo=imagen_comprobante&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('📊 Resultados búsqueda imagen_comprobante:', searchResults);
      console.log(`📈 Total encontrados: ${searchResults.pagination?.total_results || 0}`);
      
      if (searchResults.resultados?.length > 0) {
        console.log('📋 Detalles de archivos encontrados:');
        searchResults.resultados.forEach((comprobante, i) => {
          console.log(`  ${i + 1}. Venta ${comprobante.venta_id} - Cliente: ${comprobante.cliente_nombre}`);
          if (comprobante.archivos?.length > 0) {
            comprobante.archivos.forEach((archivo, j) => {
              console.log(`     📁 Archivo ${j + 1}: ${archivo.field_id} - ${archivo.filename}`);
            });
          }
        });
      } else {
        console.log('❌ No se encontraron comprobantes con imagen_comprobante');
      }
    }
  } catch (error) {
    console.error('❌ Error en búsqueda de imagen_comprobante:', error);
  }

  console.log('\n3️⃣ PROBANDO BÚSQUEDA GENERAL DE COMPROBANTES...');
  try {
    const searchResponse = await fetch(`${API_BASE}/api/comprobantes/search?tipo_archivo=comprobantes&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('📊 Resultados búsqueda comprobantes:', searchResults);
      console.log(`📈 Total encontrados: ${searchResults.pagination?.total_results || 0}`);
    }
  } catch (error) {
    console.error('❌ Error en búsqueda de comprobantes:', error);
  }

  console.log('\n4️⃣ PROBANDO BÚSQUEDA SIN FILTROS...');
  try {
    const searchResponse = await fetch(`${API_BASE}/api/comprobantes/search?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResults.json();
      console.log('📊 Resultados búsqueda sin filtros:', searchResults);
      console.log(`📈 Total general: ${searchResults.pagination?.total_results || 0}`);
      
      // Analizar tipos de archivos encontrados
      const tiposEncontrados = new Set();
      searchResults.resultados?.forEach(comprobante => {
        comprobante.archivos?.forEach(archivo => {
          if (archivo.field_id) tiposEncontrados.add(archivo.field_id);
        });
      });
      
      console.log('🔍 Tipos de field_id encontrados en la muestra:', Array.from(tiposEncontrados));
    }
  } catch (error) {
    console.error('❌ Error en búsqueda general:', error);
  }

  console.log('\n🎯 RESUMEN DEL DEBUG:');
  console.log('====================');
  console.log('✅ Las mejoras implementadas incluyen:');
  console.log('  - Tipos legacy agregados automáticamente a filtros');
  console.log('  - Botones de búsqueda rápida para Anahuac y Comprobantes');
  console.log('  - Logging detallado para debugging');
  console.log('  - Filtros prioritarios en el dropdown');
  console.log('\n🚀 Prueba usar los botones de búsqueda rápida en la interfaz!');
}

// Ejecutar el test
testFiltersAndSearch();
