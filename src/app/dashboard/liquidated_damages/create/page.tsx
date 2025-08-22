// src/app/dashboard/liquidated_damages/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lot { lot_id: string }

export default function CreateLDPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [lotId, setLotId] = useState('')
  const [lotQty, setLotQty] = useState('')
  const [actualDate, setActualDate] = useState('')
  const [quantities, setQuantities] = useState('')
  const [delays, setDelays] = useState('')
  const [lots, setLots] = useState<Lot[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    fetch(`${API}/lot_monitoring`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Lot[]) => setLots(data))
      .catch(() => setError('Failed to load lots'))
  }, [API])

  const parseArray = (txt: string) =>
    txt.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (!lots.find(l => l.lot_id === lotId)) {
      setError('Select a valid Lot ID')
      setSaving(false)
      return
    }

    const payload = {
      lot_id: lotId,
      lot_qty: parseInt(lotQty, 10),
      actual_delivery_date: actualDate || null,
      quantities_delivered: parseArray(quantities),
      delivery_delays_days: parseArray(delays),
    }

    const res = await fetch(`${API}/liquidated_damages`, {
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
      router.push('/dashboard/liquidated_damages')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Liquidated Damages</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="lotSelect" className="block text-sm font-medium">Lot ID</label>
          <input
            id="lotSelect"
            list="lots"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search…"
            value={lotId}
            onChange={e => setLotId(e.target.value)}
            required
          />
          <datalist id="lots">
            {lots.map(l => <option key={l.lot_id} value={l.lot_id} />)}
          </datalist>
        </div>

        <div>
          <label htmlFor="lotQty" className="block text-sm font-medium">Lot Quantity</label>
          <input
            id="lotQty"
            type="number"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={lotQty}
            onChange={e => setLotQty(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="actualDate" className="block text-sm font-medium">Actual Delivery Date</label>
          <input
            id="actualDate"
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={actualDate}
            onChange={e => setActualDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="quantities" className="block text-sm font-medium">
            Quantities Delivered (comma-separated)
          </label>
          <input
            id="quantities"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="e.g. 10, 20, 15"
            value={quantities}
            onChange={e => setQuantities(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="delays" className="block text-sm font-medium">
            Delivery Delays (days, comma-separated)
          </label>
          <input
            id="delays"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="e.g. 2, 0, 5"
            value={delays}
            onChange={e => setDelays(e.target.value)}
            required
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
