// src/app/dashboard/material_performance_guarantee/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Order { order_id: number; po_number: string }
interface MPGStatus { value: string }

const STATUS_OPTIONS: MPGStatus[] = [
  { value: 'NOT Issued' },
  { value: 'Issued / Extended' },
  { value: 'Extension Required' },
  { value: 'NOT Released' },
  { value: 'Released' },
]

export default function CreateMPGPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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
  const [status, setStatus] = useState(STATUS_OPTIONS[0].value)

  const [orders, setOrders] = useState<Order[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const parseDateArray = (txt: string) =>
    txt.split(',').map(s => s.trim()).filter(Boolean)

  useEffect(() => {
    fetch(`${API}/order_detail`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Order[]) => setOrders(data))
      .catch(() => setError('Failed to load orders'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const ord = orders.find(o => o.po_number === orderNo)
    if (!ord) {
      setError('Select a valid Order (PO#)')
      setSaving(false)
      return
    }

    const payload = {
      order_id: ord.order_id,
      mpgNo,
      mpg_issuing_bank: issuingBank || null,
      mpg_deposit_receipt_no: depositReceipt || null,
      cheque_no: chequeNo || null,
      tt_date: ttDate || null,
      document_date: docDate || null,
      mpg_value: parseFloat(value),
      mpg_expiry_date: expiryDate,
      mpg_submitted_date: submittedDate || null,
      mpg_return_date: returnDate || null,
      mpg_release_date_dewa: releaseDewa || null,
      mpg_release_date_bank: releaseBank || null,
      mpg_extension_dates: extensionDates
        ? parseDateArray(extensionDates)
        : null,
      remarks: remarks || null,
      pending_status: status,
    }

    const res = await fetch(`${API}/material_performance_guarantee`, {
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
      setError(err?.detail || 'Failed to create')
    } else {
      router.push('/dashboard/material_performance_guarantee')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create MPG</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        {/* Order selector */}
        <div>
          <label className="block text-sm font-medium">Order (PO#)</label>
          <input
            list="orders"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search…"
            value={orderNo}
            onChange={e => setOrderNo(e.target.value)}
            required
          />
          <datalist id="orders">
            {orders.map(o => (
              <option key={o.order_id} value={o.po_number} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium">MPG No.</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={mpgNo}
            onChange={e => setMpgNo(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Issuing Bank</label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={issuingBank}
              onChange={e => setIssuingBank(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Deposit Receipt No.</label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={depositReceipt}
              onChange={e => setDepositReceipt(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Cheque No.</label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={chequeNo}
              onChange={e => setChequeNo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">TT Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={ttDate}
              onChange={e => setTtDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Document Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={docDate}
              onChange={e => setDocDate(e.target.value)}
            />
          </div>
          <div>  
            <label className="block text-sm font-medium">MPG Value</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={value}
              onChange={e => setValue(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Expiry Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Submitted Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={submittedDate}
              onChange={e => setSubmittedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Return Date</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Release Date (DEWA)</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={releaseDewa}
              onChange={e => setReleaseDewa(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Release Date (Bank)</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={releaseBank}
              onChange={e => setReleaseBank(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Extension Dates (comma-separated)
            </label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={extensionDates}
              onChange={e => setExtensionDates(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Remarks</label>
          <textarea
            rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Pending Status</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>
                {s.value}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
