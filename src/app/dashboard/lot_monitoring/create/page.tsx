// src/app/dashboard/lot_monitoring/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface OrderItem { order_item_detail_id: number; item_description: string }

export default function CreateLotPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [lotId, setLotId] = useState('')
  const [orderItemDesc, setOrderItemDesc] = useState('')
  const [shipmentNo, setShipmentNo] = useState('')
  const [itemLotNo, setItemLotNo] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [contractualDate, setContractualDate] = useState('')
  const [actualDate, setActualDate] = useState('')

  const [items, setItems] = useState<OrderItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    fetch(`${API}/order_item_detail`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: OrderItem[]) => setItems(data))
      .catch(() => setError('Failed to load order items'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const chosen = items.find(i => i.item_description === orderItemDesc)
    if (!chosen) {
      setError('Please select a valid order-item description')
      setSaving(false)
      return
    }

    const payload = {
      lot_id: lotId,
      order_item_detail_id: chosen.order_item_detail_id,
      shipment_no: shipmentNo || null,
      item_lot_no: itemLotNo || null,
      item_unit_price: parseFloat(unitPrice),
      item_total_value: parseFloat(totalValue),
      contractual_delivery_date: contractualDate || null,
      actual_delivery_date: actualDate || null,
    }

    const res = await fetch(`${API}/lot_monitoring`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail||'Failed to create lot')
    } else {
      router.push('/dashboard/lot_monitoring')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Lot Monitoring</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="lotId" className="block text-sm font-medium">Lot ID</label>
          <input
            id="lotId"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={lotId}
            onChange={e=>setLotId(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="itemSelect" className="block text-sm font-medium">Order Item</label>
          <input
            id="itemSelect"
            list="orderItems"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search…"
            value={orderItemDesc}
            onChange={e=>setOrderItemDesc(e.target.value)}
            required
          />
          <datalist id="orderItems">
            {items.map(i=>(
              <option key={i.order_item_detail_id} value={i.item_description} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="shipmentNo" className="block text-sm font-medium">Shipment No.</label>
            <input
              id="shipmentNo"
              type="text"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={shipmentNo}
              onChange={e=>setShipmentNo(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="itemLotNo" className="block text-sm font-medium">Item Lot No.</label>
            <input
              id="itemLotNo"
              type="text"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={itemLotNo}
              onChange={e=>setItemLotNo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium">Unit Price</label>
            <input
              id="unitPrice"
              type="number" step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={unitPrice}
              onChange={e=>setUnitPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="totalValue" className="block text-sm font-medium">Total Value</label>
            <input
              id="totalValue"
              type="number" step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={totalValue}
              onChange={e=>setTotalValue(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contractualDate" className="block text-sm font-medium">Contractual Delivery Date</label>
            <input
              id="contractualDate"
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={contractualDate}
              onChange={e=>setContractualDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="actualDate" className="block text-sm font-medium">Actual Delivery Date</label>
            <input
              id="actualDate"
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={actualDate}
              onChange={e=>setActualDate(e.target.value)}
            />
          </div>
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
