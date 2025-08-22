// src/app/dashboard/order_event/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order { order_id: number; po_number: string }

export default function CreateOrderEventPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [orderNo, setOrderNo] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventText, setEventText] = useState('')
  const [remarks, setRemarks] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    fetch(`${API}/order_detail`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Order[]) => setOrders(data))
      .catch(() => setError('Failed to load orders'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const ord = orders.find(o => o.po_number === orderNo)
    if (!ord) {
      setError('Please select a valid order')
      setSaving(false)
      return
    }
    const payload = {
      order_id: ord.order_id,
      event_date: eventDate,
      event: eventText,
      remarks: remarks || null,
    }
    const res = await fetch(`${API}/order_event`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create event')
    } else {
      router.push('/dashboard/order_event')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Order Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="orderSelect" className="block text-sm font-medium">
            Order (PO#)
          </label>
          <input
            id="orderSelect"
            list="orders"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to filter…"
            value={orderNo}
            onChange={e => setOrderNo(e.target.value)}
            required
          />
          <datalist id="orders">
            {orders.map(o => (
              <option key={o.order_id} value={o.po_number} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium">
            Event Date
          </label>
          <input
            id="eventDate"
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="eventText" className="block text-sm font-medium">
            Event
          </label>
          <input
            id="eventText"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={eventText}
            onChange={e => setEventText(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="remarks" className="block text-sm font-medium">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
