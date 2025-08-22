// src/app/dashboard/pre_tender_clarification/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface PTC {
  pre_ptc_id: number
  tendering_companies_id: number
  pre_ptc_no: number
  pre_ptc_ref_no: string
  pre_ptc_date: string
  pre_ptc_received_date: string
  pre_ptc_reply_required_by: string
}

export default function PreTenderClarificationListPage() {
  const router = useRouter()
  const [items, setItems] = useState<PTC[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  useEffect(() => {
    fetch(`${API}/pre_tender_clarification`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: PTC[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<PTC>[] = [
    { key: 'pre_ptc_id', header: 'ID' },
    { key: 'tendering_companies_id', header: 'Tender-Company ID' },
    { key: 'pre_ptc_no', header: 'PTC No.' },
    { key: 'pre_ptc_ref_no', header: 'Ref No.' },
    { key: 'pre_ptc_date', header: 'Date' },
    { key: 'pre_ptc_received_date', header: 'Received' },
    { key: 'pre_ptc_reply_required_by', header: 'Reply By' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Pre-Tender Clarifications</h1>
        <button
          onClick={() => router.push('/dashboard/pre_tender_clarification/create')}
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
          idField="pre_ptc_id"
          linkPrefix="/dashboard/pre_tender_clarification"
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}
