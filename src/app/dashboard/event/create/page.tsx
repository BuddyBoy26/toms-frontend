// src/app/dashboard/event/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateEventPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [description, setDescription] = useState('')
  const [startDt, setStartDt] = useState('')
  const [endDt, setEndDt] = useState('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      description,
      start_dt: startDt,
      end_dt: endDt,
      remarks: remarks || null,
    }
    const res = await fetch(`${API}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create event')
    } else {
      router.push('/dashboard/event')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
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
