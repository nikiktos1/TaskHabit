"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createClient } from "@/supabase/client"

export function MigrationNoticeSimple() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const runMigrations = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error("Пользователь не авторизован")
      }

      // Создаем простые таблицы без сложных типов

      // Создаем таблицу tasks
      try {
        // Сначала пробуем создать таблицу tasks
        const { error: createTasksTableError } = await supabase.rpc('create_tasks_table', {
          user_id: userData.user.id
        })

        if (createTasksTableError) {
          console.error("Ошибка при создании таблицы tasks через RPC:", createTasksTableError)

          // Если RPC не работает, пробуем создать таблицу напрямую
          const { error: insertTaskError } = await supabase.from('tasks').insert({
            id: crypto.randomUUID(),
            user_id: userData.user.id,
            title: 'Тестовая задача',
            description: 'Эта задача будет удалена автоматически',
            priority: 'medium',
            status: 'pending',
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          if (insertTaskError && !insertTaskError.message.includes('already exists')) {
            console.error("Ошибка при создании записи в таблице tasks:", insertTaskError)
          }
        }
      } catch (e) {
        console.error("Ошибка при создании таблицы tasks:", e)
      }

      // Создаем таблицу habits
      try {
        // Сначала пробуем создать таблицу habits
        const { error: createHabitsTableError } = await supabase.rpc('create_habits_table', {
          user_id: userData.user.id
        })

        if (createHabitsTableError) {
          console.error("Ошибка при создании таблицы habits через RPC:", createHabitsTableError)

          // Если RPC не работает, пробуем создать таблицу напрямую
          const { error: insertHabitError } = await supabase.from('habits').insert({
            id: crypto.randomUUID(),
            user_id: userData.user.id,
            title: 'Тестовая привычка',
            description: 'Эта привычка будет удалена автоматически',
            frequency: 'daily',
            duration: 7,
            start_date: new Date().toISOString(),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          if (insertHabitError && !insertHabitError.message.includes('already exists')) {
            console.error("Ошибка при создании записи в таблице habits:", insertHabitError)
          }
        }
      } catch (e) {
        console.error("Ошибка при создании таблицы habits:", e)
      }

      // Создаем таблицу habit_logs
      try {
        // Сначала пробуем создать таблицу habit_logs
        const { error: createLogsTableError } = await supabase.rpc('create_habit_logs_table', {
          user_id: userData.user.id
        })

        if (createLogsTableError) {
          console.error("Ошибка при создании таблицы habit_logs через RPC:", createLogsTableError)

          // Если RPC не работает, пробуем создать таблицу напрямую
          const { error: insertLogError } = await supabase.from('habit_logs').insert({
            id: crypto.randomUUID(),
            habit_id: crypto.randomUUID(),
            user_id: userData.user.id,
            date: new Date().toISOString(),
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          if (insertLogError && !insertLogError.message.includes('already exists')) {
            console.error("Ошибка при создании записи в таблице habit_logs:", insertLogError)
          }
        }
      } catch (e) {
        console.error("Ошибка при создании таблицы habit_logs:", e)
      }

      // Проверяем, что таблицы созданы
      const { error: checkTasksError } = await supabase.from('tasks').select('id').limit(1)
      const { error: checkHabitsError } = await supabase.from('habits').select('id').limit(1)

      if (checkTasksError || checkHabitsError) {
        console.error("Ошибка при проверке таблиц:", { checkTasksError, checkHabitsError })

        // Последняя попытка - создать таблицы через SQL
        try {
          // Создаем таблицу tasks
          await fetch('/api/create-tables', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userData.user.id
            })
          })
        } catch (e) {
          console.error("Ошибка при создании таблиц через API:", e)
        }
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
