// src/app/dashboard/tendering_companies/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

export interface TenderingCompany {
  tendering_companies_id: number
  company_id: number
  tender_id: number
  tender_receipt_no: string | null
  tbg_no: string | null
  tbg_issuing_bank: string | null
  tender_deposit_receipt_no: string | null
  cheque_no: string | null
  tt_ref: string | null
  tt_date: string | null
  document_date: string | null
  tbg_value: number | null
  tbg_expiry_date: string | null
  tbg_submitted_date: string | null
  tbg_release_date_dewa: string | null
  tbg_release_date_bank: string | null
  tender_extension_dates: string[] | null
  tendering_currency: string
  discount_percent: number | null
  remarks: string | null
  pending_status: string
}

export default function TenderingCompaniesListPage() {
  const router = useRouter()
  const [items, setItems] = useState<TenderingCompany[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    fetch(`${API}/tendering_companies`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: TenderingCompany[]) => setItems(data))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<TenderingCompany>[] = [
    { key: 'tendering_companies_id', header: 'ID' },
    { key: 'company_id', header: 'Company ID' },
    { key: 'tender_id', header: 'Tender ID' },
    { key: 'pending_status', header: 'Status' },
    { key: 'tendering_currency', header: 'Currency' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tendering Companies</h1>
        <button
          onClick={() => router.push('/dashboard/tendering_companies/create')}
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
          idField="tendering_companies_id"
          linkPrefix="/dashboard/tendering_companies"
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}
