"use client"

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
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
              <SelectValue placeholder={field.placeholder || `Seleccionar ${field.label.toLowerCase()}`} />
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

  return (
    <FormField
      control={control}
      name={field.id}
      render={({ field: fieldProps }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1">
            {field.label}
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
} 