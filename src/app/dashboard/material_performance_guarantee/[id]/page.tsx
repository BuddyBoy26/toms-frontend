// src/app/dashboard/material_performance_guarantee/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order { order_id: number; po_number: string }
interface MPG {
  mpg_id: number
  order_id: number
  mpg_no: string
  mpg_issuing_bank: string | null
  mpg_deposit_receipt_no: string | null
  cheque_no: string | null
  tt_date: string | null
  document_date: string | null
  mpg_value: number
  mpg_expiry_date: string
  mpg_submitted_date: string | null
  mpg_return_date: string | null
  mpg_release_date_dewa: string | null
  mpg_release_date_bank: string | null
  mpg_extension_dates: string[] | null
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

export default function MPGDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [item, setItem] = useState<MPG|null>(null)

  const [orderNo, setOrderNo] = useState('')
  const [mpgNo, setMpgNo] = useState('')
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
      fetch(`${API}/material_performance_guarantee/${id}`,{ headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ])
      .then(([ords, it]:[Order[],MPG])=>{
        setOrders(ords)
        setItem(it)
        setOrderNo(ords.find(o=>o.order_id===it.order_id)?.po_number||'')
        setMpgNo(it.mpg_no)
        setIssuingBank(it.mpg_issuing_bank||'')
        setDepositReceipt(it.mpg_deposit_receipt_no||'')
        setChequeNo(it.cheque_no||'')
        setTtDate(it.tt_date||'')
        setDocDate(it.document_date||'')
        setValue(String(it.mpg_value))
        setExpiryDate(it.mpg_expiry_date)
        setSubmittedDate(it.mpg_submitted_date||'')
        setReturnDate(it.mpg_return_date||'')
        setReleaseDewa(it.mpg_release_date_dewa||'')
        setReleaseBank(it.mpg_release_date_bank||'')
        setExtensionDates(Array.isArray(it.mpg_extension_dates)?it.mpg_extension_dates.join(', '):'')
        setRemarks(it.remarks||'')
        setStatus(it.pending_status)
      })
      .catch(()=>setError('Failed to load'))
      .finally(()=>setLoading(false))
  },[API,id])

  const parseDateArray = (txt: string) =>
    txt.split(',').map(s=>s.trim()).filter(Boolean)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const ord = orders.find(o=>o.po_number===orderNo)
    if(!ord){
      setError('Select valid Order (PO#)')
      setSaving(false)
      return
    }

    const payload = {
      order_id: ord.order_id,
      mpgNo,
      mpg_issuing_bank: issuingBank||null,
      mpg_deposit_receipt_no: depositReceipt||null,
      cheque_no: chequeNo||null,
      tt_date: ttDate||null,
      document_date: docDate||null,
      mpg_value: parseFloat(value),
      mpg_expiry_date: expiryDate,
      mpg_submitted_date: submittedDate||null,
      mpg_return_date: returnDate||null,
      mpg_release_date_dewa: releaseDewa||null,
      mpg_release_date_bank: releaseBank||null,
      mpg_extension_dates: extensionDates?parseDateArray(extensionDates):null,
      remarks: remarks||null,
      pending_status: status,
    }

    const res = await fetch(`${API}/material_performance_guarantee/${id}`, {
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body: JSON.stringify(payload)
    })
    setSaving(false)
    if(!res.ok){
      const err=await res.json().catch(()=>null)
      setError(err?.detail||'Failed to save')
    }
  }

  const handleDelete = async () => {
    if(!confirm('Delete this record?')) return
    await fetch(`${API}/material_performance_guarantee/${id}`,{
      method:'DELETE',
      headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}
    })
    router.push('/dashboard/material_performance_guarantee')
  }

  if(loading) return <p>Loading…</p>
  if(!item) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit MPG #{item.mpg_id}</h1>
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
            {orders.map(o=>(
              <option key={o.order_id} value={o.po_number}/>
            ))}
          </datalist>
        </div>
        {/* repeat all form fields exactly as in create, prefilled */}
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
