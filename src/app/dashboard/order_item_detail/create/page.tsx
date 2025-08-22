'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Order { order_id: number; po_number: string }
interface Item  { item_id: number; item_description: string }

export default function CreateOrderItemPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<Item[]>([])

  const [orderId, setOrderId] = useState<number | ''>('')
  const [itemId, setItemId] = useState<number | ''>('')

  const [itemDescription, setItemDescription] = useState('')
  const [itemNoDewa, setItemNoDewa] = useState('')
  const [itemQuantity, setItemQuantity] = useState('')
  const [itemUnitPrice, setItemUnitPrice] = useState('')
  const [numberOfLots, setNumberOfLots] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    Promise.all([
      fetch(`${API}/order_detail`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()),
      fetch(`${API}/item_master`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json())
    ])
    .then(([ords, itms]: [Order[], Item[]]) => {
      setOrders(ords || [])
      setItems(itms || [])
    })
    .catch(() => setError('Failed to load dropdowns'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (!orderId || !itemId) {
      toast.error('Select valid order and item')
      setSaving(false)
      return
    }

    const payload = {
      order_id: Number(orderId),
      item_id: Number(itemId),
      item_description: itemDescription.trim() || null,
      item_no_dewa: itemNoDewa.trim(),
      item_quantity: Number(itemQuantity),
      item_unit_price: parseFloat(itemUnitPrice),
      number_of_lots: Number(numberOfLots),
    }

    const res = await fetch(`${API}/order_item_detail`, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}`
      },
      body:JSON.stringify(payload)
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const msg = err?.detail || 'Failed to create order item'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Order item created successfully')
      router.push('/dashboard/order_item_detail')
    }
  }

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section2 = 'grid grid-cols-2 gap-3'

  return (
    <div className="max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create Order Item</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className={section2}>
          <div>
            <label className={labelCls}>Order</label>
            <select className={fieldCls} value={orderId} onChange={e=>setOrderId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Select order</option>
              {orders.map(o => (
                <option key={o.order_id} value={o.order_id}>{o.po_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Item</label>
            <select className={fieldCls} value={itemId} onChange={e=>setItemId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Select item</option>
              {items.map(i => (
                <option key={i.item_id} value={i.item_id}>{i.item_description}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Item Description</label>
          <input type="text" className={fieldCls} value={itemDescription} onChange={e=>setItemDescription(e.target.value)} />
        </div>

        <div className={section2}>
          <div>
            <label className={labelCls}>Item No (DEWA)</label>
            <input type="text" className={fieldCls} value={itemNoDewa} onChange={e=>setItemNoDewa(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Quantity</label>
            <input type="number" className={fieldCls} value={itemQuantity} onChange={e=>setItemQuantity(e.target.value)} required />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label className={labelCls}>Unit Price</label>
            <input type="number" step="0.01" className={fieldCls} value={itemUnitPrice} onChange={e=>setItemUnitPrice(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Number of Lots</label>
            <input type="number" className={fieldCls} value={numberOfLots} onChange={e=>setNumberOfLots(e.target.value)} required />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full py-2 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
