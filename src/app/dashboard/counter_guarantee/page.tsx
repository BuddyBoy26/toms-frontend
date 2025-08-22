// src/app/dashboard/counter_guarantee/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface CG {
  cg_id: number
  guarantee_type: string
  guarantee_ref_number: string
  cg_date: string
  issuing_bank: string | null
  expiry_date: string
  release_date_bank: string | null
  pending_status: string
}

export default function CounterGuaranteeListPage() {
  const router = useRouter()
  const [items, setItems] = useState<CG[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  useEffect(() => {
    fetch(`${API}/counter_guarantee`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: CG[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<CG>[] = [
    { key: 'cg_id', header: 'ID' },
    { key: 'guarantee_type', header: 'Type' },
    { key: 'guarantee_ref_number', header: 'Ref #' },
    { key: 'cg_date', header: 'Date' },
    { key: 'expiry_date', header: 'Expiry' },
    { key: 'pending_status', header: 'Status' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Counter Guarantees</h1>
        <button
          onClick={() => router.push('/dashboard/counter_guarantee/create')}
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
          idField="cg_id"
          linkPrefix="/dashboard/counter_guarantee"
        />
      ) : (
        <p className="text-gray-600">No counter guarantees found.</p>
      )}
    </div>
  )
}
