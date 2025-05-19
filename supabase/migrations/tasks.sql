-- Создание типов для задач
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Создание таблицы задач
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  deadline TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_status_idx ON tasks(status);
CREATE INDEX tasks_priority_idx ON tasks(priority);
CREATE INDEX tasks_deadline_idx ON tasks(deadline);
CREATE INDEX tasks_completed_idx ON tasks(completed);

-- Настройка политик безопасности для таблицы задач
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
