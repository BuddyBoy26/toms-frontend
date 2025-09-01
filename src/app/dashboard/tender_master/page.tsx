'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

type TenderType = 'public' | 'selected'

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
  tender_date: string | null
  closing_date: string | null
  tender_fees: number | null
  bond_guarantee_amt: number | null
  tender_type: TenderType
  extension_dates?: string[] | null
}

export default function TenderListPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [rows, setRows] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    fetch(`${API}/tender`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) throw new Error(`Failed to load tenders (${r.status})`)
        return r.json()
      })
      .then((data: Tender[]) => setRows(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<Tender>[] = [
    { key: 'tender_id', header: 'ID' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'tender_description', header: 'Description' },
    { key: 'tender_type', header: 'Type' },
    { key: 'tender_date', header: 'Invitation Date' },
    { key: 'closing_date', header: 'Closing Date' },
    { key: 'tender_fees', header: 'Fees' },
    { key: 'bond_guarantee_amt', header: 'Bond Amount' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tender Master</h1>
        <button
          onClick={() => router.push('/dashboard/tender_master/create')}
          className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <p>Loading tenders…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length ? (
        <CustomTable
          data={rows}
          columns={columns}
          idField="tender_id"
          linkPrefix="/dashboard/tender_master"
        />
      ) : (
        <p className="text-gray-600">No tenders found.</p>
      )}
    </div>
  )
}
