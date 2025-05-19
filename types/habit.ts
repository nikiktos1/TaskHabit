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

// Интерфейс для привычки
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  // Продолжительность в соответствующих единицах (дни, недели, месяцы)
  duration: number;
  startDate: Date;
  endDate?: Date;
  status: HabitStatus;
  createdAt: Date;
  updatedAt: Date;
  // Поля для отображения прогресса
  streak?: number;
  target?: number;
  completed?: boolean;
}

// Интерфейс для отслеживания выполнения привычки
export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  completed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейс для создания новой привычки
export interface CreateHabitInput {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  duration: number;
  startDate?: Date;
}

// Интерфейс для обновления привычки
export interface UpdateHabitInput {
  id: string;
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
  duration?: number;
  status?: HabitStatus;
}

// Функция для расчета даты окончания привычки
export function calculateEndDate(startDate: Date, frequency: HabitFrequency, duration: number): Date {
  const endDate = new Date(startDate);

  switch (frequency) {
    case HabitFrequency.DAILY:
      endDate.setDate(endDate.getDate() + duration);
      break;
    case HabitFrequency.WEEKLY:
      endDate.setDate(endDate.getDate() + (duration * 7));
      break;
    case HabitFrequency.MONTHLY:
      endDate.setMonth(endDate.getMonth() + duration);
      break;
  }

  return endDate;
}

// Функция для форматирования продолжительности привычки
export function formatDuration(frequency: HabitFrequency, duration: number): string {
  switch (frequency) {
    case HabitFrequency.DAILY:
      return `${duration} ${duration === 1 ? 'день' : duration < 5 ? 'дня' : 'дней'}`;
    case HabitFrequency.WEEKLY:
      return `${duration} ${duration === 1 ? 'неделя' : duration < 5 ? 'недели' : 'недель'}`;
    case HabitFrequency.MONTHLY:
      return `${duration} ${duration === 1 ? 'месяц' : duration < 5 ? 'месяца' : 'месяцев'}`;
  }
}

// Функция для получения текстового представления частоты привычки
export function getFrequencyText(frequency: HabitFrequency): string {
  switch (frequency) {
    case HabitFrequency.DAILY:
      return 'Ежедневно';
    case HabitFrequency.WEEKLY:
      return 'Еженедельно';
    case HabitFrequency.MONTHLY:
      return 'Ежемесячно';
  }
}
