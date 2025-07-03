// src/app/dashboard/product_master/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Company {
  company_id: number
  company_name: string
}

interface Product {
  product_id: number
  product_name: string
  company_id: number
}

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [product, setProduct] = useState<Product | null>(null)

  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Fetch companies and product
  useEffect(() => {
    Promise.all([
      fetch(`${API}/company_master`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(res => res.json()),
      fetch(`${API}/product_master/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(res => res.json()),
    ])
      .then(([comps, prod]: [Company[], Product]) => {
        setCompanies(comps)
        setProduct(prod)
        setName(prod.product_name)
        const comp = comps.find(c => c.company_id === prod.company_id)
        setCompanyName(comp ? comp.company_name : '')
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
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

    const res = await fetch(`${API}/product_master/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to save changes')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return
    await fetch(`${API}/product_master/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/product_master')
  }

  if (loading) return <p>Loading…</p>
  if (!product) return <p className="text-red-600">Product not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Product #{product.product_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving || saved}
            className={`flex-1 py-2 rounded-md font-semibold transition ${
              saved
                ? 'bg-gray-400 text-white cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
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
