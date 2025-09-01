'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'
type PendingStatusEnum = 'To be released' | 'In effect' | 'Released (By DEWA)'
type BondMode = 'TBG' | 'Tender Deposit'

interface Company { company_id: number; company_name: string }
interface Tender  { tender_id: number; tender_no: string; tender_description: string }
interface Product { product_id: number; product_name: string }

interface TC {
  tendering_companies_id: number
  company_id: number
  tender_id: number
  tender_receipt_no: string | null
  debit_advice_no:  string | null
  tbg_no: string | null
  tbg_issuing_bank: string | null
  tender_deposit_receipt_no: string | null
  tbg_value: number | null
  tbg_expiry_date: string | null
  tbg_submitted_date: string | null
  tbg_release_date_dewa: string | null
  tbg_release_date_bank: string | null
  tt_ref: string | null
  tt_date: string | null
  document_date: string | null
  remarks: string | null
  tendering_currency: CurrencyEnum
  discount_percent: number | null
  pending_status: PendingStatusEnum
  tender_bought: 0 | 1
  participated: 0 | 1
  result_saved: 0 | 1
  evaluations_received: 0 | 1
  memo: 0 | 1
  po_copies: 0 | 1
  cg_bank: string | null
  cg_no: string | null
  cg_date: string | null
  cg_expiry_date: string | null
}

export default function TCompanyEditPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders]     = useState<Tender[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [record, setRecord]       = useState<TC | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // selectors
  const [tenderId, setTenderId]   = useState<number | ''>('')
  const [companyId, setCompanyId] = useState<number | ''>('')

  // header
  const [tenderReceiptNo, setTenderReceiptNo] = useState('')
  const [debitAdviceNo,  setDebitAdviceNo]    = useState('')

  // bond/deposit
  const [bondMode, setBondMode] = useState<BondMode>('TBG')
  const [tbgNo, setTbgNo] = useState('')
  const [tbgIssuingBank, setTbgIssuingBank] = useState('')
  const [tbgCurrency, setTbgCurrency]       = useState<CurrencyEnum>('AED')
  const [tenderDepositReceiptNo, setTenderDepositReceiptNo] = useState('')

  // values/dates
  const [tbgValue, setTbgValue]                   = useState<string>('')
  const [tbgExpiryDate, setTbgExpiryDate]         = useState('')
  const [tbgSubmittedDate, setTbgSubmittedDate]   = useState('')
  const [tbgReleaseDateDewa, setTbgReleaseDateDewa] = useState('')
  const [tbgReleaseDateBank, setTbgReleaseDateBank] = useState('')

  // misc
  const [ttRef, setTtRef]               = useState('')
  const [ttDate, setTtDate]             = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [remarks, setRemarks]           = useState('')
  const [pendingStatus, setPendingStatus] = useState<PendingStatusEnum>('To be released')
  const [discountPercent, setDiscountPercent] = useState<string>('')

  // flags
  const [tenderBought, setTenderBought]               = useState(false)
  const [participated, setParticipated]               = useState(false)
  const [resultSaved, setResultSaved]                 = useState(false)
  const [evaluationsReceived, setEvaluationsReceived] = useState(false)
  const [memo, setMemo]                               = useState(false)
  const [poCopies, setPoCopies]                       = useState(false)

  // CG details
  const [cgBank, setCgBank]           = useState('')
  const [cgNo, setCgNo]               = useState('')
  const [cgDate, setCgDate]           = useState('')
  const [cgExpiryDate, setCgExpiryDate] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    Promise.all([
      fetch(`${API}/company_master`,           { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/tender`,                   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/product_master`,           { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/tendering_companies/${id}`,{ headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([cs, ts, ps, rec]: [Company[], Tender[], Product[], TC]) => {
        setCompanies(cs || [])
        setTenders(ts || [])
        setProducts(ps || [])
        setRecord(rec)

        setTenderId(rec.tender_id)
        setCompanyId(rec.company_id)

        setTenderReceiptNo(rec.tender_receipt_no || '')
        setDebitAdviceNo(rec.debit_advice_no || '')

        setBondMode(rec.tender_deposit_receipt_no ? 'Tender Deposit' : 'TBG')
        setTbgNo(rec.tbg_no || '')
        setTbgIssuingBank(rec.tbg_issuing_bank || '')
        setTbgCurrency(rec.tendering_currency || 'AED')
        setTenderDepositReceiptNo(rec.tender_deposit_receipt_no || '')

        setTbgValue(rec.tbg_value != null ? String(rec.tbg_value) : '')
        setTbgExpiryDate(rec.tbg_expiry_date || '')
        setTbgSubmittedDate(rec.tbg_submitted_date || '')
        setTbgReleaseDateDewa(rec.tbg_release_date_dewa || '')
        setTbgReleaseDateBank(rec.tbg_release_date_bank || '')

        setTtRef(rec.tt_ref || '')
        setTtDate(rec.tt_date || '')
        setDocumentDate(rec.document_date || '')
        setRemarks(rec.remarks || '')
        setPendingStatus(rec.pending_status)
        setDiscountPercent(rec.discount_percent != null ? String(rec.discount_percent) : '')

        setTenderBought(!!rec.tender_bought)
        setParticipated(!!rec.participated)
        setResultSaved(!!rec.result_saved)
        setEvaluationsReceived(!!rec.evaluations_received)
        setMemo(!!rec.memo)
        setPoCopies(!!rec.po_copies)

        setCgBank(rec.cg_bank || '')
        setCgNo(rec.cg_no || '')
        setCgDate(rec.cg_date || '')
        setCgExpiryDate(rec.cg_expiry_date || '')
      })
      .catch(e => setError(`Failed to load: ${e.message}`))
      .finally(() => setLoading(false))
  }, [API, id])

  const supplyProductName = useMemo(() => {
    return products.find(x => x.product_id === Number(record?.tender_id))?.product_name ?? ''
  }, [products, record])

  const tenderDescriptionDisplay = useMemo(
    () => (supplyProductName ? `SUPPLY OF ${supplyProductName}` : ''),
    [supplyProductName]
  )

  const canSubmit = useMemo(() => !!tenderId && !!companyId, [tenderId, companyId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) { setError('Please select Tender and Tenderer.'); return }
    setSaving(true); setError(null)

    const token = localStorage.getItem('kkabbas_token')
    const payload = {
      tender_id: Number(tenderId),
      company_id: Number(companyId),
      tender_receipt_no: tenderReceiptNo || null,
      debit_advice_no:  debitAdviceNo  || null,
      tbg_no: bondMode === 'TBG' ? (tbgNo || null) : null,
      tbg_issuing_bank: bondMode === 'TBG' ? (tbgIssuingBank || null) : null,
      tendering_currency: bondMode === 'TBG' ? tbgCurrency : 'AED',
      tender_deposit_receipt_no: bondMode === 'Tender Deposit' ? (tenderDepositReceiptNo || null) : null,
      tbg_value: tbgValue === '' ? null : Number(tbgValue),
      tbg_expiry_date: tbgExpiryDate || null,
      tbg_submitted_date: tbgSubmittedDate || null,
      tbg_release_date_dewa: tbgReleaseDateDewa || null,
      tbg_release_date_bank: tbgReleaseDateBank || null,
      tt_ref: ttRef || null,
      tt_date: ttDate || null,
      document_date: documentDate || null,
      remarks: remarks || null,
      discount_percent: discountPercent === '' ? null : Number(discountPercent),
      pending_status: pendingStatus,
      tender_bought: tenderBought,
      participated,
      result_saved: resultSaved,
      evaluations_received: evaluationsReceived,
      memo,
      po_copies: poCopies,
      cg_bank: cgBank || null,
      cg_no: cgNo || null,
      cg_date: cgDate || null,
      cg_expiry_date: cgExpiryDate || null
    }

    const res = await fetch(`${API}/tendering_companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(typeof err?.detail === 'string' ? err.detail : `Save failed (${res.status})`)
      return
    }
    const updated = await res.json()
    setRecord(updated)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this record?')) return
    const token = localStorage.getItem('kkabbas_token')
    const res = await fetch(`${API}/tendering_companies/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(typeof err?.detail === 'string' ? err.detail : `Delete failed (${res.status})`)
      return
    }
    router.push('/dashboard/tendering_companies')
  }

  if (loading) return <p>Loading…</p>
  if (error)   return <p className="text-red-600">{error}</p>
  if (!record) return <p>Record not found.</p>

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold">TENDERING DETAILS #{record.tendering_companies_id}</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tender / Tenderer / Tender Receipt / Debit Advice */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">Tender</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2" value={tenderId} onChange={e => setTenderId(Number(e.target.value))}>
              <option value="">-- Select Tender --</option>
              {tenders.map(t => <option key={t.tender_id} value={t.tender_id}>{t.tender_no}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tenderer</label>
            <select className="mt-1 w-full rounded-md border px-3 py-2" value={companyId} onChange={e => setCompanyId(Number(e.target.value))}>
              <option value="">-- Select Company --</option>
              {companies.map(c => <option key={c.company_id} value={c.company_id}>{c.company_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tender Receipt No</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={tenderReceiptNo} onChange={e => setTenderReceiptNo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Debit Advice No.</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={debitAdviceNo} onChange={e => setDebitAdviceNo(e.target.value)} />
          </div>
        </div>

        {/* Tender Description */}
        <div>
          <label className="block text-sm font-medium">Tender Description : SUPPLY OF</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-50" value={tenderDescriptionDisplay} readOnly />
        </div>

        <div className="rounded-md border p-4">
          <div className="mb-3 flex items-end gap-4">
            <h2 className="text-lg font-semibold">TBG Details</h2>
            <div className="ml-auto">
              <label className="block text-sm font-medium">Tender Bond / Deposit</label>
              <select className="mt-1 rounded-md border px-3 py-2" value={bondMode} onChange={e => setBondMode(e.target.value as BondMode)}>
                <option value="TBG">TBG</option>
                <option value="Tender Deposit">Tender Deposit</option>
              </select>
            </div>
          </div>

          {bondMode === 'TBG' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">TBG No</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2" value={tbgNo} onChange={e => setTbgNo(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Issuing Bank</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2" value={tbgIssuingBank} onChange={e => setTbgIssuingBank(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">TBG Curr</label>
                <select className="mt-1 w-full rounded-md border px-3 py-2" value={tbgCurrency} onChange={e => setTbgCurrency(e.target.value as CurrencyEnum)}>
                  <option value="AED">AED</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">Tender Deposit Receipt No</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2" value={tenderDepositReceiptNo} onChange={e => setTenderDepositReceiptNo(e.target.value)} />
              </div>
            </div>
          )}

          {/* Value + Expiry */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">TBG Value</label>
              <input type="number" className="mt-1 w-full rounded-md border px-3 py-2" value={tbgValue} onChange={e => setTbgValue(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">TBG Expiry Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={tbgExpiryDate} onChange={e => setTbgExpiryDate(e.target.value)} />
            </div>
          </div>

          {/* Sub Dt + Releases */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">TBG Sub Dt</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={tbgSubmittedDate} onChange={e => setTbgSubmittedDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">DEWA Release Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={tbgReleaseDateDewa} onChange={e => setTbgReleaseDateDewa(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Bank Release Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={tbgReleaseDateBank} onChange={e => setTbgReleaseDateBank(e.target.value)} />
            </div>
          </div>

          {/* TT / Doc / Remarks */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium">TT Ref</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2" value={ttRef} onChange={e => setTtRef(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">TT Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={ttDate} onChange={e => setTtDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Document Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={documentDate} onChange={e => setDocumentDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Remarks</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2" value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Counter Gtee Details */}
        <div className="rounded-md border p-4">
          <h2 className="mb-3 text-lg font-semibold">Counter Gtee Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium">Bank</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2" value={cgBank} onChange={e => setCgBank(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">CG No</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2" value={cgNo} onChange={e => setCgNo(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={cgDate} onChange={e => setCgDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Exp. Date</label>
              <input type="date" className="mt-1 w-full rounded-md border px-3 py-2" value={cgExpiryDate} onChange={e => setCgExpiryDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <label className="flex items-center gap-2"><input type="checkbox" checked={tenderBought} onChange={e => setTenderBought(e.target.checked)} /> Tender bought?</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={participated} onChange={e => setParticipated(e.target.checked)} /> Participated?</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={resultSaved} onChange={e => setResultSaved(e.target.checked)} /> Result saved?</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={evaluationsReceived} onChange={e => setEvaluationsReceived(e.target.checked)} /> Evaluation received?</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={memo} onChange={e => setMemo(e.target.checked)} /> Memo?</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={poCopies} onChange={e => setPoCopies(e.target.checked)} /> PO copies?</label>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving || !canSubmit} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={handleDelete} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
