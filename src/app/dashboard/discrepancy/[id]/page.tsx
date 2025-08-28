// src/app/dashboard/discrepancy/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lot { lot_id: string }
interface Discrepancy {
  discrepancy_id: number
  lot_id: string
  dewa_letter_ref: string
  letter_date: string
  pending_quantity: number | null
  unit_sl_nos: string | null
  discrepancies: string
  remarks: string | null
  pending_status: boolean
  resolution_date: string | null
  delivery_note_no: string | null
  actual_delivery_date: string | null
}

export default function DiscrepancyDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [item, setItem] = useState<Discrepancy | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [lotId, setLotId] = useState('')
  const [dewaRef, setDewaRef] = useState('')
  const [letterDate, setLetterDate] = useState('')
  const [pendingQty, setPendingQty] = useState('')
  const [unitSlNos, setUnitSlNos] = useState('')
  const [discrepanciesText, setDiscrepanciesText] = useState('')
  const [remarks, setRemarks] = useState('')
  const [pendingStatus, setPendingStatus] = useState(true)
  const [resolutionDate, setResolutionDate] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [actualDelivery, setActualDelivery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/lot_monitoring`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/discrepancy/${id}`,       { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ])
      .then(([ls, d]: [Lot[], Discrepancy]) => {
        setLots(ls)
        setItem(d)
        setLotId(d.lot_id)
        setDewaRef(d.dewa_letter_ref)
        setLetterDate(d.letter_date)
        setPendingQty(d.pending_quantity?.toString() || '')
        setUnitSlNos(d.unit_sl_nos || '')
        setDiscrepanciesText(d.discrepancies)
        setRemarks(d.remarks || '')
        setPendingStatus(d.pending_status)
        setResolutionDate(d.resolution_date || '')
        setDeliveryNote(d.delivery_note_no || '')
        setActualDelivery(d.actual_delivery_date || '')
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [API, id])

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
      dewa_letter_ref: dewaRef,
      letter_date: letterDate,
      pending_quantity: pendingQty ? parseInt(pendingQty, 10) : null,
      unit_sl_nos: unitSlNos || null,
      discrepancies: discrepanciesText,
      remarks: remarks || null,
      pending_status: pendingStatus,
      resolution_date: resolutionDate || null,
      delivery_note_no: deliveryNote || null,
      actual_delivery_date: actualDelivery || null,
    }
    const res = await fetch(`${API}/discrepancy/${id}`, {
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
    if (!confirm('Delete this discrepancy?')) return
    await fetch(`${API}/discrepancy/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/discrepancy')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Discrepancy #{item.discrepancy_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Lot ID</label>
          <input
            list="lots"
            className="mt-1 w-full px-3 py-2 border rounded-md"
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
          <label className="block text-sm font-medium">Unit SL Nos.</label>
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
            value={discrepanciesText}
            onChange={e => setDiscrepanciesText(e.target.value)}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Resolution Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={resolutionDate}
              onChange={e => setResolutionDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Delivery Note No.</label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Actual Delivery Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={actualDelivery}
            onChange={e => setActualDelivery(e.target.value)}
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
