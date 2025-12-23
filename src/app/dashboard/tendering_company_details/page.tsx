'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'
type PendingStatusEnum = 'To be released' | 'In effect' | 'Released (By DEWA)'

/** Raw server shapes */
interface TenderingCompany {
  tendering_companies_id: number
  company_id: number
  tender_id: number
  tender_receipt_no: string | null
  tbg_no: string | null
  tbg_issuing_bank: string | null
  tbg_value: number | null
  tbg_expiry_date: string | null
  tendering_currency: CurrencyEnum
  pending_status: PendingStatusEnum
  debit_advice_no: string | null
  tender_bought: 0 | 1
  participated: 0 | 1
  result_saved: 0 | 1
  evaluations_received: 0 | 1
  memo: 0 | 1
  po_copies: 0 | 1
}

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
  tender_date: string
  closing_date: string
  tender_fees: number | null
}

interface Company {
  company_id: number
  company_name: string
}

/** Composed row shape for the table */
interface Row {
  tendering_companies_id: number
  tender_no: string
  tender_description: string
  fees: string
  invite_date: string
  closing_date: string
  tbg_amount: string
  company: string
  tender_bought: string
  participated: string
  debit_advice_no: string
  result_saved: string
  evaluations_received: string
  memo: string
  po_copies: string
}

// Utility function for number formatting
const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined) return '-'
  
  const numStr = String(value)
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`
  }
  
  return formattedInteger
}

export default function TenderingCompaniesListPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [tcs, setTcs] = useState<TenderingCompany[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('kkabbas_token')
    setLoading(true)
    try {
      const [tcRes, tendRes, compRes] = await Promise.all([
        fetch(`${API}/tendering_companies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tender`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/company_master`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!tcRes.ok) throw new Error(`Failed to load tendering companies (${tcRes.status})`)
      if (!tendRes.ok) throw new Error(`Failed to load tenders (${tendRes.status})`)
      if (!compRes.ok) throw new Error(`Failed to load companies (${compRes.status})`)

      const [tcData, tenderData, companyData] = await Promise.all([
        tcRes.json(), tendRes.json(), compRes.json()
      ])

      setTcs(Array.isArray(tcData) ? tcData : [])
      setTenders(Array.isArray(tenderData) ? tenderData : [])
      setCompanies(Array.isArray(companyData) ? companyData : [])
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load list')
    } finally {
      setLoading(false)
    }
  }

  const tenderMap = useMemo(() => {
    const m = new Map<number, Tender>()
    for (const t of tenders) m.set(t.tender_id, t)
    return m
  }, [tenders])

  const companyMap = useMemo(() => {
    const m = new Map<number, Company>()
    for (const c of companies) m.set(c.company_id, c)
    return m
  }, [companies])

  const yn = (v: 0 | 1 | boolean | null | undefined) => (v ? 'Y' : 'N')
  const fmt = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v))

  const rows: Row[] = useMemo(() => {
    return tcs.map(tc => {
      const t = tenderMap.get(tc.tender_id)
      const c = companyMap.get(tc.company_id)

      return {
        tendering_companies_id: tc.tendering_companies_id,
        tender_no: fmt(t?.tender_no),
        tender_description: fmt(t?.tender_description),
        fees: t?.tender_fees != null ? formatNumber(t.tender_fees) : '-',
        invite_date: fmt(t?.tender_date),
        closing_date: fmt(t?.closing_date),
        tbg_amount: tc.tbg_value != null ? formatNumber(tc.tbg_value) : '-',
        company: fmt(c?.company_name),
        tender_bought: yn(tc.tender_bought),
        participated: yn(tc.participated),
        debit_advice_no: fmt(tc.debit_advice_no),
        result_saved: yn(tc.result_saved),
        evaluations_received: yn(tc.evaluations_received),
        memo: yn(tc.memo),
        po_copies: yn(tc.po_copies),
      }
    })
  }, [tcs, tenderMap, companyMap])

  const columns: Column<Row>[] = [
    { key: 'tendering_companies_id', header: 'ID' },
    { key: 'company', header: 'Company' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'tender_description', header: 'Tender Description' },
    { key: 'fees', header: 'Fees' },
    { key: 'invite_date', header: 'Invite Date' },
    { key: 'closing_date', header: 'Closing Date' },
    { key: 'tbg_amount', header: 'TBG Amount' },
    { key: 'tender_bought', header: 'Tender' },
    { key: 'participated', header: 'Participated?' },
    { key: 'debit_advice_no', header: 'Debit Advice' },
    { key: 'result_saved', header: 'Result' },
    { key: 'evaluations_received', header: 'Evaluation' },
    { key: 'memo', header: 'Memo' },
    { key: 'po_copies', header: 'PO copies' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tendering Company Details</h1>
        <button
          onClick={() => router.push('/dashboard/tendering_company_details/create')}
          className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length ? (
        <CustomTable
          data={rows}
          columns={columns}
          idField="tendering_companies_id"
          linkPrefix="/dashboard/tendering_company_details"
        />
      ) : (
        <p className="text-gray-600">No records found.</p>
      )}
    </div>
  )
}