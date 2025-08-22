// src/app/dashboard/tender/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreateTenderPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [no, setNo] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [closing, setClosing] = useState('')
  const [fees, setFees] = useState('')
  const [bond, setBond] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const res = await fetch(`${API}/tender/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify({
        tender_no: no,
        tender_description: desc,
        tender_date: date,
        closing_date: closing || null,
        tender_fees: fees ? parseFloat(fees) : null,
        bond_guarantee_amt: bond ? parseFloat(bond) : null,
      }),
    })

    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create tender')
      return
    }

    // Success!
    setSaved(true)
    // after a brief moment, navigate back
    setTimeout(() => {
      router.push('/dashboard/tender')
    }, 800)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Create Tender</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {/* Tender No. */}
        <div>
          <label htmlFor="tenderNo" className="block text-sm font-medium">
            Tender No.
          </label>
          <input
            id="tenderNo"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={no}
            onChange={e => setNo(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            required
          />
        </div>

        {/* Tender Date */}
        <div>
          <label htmlFor="tenderDate" className="block text-sm font-medium">
            Tender Date
          </label>
          <input
            id="tenderDate"
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        {/* Closing Date */}
        <div>
          <label htmlFor="closingDate" className="block text-sm font-medium">
            Closing Date
          </label>
          <input
            id="closingDate"
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={closing}
            onChange={e => setClosing(e.target.value)}
          />
        </div>

        {/* Tender Fees */}
        <div>
          <label htmlFor="tenderFees" className="block text-sm font-medium">
            Tender Fees
          </label>
          <input
            id="tenderFees"
            type="number"
            step="0.01"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={fees}
            onChange={e => setFees(e.target.value)}
          />
        </div>

        {/* Bond Guarantee Amount */}
        <div>
          <label htmlFor="bondAmt" className="block text-sm font-medium">
            Bond Guarantee Amt
          </label>
          <input
            id="bondAmt"
            type="number"
            step="0.01"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={bond}
            onChange={e => setBond(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving || saved}
          className={`px-4 py-2 rounded-md transition ${
            saved
              ? 'bg-gray-400 text-white cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Creating…' : saved ? 'Saved' : 'Create'}
        </button>
      </form>
    </div>
  )
}
