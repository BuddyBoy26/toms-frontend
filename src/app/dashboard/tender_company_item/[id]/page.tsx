// src/app/dashboard/tender_company_item/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TC { tendering_companies_id: number }
interface TCI {
  id: number
  tendering_companies_id: number
  item_no_dewa: string
  discount_percent: number
}

export default function TCIEditPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [tci, setTci] = useState<TCI|null>(null)
  const [tcs, setTcs] = useState<TC[]>([])
  const [tcId, setTcId] = useState('')
  const [itemNo, setItemNo] = useState('')
  const [discount, setDiscount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tendering_companies`, { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
      fetch(`${API}/tender_company_item/${id}`,  { headers:{Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`}}).then(r=>r.json()),
    ]).then(([tcs, tci]: [TC[], TCI]) => {
      setTcs(tcs)
      setTci(tci)
      setTcId(String(tci.tendering_companies_id))
      setItemNo(tci.item_no_dewa)
      setDiscount(String(tci.discount_percent))
    }).catch(() => setError('Failed to load')).finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const tc = tcs.find(tc => String(tc.tendering_companies_id) === tcId)
    if (!tc) {
      setError('Select valid Tender-Company')
      setSaving(false)
      return
    }
    const payload = {
      tendering_companies_id: tc.tendering_companies_id,
      item_no_dewa: itemNo,
      discount_percent: parseFloat(discount),
    }
    const res = await fetch(`${API}/tender_company_item/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to save')
    } else {
      router.push('/dashboard/tender_company_item')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this record?')) return
    await fetch(`${API}/tender_company_item/${id}`, {
      method: 'DELETE',
      headers:{ Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}` }
    })
    router.push('/dashboard/tender_company_item')
  }

  if (loading) return <p>Loading…</p>
  if (!tci) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Tender Company Item #{tci.id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="tcSelect" className="block text-sm font-medium">Tender-Company ID</label>
          <input
            id="tcSelect"
            list="tcs"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={tcId}
            onChange={e => setTcId(e.target.value)}
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
