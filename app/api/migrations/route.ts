import { createClient } from '@/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { migration } = await request.json()

    if (!migration) {
      return NextResponse.json({ error: 'Migration name is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Выполняем миграцию в зависимости от типа
    if (migration === 'tasks') {
      // Создаем таблицу tasks
      try {
        // Проверяем, существует ли таблица tasks
        const { error: checkError } = await supabase
          .from('tasks')
          .select('id')
          .limit(1)

        if (checkError && checkError.message.includes('does not exist')) {
          // Создаем таблицу tasks напрямую через SQL
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql_query: `
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
          })

          if (createError) {
            // Если функция exec_sql не существует, предложим пользователю создать таблицы вручную
            console.error('Ошибка при создании таблицы tasks через SQL:', createError)
            return NextResponse.json({
              error: `Не удалось создать таблицу tasks. Пожалуйста, создайте таблицы вручную через консоль Supabase. Ошибка: ${createError.message}`,
              sql_script: true
            }, { status: 500 })
          }
        }

        // Создаем тестовую запись только если таблица была только что создана
        if (checkError && checkError.message.includes('does not exist')) {
          const { error: insertError } = await supabase
            .from('tasks')
            .insert({
              id: crypto.randomUUID(),
              user_id: user.id,
              title: 'Тестовая задача',
              description: 'Эта задача будет удалена автоматически',
              priority: 'medium',
              status: 'pending',
              deadline: null,
              completed: false
            })

          if (insertError) {
            console.error('Ошибка при создании тестовой задачи:', insertError)
            return NextResponse.json({ error: `Ошибка при создании тестовой задачи: ${insertError.message}` }, { status: 500 })
          }
        }

        return NextResponse.json({ success: true, message: 'Таблица tasks успешно создана' })
      } catch (error: any) {
        console.error('Ошибка при создании таблицы tasks:', error)
        return NextResponse.json({ error: `Ошибка при создании таблицы tasks: ${error.message}` }, { status: 500 })
      }
    } else if (migration === 'habits') {
      // Создаем таблицу habits
      try {
        // Проверяем, существует ли таблица habits
        const { error: checkError } = await supabase
          .from('habits')
          .select('id')
          .limit(1)

        if (checkError && checkError.message.includes('does not exist')) {
          // Создаем таблицу habits напрямую через SQL
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql_query: `
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
          })

          if (createError) {
            // Если функция exec_sql не существует, предложим пользователю создать таблицы вручную
            console.error('Ошибка при создании таблиц habits и habit_logs через SQL:', createError)
            return NextResponse.json({
              error: `Не удалось создать таблицы habits и habit_logs. Пожалуйста, создайте таблицы вручную через консоль Supabase. Ошибка: ${createError.message}`,
              sql_script: true
            }, { status: 500 })
          }
        }

        // Создаем тестовую запись
        const { error: insertError } = await supabase
          .from('habits')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            title: 'Тестовая привычка',
            description: 'Эта привычка будет удалена автоматически',
            frequency: 'daily',
            duration: 7,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          })

        if (insertError) {
          console.error('Ошибка при создании тестовой привычки:', insertError)
          return NextResponse.json({ error: `Ошибка при создании тестовой привычки: ${insertError.message}` }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Таблицы habits и habit_logs успешно созданы' })
      } catch (error: any) {
        console.error('Ошибка при создании таблиц habits и habit_logs:', error)
        return NextResponse.json({ error: `Ошибка при создании таблиц habits и habit_logs: ${error.message}` }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: `Неизвестная миграция: ${migration}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Ошибка при выполнении миграции:', error)
    return NextResponse.json({ error: `Ошибка при выполнении миграции: ${error.message}` }, { status: 500 })
  }
}
