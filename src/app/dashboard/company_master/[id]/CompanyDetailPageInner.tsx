// src/app/dashboard/company_master/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'

interface Product {
  product_id: number
  product_name: string
}

interface Company {
  company_id: number
  company_name: string
  business_description: string
  products?: Product[]
}

export default function CompanyDetailPageInner() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [company, setCompany] = useState<Company | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')

  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    setToken(localStorage.getItem('kkabbas_token'))
  }, [])

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch(`${API}/company_master/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${API}/product_master`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ])
      .then(([comp, prods]: [Company, Product[]]) => {
        const safeCompany: Company = {
          ...comp,
          products: Array.isArray((comp as Company).products) ? (comp as Company).products : [],
        }
        setCompany(safeCompany)
        setAllProducts(prods)
        setName(safeCompany.company_name)
        setDesc(safeCompany.business_description)
      })
      .finally(() => setLoading(false))
  }, [API, id, token])

  const saveCompany = async (updated: Company) => {
    if (!token) return
    setSaving(true)
    await fetch(`${API}/company_master/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company_name: updated.company_name,
        business_description: updated.business_description,
        product_ids: (Array.isArray(updated.products) ? updated.products : []).map(p => p.product_id),
      }),
    })
    setSaving(false)
    setCompany({
      ...updated,
      products: Array.isArray(updated.products) ? updated.products : [],
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    await saveCompany({
      ...company,
      company_name: name,
      business_description: desc,
    })
  }

  const handleDelete = async () => {
    if (!token) return
    if (!confirm('Delete this company?')) return
    await fetch(`${API}/company_master/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    router.push('/dashboard/company_master')
  }

  const handleAddProduct = async () => {
    if (!selectedProductId || !company) return
    const productToAdd = allProducts.find(p => p.product_id === Number(selectedProductId))
    if (!productToAdd) return
    const currentProducts = Array.isArray(company.products) ? company.products : []
    const exists = currentProducts.find(cp => cp.product_id === productToAdd.product_id)
    if (exists) {
      setSelectedProductId('')
      return
    }
    const updatedCompany: Company = {
      ...company,
      products: [...currentProducts, productToAdd],
    }
    await saveCompany(updatedCompany)
    setSelectedProductId('')
  }

  const handleRemoveProduct = async (productId: number) => {
    if (!company) return
    const currentProducts = Array.isArray(company.products) ? company.products : []
    const updatedCompany: Company = {
      ...company,
      products: currentProducts.filter(p => p.product_id !== productId),
    }
    await saveCompany(updatedCompany)
  }

  const companyProducts: Product[] = useMemo(
    () => (Array.isArray(company?.products) ? company!.products : []),
    [company]
  )

  const selectableProducts: Product[] = useMemo(() => {
    if (!companyProducts.length) return allProducts
    return allProducts.filter(
      p => !companyProducts.find(cp => cp.product_id === p.product_id)
    )
  }, [allProducts, companyProducts])

  if (loading) return <p>Loading company…</p>
  if (!company) return <p>Company not found.</p>

  const productColumns: Column<Product>[] = [
    { key: 'product_id', header: 'ID' },
    { key: 'product_name', header: 'Product Name' },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Company #{company.company_id}</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full px-3 py-2 border rounded-md"
              rows={4}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Products</h2>

        <div className="flex items-center space-x-2 mb-4">
          <select
            className="px-3 py-2 border rounded-md"
            value={selectedProductId}
            onChange={e => setSelectedProductId(Number(e.target.value))}
          >
            <option value="">-- Select Product --</option>
            {selectableProducts.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddProduct}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add
          </button>
        </div>

        <CustomTable
          data={companyProducts}
          columns={productColumns}
          idField="product_id"
          linkPrefix="/dashboard/product_master"
        />

        <ul className="mt-4 space-y-2">
          {companyProducts.map(p => (
            <li key={p.product_id} className="flex justify-between">
              <span>{p.product_name}</span>
              <button
                onClick={() => handleRemoveProduct(p.product_id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
