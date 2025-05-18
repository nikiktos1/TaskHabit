"use client"

import { useState, useEffect } from "react"
import { format, isSameDay } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, ClipboardList, Clock, Plus, Trash2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { useHabits, HabitFrequency, type Habit } from "@/contexts/habits-context"
import { SimpleMigration } from "@/components/simple-migration"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { DashboardHabitDialog } from "@/components/dashboard-habit-dialog"
import { useSync } from "@/contexts/sync-context"
import { completeHabitLog } from "@/app/habits/actions"

// Типы данных
type Task = {
  id: string
  title: string
  completed: boolean
  deadline: Date | null
}

interface DayScheduleProps {
  date: Date
}

export function DaySchedule({ date }: DayScheduleProps) {
  // Получаем привычки из контекста
  const {
    habits,
    loading: habitsLoading,
    error: habitsError,
    addHabit,
    fetchHabits
  } = useHabits()

  // Состояние для отслеживания загрузки и ошибок
  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const { toast } = useToast()
  const { refreshHabitsPage } = useSync()

  // Демо-данные для задач
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Complete project proposal", completed: false, deadline: new Date(Date.now() + 86400000 * 2) },
    { id: "2", title: "Review client feedback", completed: true, deadline: new Date(Date.now() - 86400000) },
    { id: "3", title: "Schedule team meeting", completed: false, deadline: new Date(Date.now() + 86400000 * 5) },
    { id: "4", title: "Prepare presentation", completed: false, deadline: new Date(Date.now() + 3600000 * 12) },
  ])

  // Фильтрация задач на выбранный день
  const tasksForSelectedDay = tasks.filter(task =>
    task.deadline && isSameDay(task.deadline, date)
  )

  // Функция для переключения статуса задачи
  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  // Функция для безопасного переключения статуса привычки
  const handleToggleHabit = async (id: string) => {
    try {
      setLocalError(null)
      setLoadingHabitId(id)

      // Отмечаем выполнение привычки
      const result = await completeHabitLog(id)

      // Показываем уведомление в зависимости от статуса выполнения
      if (result.completed) {
        toast({
          title: "Успех",
          description: "Отмечено выполнение на сегодня",
          variant: "default",
        })
      } else {
        toast({
          title: "Информация",
          description: "Отметка выполнения отменена",
          variant: "default",
        })
      }

      // Обновляем список привычек
      await fetchHabits()
    } catch (error: any) {
      console.error("Ошибка при переключении статуса привычки:", error)

      // Показываем уведомление об ошибке
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус привычки",
        variant: "destructive",
      })

      setLocalError(error.message || "Не удалось обновить статус привычки")
    } finally {
      setLoadingHabitId(null)
    }
  }

  // Функция для получения текстового описания типа привычки
  const getFrequencyText = (frequency: HabitFrequency, period: number) => {
    switch (frequency) {
      case HabitFrequency.DAILY:
        return period === 1 ? "Ежедневно" : `Каждые ${period} дней`
      case HabitFrequency.WEEKLY:
        return period === 1 ? "Еженедельно" : `Каждые ${period} недель`
      case HabitFrequency.MONTHLY:
        return period === 1 ? "Ежемесячно" : `Каждые ${period} месяцев`
      default:
        return "Неизвестный период"
    }
  }

  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-4">
        <TabsTrigger value="all">Все</TabsTrigger>
        <TabsTrigger value="tasks">Задачи</TabsTrigger>
        <TabsTrigger value="habits">Привычки</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-6">
        {/* Задачи */}
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-accent" />
            Задачи на {format(date, "d MMMM")}
          </h3>

          {tasksForSelectedDay.length > 0 ? (
            <div className="space-y-3">
              {tasksForSelectedDay.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="cursor-pointer"
                      />
                    </div>
                    <div
                      className={`text-sm font-medium leading-none cursor-pointer ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.title}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {task.deadline && (
                      <span className="text-xs text-muted-foreground mr-3">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {format(task.deadline, "HH:mm")}
                      </span>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Удалить задачу</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground border rounded-md">
              Нет задач на этот день
            </div>
          )}
        </div>

        <Separator />

        {/* Привычки */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-accent" />
              Привычки на {format(date, "d MMMM")}
            </h3>
            <DashboardHabitDialog onCreateHabit={addHabit} />
          </div>

          {habitsLoading && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          )}

          {(habitsError || localError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>
                {habitsError || localError}
              </AlertDescription>
            </Alert>
          )}

          {!habitsLoading && !habitsError && habits.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border rounded-md">
              Нет привычек на этот день
            </div>
          )}

          <div className="space-y-4">
            {habits.map(habit => (
              <div key={habit.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Checkbox
                          checked={habit.completed}
                          onCheckedChange={() => handleToggleHabit(habit.id)}
                          disabled={loadingHabitId === habit.id}
                          className="cursor-pointer"
                        />
                      </div>
                      <div
                        className="ml-3 text-sm font-medium cursor-pointer"
                        onClick={() => !loadingHabitId && handleToggleHabit(habit.id)}
                      >
                        {habit.title}
                      </div>
                      {habit.completed && (
                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                          Выполнено
                        </Badge>
                      )}
                    </div>
                    <div className="ml-7 mt-1 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Серия: {habit.streak}/{habit.target} дней
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFrequencyText(habit.frequency, habit.period)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleHabit(habit.id)}
                    disabled={loadingHabitId === habit.id}
                  >
                    {loadingHabitId === habit.id ? "Загрузка..." : (habit.completed ? "Отменить" : "Выполнить")}
                  </Button>
                </div>
                <Progress value={(habit.streak / habit.target) * 100} className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="tasks">
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-accent" />
            Задачи на {format(date, "d MMMM")}
          </h3>

          {tasksForSelectedDay.length > 0 ? (
            <div className="space-y-3">
              {tasksForSelectedDay.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="cursor-pointer"
                      />
                    </div>
                    <div
                      className={`text-sm font-medium leading-none cursor-pointer ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.title}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {task.deadline && (
                      <span className="text-xs text-muted-foreground mr-3">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {format(task.deadline, "HH:mm")}
                      </span>
                    )}

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Удалить задачу</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground border rounded-md">
              Нет задач на этот день
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="habits">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-accent" />
              Привычки на {format(date, "d MMMM")}
            </h3>
            <DashboardHabitDialog onCreateHabit={addHabit} />
          </div>

          {habitsLoading && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          )}

          {(habitsError || localError) && (
            <>
              {habitsError && typeof habitsError === 'string' && (habitsError.includes("таблица") || habitsError.includes("не существует")) ? (
                <SimpleMigration />
              ) : (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Ошибка</AlertTitle>
                  <AlertDescription>
                    {habitsError || localError}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {!habitsLoading && !habitsError && habits.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border rounded-md">
              Нет привычек на этот день
            </div>
          )}

          <div className="space-y-4">
            {habits.map(habit => (
              <div key={habit.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Checkbox
                          checked={habit.completed}
                          onCheckedChange={() => handleToggleHabit(habit.id)}
                          disabled={loadingHabitId === habit.id}
                          className="cursor-pointer"
                        />
                      </div>
                      <div
                        className="ml-3 text-sm font-medium cursor-pointer"
                        onClick={() => !loadingHabitId && handleToggleHabit(habit.id)}
                      >
                        {habit.title}
                      </div>
                      {habit.completed && (
                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                          Выполнено
                        </Badge>
                      )}
                    </div>
                    <div className="ml-7 mt-1 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Серия: {habit.streak}/{habit.target} дней
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFrequencyText(habit.frequency, habit.period)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleHabit(habit.id)}
                    disabled={loadingHabitId === habit.id}
                  >
                    {loadingHabitId === habit.id ? "Загрузка..." : (habit.completed ? "Отменить" : "Выполнить")}
                  </Button>
                </div>
                <Progress value={(habit.streak / habit.target) * 100} className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
