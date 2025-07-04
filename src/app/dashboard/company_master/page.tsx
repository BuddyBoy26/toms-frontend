// src/app/dashboard/company_master/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface Company {
  company_id: number
  company_name: string
  business_description: string
}

export default function CompanyListPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  useEffect(() => {
    fetch(`${API}/company_master`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
      .then(res => res.json())
      .then((data: Company[]) => setCompanies(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading companies…</p>
  if (!companies.length) return <p>No companies found.</p>

  const columns: Column<Company>[] = [
    { key: 'company_id', header: 'ID' },
    { key: 'company_name', header: 'Name' },
    { key: 'business_description', header: 'Description' },
  ]

  return (
    <div>
      {/* Header with Create button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Company Master</h1>
        <button
          onClick={() => router.push('/dashboard/company_master/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>

      <CustomTable
        data={companies}
        columns={columns}
        idField="company_id"
        linkPrefix="/dashboard/company_master"
      />
    </div>
  )
}
