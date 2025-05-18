-- Функция для создания таблицы tasks
CREATE OR REPLACE FUNCTION create_tasks_table(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Создаем таблицу tasks, если она не существует
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
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
  CREATE POLICY IF NOT EXISTS "Пользователи могут видеть только свои задачи"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут создавать только свои задачи"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут обновлять только свои задачи"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут удалять только свои задачи"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);
  
  -- Вставляем тестовую задачу
  INSERT INTO tasks (id, user_id, title, description, priority, status, completed, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    user_id,
    'Тестовая задача',
    'Эта задача будет удалена автоматически',
    'medium',
    'pending',
    false,
    now(),
    now()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Ошибка при создании таблицы tasks: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Функция для создания таблицы habits
CREATE OR REPLACE FUNCTION create_habits_table(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Создаем таблицу habits, если она не существует
  CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
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
  CREATE POLICY IF NOT EXISTS "Пользователи могут видеть только свои привычки"
    ON habits FOR SELECT
    USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут создавать только свои привычки"
    ON habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут обновлять только свои привычки"
    ON habits FOR UPDATE
    USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут удалять только свои привычки"
    ON habits FOR DELETE
    USING (auth.uid() = user_id);
  
  -- Вставляем тестовую привычку
  INSERT INTO habits (id, user_id, title, description, frequency, duration, start_date, status, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    user_id,
    'Тестовая привычка',
    'Эта привычка будет удалена автоматически',
    'daily',
    7,
    now(),
    'active',
    now(),
    now()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Ошибка при создании таблицы habits: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Функция для создания таблицы habit_logs
CREATE OR REPLACE FUNCTION create_habit_logs_table(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  habit_id UUID;
BEGIN
  -- Создаем таблицу habit_logs, если она не существует
  CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY,
    habit_id UUID NOT NULL,
    user_id UUID NOT NULL,
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
  CREATE POLICY IF NOT EXISTS "Пользователи могут видеть только свои логи привычек"
    ON habit_logs FOR SELECT
    USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут создавать только свои логи привычек"
    ON habit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут обновлять только свои логи привычек"
    ON habit_logs FOR UPDATE
    USING (auth.uid() = user_id);
  
  CREATE POLICY IF NOT EXISTS "Пользователи могут удалять только свои логи привычек"
    ON habit_logs FOR DELETE
    USING (auth.uid() = user_id);
  
  -- Получаем ID привычки пользователя
  SELECT id INTO habit_id FROM habits WHERE user_id = user_id LIMIT 1;
  
  -- Если привычка найдена, вставляем тестовый лог
  IF habit_id IS NOT NULL THEN
    INSERT INTO habit_logs (id, habit_id, user_id, date, completed, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      habit_id,
      user_id,
      now(),
      false,
      now(),
      now()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Ошибка при создании таблицы habit_logs: %', SQLERRM;
    RETURN FALSE;
END;
$$;
