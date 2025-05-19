"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/dashboard-layout";
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
import { Habit, HabitFrequency } from "@/types/habit";
import { getHabitById, updateHabit } from "../../actions";
import { toast } from "sonner";

// Схема валидации для формы редактирования привычки
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  description: z.string().optional(),
  frequency: z.nativeEnum(HabitFrequency),
  duration: z.coerce.number().min(1, {
    message: "Продолжительность должна быть не менее 1",
  }),
});

interface EditHabitPageProps {
  params: {
    id: string;
  };
}

export default function EditHabitPage({ params }: EditHabitPageProps) {
  const { id } = params;
  const router = useRouter();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Инициализация формы с react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      frequency: HabitFrequency.DAILY,
      duration: 21,
    },
  });

  // Загрузка данных привычки
  useEffect(() => {
    const loadHabit = async () => {
      try {
        setLoading(true);
        const habitData = await getHabitById(id);

        if (!habitData) {
          toast.error("Привычка не найдена");
          router.push("/habits");
          return;
        }

        setHabit(habitData);

        // Заполняем форму данными привычки
        form.reset({
          title: habitData.title,
          description: habitData.description || "",
          frequency: habitData.frequency,
          duration: habitData.duration,
        });
      } catch (error) {
        console.error("Ошибка при загрузке привычки:", error);
        toast.error("Не удалось загрузить данные привычки");
        router.push("/habits");
      } finally {
        setLoading(false);
      }
    };

    loadHabit();
  }, [id, router, form]);

  // Обработчик отправки формы
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      // Обновляем привычку
      try {
        await updateHabit({
          id,
          title: values.title,
          description: values.description,
          frequency: values.frequency,
          duration: values.duration,
        });

        toast.success("Привычка успешно обновлена!");
        router.push("/habits");
      } catch (err) {
        console.error("Ошибка при вызове updateHabit:", err);
        toast.error("Не удалось обновить привычку. Пожалуйста, попробуйте снова.");
      }
    } catch (error) {
      console.error("Ошибка при обновлении привычки:", error);
      toast.error("Не удалось обновить привычку. Пожалуйста, попробуйте снова.");
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
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Редактирование привычки</h1>
            <p className="text-muted-foreground mt-1">
              Измените параметры вашей привычки
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название привычки</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Textarea {...field} />
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

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/habits")}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
