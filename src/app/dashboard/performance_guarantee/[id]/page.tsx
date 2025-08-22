// src/app/dashboard/performance_guarantee/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Order { order_id: number; po_number: string }

type PBGStatus =
  | 'NOT Issued'
  | 'Issued / Extended'
  | 'Extension Required'
  | 'NOT Released'
  | 'Released'

interface PerformanceGuaranteeRec {
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
  pending_status: PBGStatus
}

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
const toInputDate = (val: string | null) => (val ? val.slice(0,10) : '')

export default function EditPerformanceGuaranteePage() {
  const { id } = useParams() as { id: string } // pg_id
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [orders, setOrders] = useState<Order[] | null>([])
  const [rec, setRec] = useState<PerformanceGuaranteeRec | null>(null)

  const [orderId, setOrderId] = useState<number | ''>('')

  const [pgNo, setPgNo] = useState('')
  const [pgIssuingBank, setPgIssuingBank] = useState('')
  const [pgDepositReceiptNo, setPgDepositReceiptNo] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [ttDate, setTtDate] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [pgValue, setPgValue] = useState('')
  const [pgExpiryDate, setPgExpiryDate] = useState('')
  const [pgSubmittedDate, setPgSubmittedDate] = useState('')
  const [pgReturnDate, setPgReturnDate] = useState('')
  const [pgReleaseDateDewa, setPgReleaseDateDewa] = useState('')
  const [pgReleaseDateBank, setPgReleaseDateBank] = useState('')

  const [extensionDateInput, setExtensionDateInput] = useState('')
  const [pgExtensionDates, setPgExtensionDates] = useState<string[]>([])

  const [remarks, setRemarks] = useState('')
  const [pendingStatus, setPendingStatus] = useState<PBGStatus>('NOT Issued')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    Promise.all([
      fetch(`${API}/order_detail`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).catch(()=>null),
      fetch(`${API}/performance_guarantee/${id}`, { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).catch(()=>null),
    ]).then(([ordersRaw, data]) => {
      const arr = coerceArray<Order>(ordersRaw)
      if (!Array.isArray(arr)) console.warn('Unexpected /order_detail shape:', ordersRaw)
      setOrders(arr)

      if (!data || typeof data !== 'object') {
        setError('Failed to load')
        return
      }
      const r = data as PerformanceGuaranteeRec
      setRec(r)

      setOrderId(r.order_id)
      setPgNo(r.pg_no)
      setPgIssuingBank(r.pg_issuing_bank ?? '')
      setPgDepositReceiptNo(r.pg_deposit_receipt_no ?? '')
      setChequeNo(r.cheque_no ?? '')
      setTtDate(toInputDate(r.tt_date))
      setDocumentDate(toInputDate(r.document_date))
      setPgValue(String(r.pg_value))
      setPgExpiryDate(toInputDate(r.pg_expiry_date))
      setPgSubmittedDate(toInputDate(r.pg_submitted_date))
      setPgReturnDate(toInputDate(r.pg_return_date))
      setPgReleaseDateDewa(toInputDate(r.pg_release_date_dewa))
      setPgReleaseDateBank(toInputDate(r.pg_release_date_bank))
      setPgExtensionDates(Array.isArray(r.pg_extension_dates) ? r.pg_extension_dates : [])
      setRemarks(r.remarks ?? '')
      setPendingStatus(r.pending_status ?? 'NOT Issued')
    }).catch(()=>{
      setError('Failed to load')
      setOrders([]) // ensure array fallback
    }).finally(()=>setLoading(false))
  }, [API, id])

  const addExtensionDate = () => {
    if (!extensionDateInput) return
    if (pgExtensionDates.includes(extensionDateInput)) return
    setPgExtensionDates(prev => [...prev, extensionDateInput].sort())
    setExtensionDateInput('')
  }
  const removeExtensionDate = (d: string) => {
    setPgExtensionDates(prev => prev.filter(x=>x!==d))
  }
  const toNum = (s: string) => {
    const n = parseFloat(s); return isNaN(n) ? null : n
  }
  const toNull = (s: string) => (s && s.trim() !== '' ? s.trim() : null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!orderId) { toast.error('Select an Order'); return }
    if (!pgNo.trim()) { toast.error('PG No is required'); return }
    if (!pgValue || toNum(pgValue) === null) { toast.error('PG Value is required'); return }
    if (!pgExpiryDate) { toast.error('PG Expiry Date is required'); return }

    setSaving(true)
    const payload = {
      order_id: Number(orderId),
      pg_no: pgNo.trim(),
      pg_issuing_bank: toNull(pgIssuingBank),
      pg_deposit_receipt_no: toNull(pgDepositReceiptNo),
      cheque_no: toNull(chequeNo),
      tt_date: ttDate || null,
      document_date: documentDate || null,
      pg_value: toNum(pgValue),
      pg_expiry_date: pgExpiryDate || null,
      pg_submitted_date: pgSubmittedDate || null,
      pg_return_date: pgReturnDate || null,
      pg_release_date_dewa: pgReleaseDateDewa || null,
      pg_release_date_bank: pgReleaseDateBank || null,
      pg_extension_dates: pgExtensionDates.length ? pgExtensionDates : null,
      remarks: toNull(remarks),
      pending_status: pendingStatus,
    }

    const res = await fetch(`${API}/performance_guarantee/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}`
      },
      body: JSON.stringify(payload)
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(()=>null)
      const msg = err?.detail || 'Failed to save'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Performance Guarantee saved')
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this Performance Guarantee?')) return
    await fetch(`${API}/performance_guarantee/${id}`, {
      method: 'DELETE',
      headers: { Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}` }
    })
    toast.success('Record deleted')
    router.push('/dashboard/performance_guarantee')
  }

  if (loading) return <p>Loading…</p>
  if (!rec) return <p className="text-red-600">Record not found.</p>

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section3 = 'grid grid-cols-3 gap-3'
  const orderOptions: Order[] = Array.isArray(orders) ? orders : [] // <— render-time guard

  return (
    <div className="max-w-6xl p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Performance Guarantee #{rec.pg_id}</h1>
      <form onSubmit={handleSave} className="space-y-5">
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
            <label className={labelCls}>PG No</label>
            <input type="text" className={fieldCls} value={pgNo} onChange={e=>setPgNo(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Issuing Bank</label>
            <input type="text" className={fieldCls} value={pgIssuingBank} onChange={e=>setPgIssuingBank(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>Deposit Receipt No</label>
            <input type="text" className={fieldCls} value={pgDepositReceiptNo} onChange={e=>setPgDepositReceiptNo(e.target.value)} />
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
            <label className={labelCls}>PG Value</label>
            <input type="number" step="0.01" className={fieldCls} value={pgValue} onChange={e=>setPgValue(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>PG Expiry Date</label>
            <input type="date" className={fieldCls} value={pgExpiryDate} onChange={e=>setPgExpiryDate(e.target.value)} required />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>PG Submitted Date</label>
            <input type="date" className={fieldCls} value={pgSubmittedDate} onChange={e=>setPgSubmittedDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>PG Return Date</label>
            <input type="date" className={fieldCls} value={pgReturnDate} onChange={e=>setPgReturnDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>PG Release Date (DEWA)</label>
            <input type="date" className={fieldCls} value={pgReleaseDateDewa} onChange={e=>setPgReleaseDateDewa(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>PG Release Date (Bank)</label>
            <input type="date" className={fieldCls} value={pgReleaseDateBank} onChange={e=>setPgReleaseDateBank(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-md p-3">
          <span className="text-xs font-medium text-gray-700">PG Extension Dates</span>
          <div className="mt-2 flex gap-2">
            <input type="date" className={fieldCls + ' max-w-xs'} value={extensionDateInput} onChange={e=>setExtensionDateInput(e.target.value)} />
            <button type="button" onClick={addExtensionDate} className="px-3 h-8 bg-gray-800 text-white rounded-md text-sm">Add</button>
          </div>
          {pgExtensionDates.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {pgExtensionDates.map(d=>(
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
            <select className={fieldCls} value={pendingStatus} onChange={e=>setPendingStatus(e.target.value as PBGStatus)} required>
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

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 py-2 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={handleDelete} className="flex-1 py-2 h-10 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
