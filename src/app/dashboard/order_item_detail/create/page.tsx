// src/app/dashboard/order_item_detail/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order   { order_id: number; po_number: string }
interface Item    { item_id: number; item_description: string }

export default function CreateOrderItemPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [orderNo, setOrderNo] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [dewaNo, setDewaNo] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [lots, setLots] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
      fetch(`${API}/item_master`, { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
    ])
      .then(([ords, its]: [Order[], Item[]]) => {
        setOrders(ords)
        setItems(its)
      })
      .catch(() => setError('Failed to load dropdowns'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const ord = orders.find(o => o.po_number === orderNo)
    const itm = items.find(i => i.item_description === itemDesc)
    if (!ord || !itm) {
      setError('Please select valid order and item')
      setSaving(false)
      return
    }

    const payload = {
      order_id: ord.order_id,
      item_id: itm.item_id,
      item_description: itm.item_description,
      item_no_dewa: dewaNo,
      item_quantity: parseInt(quantity, 10),
      item_unit_price: parseFloat(unitPrice),
      number_of_lots: parseInt(lots, 10),
    }

    const res = await fetch(`${API}/order_item_detail`, {
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
      setError(err?.detail || 'Failed to create order item')
      return
    }
    router.push('/dashboard/order_item_detail')
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Order Item</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="orderSelect" className="block text-sm font-medium">Order (PO#)</label>
          <input
            id="orderSelect"
            list="orders"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to filter…"
            value={orderNo}
            onChange={e => setOrderNo(e.target.value)}
            required
          />
          <datalist id="orders">
            {orders.map(o => (
              <option key={o.order_id} value={o.po_number} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="itemSelect" className="block text-sm font-medium">Item Description</label>
          <input
            id="itemSelect"
            list="items"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to filter…"
            value={itemDesc}
            onChange={e => setItemDesc(e.target.value)}
            required
          />
          <datalist id="items">
            {items.map(i => (
              <option key={i.item_id} value={i.item_description} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="dewaNo" className="block text-sm font-medium">DEWA Item No.</label>
          <input
            id="dewaNo"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={dewaNo}
            onChange={e => setDewaNo(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium">Quantity</label>
            <input
              id="quantity"
              type="number"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="unitPrice" className="block text-sm font-medium">Unit Price</label>
            <input
              id="unitPrice"
              type="number"
              step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={unitPrice}
              onChange={e => setUnitPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="lots" className="block text-sm font-medium">Number of Lots</label>
          <input
            id="lots"
            type="number"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={lots}
            onChange={e => setLots(e.target.value)}
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
