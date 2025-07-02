// src/app/dashboard/counter_guarantee/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const GuaranteeTypes = ['TBG', 'PBG', 'MPG']
const PendingStatuses = [
  'NOT Issued',
  'Issued / Extended',
  'Extension Required',
  'NOT Released',
  'Released',
]

export default function CreateCounterGuaranteePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [type, setType] = useState(GuaranteeTypes[0])
  const [ref, setRef] = useState('')
  const [date, setDate] = useState('')
  const [bank, setBank] = useState('')
  const [expiry, setExpiry] = useState('')
  const [release, setRelease] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState(PendingStatuses[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await fetch(`${API}/counter_guarantees`, {
      method: 'POST',
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
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create')
    } else {
      router.push('/dashboard/counter_guarantee')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Create Counter Guarantee</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}

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

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {saving ? 'Saving…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
