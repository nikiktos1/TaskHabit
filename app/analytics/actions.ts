"use server";

import { createClient } from "@/supabase/server";
import { format, startOfWeek, endOfWeek, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { ru } from "date-fns/locale";

// Типы данных для аналитики
export type AnalyticsSummary = {
  tasksCompleted: number;
  tasksCompletedChange: number;
  longestHabitStreak: number;
  currentHabitStreak: number;
  productivityScore: number;
  productivityScoreChange: number;
  achievements: number;
  newAchievements: number;
};

export type WeeklyData = {
  name: string;
  tasks: number;
  habits: number;
};

export type MonthlyComparisonData = {
  name: string;
  current: number;
  previous: number;
};

export type ProductiveDaysData = {
  day: string;
  percentage: number;
}[];

export type HabitConsistencyData = {
  title: string;
  percentage: number;
}[];

// Получение сводной аналитики
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем текущую дату и дату неделю назад
  const now = new Date();
  const oneWeekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  // Получаем количество выполненных задач за последнюю неделю
  const { data: tasksThisWeek, error: tasksThisWeekError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("updated_at", oneWeekAgo.toISOString())
    .lte("updated_at", now.toISOString());

  if (tasksThisWeekError) {
    console.error("Ошибка при получении задач за текущую неделю:", tasksThisWeekError);
  }

  // Получаем количество выполненных задач за предыдущую неделю
  const { data: tasksLastWeek, error: tasksLastWeekError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("updated_at", twoWeeksAgo.toISOString())
    .lt("updated_at", oneWeekAgo.toISOString());

  if (tasksLastWeekError) {
    console.error("Ошибка при получении задач за предыдущую неделю:", tasksLastWeekError);
  }

  // Получаем логи привычек для расчета серий
  const { data: habitLogs, error: habitLogsError } = await supabase
    .from("habit_logs")
    .select("habit_id, date, completed")
    .eq("user_id", user.id)
    .eq("completed", true)
    .order("date", { ascending: false });

  if (habitLogsError) {
    console.error("Ошибка при получении логов привычек:", habitLogsError);
  }

  // Рассчитываем текущую и самую длинную серию привычек
  const habitStreaks = calculateHabitStreaks(habitLogs || []);

  // Рассчитываем продуктивность (процент выполненных задач)
  const { data: allTasksThisWeek, error: allTasksThisWeekError } = await supabase
    .from("tasks")
    .select("id, completed")
    .eq("user_id", user.id)
    .gte("created_at", oneWeekAgo.toISOString())
    .lte("created_at", now.toISOString());

  if (allTasksThisWeekError) {
    console.error("Ошибка при получении всех задач за текущую неделю:", allTasksThisWeekError);
  }

  const { data: allTasksLastWeek, error: allTasksLastWeekError } = await supabase
    .from("tasks")
    .select("id, completed")
    .eq("user_id", user.id)
    .gte("created_at", twoWeeksAgo.toISOString())
    .lt("created_at", oneWeekAgo.toISOString());

  if (allTasksLastWeekError) {
    console.error("Ошибка при получении всех задач за предыдущую неделю:", allTasksLastWeekError);
  }

  // Рассчитываем продуктивность
  const productivityScore = calculateProductivityScore(allTasksThisWeek || []);
  const lastWeekProductivityScore = calculateProductivityScore(allTasksLastWeek || []);
  const productivityScoreChange = productivityScore - lastWeekProductivityScore;

  // Заглушка для достижений (в будущем можно реализовать систему достижений)
  const achievements = 7;
  const newAchievements = 2;

  return {
    tasksCompleted: tasksThisWeek?.length || 0,
    tasksCompletedChange: (tasksThisWeek?.length || 0) - (tasksLastWeek?.length || 0),
    longestHabitStreak: habitStreaks.longest,
    currentHabitStreak: habitStreaks.current,
    productivityScore,
    productivityScoreChange,
    achievements,
    newAchievements
  };
}

// Вспомогательная функция для расчета серий привычек
function calculateHabitStreaks(logs: any[]) {
  // Группируем логи по привычкам
  const habitLogsMap = logs.reduce((acc, log) => {
    if (!acc[log.habit_id]) {
      acc[log.habit_id] = [];
    }
    acc[log.habit_id].push(log);
    return acc;
  }, {} as Record<string, any[]>);

  let longestStreak = 0;
  let currentStreak = 0;

  // Для каждой привычки рассчитываем серию
  Object.values(habitLogsMap).forEach(habitLogs => {
    // Сортируем логи по дате (от новых к старым)
    const sortedLogs = habitLogs.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Рассчитываем текущую серию
    let streak = 0;
    for (let i = 0; i < sortedLogs.length; i++) {
      streak++;

      // Если это последний лог или есть разрыв в серии, обновляем максимальную серию
      if (i === sortedLogs.length - 1 ||
          Math.abs(new Date(sortedLogs[i].date).getTime() - new Date(sortedLogs[i+1].date).getTime()) > 86400000) {
        if (streak > longestStreak) {
          longestStreak = streak;
        }

        // Если это текущая серия (начинается с сегодня или вчера)
        const logDate = new Date(sortedLogs[i].date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (logDate >= yesterday) {
          currentStreak = Math.max(currentStreak, streak);
        }

        streak = 0;
      }
    }
  });

  return { longest: longestStreak, current: currentStreak };
}

// Вспомогательная функция для расчета продуктивности
function calculateProductivityScore(tasks: any[]) {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(task => task.completed).length;
  return Math.round((completedTasks / tasks.length) * 100);
}

// Получение данных для недельного графика
export async function getWeeklyData(): Promise<WeeklyData[]> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем начало и конец текущей недели
  const now = new Date();
  const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Неделя начинается с понедельника
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });

  // Создаем массив дней недели
  const daysOfWeek = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek
  });

  // Инициализируем результат
  const result: WeeklyData[] = daysOfWeek.map(day => ({
    name: format(day, 'EEE', { locale: ru }),
    tasks: 0,
    habits: 0
  }));

  // Получаем выполненные задачи за текущую неделю
  const { data: completedTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("updated_at")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("updated_at", startOfCurrentWeek.toISOString())
    .lte("updated_at", endOfCurrentWeek.toISOString());

  if (tasksError) {
    console.error("Ошибка при получении выполненных задач:", tasksError);
  }

  // Получаем выполненные привычки за текущую неделю
  const { data: completedHabits, error: habitsError } = await supabase
    .from("habit_logs")
    .select("date")
    .eq("user_id", user.id)
    .eq("completed", true)
    .gte("date", startOfCurrentWeek.toISOString())
    .lte("date", endOfCurrentWeek.toISOString());

  if (habitsError) {
    console.error("Ошибка при получении выполненных привычек:", habitsError);
  }

  // Распределяем задачи по дням недели
  (completedTasks || []).forEach(task => {
    const taskDate = new Date(task.updated_at);
    const dayIndex = getDay(taskDate) - 1; // Преобразуем в индекс (0 - понедельник, 6 - воскресенье)
    const adjustedIndex = dayIndex < 0 ? 6 : dayIndex; // Корректируем для воскресенья
    result[adjustedIndex].tasks++;
  });

  // Распределяем привычки по дням недели
  (completedHabits || []).forEach(habit => {
    const habitDate = new Date(habit.date);
    const dayIndex = getDay(habitDate) - 1;
    const adjustedIndex = dayIndex < 0 ? 6 : dayIndex;
    result[adjustedIndex].habits++;
  });

  return result;
}

// Получение данных для месячного сравнения
export async function getMonthlyComparisonData(): Promise<MonthlyComparisonData[]> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const result: MonthlyComparisonData[] = [];
  const now = new Date();

  // Получаем данные за последние 6 месяцев
  for (let i = 5; i >= 0; i--) {
    const currentMonth = subMonths(now, i);
    const startOfCurrentMonth = startOfMonth(currentMonth);
    const endOfCurrentMonth = endOfMonth(currentMonth);
    const monthName = format(currentMonth, "MMM yyyy", { locale: ru });

    // Получаем количество выполненных задач за текущий месяц
    const { data: currentMonthTasks, error: currentMonthError } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("updated_at", startOfCurrentMonth.toISOString())
      .lte("updated_at", endOfCurrentMonth.toISOString());

    if (currentMonthError) {
      console.error(`Ошибка при получении задач за ${monthName}:`, currentMonthError);
    }

    // Получаем количество выполненных задач за аналогичный месяц прошлого года
    const previousYear = subMonths(currentMonth, 12);
    const startOfPreviousMonth = startOfMonth(previousYear);
    const endOfPreviousMonth = endOfMonth(previousYear);

    const { data: previousMonthTasks, error: previousMonthError } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("updated_at", startOfPreviousMonth.toISOString())
      .lte("updated_at", endOfPreviousMonth.toISOString());

    if (previousMonthError) {
      console.error(`Ошибка при получении задач за ${format(previousYear, "MMM yyyy")}:`, previousMonthError);
    }

    result.push({
      name: monthName,
      current: currentMonthTasks?.length || 0,
      previous: previousMonthTasks?.length || 0
    });
  }

  return result;
}

// Получение данных о самых продуктивных днях
export async function getProductiveDaysData(): Promise<ProductiveDaysData> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем все выполненные задачи
  const { data: completedTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("updated_at")
    .eq("user_id", user.id)
    .eq("completed", true);

  if (tasksError) {
    console.error("Ошибка при получении выполненных задач:", tasksError);
    return [];
  }

  // Подсчитываем количество задач по дням недели
  const daysCounts = [0, 0, 0, 0, 0, 0, 0]; // Пн, Вт, Ср, Чт, Пт, Сб, Вс

  (completedTasks || []).forEach(task => {
    const taskDate = new Date(task.updated_at);
    const dayIndex = getDay(taskDate) - 1; // 0 - понедельник, 6 - воскресенье
    const adjustedIndex = dayIndex < 0 ? 6 : dayIndex;
    daysCounts[adjustedIndex]++;
  });

  // Рассчитываем проценты
  const totalTasks = daysCounts.reduce((sum, count) => sum + count, 0);

  if (totalTasks === 0) {
    return [
      { day: "Понедельник", percentage: 0 },
      { day: "Вторник", percentage: 0 },
      { day: "Среда", percentage: 0 }
    ];
  }

  const daysPercentages = daysCounts.map(count => Math.round((count / totalTasks) * 100));

  // Создаем массив дней с процентами
  const daysNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
  const daysWithPercentages = daysNames.map((day, index) => ({
    day,
    percentage: daysPercentages[index]
  }));

  // Сортируем по убыванию процента и берем топ-3
  return daysWithPercentages
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
}

// Получение данных о последовательности привычек
export async function getHabitConsistencyData(): Promise<HabitConsistencyData> {
  const supabase = await createClient();

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  // Получаем все привычки пользователя
  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("id, title")
    .eq("user_id", user.id);

  if (habitsError) {
    console.error("Ошибка при получении привычек:", habitsError);
    return [];
  }

  const result: HabitConsistencyData = [];

  // Для каждой привычки получаем логи и рассчитываем последовательность
  for (const habit of (habits || [])) {
    // Получаем логи привычки за последние 30 дней
    const thirtyDaysAgo = subDays(new Date(), 30);

    const { data: logs, error: logsError } = await supabase
      .from("habit_logs")
      .select("date, completed")
      .eq("habit_id", habit.id)
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgo.toISOString());

    if (logsError) {
      console.error(`Ошибка при получении логов для привычки ${habit.title}:`, logsError);
      continue;
    }

    // Рассчитываем процент выполнения
    const completedLogs = (logs || []).filter(log => log.completed).length;
    const percentage = logs && logs.length > 0
      ? Math.round((completedLogs / logs.length) * 100)
      : 0;

    result.push({
      title: habit.title,
      percentage
    });
  }

  // Сортируем по убыванию процента и берем топ-3
  return result
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
}
