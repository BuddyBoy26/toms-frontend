// src/app/dashboard/post_tender_clarification/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface PTC {
  ptc_id: number
  tendering_companies_id: number
  ptc_no: number
  ptc_ref_no: string
  ptc_date: string
  ptc_received_date: string
  ptc_reply_required_by: string
}

export default function PostTenderClarificationListPage() {
  const router = useRouter()
  const [items, setItems] = useState<PTC[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  useEffect(() => {
    fetch(`${API}/post_tender_clarification`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: PTC[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<PTC>[] = [
    { key: 'ptc_id', header: 'ID' },
    { key: 'tendering_companies_id', header: 'Tender-Company ID' },
    { key: 'ptc_no', header: 'PTC No.' },
    { key: 'ptc_ref_no', header: 'Ref No.' },
    { key: 'ptc_date', header: 'Date' },
    { key: 'ptc_received_date', header: 'Received' },
    { key: 'ptc_reply_required_by', header: 'Reply By' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Post-Tender Clarifications</h1>
        <button
          onClick={() => router.push('/dashboard/post_tender_clarification/create')}
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
          idField="ptc_id"
          linkPrefix="/dashboard/post_tender_clarification"
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}
