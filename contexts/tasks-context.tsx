"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/supabase/client"
import { useAuth } from "@/hooks/use-auth"

// Типы для задач
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Тип данных для задачи
export type Task = {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  deadline?: Date
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

// Тип данных для формы задачи
export interface TaskFormData {
  title: string
  description?: string
  priority?: TaskPriority
  deadline?: Date
}

// Интерфейс контекста задач
interface TasksContextType {
  tasks: Task[]
  loading: boolean
  error: string | null
  addTask: (task: TaskFormData) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskCompletion: (id: string) => Promise<void>
}

// Создаем контекст с начальным значением null
const TasksContext = createContext<TasksContextType | null>(null)

// Хук для использования контекста задач
export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error("useTasks должен использоваться внутри TasksProvider")
  }
  return context
}

// Провайдер контекста задач
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Проверка существования таблицы
  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      // Проверяем существование таблицы, запрашивая ее метаданные
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      // Если ошибка содержит "relation does not exist", таблица не существует
      if (error && error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Ошибка при проверке таблицы ${tableName}:`, error);
      return false;
    }
  };

  // Функция для создания демо-задач
  const createDemoTasks = async () => {
    if (!user) return;

    try {
      const demoTasks = [
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Завершить проектное предложение",
          description: "Подготовить и отправить проектное предложение клиенту",
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
          deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Просмотреть отзывы клиентов",
          description: "Проанализировать отзывы клиентов и подготовить отчет",
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.COMPLETED,
          deadline: new Date(Date.now() - 86400000).toISOString(),
          completed: true,
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Запланировать встречу команды",
          description: "Организовать еженедельную встречу команды",
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.PENDING,
          deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: "Подготовить презентацию",
          description: "Создать презентацию для клиента",
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
          deadline: new Date(Date.now() + 3600000 * 12).toISOString(),
          completed: false,
        },
      ];

      for (const task of demoTasks) {
        await supabase.from("tasks").insert(task);
      }
    } catch (error) {
      console.error("Ошибка при создании демо-задач:", error);
    }
  };

  // Загрузка задач из Supabase
  const fetchTasks = async () => {
    if (!user) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Проверяем существование таблицы tasks
      const tableExists = await checkTableExists('tasks');

      if (!tableExists) {
        setError("Таблица задач не существует. Пожалуйста, запустите миграции базы данных.");
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      // Преобразуем данные из БД в формат Task
      const formattedTasks: Task[] = data.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        completed: task.completed,
        createdAt: new Date(task.created_at),
        updatedAt: new Date(task.updated_at),
      }))

      setTasks(formattedTasks)

      // Если таблица существует, но задач нет, создаем демо-задачи
      if (formattedTasks.length === 0) {
        await createDemoTasks()
      }
    } catch (error: any) {
      console.error("Ошибка при загрузке задач:", error)
      // Проверяем, есть ли у ошибки сообщение
      const errorMessage = error.message ||
                          (error.toString && error.toString() !== '[object Object]' ? error.toString() :
                          "Не удалось загрузить задачи. Возможно, таблица не существует.");
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Загружаем задачи при изменении пользователя
  useEffect(() => {
    fetchTasks()

    // Подписываемся на изменения в таблице tasks
    const tasksSubscription = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      tasksSubscription.unsubscribe()
    }
  }, [user, supabase])

  // Функция для добавления новой задачи
  const addTask = async (taskData: TaskFormData) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      // Проверяем существование таблицы tasks
      const tableExists = await checkTableExists('tasks');

      if (!tableExists) {
        throw new Error("Таблица задач не существует. Пожалуйста, запустите миграции базы данных.");
      }

      const newTask = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        deadline: taskData.deadline ? taskData.deadline.toISOString() : null,
        completed: false,
      }

      const { error } = await supabase.from("tasks").insert(newTask).select()

      if (error) {
        console.error("Ошибка при добавлении задачи:", JSON.stringify(error))
        throw error
      }

      // Обновляем список задач
      await fetchTasks()
    } catch (error: any) {
      console.error("Ошибка при создании задачи:", error)
      const errorMessage = error.message ||
                          (error.toString && error.toString() !== '[object Object]' ? error.toString() :
                          JSON.stringify(error) || "Не удалось создать задачу")
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Функция для обновления задачи
  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      // Преобразуем даты в ISO строки для Supabase
      const dbUpdates: any = {
        ...updates,
        deadline: updates.deadline ? updates.deadline.toISOString() : undefined,
      }

      // Удаляем поля, которые не нужно обновлять в БД
      delete dbUpdates.id
      delete dbUpdates.createdAt
      delete dbUpdates.updatedAt

      // Преобразуем имена полей в snake_case для БД
      const snakeCaseUpdates: any = {}
      if (dbUpdates.deadline !== undefined) snakeCaseUpdates.deadline = dbUpdates.deadline
      if (dbUpdates.title !== undefined) snakeCaseUpdates.title = dbUpdates.title
      if (dbUpdates.description !== undefined) snakeCaseUpdates.description = dbUpdates.description
      if (dbUpdates.priority !== undefined) snakeCaseUpdates.priority = dbUpdates.priority
      if (dbUpdates.status !== undefined) snakeCaseUpdates.status = dbUpdates.status
      if (dbUpdates.completed !== undefined) snakeCaseUpdates.completed = dbUpdates.completed

      const { error } = await supabase
        .from("tasks")
        .update(snakeCaseUpdates)
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Обновляем список задач
      await fetchTasks()
    } catch (error: any) {
      console.error("Ошибка при обновлении задачи:", error)
      setError(error.message || "Не удалось обновить задачу")
      throw error
    }
  }

  // Функция для удаления задачи
  const deleteTask = async (id: string) => {
    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    try {
      setError(null)

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Обновляем список задач
      await fetchTasks()
    } catch (error: any) {
      console.error("Ошибка при удалении задачи:", error)
      setError(error.message || "Не удалось удалить задачу")
      throw error
    }
  }

  // Функция для переключения статуса выполнения задачи
  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) {
      throw new Error("Задача не найдена")
    }

    await updateTask(id, {
      completed: !task.completed,
      status: !task.completed ? TaskStatus.COMPLETED : TaskStatus.PENDING
    })
  }

  // Значение контекста
  const value = {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion
  }

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  )
}
