"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/supabase/client"
import { useAuth } from "@/hooks/use-auth"

// Типы привычек
export enum HabitFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

// Статус привычки
export enum HabitStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused",
}

// Тип данных для привычки
export type Habit = {
  id: string
  title: string
  description?: string
  streak: number
  target: number
  completed: boolean
  frequency: HabitFrequency
  period: number // количество дней/недель/месяцев
  startDate: Date
  endDate?: Date
  status: HabitStatus
  createdAt: Date
  updatedAt: Date
}

// Тип данных для формы привычки
export interface HabitFormData {
  title: string
  description?: string
  frequency: HabitFrequency
  period: number
  target: number
  startDate: Date
}

// Интерфейс контекста привычек
interface HabitsContextType {
  habits: Habit[]
  loading: boolean
  error: string | null
  addHabit: (habit: HabitFormData) => Promise<void>
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleHabitCompletion: (id: string) => Promise<void>
  incrementHabitStreak: (id: string) => Promise<void>
  fetchHabits: () => Promise<void>
}

// Создаем контекст с начальным значением null
const HabitsContext = createContext<HabitsContextType | null>(null)

// Хук для использования контекста привычек
export function useHabits() {
  const context = useContext(HabitsContext)
  if (!context) {
    throw new Error("useHabits должен использоваться внутри HabitsProvider")
  }
  return context
}

// Провайдер контекста привычек
export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Проверка существования таблицы
  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      // Проверяем существование таблицы, запрашивая ее метаданные
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      // Если ошибка содержит "relation does not exist", таблица не существует
      if (error && error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Ошибка при проверке таблицы ${tableName}:`, error);
      return false;
    }
  };

  // Функция для создания демо-привычек
  const createDemoHabits = async () => {
    if (!user) return;

    try {
      const now = new Date();

      // Создаем демо-привычки
      const demoHabits = [
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Ежедневная медитация",
          description: "Медитация для снятия стресса",
          frequency: HabitFrequency.DAILY,
          duration: 7,
          start_date: now.toISOString(),
          end_date: new Date(now.getTime() + 7 * 86400000).toISOString(),
          status: HabitStatus.ACTIVE,
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Чтение 30 минут",
          description: "Чтение книг для саморазвития",
          frequency: HabitFrequency.DAILY,
          duration: 7,
          start_date: now.toISOString(),
          end_date: new Date(now.getTime() + 7 * 86400000).toISOString(),
          status: HabitStatus.ACTIVE,
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Физические упражнения",
          description: "Тренировка для поддержания формы",
          frequency: HabitFrequency.WEEKLY,
          duration: 5,
          start_date: now.toISOString(),
          end_date: new Date(now.getTime() + 5 * 7 * 86400000).toISOString(),
          status: HabitStatus.ACTIVE,
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Ежемесячный обзор",
          description: "Анализ достижений и планирование",
          frequency: HabitFrequency.MONTHLY,
          duration: 3,
          start_date: now.toISOString(),
          end_date: new Date(now.getTime() + 3 * 30 * 86400000).toISOString(),
          status: HabitStatus.ACTIVE,
        },
      ];

      // Добавляем привычки в базу данных
      for (const habit of demoHabits) {
        const { error } = await supabase.from("habits").insert(habit);

        if (error) {
          console.error("Ошибка при создании демо-привычки:", error);
          continue;
        }

        // Создаем логи для привычек
        const habitLog = {
          id: crypto.randomUUID(),
          habit_id: habit.id,
          user_id: user.id,
          date: now.toISOString(),
          completed: Math.random() > 0.5, // Случайное значение для демонстрации
          notes: "Демо-запись",
        };

        await supabase.from("habit_logs").insert(habitLog);
      }
    } catch (error) {
      console.error("Ошибка при создании демо-привычек:", error);
    }
  };

  // Загрузка привычек из Supabase
  const fetchHabits = async () => {
    if (!user) {
      setHabits([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Проверяем существование таблицы habits
      const habitsTableExists = await checkTableExists('habits');

      if (!habitsTableExists) {
        setError("Таблица привычек не существует. Пожалуйста, запустите миграции базы данных.");
        setHabits([]);
        setLoading(false);
        return;
      }

      // Проверяем существование таблицы habit_logs
      const logsTableExists = await checkTableExists('habit_logs');

      if (!logsTableExists) {
        setError("Таблица логов привычек не существует. Пожалуйста, запустите миграции базы данных.");
        setHabits([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("habits")
        .select("*, habit_logs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Преобразуем данные из БД в формат Habit
      const formattedHabits: Habit[] = data.map((habit) => {
        // Вычисляем текущую серию на основе логов
        const logs = habit.habit_logs || []
        const streak = logs.filter((log: any) => log.completed).length

        // Определяем, выполнена ли привычка сегодня
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isCompletedToday = logs.some((log: any) => {
          const logDate = new Date(log.date)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === today.getTime() && log.completed
        })

        return {
          id: habit.id,
          title: habit.title,
          description: habit.description,
          streak: streak,
          target: habit.duration, // Используем duration как target
          completed: isCompletedToday,
          frequency: habit.frequency,
          period: 1, // По умолчанию период 1
          startDate: new Date(habit.start_date),
          endDate: habit.end_date ? new Date(habit.end_date) : undefined,
          status: habit.status,
          createdAt: new Date(habit.created_at),
          updatedAt: new Date(habit.updated_at),
        }
      })

      setHabits(formattedHabits)

      // Если таблица существует, но привычек нет, создаем демо-привычки
      if (formattedHabits.length === 0) {
        await createDemoHabits()
      }
    } catch (error: any) {
      console.error("Ошибка при загрузке привычек:", error)
      // Проверяем, есть ли у ошибки сообщение
      const errorMessage = error.message ||
                          (error.toString && error.toString() !== '[object Object]' ? error.toString() :
                          "Не удалось загрузить привычки. Возможно, таблица не существует.");
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Загружаем привычки при изменении пользователя
  useEffect(() => {
    fetchHabits()

    // Подписываемся на изменения в таблице habits
    const habitsSubscription = supabase
      .channel("habits_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habits",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchHabits()
        }
      )
      .subscribe()

    // Подписываемся на изменения в таблице habit_logs
    const logsSubscription = supabase
      .channel("habit_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "habit_logs",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchHabits()
        }
      )
      .subscribe()

    return () => {
      habitsSubscription.unsubscribe()
      logsSubscription.unsubscribe()
    }
  }, [user, supabase])

  // Функция для добавления новой привычки
  const addHabit = async (habitData: HabitFormData) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      // Проверяем существование таблицы habits
      const habitsTableExists = await checkTableExists('habits');

      if (!habitsTableExists) {
        throw new Error("Таблица привычек не существует. Пожалуйста, запустите миграции базы данных.");
      }

      // Вычисляем дату окончания привычки
      const startDate = habitData.startDate || new Date()
      let endDate: Date | undefined

      switch (habitData.frequency) {
        case HabitFrequency.DAILY:
          endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + habitData.target)
          break
        case HabitFrequency.WEEKLY:
          endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + habitData.target * 7)
          break
        case HabitFrequency.MONTHLY:
          endDate = new Date(startDate)
          endDate.setMonth(endDate.getMonth() + habitData.target)
          break
      }

      const newHabit = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: habitData.title,
        description: habitData.description || null,
        frequency: habitData.frequency,
        duration: habitData.target, // Используем target как duration
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        status: HabitStatus.ACTIVE,
      }

      const { error } = await supabase.from("habits").insert(newHabit)

      if (error) {
        throw error
      }

      // Обновляем список привычек
      await fetchHabits()
    } catch (error: any) {
      console.error("Ошибка при создании привычки:", error)
      setError(error.message || "Не удалось создать привычку")
      throw error
    }
  }

  // Функция для обновления привычки
  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      // Преобразуем даты в ISO строки для Supabase
      const dbUpdates: any = {
        ...updates,
        start_date: updates.startDate ? updates.startDate.toISOString() : undefined,
        end_date: updates.endDate ? updates.endDate.toISOString() : undefined,
      }

      // Удаляем поля, которые не нужно обновлять в БД
      delete dbUpdates.id
      delete dbUpdates.createdAt
      delete dbUpdates.updatedAt
      delete dbUpdates.startDate
      delete dbUpdates.endDate
      delete dbUpdates.streak // Streak вычисляется из логов

      // Преобразуем имена полей в snake_case для БД
      const snakeCaseUpdates: any = {}
      if (dbUpdates.title !== undefined) snakeCaseUpdates.title = dbUpdates.title
      if (dbUpdates.description !== undefined) snakeCaseUpdates.description = dbUpdates.description
      if (dbUpdates.frequency !== undefined) snakeCaseUpdates.frequency = dbUpdates.frequency
      if (dbUpdates.period !== undefined) snakeCaseUpdates.period = dbUpdates.period
      if (dbUpdates.target !== undefined) snakeCaseUpdates.duration = dbUpdates.target
      if (dbUpdates.status !== undefined) snakeCaseUpdates.status = dbUpdates.status
      if (dbUpdates.start_date !== undefined) snakeCaseUpdates.start_date = dbUpdates.start_date
      if (dbUpdates.end_date !== undefined) snakeCaseUpdates.end_date = dbUpdates.end_date

      const { error } = await supabase
        .from("habits")
        .update(snakeCaseUpdates)
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Обновляем список привычек
      await fetchHabits()
    } catch (error: any) {
      console.error("Ошибка при обновлении привычки:", error)
      setError(error.message || "Не удалось обновить привычку")
      throw error
    }
  }

  // Функция для удаления привычки
  const deleteHabit = async (id: string) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Обновляем список привычек
      await fetchHabits()
    } catch (error: any) {
      console.error("Ошибка при удалении привычки:", error)
      setError(error.message || "Не удалось удалить привычку")
      throw error
    }
  }

  // Функция для переключения статуса выполнения привычки
  const toggleHabitCompletion = async (id: string) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      // Проверяем существование таблицы habits
      const habitsTableExists = await checkTableExists('habits');

      if (!habitsTableExists) {
        throw new Error("Таблица привычек не существует. Пожалуйста, запустите миграции базы данных.");
      }

      // Проверяем существование таблицы habit_logs
      const logsTableExists = await checkTableExists('habit_logs');

      if (!logsTableExists) {
        throw new Error("Таблица логов привычек не существует. Пожалуйста, запустите миграции базы данных.");
      }

      const habit = habits.find(h => h.id === id)
      if (!habit) {
        throw new Error("Привычка не найдена")
      }

      // Получаем текущую дату в начале дня
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Получаем дату начала следующего дня
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Преобразуем даты в ISO формат для запроса
      const todayISO = today.toISOString()
      const tomorrowISO = tomorrow.toISOString()

      console.log("Проверяем логи для даты:", todayISO, "до", tomorrowISO)

      // Проверяем, есть ли уже запись на сегодня
      const { data: existingLogs, error: fetchError } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", id)
        .eq("user_id", user.id)
        .gte("date", todayISO)
        .lt("date", tomorrowISO)

      if (fetchError) {
        throw fetchError
      }

      if (existingLogs && existingLogs.length > 0) {
        // Обновляем существующую запись
        console.log("Обновляем существующую запись:", existingLogs[0].id)

        const { data, error } = await supabase
          .from("habit_logs")
          .update({
            completed: !habit.completed,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingLogs[0].id)
          .select()

        if (error) {
          console.error("Ошибка при обновлении записи:", error)
          console.error("SQL запрос:", JSON.stringify(error.details || error.hint || error.message))
          throw new Error(`Ошибка при обновлении записи: ${error.message}`)
        }

        console.log("Запись успешно обновлена:", data)
      } else {
        // Создаем новую запись
        console.log("Создаем новую запись для даты:", todayISO)

        // Создаем уникальный идентификатор для записи
        const logId = crypto.randomUUID()

        // Подготавливаем данные для вставки
        const logData = {
          id: logId,
          habit_id: id,
          user_id: user.id,
          date: todayISO, // Используем полный ISO формат с временем
          completed: true,
          notes: null
        }

        console.log("Данные для вставки:", logData)

        const { data, error } = await supabase
          .from("habit_logs")
          .insert(logData)
          .select()

        if (error) {
          console.error("Ошибка при вставке записи:", error)
          console.error("SQL запрос:", JSON.stringify(error.details || error.hint || error.message))
          throw new Error(`Ошибка при вставке записи: ${error.message}`)
        }

        console.log("Запись успешно создана:", data)
      }

      // Обновляем список привычек
      await fetchHabits()
    } catch (error: any) {
      console.error("Ошибка при переключении статуса привычки:", error)

      // Более подробная информация об ошибке
      const errorMessage = error.message ||
                          (error.toString && error.toString() !== '[object Object]' ? error.toString() :
                          JSON.stringify(error) || "Не удалось переключить статус привычки")

      console.error("Детали ошибки:", errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Функция для увеличения серии привычки
  const incrementHabitStreak = async (id: string) => {
    try {
      // Просто вызываем toggleHabitCompletion, так как серия вычисляется автоматически
      await toggleHabitCompletion(id)
    } catch (error: any) {
      console.error("Ошибка при увеличении серии привычки:", error)

      // Более подробная информация об ошибке
      const errorMessage = error.message ||
                          (error.toString && error.toString() !== '[object Object]' ? error.toString() :
                          JSON.stringify(error) || "Не удалось увеличить серию привычки")

      console.error("Детали ошибки:", errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Значение контекста
  const value = {
    habits,
    loading,
    error,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    incrementHabitStreak,
    fetchHabits
  }

  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  )
}
