"use client"

import { useState } from "react"
import { format, isAfter, startOfDay, differenceInHours } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  CheckCircle2,
  Circle,
  AlertCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTasks, TaskPriority, TaskStatus, type Task } from "@/contexts/tasks-context"
import { SimpleMigration } from "@/components/simple-migration"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TasksPage() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    loading,
    error
  } = useTasks()

  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDeadline, setNewTaskDeadline] = useState<Date | undefined>(undefined)
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>(TaskPriority.MEDIUM)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("deadline")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedTab, setSelectedTab] = useState("all")
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})

  // Функция для добавления новой задачи
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle,
        priority: newTaskPriority,
        deadline: newTaskDeadline,
      })
      setNewTaskTitle("")
      setNewTaskDeadline(undefined)
      setNewTaskPriority(TaskPriority.MEDIUM)
    }
  }

  // Функция для обработки изменения статуса задачи
  const handleTaskStatusChange = (task: Task, completed: boolean) => {
    updateTask(task.id, {
      completed,
      status: completed ? TaskStatus.COMPLETED : TaskStatus.PENDING
    })
  }

  // Функция для открытия диалога с деталями задачи
  const openTaskDetails = (task: Task) => {
    setSelectedTask(task)
    setEditedTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status
    })
    setTaskDetailsOpen(true)
  }

  // Функция для сохранения изменений в задаче
  const saveTaskChanges = () => {
    if (selectedTask && editedTask) {
      updateTask(selectedTask.id, editedTask)
      setTaskDetailsOpen(false)
    }
  }

  // Фильтрация и сортировка задач
  const filteredTasks = tasks
    .filter(task => {
      // Фильтр по поисковому запросу
      const matchesSearch = searchQuery
        ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        : true

      // Фильтр по статусу
      const matchesStatus = filterStatus
        ? task.status === filterStatus
        : true

      // Фильтр по приоритету
      const matchesPriority = filterPriority
        ? task.priority === filterPriority
        : true

      // Фильтр по вкладке
      const matchesTab = selectedTab === "all"
        ? true
        : selectedTab === "completed"
          ? task.completed
          : !task.completed

      return matchesSearch && matchesStatus && matchesPriority && matchesTab
    })
    .sort((a, b) => {
      // Сортировка по выбранному полю
      if (sortBy === "deadline") {
        // Особая обработка для дат
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return sortOrder === "asc" ? 1 : -1
        if (!b.deadline) return sortOrder === "asc" ? -1 : 1
        return sortOrder === "asc"
          ? a.deadline.getTime() - b.deadline.getTime()
          : b.deadline.getTime() - a.deadline.getTime()
      } else if (sortBy === "priority") {
        // Сортировка по приоритету
        const priorityOrder = { [TaskPriority.LOW]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.HIGH]: 3 }
        return sortOrder === "asc"
          ? priorityOrder[a.priority] - priorityOrder[b.priority]
          : priorityOrder[b.priority] - priorityOrder[a.priority]
      } else if (sortBy === "title") {
        // Сортировка по названию
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      } else if (sortBy === "createdAt") {
        // Сортировка по дате создания
        return sortOrder === "asc"
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime()
      }
      return 0
    })

  // Функция для получения класса обводки в зависимости от приоритета и дедлайна
  const getTaskBorderClass = (task: Task) => {
    if (task.completed) return "border-green-500"

    if (task.deadline) {
      const now = new Date()
      const deadlineDate = new Date(task.deadline)

      // Если дедлайн прошел
      if (isAfter(now, deadlineDate)) {
        return "border-red-500"
      }

      // Если дедлайн сегодня или завтра
      const hoursDiff = differenceInHours(deadlineDate, now)
      if (hoursDiff < 24) {
        return "border-red-500"
      }
    }

    // По умолчанию - в зависимости от приоритета
    if (task.priority === TaskPriority.HIGH) return "border-orange-500"
    return ""
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground">Управляйте своими задачами и отслеживайте прогресс</p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Новая задача</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новую задачу</DialogTitle>
                <DialogDescription>
                  Добавьте новую задачу в свой список дел
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    placeholder="Введите название задачи"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Приоритет</Label>
                  <Select
                    value={newTaskPriority}
                    onValueChange={(value) => setNewTaskPriority(value as TaskPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Низкий</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Средний</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>Высокий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deadline">Дедлайн</Label>
                  <DatePicker
                    date={newTaskDeadline}
                    setDate={setNewTaskDeadline}
                    className="w-full"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setNewTaskTitle("")
                  setNewTaskDeadline(undefined)
                  setNewTaskPriority(TaskPriority.MEDIUM)
                }}>
                  Отмена
                </Button>
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  Создать задачу
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Поиск задач..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Фильтры</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Статус</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterStatus(null)} className={!filterStatus ? "bg-accent/50" : ""}>
                Все
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus(TaskStatus.PENDING)} className={filterStatus === TaskStatus.PENDING ? "bg-accent/50" : ""}>
                Ожидает
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus(TaskStatus.COMPLETED)} className={filterStatus === TaskStatus.COMPLETED ? "bg-accent/50" : ""}>
                Завершено
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Приоритет</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority(null)} className={!filterPriority ? "bg-accent/50" : ""}>
                Все
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(TaskPriority.LOW)} className={filterPriority === TaskPriority.LOW ? "bg-accent/50" : ""}>
                Низкий
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(TaskPriority.MEDIUM)} className={filterPriority === TaskPriority.MEDIUM ? "bg-accent/50" : ""}>
                Средний
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(TaskPriority.HIGH)} className={filterPriority === TaskPriority.HIGH ? "bg-accent/50" : ""}>
                Высокий
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                <span>Сортировка</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortBy("deadline")} className={sortBy === "deadline" ? "bg-accent/50" : ""}>
                Дедлайну
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("priority")} className={sortBy === "priority" ? "bg-accent/50" : ""}>
                Приоритету
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title")} className={sortBy === "title" ? "bg-accent/50" : ""}>
                Названию
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("createdAt")} className={sortBy === "createdAt" ? "bg-accent/50" : ""}>
                Дате создания
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Порядок</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder("asc")} className={sortOrder === "asc" ? "bg-accent/50" : ""}>
                По возрастанию
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("desc")} className={sortOrder === "desc" ? "bg-accent/50" : ""}>
                По убыванию
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Все задачи</CardTitle>
              <CardDescription>
                Просмотр всех ваших задач
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    <div className="text-center py-6 text-destructive border rounded-md">
                      {error}
                    </div>
                  )}
                </>
              )}

              {!loading && !error && filteredTasks.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-md">
                  Нет задач
                </div>
              )}

              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-md flex items-start gap-3 hover:bg-accent/10 transition-colors ${getTaskBorderClass(task)}`}
                  >
                    <div className="pt-0.5">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => {
                          handleTaskStatusChange(task, checked as boolean)
                        }}
                        className="cursor-pointer"
                      />
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openTaskDetails(task)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2">
                          {task.priority === TaskPriority.HIGH && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              Высокий
                            </Badge>
                          )}

                          {task.priority === TaskPriority.MEDIUM && (
                            <Badge variant="outline" className="text-blue-500 border-blue-500">
                              Средний
                            </Badge>
                          )}

                          {task.priority === TaskPriority.LOW && (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              Низкий
                            </Badge>
                          )}

                          {task.deadline && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(task.deadline, 'dd.MM.yyyy')}</span>
                            </Badge>
                          )}

                          {task.status === TaskStatus.COMPLETED && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                              Завершено
                            </Badge>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Активные задачи</CardTitle>
              <CardDescription>
                Задачи, которые еще не завершены
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Содержимое аналогично вкладке "Все" */}
              {/* Отображается благодаря фильтрации в filteredTasks */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Завершенные задачи</CardTitle>
              <CardDescription>
                Задачи, которые вы уже выполнили
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Содержимое аналогично вкладке "Все" */}
              {/* Отображается благодаря фильтрации в filteredTasks */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог с деталями задачи */}
      <Dialog open={taskDetailsOpen} onOpenChange={setTaskDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Детали задачи</DialogTitle>
            <DialogDescription>
              Просмотр и редактирование задачи
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Название</Label>
                <Input
                  id="edit-title"
                  value={editedTask.title || ""}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
                  value={editedTask.description || ""}
                  onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                  placeholder="Добавьте описание задачи..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Приоритет</Label>
                <Select
                  value={editedTask.priority}
                  onValueChange={(value) => setEditedTask({...editedTask, priority: value as TaskPriority})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Низкий</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Средний</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Статус</Label>
                <Select
                  value={editedTask.status}
                  onValueChange={(value) => {
                    const newStatus = value as TaskStatus
                    setEditedTask({
                      ...editedTask,
                      status: newStatus,
                      completed: newStatus === TaskStatus.COMPLETED
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.PENDING}>Ожидает</SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>Завершено</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-deadline">Дедлайн</Label>
                <DatePicker
                  date={editedTask.deadline}
                  setDate={(date) => setEditedTask({...editedTask, deadline: date})}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedTask) {
                      deleteTask(selectedTask.id)
                      setTaskDetailsOpen(false)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setTaskDetailsOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={saveTaskChanges}>
                    Сохранить
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
