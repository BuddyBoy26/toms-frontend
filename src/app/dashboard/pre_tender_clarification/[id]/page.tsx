// src/app/dashboard/pre_tender_clarification/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TC { tendering_companies_id: number }
interface PTC {
  pre_ptc_id: number
  tendering_companies_id: number
  pre_ptc_no: number
  pre_ptc_ref_no: string
  pre_ptc_date: string
  pre_ptc_received_date: string
  pre_ptc_reply_required_by: string
  pre_ptc_reply_submission_date?: string
}

export default function PTCDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [item, setItem] = useState<PTC|null>(null)
  const [tcs, setTcs] = useState<TC[]>([])
  const [tcId, setTcId] = useState('')
  const [no, setNo] = useState('')
  const [refNo, setRefNo] = useState('')
  const [date, setDate] = useState('')
  const [received, setReceived] = useState('')
  const [replyBy, setReplyBy] = useState('')
  const [replySubmitted, setReplySubmitted] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tendering_companies`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/pre_tender_clarification/${id}`,  { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ]).then(([tcs, ptc]: [TC[], PTC]) => {
      setTcs(tcs)
      setItem(ptc)
      setTcId(String(ptc.tendering_companies_id))
      setNo(String(ptc.pre_ptc_no))
      setRefNo(ptc.pre_ptc_ref_no)
      setDate(ptc.pre_ptc_date)
      setReceived(ptc.pre_ptc_received_date)
      setReplyBy(ptc.pre_ptc_reply_required_by)
      setReplySubmitted(ptc.pre_ptc_reply_submission_date || '')
    }).catch(() => setError('Failed to load')).finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
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
    const res = await fetch(`${API}/pre_tender_clarification/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
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
    if (!confirm('Delete this record?')) return
    await fetch(`${API}/pre_tender_clarification/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}` }
    })
    router.push('/dashboard/pre_tender_clarification')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Pre-Tender Clarification #{item.pre_ptc_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="tcSelect" className="block text-sm font-medium">
            Tender-Company ID
          </label>
          <input
            id="tcSelect"
            list="tcs"
            className="mt-1 w-full px-3 py-2 border rounded-md"
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
            <label htmlFor="replyBy" className="block text-sm font-medium">
              Reply Required By
            </label>
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
