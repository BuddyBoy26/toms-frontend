'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface EventRec {
  event_id: number
  description: string
  start_dt: string
  end_dt: string
  remarks: string | null
}

export default function EditEventPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventRec, setEventRec] = useState<EventRec | null>(null)

  const [description, setDescription] = useState('')
  const [startDt, setStartDt] = useState('') // datetime-local string
  const [endDt, setEndDt] = useState('')     // datetime-local string
  const [remarks, setRemarks] = useState('')

  const toLocalInputValue = (isoLike: string | null) => {
    if (!isoLike) return ''
    // Expect server returns ISO or 'YYYY-MM-DDTHH:MM[:SS]'
    const d = new Date(isoLike)
    if (isNaN(d.getTime())) {
      // try to keep as provided if it's already 'YYYY-MM-DDTHH:MM'
      return isoLike.slice(0, 16)
    }
    // Convert to local 'YYYY-MM-DDTHH:MM'
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    fetch(`${API}/event/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((ev: EventRec) => {
        setEventRec(ev)
        setDescription(ev.description)
        setStartDt(toLocalInputValue(ev.start_dt))
        setEndDt(toLocalInputValue(ev.end_dt))
        setRemarks(ev.remarks ?? '')
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [API, id])

  const normalizeDT = (s: string) => (s ? (s.length === 16 ? `${s}:00` : s) : null)
  const toEpoch = (s: string) => (s ? new Date(s).getTime() : NaN)

  const handleSave = async (e: React.FormEvent) => {
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

    const res = await fetch(`${API}/event/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token') || ''}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const msg = err?.detail || 'Failed to save'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Event saved')
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return
    await fetch(`${API}/event/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token') || ''}` },
    })
    toast.success('Event deleted')
    router.push('/dashboard/event')
  }

  if (loading) return <p>Loading…</p>
  if (!eventRec) return <p className="text-red-600">Event not found.</p>

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section2 = 'grid grid-cols-2 gap-3'

  return (
    <div className="max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Event #{eventRec.event_id}</h1>
      <form onSubmit={handleSave} className="space-y-5">
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2 h-10 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
