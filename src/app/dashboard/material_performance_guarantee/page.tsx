// src/app/dashboard/material_performance_guarantee/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface MPG {
  mpg_id: number
  order_id: number
  mpg_no: string
  mpg_value: number
  mpg_expiry_date: string
  pending_status: string
}

export default function MPGListPage() {
  const router = useRouter()
  const [items, setItems] = useState<MPG[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  useEffect(() => {
    fetch(`${API}/material_performance_guarantee`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: MPG[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<MPG>[] = [
    { key: 'mpg_id', header: 'ID' },
    { key: 'mpg_no', header: 'MPG No.' },
    { key: 'mpg_value', header: 'Value' },
    { key: 'mpg_expiry_date', header: 'Expiry' },
    { key: 'pending_status', header: 'Status' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Material Performance Guarantees</h1>
        <button
          onClick={() => router.push('/dashboard/material_performance_guarantee/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
          idField="mpg_id"
          linkPrefix="/dashboard/material_performance_guarantee"
        />
      ) : (
        <p className="text-gray-600">No guarantees found.</p>
      )}
    </div>
  )
}
