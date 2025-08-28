// src/app/dashboard/product_master/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Product {
  product_id: number
  product_name: string
}

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)

  const [name, setName] = useState('')

  // Fetch product
  useEffect(() => {
    fetch(`${API}/product_master/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((prod: Product) => {
        setProduct(prod)
        setName(prod.product_name)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      product_name: name,
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
