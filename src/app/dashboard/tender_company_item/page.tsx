// src/app/dashboard/tender_company_item/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface TCI {
  id: number
  tendering_companies_id: number
  item_no_dewa: string
  discount_percent: number
}

export default function TCIListPage() {
  const router = useRouter()
  const [items, setItems] = useState<TCI[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    fetch(`${API}/tender_company_item`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: TCI[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<TCI>[] = [
    { key: 'id', header: 'ID' },
    { key: 'tendering_companies_id', header: 'Tender-Company ID' },
    { key: 'item_no_dewa', header: 'DEWA Item No.' },
    { key: 'discount_percent', header: 'Discount %' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tender Company Items</h1>
        <button
          onClick={() => router.push('/dashboard/tender_company_item/create')}
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
          idField="id"
          linkPrefix="/dashboard/tender_company_item"
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}
