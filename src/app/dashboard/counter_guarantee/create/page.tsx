// src/app/dashboard/counter_guarantee/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TYPE_OPTIONS = ['TBG', 'PBG', 'MPG']
const STATUS_OPTIONS = [
  'NOT Issued',
  'Issued / Extended',
  'Extension Required',
  'NOT Released',
  'Released',
]

export default function CreateCounterGuaranteePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [type, setType] = useState(TYPE_OPTIONS[0])
  const [refNumber, setRefNumber] = useState('')
  const [date, setDate] = useState('')
  const [issuingBank, setIssuingBank] = useState('')
  const [expiry, setExpiry] = useState('')
  const [releaseBankDate, setReleaseBankDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState(STATUS_OPTIONS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      guarantee_type: type,
      guarantee_ref_number: refNumber,
      cg_date: date,
      issuing_bank: issuingBank || null,
      expiry_date: expiry,
      release_date_bank: releaseBankDate || null,
      remarks: remarks || null,
      pending_status: status,
    }
    const res = await fetch(`${API}/counter_guarantee`, {
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
      setError(err?.detail || 'Failed to create')
    } else {
      router.push('/dashboard/counter_guarantee')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Counter Guarantee</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Guarantee Type</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Reference Number</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={refNumber}
            onChange={e => setRefNumber(e.target.value)}
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
            <label className="block text-sm font-medium">Expiry Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Issuing Bank</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={issuingBank}
            onChange={e => setIssuingBank(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Release Date (Bank)</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={releaseBankDate}
            onChange={e => setReleaseBankDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pending Status</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
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
