// src/app/dashboard/discrepancy/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lot { lot_id: string }

export default function CreateDiscrepancyPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [lotId, setLotId] = useState('')
  const [dewaRef, setDewaRef] = useState('')
  const [letterDate, setLetterDate] = useState('')
  const [pendingQty, setPendingQty] = useState('')
  const [unitSlNos, setUnitSlNos] = useState('')
  const [discrepancies, setDiscrepancies] = useState('')
  const [remarks, setRemarks] = useState('')
  const [pendingStatus, setPendingStatus] = useState(true)

  const [lots, setLots] = useState<Lot[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/lot_monitoring`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Lot[]) => setLots(data))
      .catch(() => setError('Failed to load lots'))
  }, [API])

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
      dewa_letter_ref: dewaRef,
      letter_date: letterDate,
      pending_quantity: pendingQty ? parseInt(pendingQty, 10) : null,
      unit_sl_nos: unitSlNos || null,
      discrepancies,
      remarks: remarks || null,
      pending_status: pendingStatus,
      resolution_date: null,
      delivery_note_no: null,
      actual_delivery_date: null,
    }
    const res = await fetch(`${API}/discrepancy`, {
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
      router.push('/dashboard/discrepancy')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Discrepancy</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Lot ID</label>
          <input
            list="lots"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search…"
            value={lotId}
            onChange={e => setLotId(e.target.value)}
            required
          />
          <datalist id="lots">
            {lots.map(l => (
              <option key={l.lot_id} value={l.lot_id} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium">DEWA Letter Ref</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={dewaRef}
            onChange={e => setDewaRef(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Letter Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={letterDate}
            onChange={e => setLetterDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pending Quantity</label>
          <input
            type="number"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={pendingQty}
            onChange={e => setPendingQty(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Unit SL Nos. (comma-separated)</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={unitSlNos}
            onChange={e => setUnitSlNos(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Discrepancies</label>
          <textarea
            rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={discrepancies}
            onChange={e => setDiscrepancies(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Remarks</label>
          <textarea
            rows={2}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="pendingStatus"
            type="checkbox"
            checked={pendingStatus}
            onChange={e => setPendingStatus(e.target.checked)}
          />
          <label htmlFor="pendingStatus" className="text-sm">Pending / Open</label>
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
