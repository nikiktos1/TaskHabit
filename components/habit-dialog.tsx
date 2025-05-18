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
import { HabitForm } from "@/components/habit-form"
import { Plus } from "lucide-react"

// Типы привычек
enum HabitFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

// Тип данных для формы привычки
interface HabitFormData {
  title: string
  description?: string
  frequency: HabitFrequency
  period: number
  target: number
  startDate: Date
}

interface HabitDialogProps {
  onCreateHabit: (habit: HabitFormData) => void
  initialData?: HabitFormData
  buttonText?: string
  dialogTitle?: string
  dialogDescription?: string
}

export function HabitDialog({
  onCreateHabit,
  initialData,
  buttonText = "Новая привычка",
  dialogTitle = "Создать привычку",
  dialogDescription = "Добавьте новую привычку для отслеживания",
}: HabitDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: HabitFormData) => {
    try {
      setIsSubmitting(true)
      await onCreateHabit(data)
      setOpen(false)
    } catch (error) {
      console.error("Ошибка при создании привычки:", error)
    } finally {
      setIsSubmitting(false)
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
          <HabitForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
