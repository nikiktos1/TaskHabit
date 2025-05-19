"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CreateHabitInput, HabitFrequency } from "@/types/habit";
import { createHabit } from "@/app/habits/actions";
import { toast } from "sonner";
import { useSync } from "@/contexts/sync-context";

// Схема валидации для формы создания привычки
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  description: z.string().optional(),
  frequency: z.nativeEnum(HabitFrequency),
  duration: z.coerce.number().min(1, {
    message: "Продолжительность должна быть не менее 1",
  }),
  startDate: z.date({
    required_error: "Пожалуйста, выберите дату начала",
  }),
});

interface CreateHabitFormProps {
  onSuccess?: () => void;
}

export function CreateHabitForm({ onSuccess }: CreateHabitFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshDashboardPage } = useSync();

  // Инициализация формы с react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      frequency: HabitFrequency.DAILY,
      duration: 21, // По умолчанию 21 день (стандартное время формирования привычки)
      startDate: new Date(),
    },
  });

  // Обработчик отправки формы
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      const habitData: CreateHabitInput = {
        title: values.title,
        description: values.description,
        frequency: values.frequency,
        duration: values.duration,
        startDate: values.startDate,
      };

      // Создаем привычку
      await createHabit(habitData);
      toast.success("Привычка успешно создана!");
      form.reset();

      // Обновляем Dashboard
      refreshDashboardPage();

      // Вызываем функцию onSuccess, если она передана
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Ошибка при создании привычки:", error);
      toast.error("Не удалось создать привычку. Пожалуйста, попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Получение текста для продолжительности в зависимости от частоты
  const getDurationLabel = () => {
    const frequency = form.watch("frequency");
    switch (frequency) {
      case HabitFrequency.DAILY:
        return "Количество дней";
      case HabitFrequency.WEEKLY:
        return "Количество недель";
      case HabitFrequency.MONTHLY:
        return "Количество месяцев";
      default:
        return "Продолжительность";
    }
  };

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
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getDurationLabel()}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Создание..." : "Создать привычку"}
        </Button>
      </form>
    </Form>
  );
}
