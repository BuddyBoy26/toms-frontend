// src/app/dashboard/event/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Event {
  event_id: number
  description: string
  start_dt: string
  end_dt: string
  remarks: string | null
}

export default function EventDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<Event | null>(null)

  const [description, setDescription] = useState('')
  const [startDt, setStartDt] = useState('')
  const [endDt, setEndDt] = useState('')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    fetch(`${API}/event/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Event) => {
        setItem(data)
        setDescription(data.description)
        setStartDt(data.start_dt.slice(0,16))
        setEndDt(data.end_dt.slice(0,16))
        setRemarks(data.remarks || '')
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      description,
      start_dt: startDt,
      end_dt: endDt,
      remarks: remarks || null,
    }
    const res = await fetch(`${API}/event/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to save')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return
    await fetch(`${API}/event/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/event')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Event not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Event #{item.event_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Start Date &amp; Time</label>
          <input
            type="datetime-local"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={startDt}
            onChange={e => setStartDt(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">End Date &amp; Time</label>
          <input
            type="datetime-local"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={endDt}
            onChange={e => setEndDt(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Remarks</label>
          <textarea
            rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
