"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createClient } from "@/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SimpleMigration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSqlScripts, setShowSqlScripts] = useState(false)
  const [copied, setCopied] = useState(false)

  // SQL-скрипты для создания таблиц
  const tasksTableSql = `
-- Создаем таблицу tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  deadline TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);

-- Включаем RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Создаем политики
CREATE POLICY "Пользователи могут видеть только свои задачи"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать только свои задачи"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свои задачи"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять только свои задачи"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
`

  const habitsTableSql = `
-- Создаем таблицу habits
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'daily',
  duration INTEGER DEFAULT 7,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);

-- Включаем RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Создаем политики
CREATE POLICY "Пользователи могут видеть только свои привычки"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать только свои привычки"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свои привычки"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять только свои привычки"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);
`

  const habitLogsTableSql = `
-- Создаем таблицу habit_logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_id_idx ON habit_logs(user_id);

-- Включаем RLS
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Создаем политики
CREATE POLICY "Пользователи могут видеть только свои логи привычек"
  ON habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут создавать только свои логи привычек"
  ON habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свои логи привычек"
  ON habit_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять только свои логи привычек"
  ON habit_logs FOR DELETE
  USING (auth.uid() = user_id);
`

  // Функция для копирования SQL-скрипта в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const runMigrations = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setShowSqlScripts(false)

    try {
      // Запускаем миграцию для таблицы tasks
      try {
        console.log("Запускаем миграцию для таблицы tasks...")

        const response = await fetch('/api/migrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ migration: 'tasks' }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('Ответ сервера при миграции tasks:', data)

          // Если ошибка связана с отсутствием функции exec_sql, показываем SQL-скрипты
          if (data.sql_script || data.error?.includes('exec_sql') || data.error?.includes('function') || data.error?.includes('not found')) {
            setShowSqlScripts(true)
            throw new Error('Не удалось автоматически создать таблицы. Пожалуйста, используйте SQL-скрипты ниже для создания таблиц вручную.')
          }

          throw new Error(data.error || 'Ошибка при выполнении миграции tasks')
        }

        console.log("Миграция tasks успешно выполнена:", data)
      } catch (e: any) {
        console.error("Ошибка при выполнении миграции tasks:", e)

        // Если ошибка не связана с SQL-скриптами, просто показываем сообщение об ошибке
        if (!showSqlScripts) {
          setError(`Ошибка при выполнении миграции tasks: ${e.message || JSON.stringify(e)}`)
          return
        }

        // Если ошибка связана с SQL-скриптами, продолжаем выполнение, чтобы показать все SQL-скрипты
        setError(e.message || JSON.stringify(e))
      }

      // Если мы показываем SQL-скрипты, не выполняем миграцию habits
      if (!showSqlScripts) {
        // Запускаем миграцию для таблицы habits
        try {
          console.log("Запускаем миграцию для таблицы habits...")

          const response = await fetch('/api/migrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ migration: 'habits' }),
          })

          const data = await response.json()

          if (!response.ok) {
            console.error('Ответ сервера при миграции habits:', data)

            // Если ошибка связана с отсутствием функции exec_sql, показываем SQL-скрипты
            if (data.sql_script || data.error?.includes('exec_sql') || data.error?.includes('function') || data.error?.includes('not found')) {
              setShowSqlScripts(true)
              throw new Error('Не удалось автоматически создать таблицы. Пожалуйста, используйте SQL-скрипты ниже для создания таблиц вручную.')
            }

            throw new Error(data.error || 'Ошибка при выполнении миграции habits')
          }

          console.log("Миграция habits успешно выполнена:", data)

          // Если обе миграции успешно выполнены, устанавливаем флаг успеха
          setSuccess(true)

          // Перезагружаем страницу через 2 секунды
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } catch (e: any) {
          console.error("Ошибка при выполнении миграции habits:", e)

          // Если ошибка не связана с SQL-скриптами, просто показываем сообщение об ошибке
          if (!showSqlScripts) {
            setError(`Ошибка при выполнении миграции habits: ${e.message || JSON.stringify(e)}`)
          }
        }
      }
    } catch (error: any) {
      console.error("Ошибка при запуске миграций:", error)
      setError(error.message || JSON.stringify(error) || "Не удалось запустить миграции")
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
          Пожалуйста, нажмите на кнопку ниже для создания необходимых таблиц.
        </p>

        <p className="text-sm text-muted-foreground mt-2">
          Это действие создаст таблицы для хранения задач и привычек в базе данных Supabase.
          Если возникнут проблемы, обратитесь к администратору или создайте таблицы вручную через панель управления Supabase.
        </p>

        {error && (
          <div className="text-destructive font-medium p-2 border border-destructive rounded-md bg-destructive/5 mt-2">
            <p className="font-semibold mb-1">Ошибка:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="text-green-600 font-medium p-2 border border-green-600 rounded-md bg-green-50 dark:bg-green-950 mt-2">
            <p className="font-semibold mb-1">Успех!</p>
            <p className="text-sm">Миграции успешно выполнены! Страница будет автоматически обновлена через 2 секунды.</p>
          </div>
        )}

        {showSqlScripts ? (
          <div className="mt-4 space-y-4">
            <p className="font-medium">Для создания таблиц вручную, выполните следующие SQL-запросы в консоли Supabase:</p>

            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="tasks">Таблица Tasks</TabsTrigger>
                <TabsTrigger value="habits">Таблица Habits</TabsTrigger>
                <TabsTrigger value="habit_logs">Таблица Habit Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="mt-2">
                <div className="relative">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                    <pre className="text-xs">{tasksTableSql}</pre>
                  </ScrollArea>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(tasksTableSql)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="habits" className="mt-2">
                <div className="relative">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                    <pre className="text-xs">{habitsTableSql}</pre>
                  </ScrollArea>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(habitsTableSql)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="habit_logs" className="mt-2">
                <div className="relative">
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                    <pre className="text-xs">{habitLogsTableSql}</pre>
                  </ScrollArea>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(habitLogsTableSql)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <p className="text-sm text-muted-foreground">
              После выполнения SQL-запросов обновите страницу, чтобы проверить, что таблицы созданы успешно.
            </p>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Обновить страницу
            </Button>
          </div>
        ) : (
          <Button
            variant="destructive"
            onClick={runMigrations}
            disabled={loading || success}
            className="mt-4"
          >
            {loading ? "Выполнение миграций..." : "Создать таблицы в базе данных"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
