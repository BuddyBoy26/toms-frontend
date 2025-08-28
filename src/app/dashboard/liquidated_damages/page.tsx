// src/app/dashboard/liquidated_damages/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface LD {
  ld_id: number
  lot_id: string
  lot_qty: number
  actual_delivery_date: string | null
}

export default function LDListPage() {
  const router = useRouter()
  const [items, setItems] = useState<LD[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    fetch(`${API}/liquidated_damages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: LD[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<LD>[] = [
    { key: 'ld_id', header: 'ID' },
    { key: 'lot_id', header: 'Lot ID' },
    { key: 'lot_qty', header: 'Quantity' },
    { key: 'actual_delivery_date', header: 'Delivered On' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Liquidated Damages</h1>
        <button
          onClick={() => router.push('/dashboard/liquidated_damages/create')}
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
          idField="ld_id"
          linkPrefix="/dashboard/liquidated_damages"
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}
