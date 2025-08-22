// src/app/dashboard/lot_monitoring/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Lot {
  lot_id: string
  order_item_detail_id: number
  shipment_no: string | null
  item_lot_no: string | null
  contractual_delivery_date: string | null
  actual_delivery_date: string | null
}

export default function LotMonitoringListPage() {
  const router = useRouter()
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  useEffect(() => {
    fetch(`${API}/lot_monitoring`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Lot[]) => setLots(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<Lot>[] = [
    { key: 'lot_id', header: 'Lot ID' },
    { key: 'order_item_detail_id', header: 'Order Item ID' },
    { key: 'shipment_no', header: 'Shipment No.' },
    { key: 'item_lot_no', header: 'Item Lot No.' },
    { key: 'contractual_delivery_date', header: 'Contractual Delivery' },
    { key: 'actual_delivery_date', header: 'Actual Delivery' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Lot Monitoring</h1>
        <button
          onClick={() => router.push('/dashboard/lot_monitoring/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading lots…</p>
      ) : lots.length > 0 ? (
        <CustomTable
          data={lots}
          columns={columns}
          idField="lot_id"
          linkPrefix="/dashboard/lot_monitoring"
        />
      ) : (
        <p className="text-gray-600">No lots found.</p>
      )}
    </div>
  )
}
