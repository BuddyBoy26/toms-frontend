// src/app/dashboard/material_performance_guarantee/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Order { order_id: number; po_number: string }

type MPGStatus =
  | 'NOT Issued'
  | 'Issued / Extended'
  | 'Extension Required'
  | 'NOT Released'
  | 'Released'

function coerceArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.records)) return obj.records as T[]
    if (Array.isArray(obj.rows)) return obj.rows as T[]
    if (Array.isArray(obj.orders)) return obj.orders as T[]
    if (Array.isArray(obj.order_details)) return obj.order_details as T[]
    if (Array.isArray(obj.order_detail)) return obj.order_detail as T[]
  }
  return []
}

export default function CreateMaterialPerformanceGuaranteePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [orders, setOrders] = useState<Order[] | null>([])

  const [orderId, setOrderId] = useState<number | ''>('')

  const [mpgNo, setMpgNo] = useState('')
  const [mpgIssuingBank, setMpgIssuingBank] = useState('')
  const [mpgDepositReceiptNo, setMpgDepositReceiptNo] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [ttDate, setTtDate] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [mpgValue, setMpgValue] = useState('') // required
  const [mpgExpiryDate, setMpgExpiryDate] = useState('') // required
  const [mpgSubmittedDate, setMpgSubmittedDate] = useState('')
  const [mpgReturnDate, setMpgReturnDate] = useState('')
  const [mpgReleaseDateDewa, setMpgReleaseDateDewa] = useState('')
  const [mpgReleaseDateBank, setMpgReleaseDateBank] = useState('')

  const [extensionDateInput, setExtensionDateInput] = useState('')
  const [mpgExtensionDates, setMpgExtensionDates] = useState<string[]>([])

  const [remarks, setRemarks] = useState('')
  const [pendingStatus, setPendingStatus] = useState<MPGStatus>('NOT Issued')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    fetch(`${API}/order_detail`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(async r => {
        const raw = await r.json().catch(() => null)
        const arr = coerceArray<Order>(raw)
        if (!Array.isArray(arr)) console.warn('Unexpected /order_detail shape:', raw)
        setOrders(arr)
      })
      .catch(()=>{
        setError('Failed to load orders')
        setOrders([])
      })
  }, [API])

  const addExtensionDate = () => {
    if (!extensionDateInput) return
    if (mpgExtensionDates.includes(extensionDateInput)) return
    setMpgExtensionDates(prev => [...prev, extensionDateInput].sort())
    setExtensionDateInput('')
  }
  const removeExtensionDate = (d: string) => {
    setMpgExtensionDates(prev => prev.filter(x=>x!==d))
  }
  const toNum = (s: string) => {
    const n = parseFloat(s); return isNaN(n) ? null : n
  }
  const toNull = (s: string) => (s && s.trim() !== '' ? s.trim() : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!orderId) { toast.error('Select an Order'); return }
    if (!mpgNo.trim()) { toast.error('MPG No is required'); return }
    if (!mpgValue || toNum(mpgValue) === null) { toast.error('MPG Value is required'); return }
    if (!mpgExpiryDate) { toast.error('MPG Expiry Date is required'); return }

    setSaving(true)
    const payload = {
      order_id: Number(orderId),
      mpg_no: mpgNo.trim(),
      mpg_issuing_bank: toNull(mpgIssuingBank),
      mpg_deposit_receipt_no: toNull(mpgDepositReceiptNo),
      cheque_no: toNull(chequeNo),
      tt_date: ttDate || null,
      document_date: documentDate || null,
      mpg_value: toNum(mpgValue),
      mpg_expiry_date: mpgExpiryDate,
      mpg_submitted_date: mpgSubmittedDate || null,
      mpg_return_date: mpgReturnDate || null,
      mpg_release_date_dewa: mpgReleaseDateDewa || null,
      mpg_release_date_bank: mpgReleaseDateBank || null,
      mpg_extension_dates: mpgExtensionDates.length ? mpgExtensionDates : null,
      remarks: toNull(remarks),
      pending_status: pendingStatus,
    }

    const res = await fetch(`${API}/material_performance_guarantee`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}`
      },
      body: JSON.stringify(payload)
    })
    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(()=>null)
      const msg = err?.detail || 'Failed to create Material Performance Guarantee'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Material Performance Guarantee created')
      router.push('/dashboard/material_performance_guarantee')
    }
  }

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section3 = 'grid grid-cols-3 gap-3'
  const orderOptions: Order[] = Array.isArray(orders) ? orders : []

  return (
    <div className="max-w-6xl p-6">
      <h1 className="text-xl font-semibold mb-4">Create Material Performance Guarantee</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className={section3}>
          <div>
            <label className={labelCls}>Order</label>
            <select className={fieldCls} value={orderId} onChange={e=>setOrderId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Select order</option>
              {orderOptions.map(o => (
                <option key={o.order_id} value={o.order_id}>{o.po_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>MPG No</label>
            <input type="text" className={fieldCls} value={mpgNo} onChange={e=>setMpgNo(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Issuing Bank</label>
            <input type="text" className={fieldCls} value={mpgIssuingBank} onChange={e=>setMpgIssuingBank(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>Deposit Receipt No</label>
            <input type="text" className={fieldCls} value={mpgDepositReceiptNo} onChange={e=>setMpgDepositReceiptNo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Cheque No</label>
            <input type="text" className={fieldCls} value={chequeNo} onChange={e=>setChequeNo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>TT Date</label>
            <input type="date" className={fieldCls} value={ttDate} onChange={e=>setTtDate(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>Document Date</label>
            <input type="date" className={fieldCls} value={documentDate} onChange={e=>setDocumentDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>MPG Value</label>
            <input type="number" step="0.01" className={fieldCls} value={mpgValue} onChange={e=>setMpgValue(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>MPG Expiry Date</label>
            <input type="date" className={fieldCls} value={mpgExpiryDate} onChange={e=>setMpgExpiryDate(e.target.value)} required />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>MPG Submitted Date</label>
            <input type="date" className={fieldCls} value={mpgSubmittedDate} onChange={e=>setMpgSubmittedDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>MPG Return Date</label>
            <input type="date" className={fieldCls} value={mpgReturnDate} onChange={e=>setMpgReturnDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>MPG Release Date (DEWA)</label>
            <input type="date" className={fieldCls} value={mpgReleaseDateDewa} onChange={e=>setMpgReleaseDateDewa(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>MPG Release Date (Bank)</label>
            <input type="date" className={fieldCls} value={mpgReleaseDateBank} onChange={e=>setMpgReleaseDateBank(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-md p-3">
          <span className="text-xs font-medium text-gray-700">MPG Extension Dates</span>
          <div className="mt-2 flex gap-2">
            <input type="date" className={fieldCls + ' max-w-xs'} value={extensionDateInput} onChange={e=>setExtensionDateInput(e.target.value)} />
            <button type="button" onClick={addExtensionDate} className="px-3 h-8 bg-gray-800 text-white rounded-md text-sm">Add</button>
          </div>
          {mpgExtensionDates.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {mpgExtensionDates.map(d=>(
                <span key={d} className="inline-flex items-center gap-2 px-2 h-7 rounded-full bg-gray-100 text-xs">
                  {d}
                  <button type="button" onClick={()=>removeExtensionDate(d)} className="text-gray-600 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>Pending Status</label>
            <select className={fieldCls} value={pendingStatus} onChange={e=>setPendingStatus(e.target.value as MPGStatus)} required>
              <option value="NOT Issued">NOT Issued</option>
              <option value="Issued / Extended">Issued / Extended</option>
              <option value="Extension Required">Extension Required</option>
              <option value="NOT Released">NOT Released</option>
              <option value="Released">Released</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Remarks</label>
            <textarea className="mt-1 w-full px-2 py-2 border rounded-md text-sm" rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full py-2 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
