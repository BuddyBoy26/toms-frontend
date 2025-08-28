// src/app/dashboard/lot_monitoring/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface OrderItem { order_item_detail_id: number; item_description: string }
interface Lot {
  lot_id: string
  order_item_detail_id: number
  shipment_no: string | null
  item_lot_no: string | null
  item_unit_price: number
  item_total_value: number
  contractual_delivery_date: string | null
  actual_delivery_date: string | null
}

export default function LotDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [lot, setLot] = useState<Lot|null>(null)

  const [lotId, setLotId] = useState('')
  const [orderItemDesc, setOrderItemDesc] = useState('')
  const [shipmentNo, setShipmentNo] = useState('')
  const [itemLotNo, setItemLotNo] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [contractualDate, setContractualDate] = useState('')
  const [actualDate, setActualDate] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/order_item_detail`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/lot_monitoring/${id}`,      { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ])
      .then(([ords, lt]: [OrderItem[], Lot]) => {
        setItems(ords)
        setLot(lt)
        setLotId(lt.lot_id)
        const itm = ords.find(o=>o.order_item_detail_id===lt.order_item_detail_id)
        setOrderItemDesc(itm?.item_description||'')
        setShipmentNo(lt.shipment_no||'')
        setItemLotNo(lt.item_lot_no||'')
        setUnitPrice(String(lt.item_unit_price))
        setTotalValue(String(lt.item_total_value))
        setContractualDate(lt.contractual_delivery_date||'')
        setActualDate(lt.actual_delivery_date||'')
      })
      .catch(()=>setError('Failed to load data'))
      .finally(()=>setLoading(false))
  },[API,id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const chosen = items.find(i=>i.item_description===orderItemDesc)
    if(!chosen){
      setError('Select a valid order-item description')
      setSaving(false)
      return
    }

    const payload = {
      lot_id: lotId,
      order_item_detail_id: chosen.order_item_detail_id,
      shipment_no: shipmentNo||null,
      item_lot_no: itemLotNo||null,
      item_unit_price: parseFloat(unitPrice),
      item_total_value: parseFloat(totalValue),
      contractual_delivery_date: contractualDate||null,
      actual_delivery_date: actualDate||null,
    }

    const res = await fetch(`${API}/lot_monitoring/${id}`, {
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body: JSON.stringify(payload)
    })
    setSaving(false)
    if(!res.ok){
      const err = await res.json().catch(()=>null)
      setError(err?.detail||'Failed to save')
    }
  }

  const handleDelete = async () => {
    if(!confirm('Delete this lot?')) return
    await fetch(`${API}/lot_monitoring/${id}`,{
      method:'DELETE',
      headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}
    })
    router.push('/dashboard/lot_monitoring')
  }

  if(loading) return <p>Loading…</p>
  if(!lot) return <p className="text-red-600">Lot not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Lot Monitoring #{lot.lot_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
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
            value={orderItemDesc}
            onChange={e=>setOrderItemDesc(e.target.value)}
            required
          />
          <datalist id="orderItems">
            {items.map(i=>(
              <option key={i.order_item_detail_id} value={i.item_description}/>
            ))}
          </datalist>
        </div>

        {/* Repeat the same grid fields as in create */}
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
