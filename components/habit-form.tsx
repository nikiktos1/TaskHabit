"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Типы привычек
enum HabitFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

// Схема валидации для формы создания привычки
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  description: z.string().optional(),
  frequency: z.nativeEnum(HabitFrequency),
  period: z.coerce.number().min(1, {
    message: "Период должен быть не менее 1",
  }),
  target: z.coerce.number().min(1, {
    message: "Цель должна быть не менее 1",
  }),
  startDate: z.date({
    required_error: "Пожалуйста, выберите дату начала",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface HabitFormProps {
  initialData?: FormValues
  onSubmit: (data: FormValues) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

export function HabitForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: HabitFormProps) {
  // Инициализация формы с react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      frequency: HabitFrequency.DAILY,
      period: 1,
      target: 21, // По умолчанию 21 день (стандартное время формирования привычки)
      startDate: new Date(),
    },
  })

  // Получение текста для метки продолжительности в зависимости от выбранной частоты
  const getPeriodLabel = () => {
    const frequency = form.watch("frequency")
    switch (frequency) {
      case HabitFrequency.DAILY:
        return "Повторять каждые (дней)"
      case HabitFrequency.WEEKLY:
        return "Повторять каждые (недель)"
      case HabitFrequency.MONTHLY:
        return "Повторять каждые (месяцев)"
      default:
        return "Период повторения"
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название привычки</FormLabel>
              <FormControl>
                <Input placeholder="Например: Ежедневная медитация" {...field} />
              </FormControl>
              <FormDescription>
                Короткое и понятное название вашей привычки
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание (необязательно)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Опишите подробности вашей привычки"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Частота</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите частоту" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={HabitFrequency.DAILY}>Ежедневно</SelectItem>
                    <SelectItem value={HabitFrequency.WEEKLY}>Еженедельно</SelectItem>
                    <SelectItem value={HabitFrequency.MONTHLY}>Ежемесячно</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getPeriodLabel()}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цель (дней)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormDescription>
                  Количество дней для формирования привычки
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Дата начала</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="ml-auto">
            {isSubmitting ? "Сохранение..." : initialData ? "Сохранить изменения" : "Создать привычку"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
