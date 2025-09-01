'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Item {
  item_id: number
  product_id: number
  item_description: string
  hs_code: string | null
}

interface Product {
  product_id: number
  product_name: string
}

interface ItemWithProduct extends Item {
  product_name: string
}

export default function ItemListPage() {
  const router = useRouter()
  const [items, setItems] = useState<ItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    Promise.all([
      fetch(`${API}/item_master`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(res => res.json()),
      fetch(`${API}/product_master`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(res => res.json()),
    ])
      .then(([itemsData, productsData]: [Item[], Product[]]) => {
        const merged = itemsData.map(item => {
          const product = productsData.find(p => p.product_id === item.product_id)
          return {
            ...item,
            product_name: product ? product.product_name : 'Unknown',
          }
        })
        setItems(merged)
        console.log(merged)
      })
      .finally(() => setLoading(false))
    
  }, [API])

  const columns: Column<ItemWithProduct>[] = [
    { key: 'item_id', header: 'ID' },
    { key: 'product_name', header: 'Product Name' },
    { key: 'item_description', header: 'Description' },
    { key: 'hs_code', header: 'HS Code' },
     // swapped out product_id
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Item Master</h1>
        <button
          onClick={() => router.push('/dashboard/item_master/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading items…</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={items}
          columns={columns}
          idField="item_id"
          linkPrefix="/dashboard/item_master"
        />
      ) : (
        <p className="text-gray-600">No items found.</p>
      )}
    </div>
  )
}
