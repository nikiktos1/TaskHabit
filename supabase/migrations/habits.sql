-- Создание типов для привычек
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE habit_status AS ENUM ('active', 'completed', 'failed', 'paused');

-- Создание таблицы привычек
CREATE TABLE habits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency habit_frequency NOT NULL,
  duration INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status habit_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы для отслеживания выполнения привычек
CREATE TABLE habit_logs (
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
CREATE INDEX habits_user_id_idx ON habits(user_id);
CREATE INDEX habits_status_idx ON habits(status);
CREATE INDEX habits_frequency_idx ON habits(frequency);
CREATE INDEX habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX habit_logs_user_id_idx ON habit_logs(user_id);
CREATE INDEX habit_logs_date_idx ON habit_logs(date);

-- Настройка политик безопасности для таблицы привычек
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

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

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON habits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_logs_updated_at
BEFORE UPDATE ON habit_logs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
