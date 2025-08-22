// src/app/dashboard/order_item_detail/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface OrderItem {
  order_item_detail_id: number
  order_id: number
  item_id: number
  item_no_dewa: string
  item_quantity: number
  item_unit_price: number
  number_of_lots: number
}

export default function OrderItemListPage() {
  const router = useRouter()
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  useEffect(() => {
    fetch(`${API}/order_item_detail`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: OrderItem[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<OrderItem>[] = [
    { key: 'order_item_detail_id', header: 'ID' },
    { key: 'order_id', header: 'Order ID' },
    { key: 'item_id', header: 'Item ID' },
    { key: 'item_no_dewa', header: 'DEWA Item No.' },
    { key: 'item_quantity', header: 'Qty' },
    { key: 'item_unit_price', header: 'Unit Price' },
    { key: 'number_of_lots', header: 'Lots' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Item Details</h1>
        <button
          onClick={() => router.push('/dashboard/order_item_detail/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading order items…</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={items}
          columns={columns}
          idField="order_item_detail_id"
          linkPrefix="/dashboard/order_item_detail"
        />
      ) : (
        <p className="text-gray-600">No order items found.</p>
      )}
    </div>
  )
}
