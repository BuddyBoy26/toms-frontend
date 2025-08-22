'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Drawing {
  id: number
  tender_no: string
  order_id: string
  drawing_no?: string
  drawing_version?: string
  submission_date?: string
  revision?: string
  approval_date?: string
  sent_date?: string
}

export default function DrawingListPage() {
  const router = useRouter()
  const [items, setItems] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  useEffect(() => {
    fetch(`${API}/drawing_details`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
      .then(res => res.json())
      .then((data: Drawing[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading drawings…</p>
  if (!items.length) return <p>No drawing details found.</p>

  const columns: Column<Drawing>[] = [
    { key: 'tender_no', header: 'Tender No' },
    { key: 'order_id', header: 'Order ID' },
    { key: 'drawing_no', header: 'Drawing No' },
    { key: 'drawing_version', header: 'Version' },
    { key: 'submission_date', header: 'Submitted' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Drawing Details</h1>
        <button
          onClick={() => router.push('/dashboard/drawing_details/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>

      <CustomTable
        data={items}
        columns={columns}
        idField="id"
        linkPrefix="/dashboard/drawing_details"
      />
    </div>
  )
}
