'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Company { company_id:number; company_name:string }
interface Tender  { tender_id:number;  tender_no:string }

type Currency = 'AED'|'EUR'|'USD'
type PendingStatus = 'To be released' | 'In effect' | 'Released (By DEWA)'

interface TenderingCompanyRec {
  tendering_companies_id: number
  company_id: number
  tender_id: number

  tender_receipt_no: string | null
  tbg_no: string | null
  tbg_issuing_bank: string | null
  tender_deposit_receipt_no: string | null
  cheque_no: string | null
  tt_ref: string | null
  tt_date: string | null
  document_date: string | null
  tbg_value: number | null
  tbg_expiry_date: string | null
  tbg_submitted_date: string | null
  tbg_release_date_dewa: string | null
  tbg_release_date_bank: string | null
  tender_extension_dates: string[] | null
  tendering_currency: Currency
  discount_percent: number | null
  remarks: string | null
  pending_status: PendingStatus
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

const toInputDate = (val: string | null) => (val ? val.slice(0,10) : '')

export default function EditTenderingCompanyPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [rec, setRec] = useState<TenderingCompanyRec | null>(null)

  // relationships
  const [companyId, setCompanyId] = useState<number | ''>('')
  const [tenderId, setTenderId] = useState<number | ''>('')

  // fields
  const [tenderReceiptNo, setTenderReceiptNo] = useState('')
  const [tbgNo, setTbgNo] = useState('')
  const [tbgIssuingBank, setTbgIssuingBank] = useState('')
  const [tenderDepositReceiptNo, setTenderDepositReceiptNo] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [ttRef, setTtRef] = useState('')
  const [ttDate, setTtDate] = useState('')
  const [documentDate, setDocumentDate] = useState('')

  const [tbgValue, setTbgValue] = useState('')
  const [tbgExpiryDate, setTbgExpiryDate] = useState('')
  const [tbgSubmittedDate, setTbgSubmittedDate] = useState('')
  const [tbgReleaseDateDewa, setTbgReleaseDateDewa] = useState('')
  const [tbgReleaseDateBank, setTbgReleaseDateBank] = useState('')

  const [extensionDateInput, setExtensionDateInput] = useState('')
  const [tenderExtensionDates, setTenderExtensionDates] = useState<string[]>([])

  const [tenderingCurrency, setTenderingCurrency] = useState<Currency>('AED')
  const [discountPercent, setDiscountPercent] = useState('')
  const [remarks, setRemarks] = useState('')
  const [pendingStatus, setPendingStatus] = useState<PendingStatus>('To be released')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    Promise.all([
      fetch(`${API}/company_master`, { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).catch(()=>null),
      fetch(`${API}/tender`,         { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).catch(()=>null),
      fetch(`${API}/tendering_companies/${id}`, { headers:{ Authorization:`Bearer ${token}` }}).then(r=>r.json()).catch(()=>null),
    ]).then(([compsRaw, tndsRaw, data])=>{
      setCompanies(coerceArray<Company>(compsRaw))
      setTenders(coerceArray<Tender>(tndsRaw))
      if(!data || typeof data!=='object'){ setError('Failed to load'); return }
      const r = data as TenderingCompanyRec
      setRec(r)

      setCompanyId(r.company_id)
      setTenderId(r.tender_id)

      setTenderReceiptNo(r.tender_receipt_no ?? '')
      setTbgNo(r.tbg_no ?? '')
      setTbgIssuingBank(r.tbg_issuing_bank ?? '')
      setTenderDepositReceiptNo(r.tender_deposit_receipt_no ?? '')
      setChequeNo(r.cheque_no ?? '')
      setTtRef(r.tt_ref ?? '')
      setTtDate(toInputDate(r.tt_date))
      setDocumentDate(toInputDate(r.document_date))

      setTbgValue(r.tbg_value != null ? String(r.tbg_value) : '')
      setTbgExpiryDate(toInputDate(r.tbg_expiry_date))
      setTbgSubmittedDate(toInputDate(r.tbg_submitted_date))
      setTbgReleaseDateDewa(toInputDate(r.tbg_release_date_dewa))
      setTbgReleaseDateBank(toInputDate(r.tbg_release_date_bank))

      setTenderExtensionDates(Array.isArray(r.tender_extension_dates) ? r.tender_extension_dates : [])
      setTenderingCurrency(r.tendering_currency ?? 'AED')
      setDiscountPercent(r.discount_percent != null ? String(r.discount_percent) : '')
      setRemarks(r.remarks ?? '')
      setPendingStatus(r.pending_status ?? 'To be released')
    }).catch(()=>setError('Failed to load'))
      .finally(()=>setLoading(false))
  },[API,id])

  const addExtensionDate = () => {
    if (!extensionDateInput) return
    if (tenderExtensionDates.includes(extensionDateInput)) return
    setTenderExtensionDates(prev => [...prev, extensionDateInput].sort())
    setExtensionDateInput('')
  }
  const removeExtensionDate = (d: string) => {
    setTenderExtensionDates(prev => prev.filter(x=>x!==d))
  }
  const toNumOrNull = (s: string) => {
    const n = parseFloat(s); return isNaN(n) ? null : n
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyId) { toast.error('Select a Company'); return }
    if (!tenderId)  { toast.error('Select a Tender');  return }

    setSaving(true)
    const payload = {
      company_id: Number(companyId),
      tender_id: Number(tenderId),

      tender_receipt_no: tenderReceiptNo.trim() || null,
      tbg_no: tbgNo.trim() || null,
      tbg_issuing_bank: tbgIssuingBank.trim() || null,
      tender_deposit_receipt_no: tenderDepositReceiptNo.trim() || null,
      cheque_no: chequeNo.trim() || null,
      tt_ref: ttRef.trim() || null,
      tt_date: ttDate || null,
      document_date: documentDate || null,

      tbg_value: toNumOrNull(tbgValue),
      tbg_expiry_date: tbgExpiryDate || null,
      tbg_submitted_date: tbgSubmittedDate || null,
      tbg_release_date_dewa: tbgReleaseDateDewa || null,
      tbg_release_date_bank: tbgReleaseDateBank || null,

      tender_extension_dates: tenderExtensionDates.length ? tenderExtensionDates : null,

      tendering_currency: tenderingCurrency,
      discount_percent: toNumOrNull(discountPercent),
      remarks: remarks.trim() || null,
      pending_status: pendingStatus,
    }

    const res = await fetch(`${API}/tendering_companies/${id}`,{
      method:'PUT',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}`
      },
      body:JSON.stringify(payload)
    })
    setSaving(false)
    if(!res.ok){
      const err=await res.json().catch(()=>null)
      const msg = err?.detail || 'Failed to save'
      setError(msg)
      toast.error(msg)
    } else {
      toast.success('Tender Bond Guarantee saved')
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if(!confirm('Delete this record?')) return
    await fetch(`${API}/tendering_companies/${id}`,{
      method:'DELETE',
      headers:{ Authorization:`Bearer ${localStorage.getItem('kkabbas_token') || ''}` }
    })
    toast.success('Record deleted')
    router.push('/dashboard/tendering_companies')
  }

  if (loading) return <p>Loading…</p>
  if (!rec) return <p className="text-red-600">Record not found.</p>

  const fieldCls = 'mt-1 w-full px-2 py-1 h-8 border rounded-md text-sm'
  const labelCls = 'block text-xs font-medium'
  // const section2 = 'grid grid-cols-2 gap-3'
  const section3 = 'grid grid-cols-3 gap-3'

  return (
    <div className="max-w-6xl p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Tender Bond Guarantee #{rec.tendering_companies_id}</h1>
      <form onSubmit={handleSave} className="space-y-5">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Relationships */}
        <div className={section3}>
          <div>
            <label className={labelCls}>Company</label>
            <select className={fieldCls} value={companyId} onChange={e=>setCompanyId(e.target.value?Number(e.target.value):'')} required>
              <option value="">Select company</option>
              {companies.map(c=>(
                <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tender</label>
            <select className={fieldCls} value={tenderId} onChange={e=>setTenderId(e.target.value?Number(e.target.value):'')} required>
              <option value="">Select tender</option>
              {tenders.map(t=>(
                <option key={t.tender_id} value={t.tender_id}>{t.tender_no}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tender Receipt No</label>
            <input type="text" className={fieldCls} value={tenderReceiptNo} onChange={e=>setTenderReceiptNo(e.target.value)} />
          </div>
        </div>

        {/* TBG block */}
        <div className={section3}>
          <div>
            <label className={labelCls}>TBG No</label>
            <input type="text" className={fieldCls} value={tbgNo} onChange={e=>setTbgNo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Issuing Bank</label>
            <input type="text" className={fieldCls} value={tbgIssuingBank} onChange={e=>setTbgIssuingBank(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Deposit Receipt No</label>
            <input type="text" className={fieldCls} value={tenderDepositReceiptNo} onChange={e=>setTenderDepositReceiptNo(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>Cheque No</label>
            <input type="text" className={fieldCls} value={chequeNo} onChange={e=>setChequeNo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>TT Ref</label>
            <input type="text" className={fieldCls} value={ttRef} onChange={e=>setTtRef(e.target.value)} />
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
            <label className={labelCls}>TBG Value</label>
            <input type="number" step="0.01" className={fieldCls} value={tbgValue} onChange={e=>setTbgValue(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>TBG Expiry Date</label>
            <input type="date" className={fieldCls} value={tbgExpiryDate} onChange={e=>setTbgExpiryDate(e.target.value)} />
          </div>
        </div>

        <div className={section3}>
          <div>
            <label className={labelCls}>TBG Submitted Date</label>
            <input type="date" className={fieldCls} value={tbgSubmittedDate} onChange={e=>setTbgSubmittedDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>TBG Release Date (DEWA)</label>
            <input type="date" className={fieldCls} value={tbgReleaseDateDewa} onChange={e=>setTbgReleaseDateDewa(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>TBG Release Date (Bank)</label>
            <input type="date" className={fieldCls} value={tbgReleaseDateBank} onChange={e=>setTbgReleaseDateBank(e.target.value)} />
          </div>
        </div>

        {/* Tender extensions (ARRAY(Date)) */}
        <div className="border rounded-md p-3">
          <span className="text-xs font-medium text-gray-700">Tender Extension Dates</span>
          <div className="mt-2 flex gap-2">
            <input type="date" className={fieldCls + ' max-w-xs'} value={extensionDateInput} onChange={e=>setExtensionDateInput(e.target.value)} />
            <button type="button" onClick={addExtensionDate} className="px-3 h-8 bg-gray-800 text-white rounded-md text-sm">Add</button>
          </div>
          {tenderExtensionDates.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tenderExtensionDates.map(d=>(
                <span key={d} className="inline-flex items-center gap-2 px-2 h-7 rounded-full bg-gray-100 text-xs">
                  {d}
                  <button type="button" onClick={()=>removeExtensionDate(d)} className="text-gray-600 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Currency / Status / Discount / Remarks */}
        <div className={section3}>
          <div>
            <label className={labelCls}>Currency</label>
            <select className={fieldCls} value={tenderingCurrency} onChange={e=>setTenderingCurrency(e.target.value as Currency)}>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Discount %</label>
            <input type="number" step="0.01" className={fieldCls} value={discountPercent} onChange={e=>setDiscountPercent(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Pending Status</label>
            <select className={fieldCls} value={pendingStatus} onChange={e=>setPendingStatus(e.target.value as PendingStatus)} required>
              <option value="To be released">To be released</option>
              <option value="In effect">In effect</option>
              <option value="Released (By DEWA)">Released (By DEWA)</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Remarks</label>
          <textarea className="mt-1 w-full px-2 py-2 border rounded-md text-sm" rows={4} value={remarks} onChange={e=>setRemarks(e.target.value)} />
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
