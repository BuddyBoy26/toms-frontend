// src/app/dashboard/liquidated_damages/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lot { lot_id: string }
interface LD {
  ld_id: number
  lot_id: string
  lot_qty: number
  actual_delivery_date: string | null
  quantities_delivered: number[]
  delivery_delays_days: number[]
}

export default function LDDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [item, setItem] = useState<LD|null>(null)

  const [lotId, setLotId] = useState('')
  const [lotQty, setLotQty] = useState('')
  const [actualDate, setActualDate] = useState('')
  const [quantities, setQuantities] = useState('')
  const [delays, setDelays] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/lot_monitoring`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/liquidated_damages/${id}`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ]).then(([ls, ld]: [Lot[], LD]) => {
      setLots(ls)
      setItem(ld)
      setLotId(ld.lot_id)
      setLotQty(String(ld.lot_qty))
      setActualDate(ld.actual_delivery_date || '')
      setQuantities(ld.quantities_delivered.join(', '))
      setDelays(ld.delivery_delays_days.join(', '))
    }).catch(() => setError('Failed to load')).finally(() => setLoading(false))
  }, [API, id])

  const parseArray = (txt: string) =>
    txt.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))

  const handleSave = async (e: React.FormEvent) => {
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

    const res = await fetch(`${API}/liquidated_damages/${id}`, {
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
    await fetch(`${API}/liquidated_damages/${id}`, {
      method:'DELETE',
      headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}
    })
    router.push('/dashboard/liquidated_damages')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit LD #{item.ld_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="lotSelect" className="block text-sm font-medium">Lot ID</label>
          <input
            id="lotSelect"
            list="lots"
            className="mt-1 w-full px-3 py-2 border rounded-md"
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
            value={delays}
            onChange={e => setDelays(e.target.value)}
            required
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
