// src/app/dashboard/order_detail/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface OrderDetail {
  order_id: number
  company_id: number
  tender_id: number
  po_number: string
  order_description: string
  order_date: string
  order_value: number
  currency: CurrencyEnum
  order_value_aed: number
  revised_value_lme: number | null
  revised_value_lme_aed: number | null
  kka_commission_percent: number
  old_po_id: number | null
  no_of_consignments: number | null
  order_confirmation_no: string | null
  order_confirmation_letter_ref: string | null
  order_confirmation_date: string | null
  po_confirmation_date_srm: string | null
  last_contractual_delivery: string | null
  actual_last_delivery: string | null
  drawing_submission_date: string | null
  drawing_approval_date: string | null
  drawing_number: string | null
  drawing_initial_version: string | null
  drawing_current_version: string | null
  drawing_number_revised: string | null
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
  order_id: number
  po_number: string
  company: string
  tender_no: string
  order_description: string
  order_date: string
  order_value: string
  currency: CurrencyEnum
  order_value_aed: string
  kka_commission_percent: string
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

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB')
}

const fmt = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v))

export default function OrderDetailsListPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('kkabbas_token')
    setLoading(true)
    try {
      const [orderRes, tenderRes, compRes] = await Promise.all([
        fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tender`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/company_master`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!orderRes.ok) throw new Error(`Failed to load orders (${orderRes.status})`)
      if (!tenderRes.ok) throw new Error(`Failed to load tenders (${tenderRes.status})`)
      if (!compRes.ok) throw new Error(`Failed to load companies (${compRes.status})`)

      const [orderData, tenderData, companyData] = await Promise.all([
        orderRes.json(), tenderRes.json(), compRes.json()
      ])

      setOrders(Array.isArray(orderData) ? orderData : [])
      setTenders(Array.isArray(tenderData) ? tenderData : [])
      setCompanies(Array.isArray(companyData) ? companyData : [])
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load orders')
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

  const rows: Row[] = useMemo(() => {
    return orders.map(order => {
      const t = tenderMap.get(order.tender_id)
      const c = companyMap.get(order.company_id)

      return {
        order_id: order.order_id,
        po_number: order.po_number,
        company: fmt(c?.company_name),
        tender_no: fmt(t?.tender_no),
        order_description: order.order_description,
        order_date: formatDate(order.order_date),
        order_value: formatNumber(order.order_value),
        currency: order.currency,
        order_value_aed: formatNumber(order.order_value_aed),
        kka_commission_percent: order.kka_commission_percent.toString(),
      }
    })
  }, [orders, tenderMap, companyMap])

  // Build JSON for full order listing report
  const buildFullReportJson = () => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "ORDER DETAILS REPORT" },
    })

    // Summary section
    components.push({
      type: "subheader",
      props: { text: "Summary" }
    })

    const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.order_value_aed), 0)

    components.push({
      type: "table",
      props: {
        headers: ["Metric", "Value"],
        rows: [
          ["Total Orders", orders.length.toString()],
          ["Total Order Value (AED)", formatNumber(totalOrderValue)],
          ["Report Generated", new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })],
        ],
      },
    })

    // Order listings
    components.push({
      type: "subheader",
      props: { text: "Order Listings" }
    })

    const tableRows = rows.map(order => [
      order.order_id.toString(),
      order.po_number,
      order.company,
      order.tender_no,
      order.order_date,
      `${order.currency} ${order.order_value}`,
      `AED ${order.order_value_aed}`,
      `${order.kka_commission_percent}%`,
    ])

    components.push({
      type: "table",
      props: {
        headers: ["ID", "PO Number", "Company", "Tender", "Order Date", "Order Value", "Value (AED)", "Commission %"],
        rows: tableRows,
      },
    })

    return {
      company: "Order Details",
      reportName: `Order Details Report - ${new Date().toLocaleDateString()}`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for all orders
  const handleGenerateFullReport = async () => {
    if (orders.length === 0) {
      alert('No orders to generate report')
      return
    }

    setIsGeneratingReport(true)
    try {
      const reportJson = buildFullReportJson()
      await generatePDF(reportJson, 'download', 'order-details-report.pdf')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const columns: Column<Row>[] = [
    { key: 'order_id', header: 'ID' },
    { key: 'po_number', header: 'PO Number' },
    { key: 'company', header: 'Company' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'order_description', header: 'Description' },
    { key: 'order_date', header: 'Order Date' },
    { key: 'order_value', header: 'Order Value' },
    { key: 'currency', header: 'Currency' },
    { key: 'order_value_aed', header: 'Value (AED)' },
    { key: 'kka_commission_percent', header: 'Commission %' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport || orders.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingReport && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            📊 Generate Report
          </button>
          <button
            onClick={() => router.push('/dashboard/order_detail/create')}
            className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            + Create
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length ? (
        <CustomTable
          data={rows}
          columns={columns}
          idField="order_id"
          linkPrefix="/dashboard/order_detail"
        />
      ) : (
        <p className="text-gray-600">No orders found.</p>
      )}
    </div>
  )
}