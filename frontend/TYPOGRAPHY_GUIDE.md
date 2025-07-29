# Guía de Tipografía Moderna

## Fuentes Implementadas

### Fuente Principal: Inter
- **Familia**: `font-sans` (por defecto)
- **Características**: Moderna, legible, optimizada para pantallas
- **Pesos disponibles**: 100-900 (thin a black)

### Fuente Monoespaciada: JetBrains Mono
- **Familia**: `font-mono`
- **Uso**: Código, datos técnicos, tablas
- **Pesos disponibles**: 100-800

### Fuente Display: Inter
- **Familia**: `font-display`
- **Uso**: Títulos grandes, hero sections
- **Características**: Optimizada para tamaños grandes

## Jerarquía Tipográfica

### Headings (H1-H6)
```html
<h1 class="text-4xl md:text-5xl lg:text-6xl">Título Principal</h1>
<h2 class="text-3xl md:text-4xl lg:text-5xl">Subtítulo</h2>
<h3 class="text-2xl md:text-3xl lg:text-4xl">Sección</h3>
<h4 class="text-xl md:text-2xl lg:text-3xl">Subsección</h4>
<h5 class="text-lg md:text-xl lg:text-2xl">Grupo</h5>
<h6 class="text-base md:text-lg lg:text-xl">Elemento</h6>
```

### Clases de Utilidad Predefinidas

#### `.text-display`
- Para títulos grandes y llamativos
- `font-display font-bold tracking-tight`

#### `.text-heading`
- Para headings estándar
- `font-semibold tracking-tight`

#### `.text-body`
- Para texto de cuerpo principal
- `font-normal leading-relaxed`

#### `.text-caption`
- Para texto secundario y descripciones
- `text-sm font-medium text-muted-foreground`

#### `.text-label`
- Para etiquetas y categorías
- `text-sm font-semibold tracking-wide uppercase`

#### `.text-code`
- Para código y datos técnicos
- `font-mono text-sm`

#### `.text-button`
- Para texto en botones
- `font-medium tracking-wide`

## Tamaños de Fuente Responsivos

### Escala Base
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)
- `text-5xl`: 3rem (48px)
- `text-6xl`: 3.75rem (60px)

### Pesos de Fuente
- `font-thin`: 100
- `font-extralight`: 200
- `font-light`: 300
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700
- `font-extrabold`: 800
- `font-black`: 900

### Espaciado de Letras
- `tracking-tighter`: -0.05em
- `tracking-tight`: -0.025em
- `tracking-normal`: 0em
- `tracking-wide`: 0.025em
- `tracking-wider`: 0.05em
- `tracking-widest`: 0.1em

## Ejemplos de Uso

### Dashboard Header
```html
<div class="space-y-2">
  <h1 class="text-display text-4xl md:text-5xl lg:text-6xl">
    Dashboard de Ventas
  </h1>
  <p class="text-caption">
    Resumen general de las ventas del período actual
  </p>
</div>
```

### Card de Métricas
```html
<div class="card p-6">
  <h3 class="text-heading text-xl mb-2">Ventas Totales</h3>
  <p class="text-3xl font-bold">$125,430</p>
  <p class="text-caption mt-1">+12.5% vs mes anterior</p>
</div>
```

### Formulario
```html
<form class="space-y-4">
  <div>
    <label class="text-label block mb-2">Nombre del Cliente</label>
    <input class="w-full p-3 border rounded-lg" type="text" />
  </div>
  <button class="btn text-button px-6 py-3 bg-primary text-primary-foreground rounded-lg">
    Guardar Cliente
  </button>
</form>
```

### Tabla de Datos
```html
<table class="w-full">
  <thead>
    <tr>
      <th class="text-label text-left p-3">ID</th>
      <th class="text-label text-left p-3">Cliente</th>
      <th class="text-label text-left p-3">Monto</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-code p-3">#001</td>
      <td class="text-body p-3">Juan Pérez</td>
      <td class="text-body font-medium p-3">$1,250</td>
    </tr>
  </tbody>
</table>
```

## Mejores Prácticas

1. **Consistencia**: Usa siempre las clases predefinidas para mantener consistencia
2. **Jerarquía**: Respeta la jerarquía visual con los tamaños apropiados
3. **Legibilidad**: Mantén suficiente contraste y espaciado
4. **Responsividad**: Usa las clases responsive para diferentes tamaños de pantalla
5. **Accesibilidad**: Asegúrate de que el texto sea legible para todos los usuarios

## Características Técnicas

- **Font Feature Settings**: Optimizadas para mejor legibilidad
- **Font Smoothing**: Antialiasing mejorado para pantallas
- **Text Rendering**: Optimizado para legibilidad
- **Variable Fonts**: Soporte para fuentes variables de Inter
- **Fallbacks**: Sistema robusto de fuentes de respaldo

## Migración

Para migrar componentes existentes:

1. Reemplaza clases de fuente genéricas con las nuevas utilidades
2. Actualiza headings para usar la nueva jerarquía
3. Aplica las clases de utilidad predefinidas donde sea apropiado
4. Verifica la responsividad en diferentes tamaños de pantalla 