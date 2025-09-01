'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface PTC {
  ptc_id: number
  // NOTE: backend returns tc_id (not tendering_companies_id)
  tc_id: number
  ptc_no: number
  ptc_ref_no: string
  ptc_date: string
  ptc_received_date: string
  ptc_reply_required_by: string
  ptc_reply_submission_date: string | null
}

interface TenderingCompany {
  tendering_companies_id: number
  tender_id: number
  company_id: number
}

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
}

interface Company {
  company_id: number
  company_name: string
}

interface Row extends PTC {
  tender_no: string
  tender_description: string
  company_name: string
}

export default function PtcListPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')

    Promise.all([
      fetch(`${API}/post_tender_clarification`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/tendering_companies`,        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/tender`,                     { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/company_master`,             { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([ptcsRaw, tcsRaw, tendersRaw, companiesRaw]) => {
        const ptcs: PTC[] = Array.isArray(ptcsRaw) ? ptcsRaw : (ptcsRaw ? [ptcsRaw] : [])
        const tcs: TenderingCompany[] = Array.isArray(tcsRaw) ? tcsRaw : []
        const tenders: Tender[] = Array.isArray(tendersRaw) ? tendersRaw : []
        const companies: Company[] = Array.isArray(companiesRaw) ? companiesRaw : []

        // Index helpers
        const tcById = new Map<number, TenderingCompany>(
          tcs.map(tc => [tc.tendering_companies_id, tc])
        )
        const tenderById = new Map<number, Tender>(
          tenders.map(t => [t.tender_id, t])
        )
        const companyById = new Map<number, Company>(
          companies.map(c => [c.company_id, c])
        )

        const merged: Row[] = ptcs.map(p => {
          // backend uses tc_id
          const tc = tcById.get(p.tc_id)
          const tender = tc ? tenderById.get(tc.tender_id) : undefined
          const company = tc ? companyById.get(tc.company_id) : undefined

          return {
            ...p,
            tender_no: tender?.tender_no || '',
            tender_description: tender?.tender_description || '',
            company_name: company?.company_name || '',
          }
        })

        setRows(merged)
      })
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [API])

  // Optional: sort by PTC date desc for readability
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => (b.ptc_date || '').localeCompare(a.ptc_date || ''))
  }, [rows])

  const columns: Column<Row>[] = [
    { key: 'ptc_no', header: 'PTC No' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'tender_description', header: 'Tender Description' },
    { key: 'company_name', header: 'Tenderer' },
    { key: 'ptc_ref_no', header: 'PTC Ref No' },
    { key: 'ptc_date', header: 'PTC Date' },
    { key: 'ptc_received_date', header: 'Received' },
    { key: 'ptc_reply_required_by', header: 'Reply By' },
    { key: 'ptc_reply_submission_date', header: 'Submission' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Post Tender Clarifications</h1>
        <button
          onClick={() => router.push('/dashboard/post_tender_clarification/create')}
          className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : sortedRows.length > 0 ? (
        <CustomTable
          data={sortedRows}
          columns={columns}
          idField="ptc_id"
          linkPrefix="/dashboard/post_tender_clarification"
        />
      ) : (
        <p className="text-gray-600">No clarifications found.</p>
      )}
    </div>
  )
}
