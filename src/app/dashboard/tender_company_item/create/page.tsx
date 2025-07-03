// src/app/dashboard/tender_company_item/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TC { tendering_companies_id: number; /* you may add display fields here */ }

export default function CreateTCIPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [tciId, setTciId] = useState('')
  const [itemNo, setItemNo] = useState('')
  const [discount, setDiscount] = useState('')
  const [tcs, setTcs] = useState<TC[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    fetch(`${API}/tendering_companies`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: TC[]) => setTcs(data))
      .catch(() => setError('Failed to load Tender-Company dropdown'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const tc = tcs.find(tc => String(tc.tendering_companies_id) === tciId)
    if (!tc) {
      setError('Please select a valid Tender-Company')
      setSaving(false)
      return
    }
    const payload = {
      tendering_companies_id: tc.tendering_companies_id,
      item_no_dewa: itemNo,
      discount_percent: parseFloat(discount),
    }
    const res = await fetch(`${API}/tender_company_item`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail||'Failed to create')
    } else {
      router.push('/dashboard/tender_company_item')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Tender Company Item</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="tcSelect" className="block text-sm font-medium">Tender-Company ID</label>
          <input
            id="tcSelect"
            list="tcs"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type ID…"
            value={tciId}
            onChange={e => setTciId(e.target.value)}
            required
          />
          <datalist id="tcs">
            {tcs.map(tc => (
              <option key={tc.tendering_companies_id} value={String(tc.tendering_companies_id)} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="itemNo" className="block text-sm font-medium">DEWA Item No.</label>
          <input
            id="itemNo"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={itemNo}
            onChange={e => setItemNo(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="discount" className="block text-sm font-medium">Discount %</label>
          <input
            id="discount"
            type="number"
            step="0.01"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
            required
          />
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
