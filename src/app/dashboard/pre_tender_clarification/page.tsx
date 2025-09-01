'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface pre_ptc {
  pre_ptc_id: number
  tc_id: number
  pre_ptc_no: number
  pre_ptc_ref_no: string
  pre_ptc_date: string
  pre_ptc_received_date: string
  pre_ptc_reply_sent_date: string
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

interface Row extends pre_ptc {
  tender_no: string
  tender_description: string
  company_name: string
}

export default function PrePtcListPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')

    Promise.all([
      fetch(`${API}/pre_tender_clarification`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/tendering_companies`,        { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/tender`,                     { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/company_master`,             { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([pre_ptcsRaw, tcsRaw, tendersRaw, companiesRaw]) => {
        const pre_ptcs: pre_ptc[] = Array.isArray(pre_ptcsRaw) ? pre_ptcsRaw : (pre_ptcsRaw ? [pre_ptcsRaw] : [])
        const tcs: TenderingCompany[] = Array.isArray(tcsRaw) ? tcsRaw : []
        const tenders: Tender[] = Array.isArray(tendersRaw) ? tendersRaw : []
        const companies: Company[] = Array.isArray(companiesRaw) ? companiesRaw : []

        const tcById = new Map<number, TenderingCompany>(
          tcs.map(tc => [tc.tendering_companies_id, tc])
        )
        const tenderById = new Map<number, Tender>(
          tenders.map(t => [t.tender_id, t])
        )
        const companyById = new Map<number, Company>(
          companies.map(c => [c.company_id, c])
        )

        const merged: Row[] = pre_ptcs.map(p => {
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

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => (b.pre_ptc_date || '').localeCompare(a.pre_ptc_date || ''))
  }, [rows])

  const columns: Column<Row>[] = [
    { key: 'pre_ptc_no', header: 'pre_ptc No' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'tender_description', header: 'Tender Description' },
    { key: 'company_name', header: 'Tenderer' },
    { key: 'pre_ptc_ref_no', header: 'pre_ptc Ref No' },
    { key: 'pre_ptc_date', header: 'pre_ptc Date' },
    { key: 'pre_ptc_received_date', header: 'Received' },
    { key: 'pre_ptc_reply_sent_date', header: 'Sent' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pre Tender Clarifications</h1>
        <button
          onClick={() => router.push('/dashboard/pre_tender_clarification/create')}
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
          idField="pre_ptc_id"
          linkPrefix="/dashboard/pre_tender_clarification"
        />
      ) : (
        <p className="text-gray-600">No clarifications found.</p>
      )}
    </div>
  )
}
