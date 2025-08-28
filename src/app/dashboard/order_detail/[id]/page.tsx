// src/app/dashboard/order_detail/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface Company { company_id:number; company_name:string }
interface Tender  { tender_id:number;  tender_no:string  }
type Currency = 'AED'|'EUR'|'USD'

interface Order {
  order_id: number
  company_id: number
  tender_id: number
  old_po_id: number | null

  po_number: string
  order_description: string
  order_date: string

  order_value: number
  currency: Currency
  order_value_aed: number

  revised_value_lme: number | null
  revised_value_lme_aed: number | null

  order_confirmation_no: string | null
  order_confirmation_date: string | null
  po_confirmation_date_srm: string | null
  drawing_submission_date: string | null
  drawing_approval_date: string | null
  last_contractual_delivery: string | null
  actual_last_delivery: string | null

  kka_commission_percent: number
  no_of_consignments: number | null
}

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders]   = useState<Tender[]>([])
  const [orders, setOrders]     = useState<Pick<Order,'order_id'|'po_number'>[]>([])
  const [order, setOrder] = useState<Order|null>(null)

  const [companyId, setCompanyId] = useState<number | ''>('')
  const [tenderId,  setTenderId]  = useState<number | ''>('')
  const [oldPoId,   setOldPoId]   = useState<number | ''>('')

  const [poNumber, setPoNumber] = useState('')
  const [orderDescription, setOrderDescription] = useState('')
  const [orderDate, setOrderDate] = useState('')

  const [orderValue, setOrderValue] = useState<string>('')
  const [currency, setCurrency] = useState<Currency>('AED')
  const [orderValueAed, setOrderValueAed] = useState<string>('')

  const [revisedValueLme, setRevisedValueLme] = useState<string>('')
  const [revisedValueLmeAed, setRevisedValueLmeAed] = useState<string>('')

  const [orderConfirmationNo, setOrderConfirmationNo] = useState('')
  const [orderConfirmationDate, setOrderConfirmationDate] = useState('')
  const [poConfirmationDateSrm, setPoConfirmationDateSrm] = useState('')
  const [drawingSubmissionDate, setDrawingSubmissionDate] = useState('')
  const [drawingApprovalDate, setDrawingApprovalDate] = useState('')
  const [lastContractualDelivery, setLastContractualDelivery] = useState('')
  const [actualLastDelivery, setActualLastDelivery] = useState('')

  const [kkaCommissionPercent, setKkaCommissionPercent] = useState<string>('5.00')
  const [noOfConsignments, setNoOfConsignments] = useState<string>('')

  const rates = useMemo(() => ({ AED:1, USD:3.6725, EUR:3.98 }), [])

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    Promise.all([
      fetch(`${API}/company_master`, { headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
      fetch(`${API}/tender`,         { headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
      fetch(`${API}/order_detail/${id}`, { headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
      fetch(`${API}/order_detail`,   { headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
    ])
    .then(([comps,tnds,ord,allOrders]:[Company[],Tender[],Order,Order[]])=>{
      setCompanies(comps || [])
      setTenders(tnds || [])
      setOrders((allOrders || []).map(o=>({order_id:o.order_id, po_number:o.po_number})))
      setOrder(ord)

      setCompanyId(ord.company_id)
      setTenderId(ord.tender_id)
      setOldPoId(ord.old_po_id ?? '')

      setPoNumber(ord.po_number)
      setOrderDescription(ord.order_description)
      setOrderDate(ord.order_date)

      setOrderValue(String(ord.order_value ?? ''))
      setCurrency(ord.currency)
      setOrderValueAed(ord.order_value_aed != null ? String(ord.order_value_aed) : '')

      setRevisedValueLme(ord.revised_value_lme != null ? String(ord.revised_value_lme) : '')
      setRevisedValueLmeAed(ord.revised_value_lme_aed != null ? String(ord.revised_value_lme_aed) : '')

      setOrderConfirmationNo(ord.order_confirmation_no ?? '')
      setOrderConfirmationDate(ord.order_confirmation_date ?? '')
      setPoConfirmationDateSrm(ord.po_confirmation_date_srm ?? '')
      setDrawingSubmissionDate(ord.drawing_submission_date ?? '')
      setDrawingApprovalDate(ord.drawing_approval_date ?? '')
      setLastContractualDelivery(ord.last_contractual_delivery ?? '')
      setActualLastDelivery(ord.actual_last_delivery ?? '')

      setKkaCommissionPercent(String(ord.kka_commission_percent ?? '5.00'))
      setNoOfConsignments(ord.no_of_consignments != null ? String(ord.no_of_consignments) : '')
    })
    .catch(()=>setError('Failed to load'))
    .finally(()=>setLoading(false))
  },[API,id])

  useEffect(()=>{
    const v = parseFloat(orderValue)
    if(!isNaN(v)){
      const aed = currency==='AED' ? v : v*(rates[currency]||1)
      setOrderValueAed(aed.toFixed(2))
    } else {
      setOrderValueAed('')
    }
  },[orderValue,currency,rates])

  useEffect(()=>{
    const v = parseFloat(revisedValueLme)
    if(!isNaN(v)){
      const aed = currency==='AED' ? v : v*(rates[currency]||1)
      setRevisedValueLmeAed(aed.toFixed(2))
    } else {
      setRevisedValueLmeAed('')
    }
  },[revisedValueLme,currency,rates])

  const toNumOrNull = (s: string) => {
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  setSaving(true)

  if (!companyId || !tenderId) {
    setError('Select valid company and tender')
    toast.error('Select valid company and tender')
    setSaving(false)
    return
  }

  const payload = {
      company_id: Number(companyId),
      tender_id: Number(tenderId),
      old_po_id: oldPoId === '' ? null : Number(oldPoId),

      po_number: poNumber.trim(),
      order_description: orderDescription.trim(),
      order_date: orderDate || null,

      order_value: toNumOrNull(orderValue),
      currency,
      order_value_aed: toNumOrNull(orderValueAed),

      revised_value_lme: toNumOrNull(revisedValueLme),
      revised_value_lme_aed: toNumOrNull(revisedValueLmeAed),

      order_confirmation_no: orderConfirmationNo.trim() || null,
      order_confirmation_date: orderConfirmationDate || null,
      po_confirmation_date_srm: poConfirmationDateSrm || null,
      drawing_submission_date: drawingSubmissionDate || null,
      drawing_approval_date: drawingApprovalDate || null,
      last_contractual_delivery: lastContractualDelivery || null,
      actual_last_delivery: actualLastDelivery || null,

      kka_commission_percent: toNumOrNull(kkaCommissionPercent),
      no_of_consignments: noOfConsignments === '' ? null : Number(noOfConsignments),
    }

  const res = await fetch(`${API}/order_detail/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('kkabbas_token') || ''}` },
    body: JSON.stringify(payload)
  })

  setSaving(false)
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    const message = err?.detail || 'Failed to save'
    setError(message)
    toast.error(message)
  } else {
    toast.success('Order saved successfully')
    router.refresh()
  }
}

  const handleDelete = async () => {
    if(!confirm('Delete this order?')) return
    await fetch(`${API}/order_detail/${id}`,{
      method:'DELETE',
      headers:{ Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}` }
    })
    router.push('/dashboard/order_detail')
  }

  if(loading) return <p>Loading…</p>
  if(!order) return <p className="text-red-600">Order not found.</p>

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  const section2 = 'grid grid-cols-2 gap-3'
  const section3 = 'grid grid-cols-3 gap-3'

  return (
    <div className="max-w-5xl p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Order #{order.order_id}</h1>
      <form onSubmit={handleSave} className="space-y-5">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className={section3}>
          <div>
            <label htmlFor="company" className={labelCls}>Company</label>
            <select id="company" className={fieldCls} value={companyId} onChange={e=>setCompanyId(e.target.value?Number(e.target.value):'')} required>
              <option value="">Select company</option>
              {companies.map(c=>(
                <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tender" className={labelCls}>Tender</label>
            <select id="tender" className={fieldCls} value={tenderId} onChange={e=>setTenderId(e.target.value?Number(e.target.value):'')} required>
              <option value="">Select tender</option>
              {tenders.map(t=>(
                <option key={t.tender_id} value={t.tender_id}>{t.tender_no}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="oldpo" className={labelCls}>Old PO (if any)</label>
            <select id="oldpo" className={fieldCls} value={oldPoId} onChange={e=>setOldPoId(e.target.value?Number(e.target.value):'')}>
              <option value="">None</option>
              {orders
                .filter(o=>o.order_id !== Number(id))
                .map(o=>(
                  <option key={o.order_id} value={o.order_id}>{o.po_number}</option>
                ))}
            </select>
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="poNumber" className={labelCls}>PO Number</label>
            <input id="poNumber" type="text" className={fieldCls} value={poNumber} onChange={e=>setPoNumber(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="orderDate" className={labelCls}>Order Date</label>
            <input id="orderDate" type="date" className={fieldCls} value={orderDate} onChange={e=>setOrderDate(e.target.value)} required />
          </div>
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>Description</label>
          <input id="description" type="text" className={fieldCls} value={orderDescription} onChange={e=>setOrderDescription(e.target.value)} required />
        </div>

        <div className={section3}>
          <div>
            <label htmlFor="orderValue" className={labelCls}>Order Value</label>
            <input id="orderValue" type="number" step="0.01" className={fieldCls} value={orderValue} onChange={e=>setOrderValue(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="currency" className={labelCls}>Currency</label>
            <select id="currency" className={fieldCls} value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label htmlFor="orderValueAed" className={labelCls}>Order Value (AED)</label>
            <input id="orderValueAed" type="number" step="0.01" className={fieldCls} value={orderValueAed} onChange={e=>setOrderValueAed(e.target.value)} required />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="revVal" className={labelCls}>Revised Value (LME)</label>
            <input id="revVal" type="number" step="0.01" className={fieldCls} value={revisedValueLme} onChange={e=>setRevisedValueLme(e.target.value)} />
          </div>
          <div>
            <label htmlFor="revValAed" className={labelCls}>Revised Value (LME) AED</label>
            <input id="revValAed" type="number" step="0.01" className={fieldCls} value={revisedValueLmeAed} onChange={e=>setRevisedValueLmeAed(e.target.value)} />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="ocNo" className={labelCls}>Order Confirmation No</label>
            <input id="ocNo" type="text" className={fieldCls} value={orderConfirmationNo} onChange={e=>setOrderConfirmationNo(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ocDate" className={labelCls}>Order Confirmation Date</label>
            <input id="ocDate" type="date" className={fieldCls} value={orderConfirmationDate} onChange={e=>setOrderConfirmationDate(e.target.value)} />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="poSrm" className={labelCls}>PO Confirmation Date (SRM)</label>
            <input id="poSrm" type="date" className={fieldCls} value={poConfirmationDateSrm} onChange={e=>setPoConfirmationDateSrm(e.target.value)} />
          </div>
          <div>
            <label htmlFor="drawSub" className={labelCls}>Drawing Submission Date</label>
            <input id="drawSub" type="date" className={fieldCls} value={drawingSubmissionDate} onChange={e=>setDrawingSubmissionDate(e.target.value)} />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="drawApp" className={labelCls}>Drawing Approval Date</label>
            <input id="drawApp" type="date" className={fieldCls} value={drawingApprovalDate} onChange={e=>setDrawingApprovalDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="lastCon" className={labelCls}>Last Contractual Delivery</label>
            <input id="lastCon" type="date" className={fieldCls} value={lastContractualDelivery} onChange={e=>setLastContractualDelivery(e.target.value)} />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="actLast" className={labelCls}>Actual Last Delivery</label>
            <input id="actLast" type="date" className={fieldCls} value={actualLastDelivery} onChange={e=>setActualLastDelivery(e.target.value)} />
          </div>
          <div>
            <label htmlFor="kka" className={labelCls}>KKA Commission (%)</label>
            <input id="kka" type="number" step="0.01" className={fieldCls} value={kkaCommissionPercent} onChange={e=>setKkaCommissionPercent(e.target.value)} required />
          </div>
        </div>

        <div className={section2}>
          <div>
            <label htmlFor="cons" className={labelCls}>No. of Consignments</label>
            <input id="cons" type="number" step="1" className={fieldCls} value={noOfConsignments} onChange={e=>setNoOfConsignments(e.target.value)} />
          </div>
          <div />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 py-2 h-10 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            {saving?'Saving…':'Save'}
          </button>
          <button type="button" onClick={handleDelete} className="flex-1 py-2 h-10 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}

