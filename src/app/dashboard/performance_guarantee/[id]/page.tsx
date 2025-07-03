// src/app/dashboard/performance_guarantee/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order { order_id: number; po_number: string }
interface PG {
  pg_id: number
  order_id: number
  pg_no: string
  pg_issuing_bank: string | null
  pg_deposit_receipt_no: string | null
  cheque_no: string | null
  tt_date: string | null
  document_date: string | null
  pg_value: number
  pg_expiry_date: string
  pg_submitted_date: string | null
  pg_return_date: string | null
  pg_release_date_dewa: string | null
  pg_release_date_bank: string | null
  pg_extension_dates: string[] | null
  remarks: string | null
  pending_status: string
}

const STATUS_OPTIONS = [
  'NOT Issued',
  'Issued / Extended',
  'Extension Required',
  'NOT Released',
  'Released',
]

export default function PGDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [item, setItem] = useState<PG|null>(null)

  const [orderNo, setOrderNo] = useState('')
  const [pgNo, setPgNo] = useState('')
  const [issuingBank, setIssuingBank] = useState('')
  const [depositReceipt, setDepositReceipt] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [ttDate, setTtDate] = useState('')
  const [docDate, setDocDate] = useState('')
  const [value, setValue] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [submittedDate, setSubmittedDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [releaseDewa, setReleaseDewa] = useState('')
  const [releaseBank, setReleaseBank] = useState('')
  const [extensionDates, setExtensionDates] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/order_detail`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/performance_guarantee/${id}`,{ headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ])
      .then(([ords, pg]:[Order[],PG])=>{
        setOrders(ords)
        setItem(pg)
        setOrderNo(ords.find(o=>o.order_id===pg.order_id)?.po_number||'')
        setPgNo(pg.pg_no)
        setIssuingBank(pg.pg_issuing_bank||'')
        setDepositReceipt(pg.pg_deposit_receipt_no||'')
        setChequeNo(pg.cheque_no||'')
        setTtDate(pg.tt_date||'')
        setDocDate(pg.document_date||'')
        setValue(String(pg.pg_value))
        setExpiryDate(pg.pg_expiry_date)
        setSubmittedDate(pg.pg_submitted_date||'')
        setReturnDate(pg.pg_return_date||'')
        setReleaseDewa(pg.pg_release_date_dewa||'')
        setReleaseBank(pg.pg_release_date_bank||'')
        setExtensionDates(Array.isArray(pg.pg_extension_dates)?pg.pg_extension_dates.join(', '):'')
        setRemarks(pg.remarks||'')
        setStatus(pg.pending_status)
      })
      .catch(()=>setError('Failed to load'))
      .finally(()=>setLoading(false))
  },[API,id])

  const parseDates = (txt: string) =>
    txt.split(',').map(s=>s.trim()).filter(Boolean)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const ord = orders.find(o=>o.po_number===orderNo)
    if(!ord){
      setError('Select valid Order')
      setSaving(false)
      return
    }
    const payload = {
      order_id: ord.order_id,
      pgNo,
      pg_issuing_bank: issuingBank||null,
      pg_deposit_receipt_no: depositReceipt||null,
      cheque_no: chequeNo||null,
      tt_date: ttDate||null,
      document_date: docDate||null,
      pg_value: parseFloat(value),
      pg_expiry_date: expiryDate,
      pg_submitted_date: submittedDate||null,
      pg_return_date: returnDate||null,
      pg_release_date_dewa: releaseDewa||null,
      pg_release_date_bank: releaseBank||null,
      pg_extension_dates: extensionDates?parseDates(extensionDates):null,
      remarks: remarks||null,
      pending_status: status,
    }
    const res = await fetch(`${API}/performance_guarantee/${id}`, {
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
      setError(err?.detail||'Failed to save')
    }
  }

  const handleDelete = async () => {
    if(!confirm('Delete this record?')) return
    await fetch(`${API}/performance_guarantee/${id}`,{
      method:'DELETE',
      headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}
    })
    router.push('/dashboard/performance_guarantee')
  }

  if(loading) return <p>Loading…</p>
  if(!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit PG #{item.pg_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Order (PO#)</label>
          <input
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
        {/* Repeat all form fields exactly as in create, but prefilled */}
        {/* ... */}
        <div>
          <label className="block text-sm font-medium">Pending Status</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={status}
            onChange={e=>setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s=>(
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saving?'Saving…':'Save'}
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
