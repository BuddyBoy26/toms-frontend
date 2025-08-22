// src/app/dashboard/post_tender_clarification/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TC { tendering_companies_id: number }

export default function CreatePostPTCPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [tcId, setTcId] = useState('')
  const [no, setNo] = useState('')
  const [refNo, setRefNo] = useState('')
  const [date, setDate] = useState('')
  const [received, setReceived] = useState('')
  const [replyBy, setReplyBy] = useState('')
  const [replySub, setReplySub] = useState('')
  const [tcs, setTcs] = useState<TC[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    fetch(`${API}/tendering_companies`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: TC[]) => setTcs(data))
      .catch(() => setError('Failed to load Tender-Company list'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const tc = tcs.find(tc => String(tc.tendering_companies_id) === tcId)
    if (!tc) {
      setError('Please select a valid Tender-Company')
      setSaving(false)
      return
    }
    const payload = {
      tendering_companies_id: tc.tendering_companies_id,
      ptc_no: parseInt(no, 10),
      ptc_ref_no: refNo,
      ptc_date: date,
      ptc_received_date: received,
      ptc_reply_required_by: replyBy,
      ptc_reply_submission_date: replySub || null,
    }
    const res = await fetch(`${API}/post_tender_clarification`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create')
    } else {
      router.push('/dashboard/post_tender_clarification')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Post-Tender Clarification</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Tender-Company ID</label>
          <input
            list="tcs"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type ID…"
            value={tcId}
            onChange={e => setTcId(e.target.value)}
            required
          />
          <datalist id="tcs">
            {tcs.map(tc => (
              <option key={tc.tendering_companies_id} value={String(tc.tendering_companies_id)} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium">PTC No.</label>
          <input
            type="number"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={no}
            onChange={e => setNo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Reference No.</label>
          <input
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Received Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={received}
              onChange={e => setReceived(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Reply Required By</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={replyBy}
              onChange={e => setReplyBy(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reply Submission Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={replySub}
              onChange={e => setReplySub(e.target.value)}
            />
          </div>
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
