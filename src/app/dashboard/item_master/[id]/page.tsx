// src/app/dashboard/item_master/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Product {
  product_id: number
  product_name: string
}

interface Item {
  item_id: number
  item_description: string
  hs_code: string
  product_id: number
}

export default function ItemDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [item, setItem] = useState<Item | null>(null)

  const [description, setDescription] = useState('')
  const [hsCode, setHsCode] = useState('')
  const [productName, setProductName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/product_master`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(r => r.json()),
      fetch(`${API}/item_master/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(r => r.json()),
    ])
      .then(([prods, itm]: [Product[], Item]) => {
        setProducts(prods)
        setItem(itm)
        setDescription(itm.item_description)
        setHsCode(itm.hs_code)
        const prod = prods.find(p => p.product_id === itm.product_id)
        setProductName(prod ? prod.product_name : '')
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
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

    const res = await fetch(`${API}/item_master/${id}`, {
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
    if (!confirm('Delete this item?')) return
    await fetch(`${API}/item_master/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/item_master')
  }

  if (loading) return <p>Loading…</p>
  if (!item) return <p className="text-red-600">Item not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Item #{item.item_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
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
