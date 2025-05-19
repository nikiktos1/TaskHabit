"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  CheckCircle,
  ChevronLeft,
  Edit,
  Pause,
  Play,
  Trash2
} from "lucide-react";
import {
  Habit,
  HabitLog,
  HabitStatus,
  formatDuration,
  getFrequencyText
} from "@/types/habit";
import {
  completeHabitLog,
  deleteHabit,
  getHabitById,
  pauseHabit,
  resumeHabit
} from "../actions";
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

interface HabitDetailPageProps {
  params: {
    id: string;
  };
}

export default function HabitDetailPage({ params }: HabitDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Загрузка данных привычки
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

      // TODO: Загрузка логов привычки
      // const logsData = await getHabitLogs(id);
      // setHabitLogs(logsData);
    } catch (error) {
      console.error("Ошибка при загрузке привычки:", error);
      toast.error("Не удалось загрузить данные привычки");
      router.push("/habits");
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadHabit();
  }, [id, router]);

  // Расчет прогресса привычки
  const calculateProgress = () => {
    if (!habit) return 0;

    const now = new Date();
    const start = new Date(habit.startDate);
    const end = new Date(habit.endDate || now);

    if (now > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.min(Math.round((elapsed / totalDuration) * 100), 100);
  };

  // Получение статуса привычки в виде бейджа
  const getStatusBadge = () => {
    if (!habit) return null;

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
    if (!habit) return;

    try {
      setIsLoading(true);

      try {
        await completeHabitLog(habit.id);
        toast.success("Отмечено выполнение на сегодня!");
        loadHabit();
      } catch (err: any) {
        // Проверяем сообщение об ошибке
        if (err.message && err.message.includes("уже отметили выполнение")) {
          toast.info("Вы уже отметили выполнение этой привычки сегодня");
        } else {
          console.error("Ошибка при вызове completeHabitLog:", err);
          toast.error("Не удалось отметить выполнение. Попробуйте снова.");
        }
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
    if (!habit) return;

    try {
      setIsLoading(true);
      await pauseHabit(habit.id);
      toast.success("Привычка приостановлена");
      loadHabit();
    } catch (error) {
      console.error("Ошибка при приостановке привычки:", error);
      toast.error("Не удалось приостановить привычку. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик возобновления привычки
  const handleResumeHabit = async () => {
    if (!habit) return;

    try {
      setIsLoading(true);
      await resumeHabit(habit.id);
      toast.success("Привычка возобновлена");
      loadHabit();
    } catch (error) {
      console.error("Ошибка при возобновлении привычки:", error);
      toast.error("Не удалось возобновить привычку. Попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик удаления привычки
  const handleDeleteHabit = async () => {
    if (!habit) return;

    try {
      setIsLoading(true);
      await deleteHabit(habit.id);
      toast.success("Привычка удалена");
      router.push("/habits");
    } catch (error) {
      console.error("Ошибка при удалении привычки:", error);
      toast.error("Не удалось удалить привычку. Попробуйте снова.");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/habits")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к привычкам
        </Button>

        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : habit ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{habit.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {getFrequencyText(habit.frequency)} • {formatDuration(habit.frequency, habit.duration)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {habit.description && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Описание</h3>
                      <p className="text-muted-foreground">{habit.description}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium mb-1">Период</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Начало</p>
                        <p>{format(new Date(habit.startDate), "d MMMM yyyy", { locale: ru })}</p>
                      </div>
                      {habit.endDate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Окончание</p>
                          <p>{format(new Date(habit.endDate), "d MMMM yyyy", { locale: ru })}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <h3 className="font-medium">Прогресс</h3>
                      <span>{calculateProgress()}%</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    {habit.status === HabitStatus.ACTIVE && (
                      <>
                        <Button
                          onClick={handleCompleteToday}
                          disabled={isLoading}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Отметить на сегодня
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handlePauseHabit}
                          disabled={isLoading}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Приостановить
                        </Button>
                      </>
                    )}

                    {habit.status === HabitStatus.PAUSED && (
                      <Button
                        onClick={handleResumeHabit}
                        disabled={isLoading}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Возобновить
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => router.push(`/habits/${habit.id}/edit`)}
                      disabled={isLoading}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Календарь выполнения</CardTitle>
                  <CardDescription>
                    История выполнения привычки
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border p-3">
                    <Calendar
                      mode="multiple"
                      selected={[]}
                      className="mx-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">Привычка не найдена</h3>
            <p className="text-muted-foreground mb-6">
              Привычка с указанным идентификатором не существует или была удалена
            </p>
            <Button onClick={() => router.push("/habits")}>
              Вернуться к списку привычек
            </Button>
          </div>
        )}
      </div>

      {showDeleteDialog && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Привычка "{habit?.title}" будет удалена вместе со всей историей выполнения.
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
    </DashboardLayout>
  );
}
