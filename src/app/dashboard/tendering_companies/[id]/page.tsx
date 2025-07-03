// src/app/dashboard/tendering_companies/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
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
interface TC {
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
  tendering_currency: string
  discount_percent: number | null
  remarks: string | null
  pending_status: string
}

export default function TenderingCompanyDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // dropdown data
  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])

  // form state
  const [companyId, setCompanyId] = useState('')
  const [tenderId, setTenderId] = useState('')
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
  const [extensionDates, setExtensionDates] = useState('')
  const [currency, setCurrency] = useState(CurrencyOptions[0])
  const [discountPercent, setDiscountPercent] = useState('')
  const [remarks, setRemarks] = useState('')
  const [status, setStatus] = useState(StatusOptions[0])

  const parseDatesArray = (text: string) =>
    text.split(',').map(s => s.trim()).filter(Boolean)

  useEffect(() => {
    // load dropdowns
    fetch(`${API}/company_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => setError('Failed to load companies'))

    fetch(`${API}/tender`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Tender[]) => setTenders(data))
      .catch(() => setError('Failed to load tenders'))

    // load existing record
    fetch(`${API}/tendering_companies/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((d: TC) => {
        setCompanyId(String(d.company_id))
        setTenderId(String(d.tender_id))
        setReceiptNo(d.tender_receipt_no ?? '')
        setTbgNo(d.tbg_no ?? '')
        setTbgBank(d.tbg_issuing_bank ?? '')
        setDepositReceipt(d.tender_deposit_receipt_no ?? '')
        setChequeNo(d.cheque_no ?? '')
        setTtRef(d.tt_ref ?? '')
        setTtDate(d.tt_date ?? '')
        setDocDate(d.document_date ?? '')
        setTbgValue(d.tbg_value != null ? String(d.tbg_value) : '')
        setTbgExpiry(d.tbg_expiry_date ?? '')
        setTbgSubmitted(d.tbg_submitted_date ?? '')
        setTbgReleaseDewa(d.tbg_release_date_dewa ?? '')
        setTbgReleaseBank(d.tbg_release_date_bank ?? '')
        setExtensionDates(d.tender_extension_dates?.join(', ') ?? '')
        setCurrency(d.tendering_currency)
        setDiscountPercent(d.discount_percent != null ? String(d.discount_percent) : '')
        setRemarks(d.remarks ?? '')
        setStatus(d.pending_status)
      })
      .catch(() => setError('Failed to load record'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

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
      tender_extension_dates: extensionDates ? parseDatesArray(extensionDates) : null,
      tendering_currency: currency,
      discount_percent: discountPercent ? parseFloat(discountPercent) : null,
      remarks: remarks || null,
      pending_status: status,
    }

    const res = await fetch(`${API}/tendering_companies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to save')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this record?')) return
    await fetch(`${API}/tendering_companies/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/tendering_companies')
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Tendering Company #{id}</h1>
      <form onSubmit={handleSave} className="space-y-4">
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

        {/* Optional string fields */}
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

        {/* Date fields */}
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

        {/* Numeric fields */}
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
                <option key={c} value={c}>{c}</option>
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
                <option key={s} value={s}>{s}</option>
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
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
