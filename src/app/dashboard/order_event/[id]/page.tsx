// src/app/dashboard/order_event/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order { order_id:number; po_number:string }
interface OrderEvent {
  order_event_id: number
  order_id: number
  event_date: string
  event: string
  remarks: string | null
}

export default function OrderEventDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderEvent, setOrderEvent] = useState<OrderEvent|null>(null)

  const [orderNo, setOrderNo] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventText, setEventText] = useState('')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/order_detail`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/order_event/${id}`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ]).then(([ords, ev]: [Order[],OrderEvent])=>{
      setOrders(ords)
      setOrderEvent(ev)
      setOrderNo(ords.find(o=>o.order_id===ev.order_id)?.po_number||'')
      setEventDate(ev.event_date)
      setEventText(ev.event)
      setRemarks(ev.remarks||'')
    }).catch(()=>setError('Failed to load data')).finally(()=>setLoading(false))
  },[API,id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const ord = orders.find(o=>o.po_number===orderNo)
    if(!ord){
      setError('Please select a valid order')
      setSaving(false)
      return
    }
    const payload = {
      order_id: ord.order_id,
      event_date: eventDate,
      event: eventText,
      remarks: remarks||null,
    }
    const res = await fetch(`${API}/order_event/${id}`,{
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body:JSON.stringify(payload)
    })
    setSaving(false)
    if(!res.ok){
      const err=await res.json().catch(()=>null)
      setError(err?.detail||'Failed to save changes')
    }
  }

  const handleDelete = async () => {
    if(!confirm('Delete this event?'))return
    await fetch(`${API}/order_event/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}})
    router.push('/dashboard/order_event')
  }

  if(loading) return <p>Loading…</p>
  if(!orderEvent) return <p className="text-red-600">Event not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Order Event #{orderEvent.order_event_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="orderSelect" className="block text-sm font-medium">Order (PO#)</label>
          <input
            id="orderSelect"
            list="orders"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={orderNo}
            onChange={e=>setOrderNo(e.target.value)}
            required
          />
          <datalist id="orders">
            {orders.map(o=><option key={o.order_id} value={o.po_number}/>)}
          </datalist>
        </div>

        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium">Event Date</label>
          <input
            id="eventDate"
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={eventDate}
            onChange={e=>setEventDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="eventText" className="block text-sm font-medium">Event</label>
          <input
            id="eventText"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={eventText}
            onChange={e=>setEventText(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="remarks" className="block text-sm font-medium">Remarks</label>
          <textarea
            id="remarks"
            rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={remarks}
            onChange={e=>setRemarks(e.target.value)}
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {saving?'Saving…':'Save'}
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
