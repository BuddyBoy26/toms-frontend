// src/app/dashboard/tender/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

export interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
  tender_date: string
  closing_date: string | null
  tender_fees: number | null
  bond_guarantee_amt: number | null
}

export default function TenderListPage() {
  const router = useRouter()
  const [items, setItems] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  useEffect(() => {
    fetch(`${API}/tender`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Tender[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Tender>[] = [
    { key: 'tender_id', header: 'ID' },
    { key: 'tender_no', header: 'Tender No.' },
    { key: 'tender_description', header: 'Description' },
    { key: 'tender_date', header: 'Date' },
    { key: 'closing_date', header: 'Closing' },
  ]

  return (
    <div>
      {/* Header with Create button always visible */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tenders</h1>
        <button
          onClick={() => router.push('/dashboard/tender/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <p>Loading tenders…</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={items}
          columns={columns}
          idField="tender_id"
          linkPrefix="/dashboard/tender"
        />
      ) : (
        <p className="text-gray-600">No tenders found.</p>
      )}
    </div>
  )
}
