// src/app/dashboard/product_master/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Product {
  product_id: number
  product_name: string
  company_id: number
}

export default function ProductListPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  useEffect(() => {
    fetch(`${API}/product_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Product[]) => setProducts(data))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Product>[] = [
    { key: 'product_id', header: 'ID' },
    { key: 'product_name', header: 'Product Name' },
    { key: 'company_id', header: 'Company ID' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Product Master</h1>
        <button
          onClick={() => router.push('/dashboard/product_master/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <p>Loading products…</p>
      ) : products.length > 0 ? (
        <CustomTable
          data={products}
          columns={columns}
          idField="product_id"
          linkPrefix="/dashboard/product_master"
        />
      ) : (
        <p className="text-gray-600">No products found.</p>
      )}
    </div>
  )
}
