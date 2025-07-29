"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Info, RefreshCw, FileSpreadsheet, Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TypographyExamples() {
  return (
    <div className="space-y-8 p-6">
      {/* Ejemplo del nuevo Dashboard Header */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-display text-3xl md:text-4xl lg:text-5xl text-white">
              Dashboard de Anahuac
            </h1>
            <div className="flex items-start gap-3">
              <p className="text-body text-gray-200 leading-relaxed max-w-2xl">
                Gestiona, analiza y potencia las ventas de Anahuac desde un solo panel centralizado.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-5 w-5 text-gray-400 hover:text-gray-300 cursor-help mt-1 flex-shrink-0 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-gray-800 border-gray-700 text-gray-200">
                    <span className="text-sm">
                      Este panel te permite visualizar métricas clave, analizar tendencias y tomar decisiones informadas.
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline text-button">Actualizar</span>
                <span className="sm:hidden text-button">Refrescar</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline text-button">Exportar Excel</span>
                <span className="sm:hidden text-button">Excel</span>
              </Button>
            </div>
            <Button 
              size="sm"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="text-button">Nueva Venta</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Ejemplo de Header Principal */}
      <div className="space-y-4">
        <h1 className="text-display text-4xl md:text-5xl lg:text-6xl">
          Sistema de Ventas Moderno
        </h1>
        <p className="text-caption max-w-2xl">
          Una plataforma completa para la gestión de ventas con tipografía moderna y diseño responsive
        </p>
      </div>

      {/* Ejemplo de Cards con Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-heading text-lg">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$125,430</div>
            <p className="text-caption mt-1">+12.5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-heading text-lg">Clientes Nuevos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-caption mt-1">+8.3% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-heading text-lg">Tasa de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.2%</div>
            <p className="text-caption mt-1">+0.5% vs mes anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Ejemplo de Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading text-xl">Nuevo Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">Nombre del Cliente</label>
              <input 
                type="text" 
                placeholder="Ingrese el nombre"
                className="w-full p-3 border rounded-lg text-body"
              />
            </div>
            <div>
              <label className="text-label block mb-2">Email</label>
              <input 
                type="email" 
                placeholder="cliente@ejemplo.com"
                className="w-full p-3 border rounded-lg text-body"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="text-button">Guardar Cliente</Button>
            <Button variant="outline" className="text-button">Cancelar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Ejemplo de Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading text-xl">Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-label text-left p-3">ID</th>
                  <th className="text-label text-left p-3">Cliente</th>
                  <th className="text-label text-left p-3">Asesor</th>
                  <th className="text-label text-left p-3">Monto</th>
                  <th className="text-label text-left p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="text-code p-3">#001</td>
                  <td className="text-body p-3">Juan Pérez</td>
                  <td className="text-body p-3">María García</td>
                  <td className="text-body font-medium p-3">$1,250</td>
                  <td className="p-3">
                    <Badge className="bg-green-100 text-green-800">Completada</Badge>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="text-code p-3">#002</td>
                  <td className="text-body p-3">Ana López</td>
                  <td className="text-body p-3">Carlos Ruiz</td>
                  <td className="text-body font-medium p-3">$2,100</td>
                  <td className="p-3">
                    <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="text-code p-3">#003</td>
                  <td className="text-body p-3">Roberto Silva</td>
                  <td className="text-body p-3">Laura Torres</td>
                  <td className="text-body font-medium p-3">$850</td>
                  <td className="p-3">
                    <Badge className="bg-blue-100 text-blue-800">En Proceso</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ejemplo de Jerarquía de Textos */}
      <div className="space-y-4">
        <h2 className="text-heading text-2xl md:text-3xl lg:text-4xl">Jerarquía de Textos</h2>
        <div className="space-y-2">
          <h3 className="text-heading text-xl md:text-2xl lg:text-3xl">Título de Sección</h3>
          <h4 className="text-heading text-lg md:text-xl lg:text-2xl">Subtítulo</h4>
          <h5 className="text-heading text-base md:text-lg lg:text-xl">Encabezado Menor</h5>
          <p className="text-body">
            Este es un párrafo de texto normal con la fuente Inter. La tipografía moderna 
            mejora significativamente la legibilidad y la experiencia del usuario.
          </p>
          <p className="text-caption">
            Este es un texto de caption que se usa para información secundaria o descriptiva.
          </p>
        </div>
      </div>

      {/* Ejemplo de Código */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading text-xl">Ejemplo de Código</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code className="text-code">
{`// Ejemplo de función en JavaScript
function calcularVenta(monto, descuento) {
  const total = monto - (monto * descuento);
  return total.toFixed(2);
}

const venta = calcularVenta(1000, 0.1);
console.log('Total:', venta);`}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
} 