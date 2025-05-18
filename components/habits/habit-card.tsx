"use client";

import { useState, useEffect } from "react";
import { format, isToday, isYesterday, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { useSync } from "@/contexts/sync-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Edit,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Habit,
  HabitStatus,
  formatDuration,
  getFrequencyText
} from "@/types/habit";
import {
  completeHabitLog,
  deleteHabit,
  pauseHabit,
  resumeHabit
} from "@/app/habits/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HabitCardProps {
  habit: Habit;
  onUpdate: () => void;
}

export function HabitCard({ habit, onUpdate }: HabitCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [streak, setStreak] = useState(0);
  const { refreshDashboardPage } = useSync();

  // Загрузка данных о серии при монтировании компонента
  useEffect(() => {
    calculateStreak();
  }, [habit.id]);

  // Расчет прогресса привычки
  const calculateProgress = () => {
    const now = new Date();
    const start = new Date(habit.startDate);
    const end = new Date(habit.endDate || now);

    if (now > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.min(Math.round((elapsed / totalDuration) * 100), 100);
  };

  // Расчет текущей серии привычки
  const calculateStreak = async () => {
    try {
      // Если у привычки уже есть поле streak, используем его
      if (habit.streak !== undefined) {
        setStreak(habit.streak);
        return;
      }

      // Иначе рассчитываем серию на основе прогресса
      const progress = calculateProgress();
      const calculatedStreak = Math.floor((progress / 100) * habit.duration);
      setStreak(calculatedStreak);
    } catch (error) {
      console.error("Ошибка при расчете серии:", error);
      setStreak(0);
    }
  };

  // Получение текущей серии привычки
  const getStreak = () => {
    // Если у привычки есть поле streak, используем его
    if (habit.streak !== undefined) {
      return habit.streak;
    }
    // Иначе используем локальное состояние
    return streak;
  };

  // Получение целевого значения серии
  const getTarget = () => {
    // Если у привычки есть поле target, используем его
    if ('target' in habit) {
      return (habit as any).target;
    }
    // Иначе используем duration
    return habit.duration;
  };

  // Получение текста для отображения продолжительности
  const getDurationText = () => {
    const target = getTarget();
    return target === 1 ? 'день' : target < 5 ? 'дня' : 'дней';
  };

  // Получение статуса привычки в виде бейджа
  const getStatusBadge = () => {
    switch (habit.status) {
      case HabitStatus.ACTIVE:
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Активна</Badge>;
      case HabitStatus.COMPLETED:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Завершена</Badge>;
      case HabitStatus.FAILED:
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Не выполнена</Badge>;
      case HabitStatus.PAUSED:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Приостановлена</Badge>;
    }
  };

  // Обработчик отметки выполнения привычки на сегодня
  const handleCompleteToday = async () => {
    try {
      setIsLoading(true);

      try {
        // Отмечаем выполнение привычки
        const result = await completeHabitLog(habit.id);

        // Показываем уведомление в зависимости от статуса выполнения
        if (result.completed) {
          toast.success("Отмечено выполнение на сегодня!");
        } else {
          toast.info("Отметка выполнения отменена");
        }

        // Обновляем страницу привычек
        onUpdate();
      } catch (err: any) {
        console.error("Ошибка при вызове completeHabitLog:", err);
        toast.error("Не удалось отметить выполнение. Попробуйте снова.");
      }
    } catch (error) {
      console.error("Ошибка при отметке выполнения:", error);
      toast.error("Не удалось отметить выполнение. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик паузы привычки
  const handlePauseHabit = async () => {
    try {
      setIsLoading(true);
      await pauseHabit(habit.id);
      toast.success("Привычка приостановлена");

      // Обновляем страницу привычек и Dashboard
      onUpdate();
      refreshDashboardPage();
    } catch (error) {
      console.error("Ошибка при приостановке привычки:", error);
      toast.error("Не удалось приостановить привычку. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик возобновления привычки
  const handleResumeHabit = async () => {
    try {
      setIsLoading(true);
      await resumeHabit(habit.id);
      toast.success("Привычка возобновлена");

      // Обновляем страницу привычек и Dashboard
      onUpdate();
      refreshDashboardPage();
    } catch (error) {
      console.error("Ошибка при возобновлении привычки:", error);
      toast.error("Не удалось возобновить привычку. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик удаления привычки
  const handleDeleteHabit = async () => {
    try {
      setIsLoading(true);
      await deleteHabit(habit.id);
      toast.success("Привычка удалена");

      // Обновляем страницу привычек и Dashboard
      onUpdate();
      refreshDashboardPage();
    } catch (error) {
      console.error("Ошибка при удалении привычки:", error);
      toast.error("Не удалось удалить привычку. Попробуйте снова.");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{habit.title}</CardTitle>
              <CardDescription className="mt-1">
                {getFrequencyText(habit.frequency)} • {formatDuration(habit.frequency, habit.duration)}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href={`/habits/${habit.id}/edit`} className="flex items-center w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Редактировать</span>
                  </Link>
                </DropdownMenuItem>
                {habit.status === HabitStatus.ACTIVE ? (
                  <DropdownMenuItem onClick={handlePauseHabit}>
                    <Pause className="mr-2 h-4 w-4" />
                    <span>Приостановить</span>
                  </DropdownMenuItem>
                ) : habit.status === HabitStatus.PAUSED ? (
                  <DropdownMenuItem onClick={handleResumeHabit}>
                    <Play className="mr-2 h-4 w-4" />
                    <span>Возобновить</span>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Удалить</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge()}
            <div className="text-xs text-muted-foreground">
              Начало: {format(new Date(habit.startDate), "d MMM yyyy", { locale: ru })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          {habit.description && (
            <p className="text-sm text-muted-foreground mb-4">{habit.description}</p>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Прогресс</span>
                <span>{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Серия:</span>
                <span>{getStreak()}/{getTarget()} {getDurationText()}</span>
              </div>
              <Progress
                value={(getStreak() / getTarget()) * 100}
                className="h-2"
                color={getStreak() === getTarget() ? "bg-green-500" : undefined}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          {habit.status === HabitStatus.ACTIVE && (
            <Button
              onClick={handleCompleteToday}
              disabled={isLoading}
              className="w-full"
              variant={habit.completed ? "secondary" : "outline"}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {habit.completed ? "Отменить выполнение" : "Отметить на сегодня"}
            </Button>
          )}
          {habit.status === HabitStatus.PAUSED && (
            <Button
              onClick={handleResumeHabit}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Play className="mr-2 h-4 w-4" />
              Возобновить
            </Button>
          )}
          {(habit.status === HabitStatus.COMPLETED || habit.status === HabitStatus.FAILED) && (
            <div className="w-full text-center text-sm text-muted-foreground">
              <Clock className="inline-block mr-2 h-4 w-4" />
              Завершено {format(new Date(habit.endDate!), "d MMM yyyy", { locale: ru })}
            </div>
          )}
        </CardFooter>
      </Card>

      {showDeleteDialog && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Привычка "{habit.title}" будет удалена вместе со всей историей выполнения.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteHabit}
                className="bg-red-600 hover:bg-red-700"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
