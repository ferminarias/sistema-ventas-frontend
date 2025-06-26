"use client"

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/components/ui/file-upload"
import type { ClientField } from "@/services/client-fields-service"
import { Control } from "react-hook-form"

interface DynamicFieldProps {
  field: ClientField;
  control: Control<any>;
  disabled?: boolean;
}

export function DynamicField({ field, control, disabled }: DynamicFieldProps) {
  // Protección contra control null/undefined
  if (!control) {
    console.error('DynamicField: control is null or undefined')
    return (
      <div className="p-3 border rounded bg-muted/50">
        <p className="text-sm font-medium">{typeof field.label === 'string' ? field.label : JSON.stringify(field.label)}</p>
        <p className="text-xs text-muted-foreground">Tipo: {field.type}</p>
        {field.required && <p className="text-xs text-red-500">Campo requerido</p>}
      </div>
    )
  }

  const renderFieldByType = (fieldProps: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            disabled={disabled}
            {...fieldProps}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled={disabled}
            className="min-h-[100px]"
            {...fieldProps}
          />
        );

      case 'select':
        return (
          <Select
            value={fieldProps.value}
            onValueChange={fieldProps.onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Seleccionar ${typeof field.label === 'string' ? field.label.toLowerCase() : 'opción'}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fieldProps.value && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fieldProps.value ? (
                  format(new Date(fieldProps.value), "PPP", { locale: es })
                ) : (
                  <span>{field.placeholder || "Seleccionar fecha"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fieldProps.value ? new Date(fieldProps.value) : undefined}
                onSelect={(date) => fieldProps.onChange(date?.toISOString().split('T')[0])}
                disabled={(date) => 
                  disabled || 
                  date > new Date() || 
                  date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'file':
        return (
          <FileUpload
            field={field}
            value={fieldProps.value}
            onChange={fieldProps.onChange}
            disabled={disabled}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={fieldProps.value || false}
              onCheckedChange={fieldProps.onChange}
              disabled={disabled}
            />
            <label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.placeholder || (typeof field.label === 'string' ? field.label : JSON.stringify(field.label))}
            </label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={fieldProps.value}
            onValueChange={fieldProps.onChange}
            disabled={disabled}
            className="flex flex-col space-y-2"
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <label
                  htmlFor={`${field.id}-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option}
                </label>
              </div>
            ))}
          </RadioGroup>
        );

      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            disabled={disabled}
            {...fieldProps}
          />
        );
    }
  };

  try {
    return (
      <FormField
        control={control}
        name={field.id}
        render={({ field: fieldProps }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {typeof field.label === 'string' ? field.label : JSON.stringify(field.label)}
              {field.required && <span className="text-red-500">*</span>}
            </FormLabel>
            
            {field.help_text && field.type !== 'file' && (
              <p className="text-sm text-muted-foreground">{field.help_text}</p>
            )}
            
            <FormControl>
              {renderFieldByType(fieldProps)}
            </FormControl>
            
            <FormMessage />
          </FormItem>
        )}
      />
    );
  } catch (error) {
    console.error('Error in DynamicField:', error)
    return (
      <div className="p-3 border rounded bg-red-50 border-red-200">
        <p className="text-sm font-medium text-red-700">Error en campo: {typeof field.label === 'string' ? field.label : JSON.stringify(field.label)}</p>
        <p className="text-xs text-red-600">Tipo: {field.type}</p>
      </div>
    )
  }
} 