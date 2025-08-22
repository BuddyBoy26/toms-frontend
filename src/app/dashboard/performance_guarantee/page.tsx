// src/app/dashboard/performance_guarantee/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface PG {
  pg_id: number
  order_id: number
  pg_no: string
  pg_value: number
  pg_expiry_date: string
  pending_status: string
}

export default function PGListPage() {
  const router = useRouter()
  const [items, setItems] = useState<PG[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  useEffect(() => {
    fetch(`${API}/performance_guarantee`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: PG[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<PG>[] = [
    { key: 'pg_id', header: 'ID' },
    { key: 'pg_no', header: 'PG No.' },
    { key: 'pg_value', header: 'Value' },
    { key: 'pg_expiry_date', header: 'Expiry' },
    { key: 'pending_status', header: 'Status' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Performance Guarantees</h1>
        <button
          onClick={() => router.push('/dashboard/performance_guarantee/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <p>Loading guarantees…</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={items}
          columns={columns}
          idField="pg_id"
          linkPrefix="/dashboard/performance_guarantee"
        />
      ) : (
        <p className="text-gray-600">No guarantees found.</p>
      )}
    </div>
  )
}
