# Guía de Tipografía Moderna y UX

## 🎨 Principios de UX Implementados

### **Contraste y Legibilidad**
- **Texto principal**: `text-white` para máximo contraste en fondos oscuros
- **Texto secundario**: `text-gray-200` para buen contraste sin ser agresivo
- **Texto terciario**: `text-gray-400` para información menos importante
- **Ratios de contraste**: Cumplen con WCAG AA (4.5:1) para accesibilidad

### **Jerarquía Visual**
- **Títulos**: `text-display` con tamaños responsivos
- **Subtítulos**: `text-heading` para secciones
- **Cuerpo**: `text-body` para contenido principal
- **Captions**: `text-caption` para información secundaria

### **Capitalización Inteligente**
- **Nombres de clientes**: Capitalización apropiada (ej: "Anahuac" en lugar de "anahuac")
- **Títulos**: Capitalización de título (Title Case)
- **Labels**: Uppercase para etiquetas de formularios

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
<h1 class="text-display text-4xl md:text-5xl lg:text-6xl">Título Principal</h1>
<h2 class="text-heading text-3xl md:text-4xl lg:text-5xl">Subtítulo</h2>
<h3 class="text-heading text-2xl md:text-3xl lg:text-4xl">Sección</h3>
<h4 class="text-heading text-xl md:text-2xl lg:text-3xl">Subsección</h4>
<h5 class="text-heading text-lg md:text-xl lg:text-2xl">Grupo</h5>
<h6 class="text-heading text-base md:text-lg lg:text-xl">Elemento</h6>
```

### Clases de Utilidad Predefinidas

#### `.text-display`
- Para títulos grandes y llamativos
- `font-display font-bold tracking-tight`
- **Uso**: Headers principales, hero sections

#### `.text-heading`
- Para headings estándar
- `font-semibold tracking-tight`
- **Uso**: Títulos de secciones, cards

#### `.text-body`
- Para texto de cuerpo principal
- `font-normal leading-relaxed`
- **Uso**: Párrafos, contenido principal

#### `.text-caption`
- Para texto secundario y descripciones
- `text-sm font-medium text-muted-foreground`
- **Uso**: Descripciones, información adicional

#### `.text-label`
- Para etiquetas y categorías
- `text-sm font-semibold tracking-wide uppercase`
- **Uso**: Labels de formularios, headers de tablas

#### `.text-code`
- Para código y datos técnicos
- `font-mono text-sm`
- **Uso**: IDs, códigos, datos técnicos

#### `.text-button`
- Para texto en botones
- `font-medium tracking-wide`
- **Uso**: Texto de botones, CTAs

## 🎯 Ejemplos de Implementación

### Dashboard Header Moderno
```html
<div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
  <div class="flex-1 min-w-0 space-y-3">
    <!-- Título principal con tipografía moderna -->
    <h1 class="text-display text-3xl md:text-4xl lg:text-5xl text-white">
      Dashboard de Anahuac
    </h1>
    
    <!-- Descripción con mejor contraste -->
    <div class="flex items-start gap-3">
      <p class="text-body text-gray-200 leading-relaxed max-w-2xl">
        Gestiona, analiza y potencia las ventas de Anahuac desde un solo panel centralizado.
      </p>
      <Info class="h-5 w-5 text-gray-400 hover:text-gray-300 cursor-help" />
    </div>
  </div>
  
  <!-- Botones con tipografía consistente -->
  <div class="flex gap-3">
    <Button class="text-button">Actualizar</Button>
    <Button class="text-button">Exportar Excel</Button>
    <Button class="text-button">Nueva Venta</Button>
  </div>
</div>
```

### Cards de Métricas
```html
<Card>
  <CardHeader class="pb-2">
    <CardTitle class="text-heading text-lg">Ventas Totales</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="text-3xl font-bold">$125,430</div>
    <p class="text-caption mt-1">+12.5% vs mes anterior</p>
  </CardContent>
</Card>
```

### Formularios
```html
<form class="space-y-4">
  <div>
    <label class="text-label block mb-2">Nombre del Cliente</label>
    <input class="w-full p-3 border rounded-lg text-body" type="text" />
  </div>
  <Button class="text-button px-6 py-3 bg-primary text-primary-foreground rounded-lg">
    Guardar Cliente
  </Button>
</form>
```

### Tablas de Datos
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

## 🎨 Paleta de Colores para Texto

### Fondos Oscuros (Dashboard)
- **Texto principal**: `text-white` (#FFFFFF)
- **Texto secundario**: `text-gray-200` (#E5E7EB)
- **Texto terciario**: `text-gray-400` (#9CA3AF)
- **Texto muted**: `text-gray-500` (#6B7280)

### Fondos Claros (Formularios)
- **Texto principal**: `text-gray-900` (#111827)
- **Texto secundario**: `text-gray-700` (#374151)
- **Texto terciario**: `text-gray-500` (#6B7280)
- **Texto muted**: `text-gray-400` (#9CA3AF)

## 📱 Responsividad

### Breakpoints
- **Mobile**: `text-3xl` para títulos principales
- **Tablet**: `md:text-4xl` para títulos principales
- **Desktop**: `lg:text-5xl` para títulos principales

### Espaciado Adaptativo
- **Mobile**: `gap-4` entre elementos
- **Desktop**: `md:gap-6` entre elementos

## ♿ Accesibilidad

### Contraste
- **WCAG AA**: Todos los textos cumplen con ratio 4.5:1
- **WCAG AAA**: Textos principales cumplen con ratio 7:1

### Tamaños de Fuente
- **Mínimo**: 14px para texto de cuerpo
- **Recomendado**: 16px para mejor legibilidad

### Espaciado
- **Line-height**: 1.5 para texto de cuerpo
- **Letter-spacing**: Ajustado para mejor legibilidad

## 🔧 Funciones de Utilidad

### Capitalización de Nombres
```javascript
const formatClientName = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}
```

### Clases de Transición
```css
.transition-all {
  transition: all 0.2s ease-in-out;
}
```

## 📋 Checklist de Implementación

- [ ] Usar `.text-display` para títulos principales
- [ ] Usar `.text-heading` para subtítulos
- [ ] Usar `.text-body` para contenido principal
- [ ] Usar `.text-caption` para información secundaria
- [ ] Usar `.text-label` para etiquetas
- [ ] Usar `.text-code` para datos técnicos
- [ ] Usar `.text-button` para texto de botones
- [ ] Verificar contraste en fondos oscuros y claros
- [ ] Implementar capitalización apropiada
- [ ] Probar responsividad en todos los breakpoints
- [ ] Verificar accesibilidad con lectores de pantalla

## 🚀 Mejores Prácticas

1. **Consistencia**: Usa siempre las clases predefinidas
2. **Jerarquía**: Respeta la jerarquía visual con los tamaños apropiados
3. **Contraste**: Mantén suficiente contraste para legibilidad
4. **Responsividad**: Usa las clases responsive para diferentes tamaños
5. **Accesibilidad**: Asegúrate de que el texto sea legible para todos
6. **Capitalización**: Usa capitalización apropiada para nombres propios
7. **Espaciado**: Mantén espaciado consistente entre elementos
8. **Transiciones**: Usa transiciones suaves para mejor UX 