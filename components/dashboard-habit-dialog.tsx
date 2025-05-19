"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreateHabitForm } from "@/components/habits/create-habit-form"
import { Plus } from "lucide-react"
import { CreateHabitInput } from "@/types/habit"
import { toast } from "sonner"
import { useSync } from "@/contexts/sync-context"

interface DashboardHabitDialogProps {
  onCreateHabit: (habit: any) => Promise<void>
  buttonText?: string
  dialogTitle?: string
  dialogDescription?: string
}

export function DashboardHabitDialog({
  onCreateHabit,
  buttonText = "Новая привычка",
  dialogTitle = "Создать привычку",
  dialogDescription = "Добавьте новую привычку для отслеживания",
}: DashboardHabitDialogProps) {
  const [open, setOpen] = useState(false)
  const { refreshHabitsPage } = useSync()

  // Обработчик успешного создания привычки
  const handleSuccess = () => {
    setOpen(false)
    toast.success("Привычка успешно создана!")

    // Обновляем страницу привычек
    refreshHabitsPage()
  }

  // Преобразование данных из CreateHabitInput в формат, ожидаемый контекстом привычек
  const handleCreateHabit = async (data: CreateHabitInput) => {
    try {
      // Преобразуем данные в формат, ожидаемый контекстом привычек
      const habitData = {
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        period: 1, // По умолчанию период 1
        target: data.duration, // duration в CreateHabitInput соответствует target в контексте
        startDate: data.startDate,
      }

      // Вызываем функцию создания привычки из контекста
      await onCreateHabit(habitData)

      // Закрываем диалог
      handleSuccess()
    } catch (error) {
      console.error("Ошибка при создании привычки:", error)
      toast.error("Не удалось создать привычку. Пожалуйста, попробуйте снова.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CreateHabitForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
