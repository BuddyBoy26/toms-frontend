// src/app/dashboard/tendering_companies/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'
type PendingStatusEnum = 'To be released' | 'In effect' | 'Released (By DEWA)'
type BondMode = 'TBG' | 'Tender Deposit'

interface Company { company_id: number; company_name: string }
interface Tender  { tender_id: number; tender_no: string; tender_description: string }
interface Product { product_id: number; product_name: string }

export default function TCompanyCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? ''

  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders]     = useState<Tender[]>([])
  const [products, setProducts]   = useState<Product[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [tenderId, setTenderId]   = useState<number | ''>('')
  const [companyId, setCompanyId] = useState<number | ''>('')

  const [tenderReceiptNo, setTenderReceiptNo] = useState('')
  const [debitAdviceNo,  setDebitAdviceNo]    = useState('')

  const [supplyProductId, setSupplyProductId] = useState<number | ''>('')

  const [bondMode, setBondMode]   = useState<BondMode>('TBG')
  const [tbgNo, setTbgNo]         = useState('')
  const [tbgIssuingBank, setTbgIssuingBank] = useState('')
  const [tbgCurrency, setTbgCurrency]       = useState<CurrencyEnum>('AED')
  const [tenderDepositReceiptNo, setTenderDepositReceiptNo] = useState('')

  const [tbgValue, setTbgValue]                 = useState<string>('')
  const [tbgExpiryDate, setTbgExpiryDate]       = useState('')
  const [tbgSubmittedDate, setTbgSubmittedDate] = useState('')
  const [tbgReleaseDateDewa, setTbgReleaseDateDewa] = useState('')
  const [tbgReleaseDateBank, setTbgReleaseDateBank] = useState('')

  const [ttRef, setTtRef]               = useState('')
  const [ttDate, setTtDate]             = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [remarks, setRemarks]           = useState('')

  const [pendingStatus, setPendingStatus] = useState<PendingStatusEnum>('To be released')
  const [discountPercent, setDiscountPercent] = useState<string>('')

  const [tenderBought, setTenderBought]               = useState(false)
  const [participated, setParticipated]               = useState(false)
  const [resultSaved, setResultSaved]                 = useState(false)
  const [evaluationsReceived, setEvaluationsReceived] = useState(false)
  const [memo, setMemo]                               = useState(false)
  const [poCopies, setPoCopies]                       = useState(false)

  const [cgBank, setCgBank]         = useState('')
  const [cgNo, setCgNo]             = useState('')
  const [cgDate, setCgDate]         = useState('')
  const [cgExpiryDate, setCgExpiryDate] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token') || ''
    Promise.all([
      fetch(`${API}/tender`,         { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/company_master`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/product_master`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
    ])
      .then(([ts, cs, ps]) => {
        setTenders(Array.isArray(ts) ? ts as Tender[] : [])
        setCompanies(Array.isArray(cs) ? cs as Company[] : [])
        setProducts(Array.isArray(ps) ? ps as Product[] : [])
      })
      .catch(() => setError('Failed to load dropdown data'))
  }, [API])

  const supplyProductName = useMemo(() => {
    if (supplyProductId === '') return ''
    return products.find(x => x.product_id === Number(supplyProductId))?.product_name ?? ''
  }, [supplyProductId, products])

  const tenderDescriptionDisplay = useMemo(
    () => (supplyProductName ? `SUPPLY OF ${supplyProductName}` : ''),
    [supplyProductName]
  )

  const canSubmit = useMemo(() => !!tenderId && !!companyId, [tenderId, companyId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) { setError('Please select Tender and Tenderer.'); return }
    setSaving(true); setError(null)

    const token = localStorage.getItem('kkabbas_token') || ''
    const payload = {
      tender_id: Number(tenderId),
      company_id: Number(companyId),

      tender_receipt_no: tenderReceiptNo || null,
      debit_advice_no:  debitAdviceNo  || null,

      tbg_no:               bondMode === 'TBG' ? (tbgNo || null) : null,
      tbg_issuing_bank:     bondMode === 'TBG' ? (tbgIssuingBank || null) : null,
      tendering_currency:   bondMode === 'TBG' ? tbgCurrency : 'AED',
      tender_deposit_receipt_no: bondMode === 'Tender Deposit' ? (tenderDepositReceiptNo || null) : null,

      tbg_value:               tbgValue === '' ? null : Number(tbgValue),
      tbg_expiry_date:         tbgExpiryDate || null,
      tbg_submitted_date:      tbgSubmittedDate || null,
      tbg_release_date_dewa:   tbgReleaseDateDewa || null,
      tbg_release_date_bank:   tbgReleaseDateBank || null,

      tt_ref:        ttRef || null,
      tt_date:       ttDate || null,
      document_date: documentDate || null,
      remarks:       remarks || null,

      discount_percent: discountPercent === '' ? null : Number(discountPercent),
      pending_status:   pendingStatus,

      tender_bought:           tenderBought,
      participated,
      result_saved:            resultSaved,
      evaluations_received:    evaluationsReceived,
      memo,
      po_copies:               poCopies,

      cg_bank:       cgBank || null,
      cg_no:         cgNo || null,
      cg_date:       cgDate || null,
      cg_expiry_date: cgExpiryDate || null,
    }

    const res = await fetch(`${API}/tendering_companies/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(typeof err?.detail === 'string' ? err.detail : `Create failed (${res.status})`)
      return
    }
    router.push('/dashboard/tendering_companies')
  }

  const onSelectNumber =
    (setter: (v: number | '') => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value
      setter(v === '' ? '' : Number(v))
    }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold">TENDERING DETAILS</h1>

      <form onSubmit={handleCreate} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        {/* Tender / Company / Receipt / Advice */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Tender */}
          <div>
            <label className="block text-sm font-medium">Tender</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={tenderId}
              onChange={onSelectNumber(setTenderId)}
            >
              <option value="">-- Select Tender --</option>
              {tenders.map(t => (
                <option key={t.tender_id} value={t.tender_id}>{t.tender_no}</option>
              ))}
            </select>
          </div>
          {/* Company */}
          <div>
            <label className="block text-sm font-medium">Tenderer</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={companyId}
              onChange={onSelectNumber(setCompanyId)}
            >
              <option value="">-- Select Company --</option>
              {companies.map(c => (
                <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          {/* Receipt */}
          <div>
            <label className="block text-sm font-medium">Tender Receipt No</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={tenderReceiptNo}
              onChange={e => setTenderReceiptNo(e.target.value)}
            />
          </div>
          {/* Advice */}
          <div>
            <label className="block text-sm font-medium">Debit Advice No.</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={debitAdviceNo}
              onChange={e => setDebitAdviceNo(e.target.value)}
            />
          </div>
        </div>

        {/* Description / Supply Product */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Tender Description : SUPPLY OF</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 bg-gray-50"
              value={tenderDescriptionDisplay}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium">SUPPLY OF (Product)</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={supplyProductId}
              onChange={onSelectNumber(setSupplyProductId)}
            >
              <option value="">-- Select Product --</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pending Status & Discount */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Pending Status</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={pendingStatus}
              onChange={e => setPendingStatus(e.target.value as PendingStatusEnum)}
            >
              <option value="To be released">To be released</option>
              <option value="In effect">In effect</option>
              <option value="Released (By DEWA)">Released (By DEWA)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Discount %</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={discountPercent}
              onChange={e => setDiscountPercent(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
        </div>

        {/* TBG / Deposit block */}
        <div className="rounded-md border p-4">
          <div className="mb-3 flex items-end gap-4">
            <h2 className="text-lg font-semibold">TBG Details</h2>
            <div className="ml-auto">
              <label className="block text-sm font-medium">Tender Bond / Deposit</label>
              <select
                className="mt-1 rounded-md border px-3 py-2"
                value={bondMode}
                onChange={e => setBondMode(e.target.value as BondMode)}
              >
                <option value="TBG">TBG</option>
                <option value="Tender Deposit">Tender Deposit</option>
              </select>
            </div>
          </div>

          {bondMode === 'TBG' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">TBG No</label>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={tbgNo}
                  onChange={e => setTbgNo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Issuing Bank</label>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={tbgIssuingBank}
                  onChange={e => setTbgIssuingBank(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">TBG Curr</label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={tbgCurrency}
                  onChange={e => setTbgCurrency(e.target.value as CurrencyEnum)}
                >
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
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={tenderDepositReceiptNo}
                  onChange={e => setTenderDepositReceiptNo(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">TBG Value</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={tbgValue}
                onChange={e => setTbgValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">TBG Expiry Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={tbgExpiryDate}
                onChange={e => setTbgExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">TBG Sub Dt</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={tbgSubmittedDate}
                onChange={e => setTbgSubmittedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">DEWA Release Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={tbgReleaseDateDewa}
                onChange={e => setTbgReleaseDateDewa(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Bank Release Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={tbgReleaseDateBank}
                onChange={e => setTbgReleaseDateBank(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium">TT Ref</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={ttRef}
                onChange={e => setTtRef(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">TT Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={ttDate}
                onChange={e => setTtDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Document Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={documentDate}
                onChange={e => setDocumentDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Remarks</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Counter Guarantee */}
        <div className="rounded-md border p-4">
          <h2 className="mb-3 text-lg font-semibold">Counter Gtee Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium">Bank</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={cgBank}
                onChange={e => setCgBank(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">CG No</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={cgNo}
                onChange={e => setCgNo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={cgDate}
                onChange={e => setCgDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Exp. Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={cgExpiryDate}
                onChange={e => setCgExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tenderBought} onChange={e => setTenderBought(e.target.checked)} /> Tender bought?
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={participated} onChange={e => setParticipated(e.target.checked)} /> Participated?
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={resultSaved} onChange={e => setResultSaved(e.target.checked)} /> Result saved?
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={evaluationsReceived} onChange={e => setEvaluationsReceived(e.target.checked)} /> Evaluation received?
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={memo} onChange={e => setMemo(e.target.checked)} /> Memo?
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={poCopies} onChange={e => setPoCopies(e.target.checked)} /> PO copies?
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/tendering_companies')}
            className="rounded-md border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
