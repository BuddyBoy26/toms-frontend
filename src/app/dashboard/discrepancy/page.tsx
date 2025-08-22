// src/app/dashboard/discrepancy/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Discrepancy {
  discrepancy_id: number
  lot_id: string
  dewa_letter_ref: string
  letter_date: string
  pending_quantity: number | null
  pending_status: boolean
}

export default function DiscrepancyListPage() {
  const router = useRouter()
  const [items, setItems] = useState<Discrepancy[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  useEffect(() => {
    fetch(`${API}/discrepancy`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Discrepancy[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<Discrepancy>[] = [
    { key: 'discrepancy_id', header: 'ID' },
    { key: 'lot_id', header: 'Lot ID' },
    { key: 'dewa_letter_ref', header: 'Letter Ref' },
    { key: 'letter_date', header: 'Date' },
    { key: 'pending_quantity', header: 'Pending Qty' },
    { key: 'pending_status', header: 'Open?' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Discrepancies</h1>
        <button
          onClick={() => router.push('/dashboard/discrepancy/create')}
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
          idField="discrepancy_id"
          linkPrefix="/dashboard/discrepancy"
        />
      ) : (
        <p className="text-gray-600">No discrepancies found.</p>
      )}
    </div>
  )
}
