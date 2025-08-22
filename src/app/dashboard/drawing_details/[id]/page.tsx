'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Tender { tender_id: number; tender_no: string }
interface Order  { order_id: number; po_number: string }

interface DrawingDetails {
  id: number
  tender_no: string
  order_id: number
  drawing_no: string | null
  drawing_version: string | null
  submission_date: string | null
  revision: string | null
  approval_date: string | null
  sent_date: string | null
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
  }
  return []
}

export default function EditDrawingPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [tenders, setTenders] = useState<Tender[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [drawing, setDrawing] = useState<DrawingDetails | null>(null)

  const [tenderNo, setTenderNo] = useState<string>('')
  const [orderId, setOrderId] = useState<number | ''>('')

  const [drawingNo, setDrawingNo] = useState('')
  const [drawingVersion, setDrawingVersion] = useState('')
  const [submissionDate, setSubmissionDate] = useState('')
  const [revision, setRevision] = useState('')
  const [approvalDate, setApprovalDate] = useState('')
  const [sentDate, setSentDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    Promise.all([
      fetch(`${API}/tender`, { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).catch(() => null),
      fetch(`${API}/order_detail`, { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).catch(() => null),
      fetch(`${API}/drawing_details/${id}`, { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).catch(() => null),
    ])
    .then(([tndsRaw, ordsRaw, drw]) => {
      const tnds = coerceArray<Tender>(tndsRaw)
      const ords = coerceArray<Order>(ordsRaw)
      setTenders(tnds)
      setOrders(ords)
      if (!drw || typeof drw !== 'object') {
        setError('Failed to load')
        return
      }
      setDrawing(drw as DrawingDetails)

      setTenderNo((drw as DrawingDetails).tender_no)
      setOrderId((drw as DrawingDetails).order_id)

      setDrawingNo((drw as DrawingDetails).drawing_no ?? '')
      setDrawingVersion((drw as DrawingDetails).drawing_version ?? '')
      setSubmissionDate((drw as DrawingDetails).submission_date ?? '')
      setRevision((drw as DrawingDetails).revision ?? '')
      setApprovalDate((drw as DrawingDetails).approval_date ?? '')
      setSentDate((drw as DrawingDetails).sent_date ?? '')

      if (!Array.isArray(tndsRaw)) console.warn('Unexpected /tender shape:', tndsRaw)
      if (!Array.isArray(ordsRaw)) console.warn('Unexpected /order_detail shape:', ordsRaw)
    })
    .catch(() => setError('Failed to load'))
    .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (!tenderNo) {
      toast.error('Select a valid Tender No')
      setSaving(false)
      return
    }
    if (!orderId) {
      toast.error('Select a valid Order')
      setSaving(false)
      return
    }

    const payload = {
      tender_no: tenderNo,
      order_id: Number(orderId),
      drawing_no: drawingNo.trim() || null,
      drawing_version: drawingVersion.trim() || null,
      submission_date: submissionDate || null,
      revision: revision.trim() || null,
      approval_date: approvalDate || null,
      sent_date: sentDate || null,
    }

    const res = await fetch(`${API}/drawing_details/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type':'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token') || ''}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const msg = err?.detail || 'Failed to save'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Drawing record saved')
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this drawing record?')) return
    await fetch(`${API}/drawing_details/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token') || ''}` },
    })
    toast.success('Drawing record deleted')
    router.push('/dashboard/drawing_details')
  }

  if (loading) return <p>Loading…</p>
  if (!drawing) return <p className="text-red-600">Drawing record not found.</p>

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section2 = 'grid grid-cols-2 gap-3'
  const section3 = 'grid grid-cols-3 gap-3'

  return (
    <div className="max-w-4xl p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Drawing #{drawing.id}</h1>
      <form onSubmit={handleSave} className="space-y-5">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className={section3}>
          <div>
            <label className={labelCls}>Tender No</label>
            <select className={fieldCls} value={tenderNo} onChange={e=>setTenderNo(e.target.value)} required>
              <option value="">Select tender</option>
              {tenders.map(t => (
                <option key={t.tender_id} value={t.tender_no}>{t.tender_no}</option>
              ))}
            </select>
          </div>
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
            <label className={labelCls}>Drawing No</label>
            <input type="text" className={fieldCls} value={drawingNo} onChange={e=>setDrawingNo(e.target.value)} />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label className={labelCls}>Drawing Version</label>
            <input type="text" className={fieldCls} value={drawingVersion} onChange={e=>setDrawingVersion(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Revision</label>
            <input type="text" className={fieldCls} value={revision} onChange={e=>setRevision(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>Submission Date</label>
            <input type="date" className={fieldCls} value={submissionDate} onChange={e=>setSubmissionDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Approval Date</label>
            <input type="date" className={fieldCls} value={approvalDate} onChange={e=>setApprovalDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Sent Date</label>
            <input type="date" className={fieldCls} value={sentDate} onChange={e=>setSentDate(e.target.value)} />
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
