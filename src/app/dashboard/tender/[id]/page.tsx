// src/app/dashboard/tender/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Tender {
  tender_no: string
  tender_description: string
  tender_date: string
  closing_date: string | null
  tender_fees: number | null
  bond_guarantee_amt: number | null
}

export default function TenderDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [item, setItem] = useState<Tender | null>(null)

  const [no, setNo] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState('')
  const [closing, setClosing] = useState('')
  const [fees, setFees] = useState('')
  const [bond, setBond] = useState('')

  // Fetch existing tender
  useEffect(() => {
    fetch(`${API}/tender/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
      .then(res => res.json())
      .then((data: Tender) => {
        setItem(data)
        setNo(data.tender_no)
        setDesc(data.tender_description)
        setDate(data.tender_date)
        setClosing(data.closing_date ?? '')
        setFees(data.tender_fees != null ? String(data.tender_fees) : '')
        setBond(data.bond_guarantee_amt != null ? String(data.bond_guarantee_amt) : '')
      })
      .finally(() => setLoading(false))
  }, [API, id])

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const res = await fetch(`${API}/tender/${id}`, {
      method: 'PUT',
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
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      console.error('Failed to save')
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!confirm('Delete this tender?')) return
    await fetch(`${API}/tender/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
    router.push('/dashboard/tender')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Tender not found.</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Tender #{id}</h1>
      <form onSubmit={handleSave} className="space-y-4">
        {/* Tender No */}
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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Fees and Bond */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={saving || saved}
            className={`px-4 py-2 rounded-md transition ${
              saved ? 'bg-gray-400 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
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
