// src/app/dashboard/item_master/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Product {
  product_id: number
  product_name: string
}

export default function CreateItemPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [description, setDescription] = useState('')
  const [hsCode, setHsCode] = useState('')
  const [productName, setProductName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/product_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch(() => setError('Failed to load products'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const chosen = products.find(p => p.product_name === productName)
    if (!chosen) {
      setError('Please select a valid product from the list')
      setSaving(false)
      return
    }

    const payload = {
      item_description: description,
      hs_code: hsCode,
      product_id: chosen.product_id,
    }

    const res = await fetch(`${API}/item_master`, {
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
      setError(err?.detail || 'Failed to create item')
      return
    }

    setSaved(true)
    setTimeout(() => router.push('/dashboard/item_master'), 800)
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Item</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="hsCode" className="block text-sm font-medium">
            HS Code
          </label>
          <input
            id="hsCode"
            type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={hsCode}
            onChange={e => setHsCode(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="productSelect" className="block text-sm font-medium">
            Product
          </label>
          <input
            id="productSelect"
            list="products"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search..."
            value={productName}
            onChange={e => setProductName(e.target.value)}
            required
          />
          <datalist id="products">
            {products.map(p => (
              <option key={p.product_id} value={p.product_name} />
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
