-- Функция для запуска миграций
CREATE OR REPLACE FUNCTION run_migration(migration_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_content TEXT;
BEGIN
  -- Проверяем, какую миграцию нужно запустить
  IF migration_name = 'tasks' THEN
    -- SQL для создания таблицы задач
    sql_content := '
      -- Создание типов для задач
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''task_priority'') THEN
          CREATE TYPE task_priority AS ENUM (''low'', ''medium'', ''high'');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''task_status'') THEN
          CREATE TYPE task_status AS ENUM (''pending'', ''in_progress'', ''completed'', ''cancelled'');
        END IF;
      END$$;

      -- Создание таблицы задач
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        priority task_priority NOT NULL DEFAULT ''medium'',
        status task_status NOT NULL DEFAULT ''pending'',
        deadline TIMESTAMP WITH TIME ZONE,
        completed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      -- Создание индексов для оптимизации запросов
      CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
      CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
      CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks(deadline);
      CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks(completed);

      -- Настройка политик безопасности для таблицы задач
      ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

      -- Удаляем существующие политики, если они есть
      DROP POLICY IF EXISTS "Пользователи могут видеть только свои задачи" ON tasks;
      DROP POLICY IF EXISTS "Пользователи могут создавать только свои задачи" ON tasks;
      DROP POLICY IF EXISTS "Пользователи могут обновлять только свои задачи" ON tasks;
      DROP POLICY IF EXISTS "Пользователи могут удалять только свои задачи" ON tasks;

      -- Создаем новые политики
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
    ';
  ELSIF migration_name = 'habits' THEN
    -- SQL для создания таблицы привычек
    sql_content := '
      -- Создание типов для привычек
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''habit_frequency'') THEN
          CREATE TYPE habit_frequency AS ENUM (''daily'', ''weekly'', ''monthly'');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''habit_status'') THEN
          CREATE TYPE habit_status AS ENUM (''active'', ''completed'', ''failed'', ''paused'');
        END IF;
      END$$;

      -- Создание таблицы привычек
      CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        frequency habit_frequency NOT NULL,
        duration INTEGER NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        status habit_status NOT NULL DEFAULT ''active'',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      -- Создание таблицы для отслеживания выполнения привычек
      CREATE TABLE IF NOT EXISTS habit_logs (
        id UUID PRIMARY KEY,
        habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      -- Создание индексов для оптимизации запросов
      CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
      CREATE INDEX IF NOT EXISTS habits_status_idx ON habits(status);
      CREATE INDEX IF NOT EXISTS habits_frequency_idx ON habits(frequency);
      CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON habit_logs(habit_id);
      CREATE INDEX IF NOT EXISTS habit_logs_user_id_idx ON habit_logs(user_id);
      CREATE INDEX IF NOT EXISTS habit_logs_date_idx ON habit_logs(date);

      -- Настройка политик безопасности для таблицы привычек
      ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

      -- Удаляем существующие политики, если они есть
      DROP POLICY IF EXISTS "Пользователи могут видеть только свои привычки" ON habits;
      DROP POLICY IF EXISTS "Пользователи могут создавать только свои привычки" ON habits;
      DROP POLICY IF EXISTS "Пользователи могут обновлять только свои привычки" ON habits;
      DROP POLICY IF EXISTS "Пользователи могут удалять только свои привычки" ON habits;

      -- Создаем новые политики
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

      -- Настройка политик безопасности для таблицы логов привычек
      ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

      -- Удаляем существующие политики, если они есть
      DROP POLICY IF EXISTS "Пользователи могут видеть только свои логи привычек" ON habit_logs;
      DROP POLICY IF EXISTS "Пользователи могут создавать только свои логи привычек" ON habit_logs;
      DROP POLICY IF EXISTS "Пользователи могут обновлять только свои логи привычек" ON habit_logs;
      DROP POLICY IF EXISTS "Пользователи могут удалять только свои логи привычек" ON habit_logs;

      -- Создаем новые политики
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
    ';
  ELSE
    RAISE EXCEPTION 'Неизвестная миграция: %', migration_name;
  END IF;

  -- Выполняем SQL
  EXECUTE sql_content;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Ошибка при выполнении миграции %: %', migration_name, SQLERRM;
    RETURN FALSE;
END;
$$;
