import { createClient } from '@/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Создаем таблицу tasks
    try {
      await supabase.from('tasks').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Тестовая задача',
        description: 'Эта задача будет удалена автоматически',
        priority: 'medium',
        status: 'pending',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Ошибка при создании таблицы tasks:', error)
    }
    
    // Создаем таблицу habits
    try {
      await supabase.from('habits').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        title: 'Тестовая привычка',
        description: 'Эта привычка будет удалена автоматически',
        frequency: 'daily',
        duration: 7,
        start_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Ошибка при создании таблицы habits:', error)
    }
    
    // Создаем таблицу habit_logs
    try {
      await supabase.from('habit_logs').insert({
        id: crypto.randomUUID(),
        habit_id: crypto.randomUUID(),
        user_id: userId,
        date: new Date().toISOString(),
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Ошибка при создании таблицы habit_logs:', error)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка при создании таблиц:', error)
    return NextResponse.json({ error: 'Failed to create tables' }, { status: 500 })
  }
}
