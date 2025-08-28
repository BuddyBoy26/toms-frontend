'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Log {
  id: number
  date: string
  time: string
  title: string
  description: string
  user_id: number
}

export default function LogListPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    fetch(`${API}/logs`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
      .then(res => res.json())
      .then((data: Log[]) => setLogs(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading logs…</p>
  if (!logs.length) return <p>No logs found.</p>

  const columns: Column<Log>[] = [
    { key: 'date', header: 'Date' },
    { key: 'time', header: 'Time' },
    { key: 'title', header: 'Title' },
    { key: 'user_id', header: 'User' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Logs</h1>
        <button
          onClick={() => router.push('/dashboard/logs/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>

      <CustomTable
        data={logs}
        columns={columns}
        idField="id"
        linkPrefix="/dashboard/logs"
      />
    </div>
  )
}
