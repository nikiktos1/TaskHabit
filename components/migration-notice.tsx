"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createClient } from "@/supabase/client"

export function MigrationNotice() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const runMigrations = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Создаем таблицу tasks с минимальными полями
      const { error: createTasksError } = await supabase.from('tasks').insert({
        id: crypto.randomUUID(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
        title: 'Временная задача',
        description: 'Эта задача будет удалена',
        priority: 'medium',
        status: 'pending',
        completed: false
      }).select()

      if (createTasksError && !createTasksError.message.includes('already exists')) {
        console.error("Ошибка при создании таблицы tasks:", createTasksError)

        // Если ошибка связана с отсутствием типов, создаем их вручную
        if (createTasksError.message.includes('type') || createTasksError.message.includes('does not exist')) {
          // Создаем таблицу tasks с текстовыми полями вместо enum
          const { error: createSimpleTasksError } = await supabase.from('tasks').insert({
            id: crypto.randomUUID(),
            user_id: (await supabase.auth.getUser()).data.user?.id,
            title: 'Временная задача',
            description: 'Эта задача будет удалена',
            priority: 'medium',
            status: 'pending',
            completed: false
          }).select()

          if (createSimpleTasksError) {
            console.error("Ошибка при создании упрощенной таблицы tasks:", createSimpleTasksError)
          }
        }
      }

      // Создаем таблицу habits с минимальными полями
      const { error: createHabitsError } = await supabase.from('habits').insert({
        id: crypto.randomUUID(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
        title: 'Временная привычка',
        description: 'Эта привычка будет удалена',
        frequency: 'daily',
        duration: 7,
        start_date: new Date().toISOString(),
        status: 'active'
      }).select()

      if (createHabitsError && !createHabitsError.message.includes('already exists')) {
        console.error("Ошибка при создании таблицы habits:", createHabitsError)

        // Если ошибка связана с отсутствием типов, создаем их вручную
        if (createHabitsError.message.includes('type') || createHabitsError.message.includes('does not exist')) {
          // Создаем таблицу habits с текстовыми полями вместо enum
          const { error: createSimpleHabitsError } = await supabase.from('habits').insert({
            id: crypto.randomUUID(),
            user_id: (await supabase.auth.getUser()).data.user?.id,
            title: 'Временная привычка',
            description: 'Эта привычка будет удалена',
            frequency: 'daily',
            duration: 7,
            start_date: new Date().toISOString(),
            status: 'active'
          }).select()

          if (createSimpleHabitsError) {
            console.error("Ошибка при создании упрощенной таблицы habits:", createSimpleHabitsError)
          }
        }
      }

      // Проверяем, что таблицы созданы
      const { error: checkTasksError } = await supabase.from('tasks').select('id').limit(1)
      const { error: checkHabitsError } = await supabase.from('habits').select('id').limit(1)

      if (checkTasksError || checkHabitsError) {
        throw new Error("Не удалось создать все необходимые таблицы. Пожалуйста, обратитесь к администратору.")
      }

      setSuccess(true)

      // Перезагружаем страницу через 2 секунды
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error("Ошибка при запуске миграций:", error)
      setError(error.message || "Не удалось запустить миграции")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Внимание!</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Для корректной работы приложения необходимо создать таблицы в базе данных.
          Пожалуйста, запустите миграции, нажав на кнопку ниже.
        </p>

        {error && (
          <p className="text-destructive font-medium">
            {error}
          </p>
        )}

        {success && (
          <p className="text-green-600 font-medium">
            Миграции успешно выполнены! Обновите страницу, чтобы увидеть изменения.
          </p>
        )}

        <Button
          variant="destructive"
          onClick={runMigrations}
          disabled={loading || success}
        >
          {loading ? "Выполнение миграций..." : "Запустить миграции"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
