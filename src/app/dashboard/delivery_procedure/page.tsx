// src/app/dashboard/delivery_procedure/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface DP {
  dp_id: number
  lot_id: string
  order_item_detail_id: number
  shipment_etd: string | null
  shipment_eta: string | null
  receive_shipping_docs_status: string | null
}

export default function DeliveryProcedureListPage() {
  const router = useRouter()
  const [items, setItems] = useState<DP[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  useEffect(() => {
    fetch(`${API}/delivery_procedure`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: DP[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<DP>[] = [
    { key: 'dp_id', header: 'ID' },
    { key: 'lot_id', header: 'Lot ID' },
    { key: 'order_item_detail_id', header: 'Order Item ID' },
    { key: 'shipment_etd', header: 'ETD' },
    { key: 'shipment_eta', header: 'ETA' },
    { key: 'receive_shipping_docs_status', header: 'Docs Status' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Delivery Procedures</h1>
        <button
          onClick={() => router.push('/dashboard/delivery_procedure/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={items}
          columns={columns}
          idField="dp_id"
          linkPrefix="/dashboard/delivery_procedure"
        />
      ) : (
        <p className="text-gray-600">No delivery procedures found.</p>
      )}
    </div>
  )
}
