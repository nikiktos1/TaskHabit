"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { useHabits, HabitFrequency, type Habit } from "@/contexts/habits-context"
import { SimpleMigration } from "@/components/simple-migration"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { DashboardHabitDialog } from "@/components/dashboard-habit-dialog"
import { useSync } from "@/contexts/sync-context"

export function HabitsPanel() {
  const {
    habits,
    loading,
    error,
    addHabit,
    toggleHabitCompletion,
    incrementHabitStreak,
    deleteHabit
  } = useHabits()

  // Состояние для отслеживания загрузки и ошибок
  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const { toast } = useToast()
  const { refreshHabitsPage } = useSync()

  // Функция для безопасного переключения статуса привычки
  const handleToggleHabit = async (id: string) => {
    try {
      setLocalError(null)
      setLoadingHabitId(id)

      await toggleHabitCompletion(id)

      // Показываем уведомление об успешном выполнении
      toast({
        title: "Успех",
        description: "Статус привычки успешно обновлен",
        variant: "default",
      })

      // Обновляем страницу привычек
      refreshHabitsPage()
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Долгосрочные привычки</CardTitle>
          <CardDescription>Отслеживайте свои привычки и развивайте постоянство</CardDescription>
        </div>
        <DashboardHabitDialog
          onCreateHabit={addHabit}
          buttonText="Новая привычка"
          dialogTitle="Создать привычку"
          dialogDescription="Добавьте новую привычку для отслеживания"
        />
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        )}

        {(error || localError) && (
          <>
            {error && typeof error === 'string' && (error.includes("таблица") || error.includes("не существует")) ? (
              <SimpleMigration />
            ) : (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>
                  {error || localError}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <div className="space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium">{habit.title}</h4>
                    {habit.completed && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Выполнено
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Серия: {habit.streak}/{habit.target} дней
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFrequencyText(habit.frequency, habit.period)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={habit.completed ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleToggleHabit(habit.id)}
                    disabled={loadingHabitId === habit.id}
                  >
                    {loadingHabitId === habit.id ? "Загрузка..." : (habit.completed ? "Отменить" : "Выполнить")}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <Progress value={(habit.streak / habit.target) * 100} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
