// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/utils/auth'
import Loader from '@/components/Loader'

// ── Types ──────────────────────────────────────────────

interface Reminder {
  reminder_id: number
  reminder_type: string
  order_id: number | null
  po_number: string
  description: string
  activation_date: string
  is_dismissed: boolean
  source_table: string
  source_id: number
  created_at: string
  updated_at: string
}

interface Todo {
  todo_id: number
  content: string
  is_done: boolean
  user_id: number
  created_at: string
}

// Full-card color schemes per reminder type
const TYPE_STYLES: Record<string, { label: string; bg: string; border: string; text: string; badge: string; dismiss: string; dismissHover: string }> = {
  TBG_TO_BE_ISSUED:       { label: 'TBG Issue',       bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-900',    badge: 'bg-blue-600 text-white',       dismiss: 'text-blue-400',    dismissHover: 'hover:text-blue-700' },
  PBG_TO_BE_ISSUED:       { label: 'PBG Issue',       bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-900',  badge: 'bg-violet-600 text-white',     dismiss: 'text-violet-400',  dismissHover: 'hover:text-violet-700' },
  TBG_TO_BE_RELEASED:     { label: 'TBG Release',     bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-900',     badge: 'bg-sky-600 text-white',        dismiss: 'text-sky-400',     dismissHover: 'hover:text-sky-700' },
  MPG_TO_BE_ISSUED:       { label: 'MPG Issue',       bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white',    dismiss: 'text-emerald-400', dismissHover: 'hover:text-emerald-700' },
  PBG_TO_BE_RELEASED:     { label: 'PBG Release',     bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-900',  badge: 'bg-purple-600 text-white',     dismiss: 'text-purple-400',  dismissHover: 'hover:text-purple-700' },
  GET_ETD:                { label: 'ETD',             bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-900',  badge: 'bg-orange-500 text-white',     dismiss: 'text-orange-400',  dismissHover: 'hover:text-orange-700' },
  GET_CUSTOMS_EXEMPTION:  { label: 'Customs',         bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-900',   badge: 'bg-amber-500 text-white',      dismiss: 'text-amber-400',   dismissHover: 'hover:text-amber-700' },
  PREPARE_ASN:            { label: 'ASN',             bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-900',    badge: 'bg-teal-600 text-white',       dismiss: 'text-teal-400',    dismissHover: 'hover:text-teal-700' },
  CREATE_DELIVERY_NOTE:   { label: 'Delivery Note',   bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-900',  badge: 'bg-indigo-600 text-white',     dismiss: 'text-indigo-400',  dismissHover: 'hover:text-indigo-700' },
  PAYMENT_APPLICATION:    { label: 'Payment',         bg: 'bg-green-50',   border: 'border-green-200',   text: 'text-green-900',   badge: 'bg-green-600 text-white',      dismiss: 'text-green-400',   dismissHover: 'hover:text-green-700' },
  PREPARE_LD_STATEMENT:   { label: 'LD Statement',    bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-900',    badge: 'bg-rose-600 text-white',       dismiss: 'text-rose-400',    dismissHover: 'hover:text-rose-700' },
  MPG_TO_BE_RELEASED:     { label: 'MPG Release',     bg: 'bg-lime-50',    border: 'border-lime-200',    text: 'text-lime-900',    badge: 'bg-lime-600 text-white',       dismiss: 'text-lime-400',    dismissHover: 'hover:text-lime-700' },
  INSPECTION_APPLICATION: { label: 'Inspection',      bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-900',  badge: 'bg-yellow-500 text-white',     dismiss: 'text-yellow-400',  dismissHover: 'hover:text-yellow-700' },
  GET_SHIPPING_DOCUMENTS: { label: 'Shipping Docs',   bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-900',    badge: 'bg-cyan-600 text-white',       dismiss: 'text-cyan-400',    dismissHover: 'hover:text-cyan-700' },
}

const DEFAULT_STYLE = { label: 'Other', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-500 text-white', dismiss: 'text-gray-400', dismissHover: 'hover:text-gray-600' }

// ── Helper ─────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const daysAgo = (dateStr: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return '1 day ago'
  if (diff < 0) return `In ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`
  return `${diff} days ago`
}

// ── SVG Icons ──────────────────────────────────────────

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const DismissIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const EmptyCheckIcon = () => (
  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

// ── Component ──────────────────────────────────────────

export default function DashboardHome() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Reminders
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindersLoading, setRemindersLoading] = useState(true)
  const [dismissingId, setDismissingId] = useState<number | null>(null)

  // Todos
  const [todos, setTodos] = useState<Todo[]>([])
  const [todosLoading, setTodosLoading] = useState(true)
  const [newTodo, setNewTodo] = useState('')
  const [savingTodo, setSavingTodo] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resizable panel
  const [leftWidthPercent, setLeftWidthPercent] = useState(50)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Auth ──

  useEffect(() => {
    getCurrentUser()
      .then(u => {
        setUserName(u.full_name)
        if (!u) router.replace('/login')
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false))
  }, [])

  // ── Fetch reminders ──

  const fetchReminders = useCallback(async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    setRemindersLoading(true)
    try {
      const res = await fetch(`${API}/reminders/active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: Reminder[] = await res.json()
        data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setReminders(data)
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err)
    } finally {
      setRemindersLoading(false)
    }
  }, [API])

  useEffect(() => {
    if (!loading) fetchReminders()
  }, [loading, fetchReminders])

  // ── Dismiss ──

  const handleDismiss = async (reminderId: number) => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    setDismissingId(reminderId)
    try {
      const res = await fetch(`${API}/reminders/${reminderId}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.reminder_id !== reminderId))
      }
    } catch (err) {
      console.error('Failed to dismiss reminder:', err)
    } finally {
      setDismissingId(null)
    }
  }

  // ── Todos ──

  const fetchTodos = useCallback(async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    setTodosLoading(true)
    try {
      const res = await fetch(`${API}/todos/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: Todo[] = await res.json()
        data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setTodos(data)
      }
    } catch (err) {
      console.error('Failed to fetch todos:', err)
    } finally {
      setTodosLoading(false)
    }
  }, [API])

  useEffect(() => {
    if (!loading) fetchTodos()
  }, [loading, fetchTodos])

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleAddTodo = async () => {
    const text = newTodo.trim()
    if (!text || savingTodo) return

    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    setSavingTodo(true)
    try {
      const res = await fetch(`${API}/todos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const created: Todo = await res.json()
        setTodos(prev => [...prev, created])
        setNewTodo('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
      }
    } catch (err) {
      console.error('Failed to create todo:', err)
    } finally {
      setSavingTodo(false)
    }
  }

  const handleToggleTodo = async (todoId: number, currentDone: boolean) => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    setTodos(prev => prev.map(t => t.todo_id === todoId ? { ...t, is_done: !currentDone } : t))

    try {
      const res = await fetch(`${API}/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_done: !currentDone }),
      })
      if (!res.ok) {
        setTodos(prev => prev.map(t => t.todo_id === todoId ? { ...t, is_done: currentDone } : t))
      }
    } catch {
      setTodos(prev => prev.map(t => t.todo_id === todoId ? { ...t, is_done: currentDone } : t))
    }
  }

  const handleDeleteTodo = async (todoId: number) => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    const prev = todos
    setTodos(t => t.filter(x => x.todo_id !== todoId))

    try {
      const res = await fetch(`${API}/todos/${todoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) setTodos(prev)
    } catch {
      setTodos(prev)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
    }
  }

  // ── Drag-to-resize ──

  const handleMouseDown = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = Math.min(Math.max((x / rect.width) * 100, 25), 75)
      setLeftWidthPercent(pct)
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // ── Backup ──

  const [backingUp, setBackingUp] = useState<'json' | 'sql' | null>(null)

  const handleBackup = async (format: 'json' | 'sql') => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !API) return

    setBackingUp(format)
    try {
      const res = await fetch(`${API}/backup/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Backup failed')

      const blob = await res.blob()
      const now = new Date()
const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
const filename = `kkabbas_backup_${ts}.${format}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Backup error:', err)
    } finally {
      setBackingUp(null)
    }
  }

  // ── Render ──

  if (loading) return <Loader />

  const pendingTodos = todos.filter(t => !t.is_done).length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}</h1>
          <p className="text-sm text-gray-500 mt-1">Here is what needs your attention today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBackup('json')}
            disabled={backingUp !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download JSON backup"
          >
            {backingUp === 'json' ? (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            JSON
          </button>
          <button
            onClick={() => handleBackup('sql')}
            disabled={backingUp !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download SQL backup"
          >
            {backingUp === 'sql' ? (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            SQL
          </button>
        </div>
      </div>

      {/* Two-panel area */}
      <div ref={containerRef} className="flex flex-1 min-h-0 rounded-xl overflow-hidden shadow-sm border border-gray-200">

        {/* ── LEFT PANEL: Reminders ── */}
        <div style={{ width: `${leftWidthPercent}%` }} className="flex flex-col min-w-0 bg-white">

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-rose-400 to-orange-300">
            <div className="flex items-center gap-2.5">
              <div className="text-white"><BellIcon /></div>
              <h2 className="font-semibold text-white text-[15px]">Reminders</h2>
              {reminders.length > 0 && (
                <span className="text-[11px] font-bold bg-white text-rose-500 rounded-full px-2 py-0.5 min-w-[22px] text-center">
                  {reminders.length}
                </span>
              )}
            </div>
            <button
              onClick={fetchReminders}
              className="text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition"
              title="Refresh reminders"
            >
              <RefreshIcon />
            </button>
          </div>

          {/* Reminder list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {remindersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-[3px] border-gray-200 border-t-rose-400 rounded-full animate-spin"></div>
              </div>
            ) : reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <EmptyCheckIcon />
                <p className="text-sm mt-3 font-medium text-gray-500">All clear</p>
                <p className="text-xs text-gray-400 mt-0.5">No active reminders right now</p>
              </div>
            ) : (
              reminders.map(r => {
                const s = TYPE_STYLES[r.reminder_type] || DEFAULT_STYLE
                return (
                  <div
                    key={r.reminder_id}
                    className={`group flex items-start gap-3 p-3 rounded-lg border ${s.bg} ${s.border} transition hover:shadow-md`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${s.badge}`}>
                          {s.label}
                        </span>
                        <span className={`text-[11px] font-medium ${s.text} opacity-60`}>{daysAgo(r.activation_date)}</span>
                      </div>
                      <p className={`text-sm leading-snug font-medium ${s.text}`}>{r.description}</p>
                      <p className={`text-[11px] mt-1 ${s.text} opacity-50`}>
                        Since {formatDate(r.activation_date)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismiss(r.reminder_id)}
                      disabled={dismissingId === r.reminder_id}
                      className={`opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5 ${s.dismiss} ${s.dismissHover} disabled:opacity-30`}
                      title="Dismiss"
                    >
                      {dismissingId === r.reminder_id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <DismissIcon />
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── DIVIDER (draggable) ── */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 bg-gray-100 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0"
        />

        {/* ── RIGHT PANEL: Things to Do ── */}
        <div style={{ width: `${100 - leftWidthPercent}%` }} className="flex flex-col min-w-0 bg-white">

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-500 to-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="text-white"><ClipboardIcon /></div>
              <h2 className="font-semibold text-white text-[15px]">Things to Do</h2>
              {pendingTodos > 0 && (
                <span className="text-[11px] font-bold bg-white text-slate-600 rounded-full px-2 py-0.5 min-w-[22px] text-center">
                  {pendingTodos}
                </span>
              )}
            </div>
          </div>

          {/* Todo list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {todosLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-[3px] border-gray-200 border-t-slate-400 rounded-full animate-spin"></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <ClipboardIcon />
                <p className="text-sm mt-3 font-medium text-gray-500">No tasks yet</p>
                <p className="text-xs text-gray-400 mt-0.5">Add one below to get started</p>
              </div>
            ) : (
              todos.map(t => (
                <div
                  key={t.todo_id}
                  className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg transition ${
                    t.is_done ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Content */}
                  <p
                    className={`flex-1 text-sm leading-snug pt-[1px] break-words whitespace-pre-wrap ${
                      t.is_done ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {t.content}
                  </p>

                  {/* Green checkbox — right side */}
                  <button
                    onClick={() => handleToggleTodo(t.todo_id, t.is_done)}
                    className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      t.is_done
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                    title={t.is_done ? 'Mark undone' : 'Mark done'}
                  >
                    {t.is_done && <CheckIcon />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteTodo(t.todo_id)}
                    className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-3 bg-gray-50/50">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={newTodo}
                onChange={(e) => { setNewTodo(e.target.value); autoResize() }}
                onKeyDown={handleKeyDown}
                placeholder="Add a task... (Enter to save)"
                rows={1}
                className="flex-1 resize-none overflow-hidden px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleAddTodo}
                disabled={!newTodo.trim() || savingTodo}
                className="shrink-0 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Add task"
              >
                {savingTodo ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PlusIcon />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}