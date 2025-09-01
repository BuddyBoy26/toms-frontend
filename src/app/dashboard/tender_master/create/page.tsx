'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type TenderType = 'public' | 'selected'

interface Product {
  product_id: number
  product_name: string
}

type ErrorDetail = { msg?: string; [key: string]: unknown }


export default function TenderCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tenderNo, setTenderNo] = useState('')
  const [tenderDescription, setTenderDescription] = useState('')
  const [tenderType, setTenderType] = useState<TenderType>('public')
  const [supplyProductId, setSupplyProductId] = useState<number | ''>('')
  const [invitationDate, setInvitationDate] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [bondAmount, setBondAmount] = useState<string>('')
  const [fees, setFees] = useState<string>('')

  useEffect(() => {
    fetch(`${API}/product_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Product[]) => setProducts(Array.isArray(data) ? data : []))
  }, [])

  const canSubmit = useMemo(() => {
    if (!tenderNo.trim() || !tenderDescription.trim()) return false
    if (!invitationDate || !closingDate) return false
    return new Date(closingDate) > new Date(invitationDate)
  }, [tenderNo, tenderDescription, invitationDate, closingDate])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError('Closing date must be after invitation date.')
      return
    }

    setSaving(true)

    const payload = {
      tender_no: tenderNo,
      tender_description: tenderDescription,
      tender_type: tenderType,
      supply_product_id: supplyProductId === '' ? null : Number(supplyProductId),
      tender_date: invitationDate, // ✅ backend expects tender_date
      closing_date: closingDate,   // ✅ required field
      bond_guarantee_amt: bondAmount === '' ? null : Number(bondAmount),
      tender_fees: fees === '' ? null : Number(fees),
    }

    const res = await fetch(`${API}/tender`, {
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
      const msg =
        Array.isArray(err?.detail)
          ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
          : typeof err?.detail === 'string'
          ? err.detail
          : 'Failed to create tender'
      setError(msg)
      return
    }

    router.push('/dashboard/tender_master')
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">Create Tender</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Tender No</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={tenderNo}
            onChange={e => setTenderNo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tender Description</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            value={tenderDescription}
            onChange={e => setTenderDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tender Type</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={tenderType}
            onChange={e => setTenderType(e.target.value as TenderType)}
          >
            <option value="public">Public</option>
            <option value="selected">Selected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Supply Of (Product)</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={supplyProductId}
            onChange={e =>
              setSupplyProductId(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">-- Select Product --</option>
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}
          </select>
        </div>

        {/* Dates inline */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Tender Invitation Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={invitationDate}
              onChange={e => setInvitationDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tender Closing Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={closingDate}
              onChange={e => setClosingDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Costs inline */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Tender Bond Amount (AED)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={bondAmount}
              onChange={e => setBondAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tender Fees (AED)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={fees}
              onChange={e => setFees(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
