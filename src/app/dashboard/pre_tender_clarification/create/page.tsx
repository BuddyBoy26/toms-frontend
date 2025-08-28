// src/app/dashboard/pre_tender_clarification/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TC { tendering_companies_id: number; /* add display fields if desired */ }

export default function CreatePrePTCPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [tcId, setTcId] = useState('')
  const [no, setNo] = useState('')
  const [refNo, setRefNo] = useState('')
  const [date, setDate] = useState('')
  const [received, setReceived] = useState('')
  const [replyBy, setReplyBy] = useState('')
  const [replySubmitted, setReplySubmitted] = useState('')
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
      pre_ptc_no: parseInt(no, 10),
      pre_ptc_ref_no: refNo,
      pre_ptc_date: date,
      pre_ptc_received_date: received,
      pre_ptc_reply_required_by: replyBy,
      pre_ptc_reply_submission_date: replySubmitted || null,
    }
    const res = await fetch(`${API}/pre_tender_clarification`, {
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
      router.push('/dashboard/pre_tender_clarification')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Pre-Tender Clarification</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="tcSelect" className="block text-sm font-medium">
            Tender-Company ID
          </label>
          <input
            id="tcSelect"
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
          <label htmlFor="no" className="block text-sm font-medium">PTC No.</label>
          <input
            id="no"
            type="number"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={no}
            onChange={e => setNo(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="refNo" className="block text-sm font-medium">Reference No.</label>
          <input
            id="refNo"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">Date</label>
            <input
              id="date"
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="received" className="block text-sm font-medium">Received Date</label>
            <input
              id="received"
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
            <label htmlFor="replyBy" className="block text-sm font-medium">Reply Required By</label>
            <input
              id="replyBy"
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={replyBy}
              onChange={e => setReplyBy(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="replySubmitted" className="block text-sm font-medium">
              Reply Submission Date
            </label>
            <input
              id="replySubmitted"
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={replySubmitted}
              onChange={e => setReplySubmitted(e.target.value)}
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
