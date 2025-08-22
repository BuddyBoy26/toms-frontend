// src/app/dashboard/order_event/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface OrderEvent {
  order_event_id: number
  order_id: number
  event_date: string
  event: string
  remarks: string | null
}

export default function OrderEventListPage() {
  const router = useRouter()
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  useEffect(() => {
    fetch(`${API}/order_event`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: OrderEvent[]) => setEvents(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<OrderEvent>[] = [
    { key: 'order_event_id', header: 'ID' },
    { key: 'order_id', header: 'Order ID' },
    { key: 'event_date', header: 'Date' },
    { key: 'event', header: 'Event' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Events</h1>
        <button
          onClick={() => router.push('/dashboard/order_event/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading events…</p>
      ) : events.length > 0 ? (
        <CustomTable
          data={events}
          columns={columns}
          idField="order_event_id"
          linkPrefix="/dashboard/order_event"
        />
      ) : (
        <p className="text-gray-600">No events found.</p>
      )}
    </div>
  )
}
