// src/app/dashboard/product_master/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Company {
  company_id: number
  company_name: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch companies for the dropdown
  useEffect(() => {
    fetch(`${API}/company_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => setError('Failed to load companies'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const chosen = companies.find(c => c.company_name === companyName)
    if (!chosen) {
      setError('Please select a valid company from the list')
      setSaving(false)
      return
    }

    const payload = {
      product_name: name,
      company_id: chosen.company_id,
    }

    const res = await fetch(`${API}/product_master`, {
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
      setError(err?.detail || 'Failed to create product')
      return
    }

    setSaved(true)
    setTimeout(() => router.push('/dashboard/product_master'), 800)
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="productName" className="block text-sm font-medium">
            Product Name
          </label>
          <input
            id="productName"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="companySelect" className="block text-sm font-medium">
            Company
          </label>
          <input
            id="companySelect"
            list="companies"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search..."
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
          />
          <datalist id="companies">
            {companies.map(c => (
              <option key={c.company_id} value={c.company_name} />
            ))}
          </datalist>
        </div>

        <button
          type="submit"
          disabled={saving || saved}
          className={`w-full py-2 rounded-md font-semibold transition ${
            saved
              ? 'bg-gray-400 text-white cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Creating…' : saved ? 'Saved' : 'Create'}
        </button>
      </form>
    </div>
  )
}
