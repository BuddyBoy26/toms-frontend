// src/app/dashboard/post_tender_clarification/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TC { tendering_companies_id: number }
interface PTC {
  ptc_id: number
  tendering_companies_id: number
  ptc_no: number
  ptc_ref_no: string
  ptc_date: string
  ptc_received_date: string
  ptc_reply_required_by: string
  ptc_reply_submission_date?: string
}

export default function PostPTCDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [item, setItem] = useState<PTC|null>(null)
  const [tcs, setTcs] = useState<TC[]>([])
  const [tcId, setTcId] = useState('')
  const [no, setNo] = useState('')
  const [refNo, setRefNo] = useState('')
  const [date, setDate] = useState('')
  const [received, setReceived] = useState('')
  const [replyBy, setReplyBy] = useState('')
  const [replySub, setReplySub] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tendering_companies`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/post_tender_clarification/${id}`,  { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ]).then(([tcs, ptc]: [TC[], PTC]) => {
      setTcs(tcs)
      setItem(ptc)
      setTcId(String(ptc.tendering_companies_id))
      setNo(String(ptc.ptc_no))
      setRefNo(ptc.ptc_ref_no)
      setDate(ptc.ptc_date)
      setReceived(ptc.ptc_received_date)
      setReplyBy(ptc.ptc_reply_required_by)
      setReplySub(ptc.ptc_reply_submission_date || '')
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
      ptc_no: parseInt(no, 10),
      ptc_ref_no: refNo,
      ptc_date: date,
      ptc_received_date: received,
      ptc_reply_required_by: replyBy,
      ptc_reply_submission_date: replySub || null,
    }
    const res = await fetch(`${API}/post_tender_clarification/${id}`, {
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
    await fetch(`${API}/post_tender_clarification/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}` }
    })
    router.push('/dashboard/post_tender_clarification')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Post-Tender Clarification #{item.ptc_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Tender-Company ID</label>
          <input
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
