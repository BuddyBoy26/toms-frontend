// src/app/dashboard/counter_guarantee/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const TYPE_OPTIONS = ['TBG', 'PBG', 'MPG']
const STATUS_OPTIONS = [
  'NOT Issued',
  'Issued / Extended',
  'Extension Required',
  'NOT Released',
  'Released',
]

interface CG {
  cg_id: number
  guarantee_type: string
  guarantee_ref_number: string
  cg_date: string
  issuing_bank: string | null
  expiry_date: string
  release_date_bank: string | null
  remarks: string | null
  pending_status: string
}

export default function CounterGuaranteeDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [item, setItem] = useState<CG | null>(null)
  const [type, setType] = useState(TYPE_OPTIONS[0])
  const [refNumber, setRefNumber] = useState('')
  const [date, setDate] = useState('')
  const [issuingBank, setIssuingBank] = useState('')
  const [expiry, setExpiry] = useState('')
  const [releaseBankDate, setReleaseBankDate] = useState('')
  const [status, setStatus] = useState(STATUS_OPTIONS[0])
  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/counter_guarantee/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: CG) => {
        setItem(data)
        setType(data.guarantee_type)
        setRefNumber(data.guarantee_ref_number)
        setDate(data.cg_date)
        setIssuingBank(data.issuing_bank || '')
        setExpiry(data.expiry_date)
        setReleaseBankDate(data.release_date_bank || '')
        setStatus(data.pending_status)
        setRemarks(data.remarks || '')
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
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
    const res = await fetch(`${API}/counter_guarantee/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
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
    if (!confirm('Delete this counter guarantee?')) return
    await fetch(`${API}/counter_guarantee/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/counter_guarantee')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Counter Guarantee #{item.cg_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
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
