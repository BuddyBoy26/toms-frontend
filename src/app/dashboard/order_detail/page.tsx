// src/app/dashboard/order_detail/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Order {
  order_id: number
  po_number: string
  order_description: string
  order_date: string
  order_value: number
  currency: string
  company_id: number
  tender_id: number
}

export default function OrderListPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    fetch(`${API}/order_detail`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Order[]) => setOrders(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<Order>[] = [
    { key: 'order_id', header: 'ID' },
    { key: 'po_number', header: 'PO Number' },
    { key: 'order_date', header: 'Date' },
    { key: 'order_value', header: 'Value' },
    { key: 'currency', header: 'Currency' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <button
          onClick={() => router.push('/dashboard/order_detail/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading orders…</p>
      ) : orders.length > 0 ? (
        <CustomTable
          data={orders}
          columns={columns}
          idField="order_id"
          linkPrefix="/dashboard/order_detail"
        />
      ) : (
        <p className="text-gray-600">No orders found.</p>
      )}
    </div>
  )
}
