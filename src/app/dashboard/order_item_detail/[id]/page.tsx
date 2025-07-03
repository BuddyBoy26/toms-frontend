// src/app/dashboard/order_item_detail/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order   { order_id: number; po_number: string }
interface Item    { item_id: number; item_description: string }
interface OrderItem {
  order_item_detail_id: number
  order_id: number
  item_id: number
  item_description: string
  item_no_dewa: string
  item_quantity: number
  item_unit_price: number
  number_of_lots: number
}

export default function OrderItemDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null)

  const [orderNo, setOrderNo] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [dewaNo, setDewaNo] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [lots, setLots] = useState('')

  // fetch all dropdowns and the record
  useEffect(() => {
    Promise.all([
      fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
      fetch(`${API}/item_master`,   { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
      fetch(`${API}/order_item_detail/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
    ])
      .then(([ords, its, oi]: [Order[], Item[], OrderItem]) => {
        setOrders(ords)
        setItems(its)
        setOrderItem(oi)
        setOrderNo(ords.find(o => o.order_id === oi.order_id)?.po_number || '')
        setItemDesc(its.find(i => i.item_id === oi.item_id)?.item_description || '')
        setDewaNo(oi.item_no_dewa)
        setQuantity(String(oi.item_quantity))
        setUnitPrice(String(oi.item_unit_price))
        setLots(String(oi.number_of_lots))
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
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

    const res = await fetch(`${API}/order_item_detail/${id}`, {
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
      setError(err?.detail || 'Failed to save changes')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this item?')) return
    await fetch(`${API}/order_item_detail/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/order_item_detail')
  }

  if (loading) return <p>Loading…</p>
  if (!orderItem) return <p className="text-red-600">Order item not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Order Item #{orderItem.order_item_detail_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
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
