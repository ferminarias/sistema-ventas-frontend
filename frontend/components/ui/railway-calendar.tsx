"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface RailwayCalendarProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Función simple para formatear fecha sin dependencias externas
const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return date.toLocaleDateString('es-ES', options)
}

// Función para generar días del mes
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

// Función para obtener el primer día de la semana del mes
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

export function RailwayCalendar({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className
}: RailwayCalendarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const handleDateSelect = React.useCallback((selectedDate: Date) => {
    console.log("RailwayCalendar - Fecha seleccionada:", selectedDate)
    console.log("RailwayCalendar - Día del mes:", selectedDate.getDate())
    console.log("RailwayCalendar - Mes:", selectedDate.getMonth() + 1)
    console.log("RailwayCalendar - Año:", selectedDate.getFullYear())
    onDateChange(selectedDate)
    setIsOpen(false)
  }, [onDateChange])

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentMonth.month === today.getMonth() && 
           currentMonth.year === today.getFullYear()
  }

  const isSelected = (day: number) => {
    if (!date) return false
    return day === date.getDate() && 
           currentMonth.month === date.getMonth() && 
           currentMonth.year === date.getFullYear()
  }

  const isDisabled = (day: number) => {
    const checkDate = new Date(currentMonth.year, currentMonth.month, day)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return checkDate > today || checkDate < new Date(1900, 0, 1)
  }

  const handleDayClick = React.useCallback((day: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    console.log("RailwayCalendar - handleDayClick llamado con día:", day)
    
    if (isDisabled(day)) {
      console.log("RailwayCalendar - Día deshabilitado:", day)
      return
    }
    
    const selectedDate = new Date(currentMonth.year, currentMonth.month, day)
    console.log("RailwayCalendar - Fecha creada:", selectedDate)
    console.log("RailwayCalendar - Verificación - Día:", selectedDate.getDate(), "Mes:", selectedDate.getMonth() + 1, "Año:", selectedDate.getFullYear())
    
    handleDateSelect(selectedDate)
  }, [currentMonth, isDisabled, handleDateSelect])

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month)
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth.year, currentMonth.month)
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDate(date) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 z-50" align="start">
        <div className="space-y-4">
          {/* Header del calendario */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
              type="button"
            >
              ←
            </Button>
            <div className="text-sm font-medium">
              {monthNames[currentMonth.month]} {currentMonth.year}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
              type="button"
            >
              →
            </Button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map(day => (
              <div key={day} className="p-2 font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {/* Días vacíos al inicio */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {/* Días del mes */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const isDayDisabled = isDisabled(day)
              const isDayToday = isToday(day)
              const isDaySelected = isSelected(day)
              
              return (
                <div key={day} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-xs relative z-10",
                      isDayToday && "bg-blue-100 text-blue-900 font-bold",
                      isDaySelected && "bg-blue-600 text-white hover:bg-blue-700",
                      isDayDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
                      !isDayDisabled && !isDaySelected && "hover:bg-gray-100"
                    )}
                    disabled={isDayDisabled}
                    onClick={(e) => {
                      console.log("RailwayCalendar - Click en día:", day)
                      handleDayClick(day, e)
                    }}
                    type="button"
                    data-day={day}
                    data-testid={`calendar-day-${day}`}
                  >
                    {day}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 