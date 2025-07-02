// src/app/dashboard/counter_guarantee/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const GuaranteeTypes = ['TBG', 'PBG', 'MPG']
const PendingStatuses = [
  'NOT Issued',
  'Issued / Extended',
  'Extension Required',
  'NOT Released',
  'Released',
]

export default function CounterGuaranteeDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [item, setItem] = useState<any>(null)
  const [type, setType] = useState('')
  const [ref, setRef] = useState('')
  const [date, setDate] = useState('')
  const [bank, setBank] = useState('')
  const [expiry, setExpiry] = useState('')
  const [release, setRelease] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch(`${API}/counter_guarantees/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then(data => {
        setItem(data)
        setType(data.guarantee_type)
        setRef(data.guarantee_ref_number)
        setDate(data.cg_date)
        setBank(data.issuing_bank || '')
        setExpiry(data.expiry_date)
        setRelease(data.release_date_bank || '')
        setRemarks(data.remarks || '')
        setStatus(data.pending_status)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`${API}/counter_guarantees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify({
        guarantee_type: type,
        guarantee_ref_number: ref,
        cg_date: date,
        issuing_bank: bank || null,
        expiry_date: expiry,
        release_date_bank: release || null,
        remarks: remarks || null,
        pending_status: status,
      }),
    })
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this record?')) return
    await fetch(`${API}/counter_guarantees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/counter_guarantee')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p>Not found.</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">CounterGuarantee #{id}</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            required
          >
            {GuaranteeTypes.map(gt => (
              <option key={gt} value={gt}>{gt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Reference #</label>
          <input
            type="text"
            value={ref}
            onChange={e => setRef(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Expiry</label>
            <input
              type="date"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Issuing Bank</label>
          <input
            type="text"
            value={bank}
            onChange={e => setBank(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Release Date</label>
          <input
            type="date"
            value={release}
            onChange={e => setRelease(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pending Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            required
          >
            {PendingStatuses.map(ps => (
              <option key={ps} value={ps}>{ps}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Remarks</label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
