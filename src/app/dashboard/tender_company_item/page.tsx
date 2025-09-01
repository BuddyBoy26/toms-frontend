'use client'

import { useEffect, useMemo, useState } from 'react'
// import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

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

interface Row {
  tendering_companies_id: number
  tender_no: string
  tender_description: string
  company_name: string
}

export default function TenderingCompaniesListPage() {
  // const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [tcs, setTcs] = useState<TenderingCompany[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    async function loadAll() {
      try {
        const [tcRes, tendRes, compRes] = await Promise.all([
          fetch(`${API}/tendering_companies`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/tender`,               { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/company_master`,       { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!tcRes.ok)  throw new Error(`Failed to load tendering companies (${tcRes.status})`)
        if (!tendRes.ok) throw new Error(`Failed to load tenders (${tendRes.status})`)
        if (!compRes.ok) throw new Error(`Failed to load companies (${compRes.status})`)

        const [tcData, tData, cData] = await Promise.all([tcRes.json(), tendRes.json(), compRes.json()])
        setTcs(Array.isArray(tcData) ? tcData : [])
        setTenders(Array.isArray(tData) ? tData : [])
        setCompanies(Array.isArray(cData) ? cData : [])
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Failed to load list')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [API])

  const tenderById = useMemo(() => new Map(tenders.map(t => [t.tender_id, t])), [tenders])
  const companyById = useMemo(() => new Map(companies.map(c => [c.company_id, c])), [companies])

  const rows: Row[] = useMemo(() => {
    return tcs.map(tc => {
      const t = tenderById.get(tc.tender_id)
      const c = companyById.get(tc.company_id)
      return {
        tendering_companies_id: tc.tendering_companies_id,
        tender_no: t?.tender_no ?? '-',
        tender_description: t?.tender_description ?? '-',
        company_name: c?.company_name ?? '-',
      }
    })
  }, [tcs, tenderById, companyById])

  const columns: Column<Row>[] = [
    { key: 'tendering_companies_id', header: 'ID' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'tender_description', header: 'Tender Description' },
    { key: 'company_name', header: 'Company' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tendered Items Discounts</h1>
        {/* No create button here */}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length ? (
        <CustomTable
          data={rows}
          columns={columns}
          idField="tendering_companies_id"
          linkPrefix="/dashboard/tender_company_item"  // click -> discount interface
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}
