"use client"

import { useState } from "react"
import { format, isAfter, startOfDay, differenceInHours } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Calendar } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTasks, TaskPriority, type Task } from "@/contexts/tasks-context"
import { SimpleMigration } from "@/components/simple-migration"
import { TaskForm } from "@/components/task-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function TasksPanel() {
  const {
    tasks,
    loading,
    error,
    addTask: addTaskToContext,
    toggleTaskCompletion,
    deleteTask
  } = useTasks()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTask = async (data: any) => {
    try {
      setIsSubmitting(true)

      // Проверяем, что все обязательные поля заполнены
      if (!data.title) {
        throw new Error("Название задачи обязательно для заполнения")
      }

      // Добавляем задачу через контекст
      await addTaskToContext({
        title: data.title,
        description: data.description || "",
        priority: data.priority,
        deadline: data.deadline
      })

      // Закрываем диалоговое окно
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Ошибка при добавлении задачи:", error)

      // Показываем сообщение об ошибке
      const errorMessage = error.message ||
                          (error.toString && error.toString() !== '[object Object]' ? error.toString() :
                          JSON.stringify(error) || "Неизвестная ошибка")

      alert(`Ошибка при добавлении задачи: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ежедневные задачи</CardTitle>
        <CardDescription>Управляйте своими задачами и отслеживайте прогресс</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Добавить задачу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить новую задачу</DialogTitle>
                <DialogDescription>
                  Заполните форму для создания новой задачи
                </DialogDescription>
              </DialogHeader>
              <TaskForm
                onSubmit={handleAddTask}
                isSubmitting={isSubmitting}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        )}

        {error && (
          <>
            {error && typeof error === 'string' && (error.includes("таблица") || error.includes("не существует")) ? (
              <SimpleMigration />
            ) : (
              <div className="text-center py-6 text-destructive border rounded-md p-4">
                <p className="font-semibold mb-2">Ошибка:</p>
                <p>{error}</p>
              </div>
            )}
          </>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground border rounded-md">
            <p className="mb-2">У вас пока нет задач</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить первую задачу
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {tasks.map((task) => {
            const now = new Date();
            const isOverdue = task.deadline && !task.completed && isAfter(startOfDay(now), task.deadline);
            const isUrgent = task.deadline && !task.completed && !isOverdue && differenceInHours(task.deadline, now) <= 24;

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 border rounded-md ${
                  isOverdue ? "border-destructive bg-destructive/5" :
                  isUrgent ? "border-destructive border-2" : ""
                }`}
              >
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        className="cursor-pointer"
                      />
                    </div>
                    <div
                      className={`text-sm font-medium leading-none cursor-pointer ${
                        task.completed ? "line-through text-muted-foreground" :
                        isOverdue ? "text-destructive font-semibold" :
                        isUrgent ? "text-destructive" : ""
                      }`}
                      onClick={() => toggleTaskCompletion(task.id)}
                    >
                      {task.title}
                    </div>
                  </div>

                  {task.deadline && (
                    <div className="flex items-center ml-7 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className={isOverdue ? "text-destructive" : isUrgent ? "text-destructive" : ""}>
                        {format(task.deadline, "dd.MM.yyyy")}
                        {isOverdue && " (просрочено)"}
                        {isUrgent && " (срочно)"}
                      </span>
                    </div>
                  )}
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Удалить задачу</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
