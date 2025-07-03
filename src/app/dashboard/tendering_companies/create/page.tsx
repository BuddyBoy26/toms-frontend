// src/app/dashboard/tendering_companies/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const CurrencyOptions = ['AED', 'EUR', 'USD']
const StatusOptions = ['To be released', 'In effect', 'Released (By DEWA)']

interface Company {
  company_id: number
  company_name: string
}
interface Tender {
  tender_id: number
  tender_no: string
}

export default function CreateTenderingCompanyPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  // required FK fields
  const [companyId, setCompanyId] = useState('')
  const [tenderId, setTenderId] = useState('')
  // optional fields
  const [receiptNo, setReceiptNo] = useState('')
  const [tbgNo, setTbgNo] = useState('')
  const [tbgBank, setTbgBank] = useState('')
  const [depositReceipt, setDepositReceipt] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [ttRef, setTtRef] = useState('')
  const [ttDate, setTtDate] = useState('')
  const [docDate, setDocDate] = useState('')
  const [tbgValue, setTbgValue] = useState('')
  const [tbgExpiry, setTbgExpiry] = useState('')
  const [tbgSubmitted, setTbgSubmitted] = useState('')
  const [tbgReleaseDewa, setTbgReleaseDewa] = useState('')
  const [tbgReleaseBank, setTbgReleaseBank] = useState('')
  const [extensionDates, setExtensionDates] = useState<string>('')
  const [currency, setCurrency] = useState(CurrencyOptions[0])
  const [discountPercent, setDiscountPercent] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState(StatusOptions[0])

  // dropdown data
  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // fetch companies and tenders
    fetch(`${API}/company_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => setError('Failed to load companies'))

    fetch(`${API}/tender`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Tender[]) => setTenders(data))
      .catch(() => setError('Failed to load tenders'))
  }, [API])

  const parseDatesArray = (text: string) =>
    text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      company_id: parseInt(companyId, 10),
      tender_id: parseInt(tenderId, 10),
      tender_receipt_no: receiptNo || null,
      tbg_no: tbgNo || null,
      tbg_issuing_bank: tbgBank || null,
      tender_deposit_receipt_no: depositReceipt || null,
      cheque_no: chequeNo || null,
      tt_ref: ttRef || null,
      tt_date: ttDate || null,
      document_date: docDate || null,
      tbg_value: tbgValue ? parseFloat(tbgValue) : null,
      tbg_expiry_date: tbgExpiry || null,
      tbg_submitted_date: tbgSubmitted || null,
      tbg_release_date_dewa: tbgReleaseDewa || null,
      tbg_release_date_bank: tbgReleaseBank || null,
      tender_extension_dates: extensionDates
        ? parseDatesArray(extensionDates)
        : null,
      tendering_currency: currency,
      discount_percent: discountPercent
        ? parseFloat(discountPercent)
        : null,
      remarks: remarks || null,
      pending_status: status,
    }

    const res = await fetch(`${API}/tendering_companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create record')
    } else {
      router.push('/dashboard/tendering_companies')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Tendering Company</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {/* Company dropdown */}
        <div>
          <label className="block text-sm font-medium">Company</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            required
          >
            <option value="">Select company…</option>
            {companies.map(c => (
              <option key={c.company_id} value={c.company_id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        {/* Tender dropdown */}
        <div>
          <label className="block text-sm font-medium">Tender</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={tenderId}
            onChange={e => setTenderId(e.target.value)}
            required
          >
            <option value="">Select tender…</option>
            {tenders.map(t => (
              <option key={t.tender_id} value={t.tender_id}>
                {t.tender_no}
              </option>
            ))}
          </select>
        </div>

        {/* Optional String Fields */}
{(
  [
    ['Tender Receipt No.', receiptNo, setReceiptNo],
    ['TBG No.', tbgNo, setTbgNo],
    ['TBG Issuing Bank', tbgBank, setTbgBank],
    ['Deposit Receipt No.', depositReceipt, setDepositReceipt],
    ['Cheque No.', chequeNo, setChequeNo],
    ['TT Ref', ttRef, setTtRef],
    ['Remarks', remarks, setRemarks],
  ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]
).map(([label, val, setter]) => (
  <div key={label}>
    <label className="block text-sm font-medium">{label}</label>
    <input
      className="mt-1 w-full px-3 py-2 border rounded-md"
      value={val}
      onChange={e => setter(e.target.value)}
    />
  </div>
))}


        {/* Dates */}
        {(
  [
    ['TT Date', ttDate, setTtDate],
    ['Document Date', docDate, setDocDate],
    ['TBG Expiry Date', tbgExpiry, setTbgExpiry],
    ['TBG Submitted Date', tbgSubmitted, setTbgSubmitted],
    ['TBG Release Date (DEWA)', tbgReleaseDewa, setTbgReleaseDewa],
    ['TBG Release Date (Bank)', tbgReleaseBank, setTbgReleaseBank],
  ] as [string, string, React.Dispatch<React.SetStateAction<string>>][]
).map(([label, val, setter]) => (
  <div key={label}>
    <label className="block text-sm font-medium">{label}</label>
    <input
      type="date"
      className="mt-1 w-full px-3 py-2 border rounded-md"
      value={val}
      onChange={e => setter(e.target.value)}
    />
  </div>
))}


        {/* Numeric */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">TBG Value</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={tbgValue}
              onChange={e => setTbgValue(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Discount Percent</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={discountPercent}
              onChange={e => setDiscountPercent(e.target.value)}
            />
          </div>
        </div>

        {/* Extension Dates */}
        <div>
          <label className="block text-sm font-medium">
            Extension Dates (comma-separated YYYY-MM-DD)
          </label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={extensionDates}
            onChange={e => setExtensionDates(e.target.value)}
          />
        </div>

        {/* Enums */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Currency</label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              {CurrencyOptions.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Pending Status</label>
            <select
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {StatusOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
