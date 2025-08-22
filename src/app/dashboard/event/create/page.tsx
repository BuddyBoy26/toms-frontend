'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CreateEventPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [description, setDescription] = useState('')
  const [startDt, setStartDt] = useState('') // HTML datetime-local value
  const [endDt, setEndDt] = useState('')     // HTML datetime-local value
  const [remarks, setRemarks] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeDT = (s: string) => (s ? (s.length === 16 ? `${s}:00` : s) : null)
  const toEpoch = (s: string) => (s ? new Date(s).getTime() : NaN)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!startDt || !endDt) {
      toast.error('Start and End date/time are required')
      return
    }
    if (toEpoch(startDt) > toEpoch(endDt)) {
      toast.error('End date/time must be after Start date/time')
      return
    }

    setSaving(true)
    const payload = {
      description: description.trim(),
      start_dt: normalizeDT(startDt),
      end_dt: normalizeDT(endDt),
      remarks: remarks.trim() || null,
    }

    const res = await fetch(`${API}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token') || ''}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const msg = err?.detail || 'Failed to create event'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Event created')
      router.push('/dashboard/event')
    }
  }

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section2 = 'grid grid-cols-2 gap-3'

  return (
    <div className="max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create Event</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div>
          <label className={labelCls}>Description</label>
          <input
            type="text"
            className={fieldCls}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div className={section2}>
          <div>
            <label className={labelCls}>Start Date & Time</label>
            <input
              type="datetime-local"
              className={fieldCls}
              value={startDt}
              onChange={e => setStartDt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls}>End Date & Time</label>
            <input
              type="datetime-local"
              className={fieldCls}
              value={endDt}
              onChange={e => setEndDt(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Remarks</label>
          <textarea
            className="mt-1 w-full px-2 py-2 border rounded-md text-sm"
            rows={4}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
