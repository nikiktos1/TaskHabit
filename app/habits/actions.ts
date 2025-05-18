"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import {
  CreateHabitInput,
  Habit,
  HabitFrequency,
  HabitLog,
  HabitStatus,
  UpdateHabitInput,
  calculateEndDate
} from "@/types/habit";
import { v4 } from "uuid";

// Получение всех привычек пользователя
export async function getUserHabits(): Promise<Habit[]> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем привычки пользователя вместе с логами
  const { data, error } = await supabase
    .from("habits")
    .select(`
      *,
      habit_logs(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ошибка при получении привычек:", error);
    throw new Error("Не удалось получить привычки");
  }

  // Получаем текущую дату в начале дня
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Преобразуем данные из БД в формат Habit
  return data.map((item: any): Habit => {
    // Вычисляем текущую серию на основе логов
    const logs = item.habit_logs || [];
    const streak = logs.filter((log: any) => log.completed).length;

    // Определяем, выполнена ли привычка сегодня
    const isCompletedToday = logs.some((log: any) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime() && log.completed;
    });

    return {
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description,
      frequency: item.frequency,
      duration: item.duration,
      startDate: new Date(item.start_date),
      endDate: item.end_date ? new Date(item.end_date) : undefined,
      status: item.status,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      streak: streak,
      target: item.duration, // Используем duration как target
      completed: isCompletedToday,
    };
  });
}

// Получение привычки по ID
export async function getHabitById(habitId: string): Promise<Habit | null> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем привычку вместе с логами
  const { data, error } = await supabase
    .from("habits")
    .select(`
      *,
      habit_logs(*)
    `)
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Привычка не найдена
    }
    console.error("Ошибка при получении привычки:", error);
    throw new Error("Не удалось получить привычку");
  }

  // Получаем текущую дату в начале дня
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Вычисляем текущую серию на основе логов
  const logs = data.habit_logs || [];
  const streak = logs.filter((log: any) => log.completed).length;

  // Определяем, выполнена ли привычка сегодня
  const isCompletedToday = logs.some((log: any) => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime() && log.completed;
  });

  // Преобразуем данные из БД в формат Habit
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    frequency: data.frequency,
    duration: data.duration,
    startDate: new Date(data.start_date),
    endDate: data.end_date ? new Date(data.end_date) : undefined,
    status: data.status,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    streak: streak,
    target: data.duration, // Используем duration как target
    completed: isCompletedToday,
  };
}

// Создание новой привычки
export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const startDate = input.startDate || new Date();
  const endDate = calculateEndDate(startDate, input.frequency, input.duration);
  const now = new Date();

  const habitId = v4();

  // Создаем привычку в БД
  const { error } = await supabase
    .from("habits")
    .insert({
      id: habitId,
      user_id: user.id,
      title: input.title,
      description: input.description,
      frequency: input.frequency,
      duration: input.duration,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: HabitStatus.ACTIVE,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

  if (error) {
    console.error("Ошибка при создании привычки:", error);
    throw new Error("Не удалось создать привычку");
  }

  // Обновляем кэш страницы привычек
  revalidatePath("/habits");

  // Возвращаем созданную привычку
  return {
    id: habitId,
    userId: user.id,
    title: input.title,
    description: input.description,
    frequency: input.frequency,
    duration: input.duration,
    startDate,
    endDate,
    status: HabitStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
  };
}

// Обновление привычки
export async function updateHabit(input: UpdateHabitInput): Promise<Habit> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем текущую привычку
  const habit = await getHabitById(input.id);

  if (!habit) {
    throw new Error("Привычка не найдена");
  }

  // Проверяем, принадлежит ли привычка пользователю
  if (habit.userId !== user.id) {
    throw new Error("У вас нет прав на редактирование этой привычки");
  }

  const now = new Date();

  // Обновляем данные привычки
  const updates: any = {
    updated_at: now.toISOString(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) updates.status = input.status;

  // Если изменилась частота или продолжительность, пересчитываем дату окончания
  if (input.frequency !== undefined || input.duration !== undefined) {
    const frequency = input.frequency || habit.frequency;
    const duration = input.duration || habit.duration;

    updates.frequency = frequency;
    updates.duration = duration;

    // Пересчитываем дату окончания
    const endDate = calculateEndDate(habit.startDate, frequency, duration);
    updates.end_date = endDate.toISOString();
  }

  // Обновляем привычку в БД
  const { error } = await supabase
    .from("habits")
    .update(updates)
    .eq("id", input.id);

  if (error) {
    console.error("Ошибка при обновлении привычки:", error);
    throw new Error("Не удалось обновить привычку");
  }

  // Обновляем кэш страницы привычек
  revalidatePath("/habits");
  revalidatePath(`/habits/${input.id}`);

  // Получаем обновленную привычку
  const updatedHabit = await getHabitById(input.id);

  if (!updatedHabit) {
    throw new Error("Не удалось получить обновленную привычку");
  }

  return updatedHabit;
}

// Приостановка привычки
export async function pauseHabit(habitId: string): Promise<void> {
  await updateHabit({
    id: habitId,
    status: HabitStatus.PAUSED,
  });
}

// Возобновление привычки
export async function resumeHabit(habitId: string): Promise<void> {
  await updateHabit({
    id: habitId,
    status: HabitStatus.ACTIVE,
  });
}

// Удаление привычки
export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем привычку
  const habit = await getHabitById(habitId);

  if (!habit) {
    throw new Error("Привычка не найдена");
  }

  // Проверяем, принадлежит ли привычка пользователю
  if (habit.userId !== user.id) {
    throw new Error("У вас нет прав на удаление этой привычки");
  }

  // Удаляем все записи о выполнении привычки
  const { error: logsError } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId);

  if (logsError) {
    console.error("Ошибка при удалении записей о выполнении привычки:", logsError);
    throw new Error("Не удалось удалить записи о выполнении привычки");
  }

  // Удаляем привычку
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId);

  if (error) {
    console.error("Ошибка при удалении привычки:", error);
    throw new Error("Не удалось удалить привычку");
  }

  // Обновляем кэш страницы привычек
  revalidatePath("/habits");
}

// Отметка выполнения привычки на сегодня
export async function completeHabitLog(habitId: string): Promise<HabitLog> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем привычку
  const habit = await getHabitById(habitId);

  if (!habit) {
    throw new Error("Привычка не найдена");
  }

  // Проверяем, принадлежит ли привычка пользователю
  if (habit.userId !== user.id) {
    throw new Error("У вас нет прав на отметку выполнения этой привычки");
  }

  // Проверяем, активна ли привычка
  if (habit.status !== HabitStatus.ACTIVE) {
    throw new Error("Можно отмечать выполнение только активных привычек");
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const logId = v4();

  // Проверяем, не отмечена ли уже привычка на сегодня
  let existingLogId = null;
  try {
    const { data: existingLog } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .gte("date", today.toISOString())
      .lt(new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (existingLog && existingLog.length > 0) {
      // Если запись уже существует, обновляем ее
      existingLogId = existingLog[0].id;

      const { error } = await supabase
        .from("habit_logs")
        .update({
          completed: !existingLog[0].completed, // Переключаем статус выполнения
          updated_at: now.toISOString(),
        })
        .eq("id", existingLogId);

      if (error) {
        console.error("Ошибка при обновлении записи о выполнении:", error);
        throw new Error("Не удалось обновить запись о выполнении");
      }

      // Обновляем кэш страницы привычек
      revalidatePath("/habits");
      revalidatePath(`/habits/${habitId}`);

      // Возвращаем обновленную запись
      return {
        id: existingLogId,
        habitId,
        userId: user.id,
        date: now,
        completed: !existingLog[0].completed,
        createdAt: new Date(existingLog[0].created_at),
        updatedAt: now,
      };
    }
  } catch (error) {
    console.error("Ошибка при проверке существующей записи:", error);
    // Продолжаем выполнение, даже если не удалось проверить существующую запись
    // Это может произойти, если таблица habit_logs еще не создана
  }

  // Создаем новую запись о выполнении
  try {
    const { error } = await supabase
      .from("habit_logs")
      .insert({
        id: logId,
        habit_id: habitId,
        user_id: user.id,
        date: now.toISOString(),
        completed: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (error) {
      console.error("Ошибка при создании записи о выполнении:", error);
      throw new Error("Не удалось создать запись о выполнении");
    }
  } catch (error) {
    console.error("Ошибка при создании записи о выполнении:", error);
    // Продолжаем выполнение, даже если не удалось создать запись о выполнении
    // Это может произойти, если таблица habit_logs еще не создана
  }

  // Проверяем, не завершена ли привычка
  const endDate = habit.endDate;
  if (endDate && now >= endDate) {
    // Отмечаем привычку как завершенную
    await updateHabit({
      id: habitId,
      status: HabitStatus.COMPLETED,
    });
  }

  // Обновляем кэш страницы привычек
  revalidatePath("/habits");
  revalidatePath(`/habits/${habitId}`);

  // Возвращаем созданную запись
  return {
    id: logId,
    habitId,
    userId: user.id,
    date: now,
    completed: true,
    createdAt: now,
    updatedAt: now,
  };
}
