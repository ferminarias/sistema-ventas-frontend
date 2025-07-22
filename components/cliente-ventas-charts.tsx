import { useEffect, useRef, useState } from "react"

export function ClienteVentasCharts({ cliente, clientIdToName, nombreCliente }: ClienteVentasChartsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 500, height: 300 })

  useEffect(() => {
    const updateCanvasDimensions = () => {
      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect()
        setCanvasDimensions({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 200)
        })
      }
    }
    const resizeObserver = new window.ResizeObserver(updateCanvasDimensions)
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current)
    }
    updateCanvasDimensions()
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    const dpr = window.devicePixelRatio || 1;
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    chartRef.current.width = width * dpr;
    chartRef.current.height = height * dpr;
    chartRef.current.style.width = width + "px";
    chartRef.current.style.height = height + "px";
    // ... resto del código de dibujo ...
  }, [canvasDimensions /*, ...otros deps necesarios*/])

  return (
    <div ref={chartContainerRef} className="w-full min-h-[320px]" style={{ height: '320px' }}>
      <canvas
        ref={chartRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="w-full h-full rounded-lg"
      ></canvas>
    </div>
  )
} 