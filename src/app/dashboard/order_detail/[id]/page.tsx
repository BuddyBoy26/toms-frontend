// src/app/dashboard/order_detail/[id]/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Loader from '@/components/Loader'
import OrderItemsTable from '@/components/OrderItemsTable'
import { generatePDF } from '@/utils/pdfGenerator'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface OrderDetail {
  order_id: number
  company_id: number
  tender_id: number
  po_number: string
  order_description: string
  order_date: string
  po_commencement_date: string | null
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
  remarks: string | null
}

interface TenderingCompany {
  tendering_companies_id: number
  company_id: number
  tender_id: number
  company_name?: string
  tender_no?: string
  tender_description?: string
  tender_value: number | null
  tendering_currency: CurrencyEnum
}

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
  tender_value: number | null
  currency: CurrencyEnum
}

interface Company {
  company_id: number
  company_name: string
}

interface Product {
  product_id: number
  product_name: string
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

// Helper function to extract product from tender description
const extractProductFromDescription = (description: string, products: Product[]): number | null => {
  if (!description || !products.length) return null
  
  const match = description.match(/SUPPLY OF (.+)/i)
  if (!match) return null
  
  const productName = match[1].trim()
  const product = products.find(p => 
    p.product_name.toUpperCase() === productName.toUpperCase()
  )
  
  return product ? product.product_id : null
}

// Utility functions for number formatting
const formatNumber = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return ''
  
  const numStr = String(value).replace(/[^\d.]/g, '')
  if (!numStr) return ''
  
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`
  }
  
  return formattedInteger
}

const parseFormattedNumber = (value: string): number | null => {
  if (!value) return null
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export default function OrderDetailEditPage() {
  const params = useParams()
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const orderId = params?.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [tenderingCompanies, setTenderingCompanies] = useState<TenderingCompany[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [oldOrders, setOldOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    tendering_company_id: '' as number | '',
    company_id: '' as number | '',
    tender_id: '' as number | '',
    po_number: '',
    order_date: '',
    po_commencement_date: '',
    order_value: '',
    currency: 'AED' as CurrencyEnum,
    order_value_aed: '',
    revised_value_lme: '',
    revised_value_lme_aed: '',
    kka_commission_percent: '5.00',
    old_po_id: '' as number | '',
    no_of_consignments: '',
    order_confirmation_no: '',
    order_confirmation_letter_ref: '',
    order_confirmation_date: '',
    po_confirmation_date_srm: '',
    last_contractual_delivery: '',
    actual_last_delivery: '',
    drawing_submission_date: '',
    drawing_approval_date: '',
    drawing_number: '',
    drawing_initial_version: '',
    drawing_current_version: '',
    drawing_number_revised: '',
    remarks: '',
  })

  useEffect(() => {
    fetchData()
  }, [orderId])

  const fetchData = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [orderRes, tcRes, tenderRes, compRes, prodRes, oldOrdersRes] = await Promise.all([
        fetch(`${API}/order_detail/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tendering_companies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tender`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/company_master`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/product_master`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!orderRes.ok) throw new Error('Failed to load order')
      
      const [orderData, tcData, tenderData, companyData, productData, oldOrdersData] = await Promise.all([
        orderRes.json(), tcRes.json(), tenderRes.json(), compRes.json(), prodRes.json(), oldOrdersRes.json()
      ])

      const companiesArr: Company[] = Array.isArray(companyData) ? companyData : []
      const tendersArr: Tender[] = Array.isArray(tenderData) ? tenderData : []
      const productsArr: Product[] = Array.isArray(productData) ? productData : []
      
      setOrder(orderData)
      setTenders(tendersArr)
      setCompanies(companiesArr)
      setProducts(productsArr)
      setOldOrders(Array.isArray(oldOrdersData) ? oldOrdersData.filter((o: OrderDetail) => o.order_id !== orderData.order_id) : [])

      // Enrich tendering companies with company and tender names
      const enrichedTC: TenderingCompany[] = Array.isArray(tcData)
        ? tcData.map((tc: any) => {
            const company = companiesArr.find(c => c.company_id === tc.company_id)
            const tender = tendersArr.find(t => t.tender_id === tc.tender_id)
            return {
              ...tc,
              company_name: company?.company_name,
              tender_no: tender?.tender_no,
              tender_description: tender?.tender_description,
            }
          })
        : []

      setTenderingCompanies(enrichedTC)

      // Find matching tendering company
      const matchingTC = enrichedTC.find(tc => 
        tc.company_id === orderData.company_id && tc.tender_id === orderData.tender_id
      )

      // Populate form
      setFormData({
        tendering_company_id: matchingTC?.tendering_companies_id || '',
        company_id: orderData.company_id,
        tender_id: orderData.tender_id,
        po_number: orderData.po_number,
        order_date: orderData.order_date,
        po_commencement_date: orderData.po_commencement_date || '',
        order_value: formatNumber(orderData.order_value),
        currency: orderData.currency,
        order_value_aed: formatNumber(orderData.order_value_aed),
        revised_value_lme: orderData.revised_value_lme ? formatNumber(orderData.revised_value_lme) : '',
        revised_value_lme_aed: orderData.revised_value_lme_aed ? formatNumber(orderData.revised_value_lme_aed) : '',
        kka_commission_percent: orderData.kka_commission_percent.toString(),
        old_po_id: orderData.old_po_id || '',
        no_of_consignments: orderData.no_of_consignments?.toString() || '',
        order_confirmation_no: orderData.order_confirmation_no || '',
        order_confirmation_letter_ref: orderData.order_confirmation_letter_ref || '',
        order_confirmation_date: orderData.order_confirmation_date || '',
        po_confirmation_date_srm: orderData.po_confirmation_date_srm || '',
        last_contractual_delivery: orderData.last_contractual_delivery || '',
        actual_last_delivery: orderData.actual_last_delivery || '',
        drawing_submission_date: orderData.drawing_submission_date || '',
        drawing_approval_date: orderData.drawing_approval_date || '',
        drawing_number: orderData.drawing_number || '',
        drawing_initial_version: orderData.drawing_initial_version || '',
        drawing_current_version: orderData.drawing_current_version || '',
        drawing_number_revised: orderData.drawing_number_revised || '',
        remarks: orderData.remarks || '',
      })
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  // Extract current product ID from selected tender
  const currentProductId = useMemo(() => {
    const selectedTender = tenders.find(t => t.tender_id === formData.tender_id)
    if (!selectedTender || !products.length) return null
    return extractProductFromDescription(selectedTender.tender_description, products)
  }, [formData.tender_id, tenders, products])

  // Auto-populate when tendering company is selected
  const handleTenderingCompanyChange = async (tcId: string) => {
    const tcIdNum = tcId === '' ? '' : Number(tcId)
    
    if (tcId === '') {
      setFormData({
        ...formData,
        tendering_company_id: '',
        company_id: '',
        tender_id: '',
        order_value: '',
        currency: 'AED',
      })
      return
    }

    const selectedTC = tenderingCompanies.find(tc => tc.tendering_companies_id === Number(tcId))
    
    if (selectedTC) {
      // Fetch tender company items to calculate total after discount
      const token = localStorage.getItem('kkabbas_token')
      try {
        const response = await fetch(
          `${API}/tender_company_items?tendering_companies_id=${selectedTC.tendering_companies_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const itemsData = await response.json()
        
        // Calculate total value after discount from items
        let totalAfterDiscount = 0
        if (Array.isArray(itemsData) && itemsData.length > 0) {
          totalAfterDiscount = itemsData.reduce((sum: number, item: any) => {
            const itemTotal = item.item_total_value || 0
            const discountValue = item.discount_value || 0
            return sum + (itemTotal - discountValue)
          }, 0)
        } else {
          // Fallback to tender value if no items
          totalAfterDiscount = selectedTC.tender_value || 0
        }

        setFormData({
          ...formData,
          tendering_company_id: tcIdNum,
          company_id: selectedTC.company_id,
          tender_id: selectedTC.tender_id,
          order_value: formatNumber(totalAfterDiscount),
          currency: selectedTC.tendering_currency,
        })
      } catch (error) {
        console.error('Error fetching tender company items:', error)
        // Fallback to tender value
        setFormData({
          ...formData,
          tendering_company_id: tcIdNum,
          company_id: selectedTC.company_id,
          tender_id: selectedTC.tender_id,
          order_value: selectedTC.tender_value ? formatNumber(selectedTC.tender_value) : '',
          currency: selectedTC.tendering_currency,
        })
      }
    }
  }

  // Auto-populate order description from selected tender
  const orderDescription = useMemo(() => {
    if (formData.tender_id === '') return ''
    const tender = tenders.find(t => t.tender_id === Number(formData.tender_id))
    return tender ? tender.tender_description : ''
  }, [formData.tender_id, tenders])

  const handleAmountChange = (field: string, value: string) => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, [field]: formatted })
  }

  const handleOrderDateChange = (date: string) => {
    setFormData({
      ...formData,
      order_date: date,
      po_commencement_date: date,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.company_id || !formData.tender_id) {
      setError('Please select a tendering company')
      return
    }

    setIsSaving(true)

    const payload = {
      company_id: Number(formData.company_id),
      tender_id: Number(formData.tender_id),
      po_number: formData.po_number,
      order_description: orderDescription,
      order_date: formData.order_date,
      po_commencement_date: formData.po_commencement_date || null,
      order_value: parseFormattedNumber(formData.order_value),
      currency: formData.currency,
      order_value_aed: parseFormattedNumber(formData.order_value_aed),
      revised_value_lme: parseFormattedNumber(formData.revised_value_lme),
      revised_value_lme_aed: parseFormattedNumber(formData.revised_value_lme_aed),
      kka_commission_percent: parseFloat(formData.kka_commission_percent),
      old_po_id: formData.old_po_id === '' ? null : Number(formData.old_po_id),
      no_of_consignments: formData.no_of_consignments === '' ? null : Number(formData.no_of_consignments),
      order_confirmation_no: formData.order_confirmation_no || null,
      order_confirmation_letter_ref: formData.order_confirmation_letter_ref || null,
      order_confirmation_date: formData.order_confirmation_date || null,
      po_confirmation_date_srm: formData.po_confirmation_date_srm || null,
      last_contractual_delivery: formData.last_contractual_delivery || null,
      actual_last_delivery: formData.actual_last_delivery || null,
      drawing_submission_date: formData.drawing_submission_date || null,
      drawing_approval_date: formData.drawing_approval_date || null,
      drawing_number: formData.drawing_number || null,
      drawing_initial_version: formData.drawing_initial_version || null,
      drawing_current_version: formData.drawing_current_version || null,
      drawing_number_revised: formData.drawing_number_revised || null,
      remarks: formData.remarks || null,
    }

    try {
      const response = await fetch(`${API}/order_detail/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/order_detail')
      } else {
        const err = await response.json().catch(() => null)
        const msg =
          Array.isArray(err?.detail)
            ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
            : typeof err?.detail === 'string'
            ? err.detail
            : 'Failed to update order'
        setError(msg)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setError('An error occurred while updating')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete order "${order.po_number}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/order_detail/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        router.push('/dashboard/order_detail')
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  // Build JSON for single order report
  const buildSingleOrderReportJson = () => {
    if (!order) return null

    const components: any[] = []

    const company = companies.find(c => c.company_id === order.company_id)
    const tender = tenders.find(t => t.tender_id === order.tender_id)

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "ORDER DETAILS REPORT" },
    })

    // Order details
    components.push({
      type: "subheader",
      props: { text: `PO Number: ${order.po_number}` }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["Order ID", order.order_id.toString()],
          ["PO Number", order.po_number],
          ["Company", company?.company_name || 'N/A'],
          ["Tender", tender?.tender_no || 'N/A'],
          ["Order Description", order.order_description],
          ["Order Date", order.order_date || 'N/A'],
          ["PO Commencement Date", order.po_commencement_date || 'N/A'],
          ["Order Value", `${order.currency} ${formatNumber(order.order_value)}`],
          ["Order Value (AED)", `AED ${formatNumber(order.order_value_aed)}`],
          ["KKA Commission", `${order.kka_commission_percent}%`],
          ["No. of Consignments", order.no_of_consignments?.toString() || 'N/A'],
          ["Order Confirmation No", order.order_confirmation_no || 'N/A'],
          ["Order Confirmation Date", order.order_confirmation_date || 'N/A'],
          ["Last Contractual Delivery", order.last_contractual_delivery || 'N/A'],
          ["Actual Last Delivery", order.actual_last_delivery || 'N/A'],
          ["Drawing Number", order.drawing_number || 'N/A'],
          ["Remarks", order.remarks || 'N/A'],
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

    return {
      company: order.po_number,
      reportName: `${order.po_number} - Order Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for single order
  const handleGenerateSingleReport = async () => {
    if (!order) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildSingleOrderReportJson()
      if (reportJson) {
        await generatePDF(reportJson, 'download', `${order.po_number.replace(/\s+/g, '-')}-report.pdf`)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (loading) return <Loader />
  if (error && !order) return <div className="p-4"><p className="text-red-600">{error}</p></div>

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Order Details</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Basic Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tendering Company (Company - Tender) *
                </label>
                <select
                  value={formData.tendering_company_id}
                  onChange={(e) => handleTenderingCompanyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Tendering Company --</option>
                  {tenderingCompanies.map(tc => (
                    <option key={tc.tendering_companies_id} value={tc.tendering_companies_id}>
                      {tc.company_name} - {tc.tender_no}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Number *
                </label>
                <input
                  type="text"
                  value={formData.po_number}
                  onChange={(e) =>
                    setFormData({ ...formData, po_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date *
                </label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => handleOrderDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Commencement Date *
                </label>
                <input
                  type="date"
                  value={formData.po_commencement_date}
                  onChange={(e) =>
                    setFormData({ ...formData, po_commencement_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Description (Auto-populated)
              </label>
              <input
                type="text"
                value={orderDescription}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="Select a tendering company to auto-populate description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Value (Auto-populated) *
                </label>
                <input
                  type="text"
                  value={formData.order_value}
                  onChange={(e) => handleAmountChange('order_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency (Auto-populated) *
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Value (AED) *
                </label>
                <input
                  type="text"
                  value={formData.order_value_aed}
                  onChange={(e) => handleAmountChange('order_value_aed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KKA Commission % *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.kka_commission_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, kka_commission_percent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revised Value (LME)
                </label>
                <input
                  type="text"
                  value={formData.revised_value_lme}
                  onChange={(e) => handleAmountChange('revised_value_lme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revised Value (LME AED)
                </label>
                <input
                  type="text"
                  value={formData.revised_value_lme_aed}
                  onChange={(e) => handleAmountChange('revised_value_lme_aed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Old PO Reference
                </label>
                <select
                  value={formData.old_po_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      old_po_id: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- None --</option>
                  {oldOrders.map(o => (
                    <option key={o.order_id} value={o.order_id}>
                      {o.po_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. of Consignments
                </label>
                <input
                  type="number"
                  value={formData.no_of_consignments}
                  onChange={(e) =>
                    setFormData({ ...formData, no_of_consignments: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Confirmation */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Order Confirmation</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Confirmation No
                </label>
                <input
                  type="text"
                  value={formData.order_confirmation_no}
                  onChange={(e) =>
                    setFormData({ ...formData, order_confirmation_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Confirmation Letter Ref
                </label>
                <input
                  type="text"
                  value={formData.order_confirmation_letter_ref}
                  onChange={(e) =>
                    setFormData({ ...formData, order_confirmation_letter_ref: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Confirmation Date
                </label>
                <input
                  type="date"
                  value={formData.order_confirmation_date}
                  onChange={(e) =>
                    setFormData({ ...formData, order_confirmation_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Confirmation Date (SRM)
                </label>
                <input
                  type="date"
                  value={formData.po_confirmation_date_srm}
                  onChange={(e) =>
                    setFormData({ ...formData, po_confirmation_date_srm: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Delivery Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Contractual Delivery
                </label>
                <input
                  type="date"
                  value={formData.last_contractual_delivery}
                  onChange={(e) =>
                    setFormData({ ...formData, last_contractual_delivery: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Last Delivery
                </label>
                <input
                  type="date"
                  value={formData.actual_last_delivery}
                  onChange={(e) =>
                    setFormData({ ...formData, actual_last_delivery: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drawing Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Drawing</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Submission Date
                </label>
                <input
                  type="date"
                  value={formData.drawing_submission_date}
                  onChange={(e) =>
                    setFormData({ ...formData, drawing_submission_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Approval Date
                </label>
                <input
                  type="date"
                  value={formData.drawing_approval_date}
                  onChange={(e) =>
                    setFormData({ ...formData, drawing_approval_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Number
                </label>
                <input
                  type="text"
                  value={formData.drawing_number}
                  onChange={(e) =>
                    setFormData({ ...formData, drawing_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Number (Revised)
                </label>
                <input
                  type="text"
                  value={formData.drawing_number_revised}
                  onChange={(e) =>
                    setFormData({ ...formData, drawing_number_revised: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Initial Version
                </label>
                <input
                  type="text"
                  value={formData.drawing_initial_version}
                  onChange={(e) =>
                    setFormData({ ...formData, drawing_initial_version: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawing Current Version
                </label>
                <input
                  type="text"
                  value={formData.drawing_current_version}
                  onChange={(e) =>
                    setFormData({ ...formData, drawing_current_version: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table - NOW FILTERED BY TENDERING COMPANY */}
        <div className="bg-white rounded-lg shadow p-4">
          <OrderItemsTable
            orderId={Number(orderId)}
            productId={currentProductId}
            orderCurrency={formData.currency}
            tenderingCompanyId={formData.tendering_company_id === '' ? null : Number(formData.tendering_company_id)}
          />
        </div>

        {/* Remarks */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Remarks</h2>
          <div>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter any additional remarks..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          {/* Left side: Delete and Generate Report buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Delete
            </button>
            <button
              type="button"
              onClick={handleGenerateSingleReport}
              disabled={isGeneratingReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isGeneratingReport && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              📄 Report
            </button>
          </div>

          {/* Right side: Cancel and Save buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/order_detail')}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isSaving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}