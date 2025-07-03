// src/app/dashboard/event/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Event {
  event_id: number
  description: string
  start_dt: string
  end_dt: string
}

export default function EventListPage() {
  const router = useRouter()
  const [items, setItems] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  useEffect(() => {
    fetch(`${API}/event`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Event[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<Event>[] = [
    { key: 'event_id', header: 'ID' },
    { key: 'description', header: 'Description' },
    { key: 'start_dt', header: 'Start' },
    { key: 'end_dt', header: 'End' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Events</h1>
        <button
          onClick={() => router.push('/dashboard/event/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={items}
          columns={columns}
          idField="event_id"
          linkPrefix="/dashboard/event"
        />
      ) : (
        <p className="text-gray-600">No events found.</p>
      )}
    </div>
  )
}
