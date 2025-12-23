// src/app/dashboard/tender_master/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

type TenderType = 'public' | 'selected'

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
  tender_date: string | null
  closing_date: string | null
  tender_fees: number | null
  currency: string
  bond_guarantee_amt: number | null
  tender_type: TenderType
  supply_product_id?: number | null
  extension_dates?: string[] | null
}

interface Product {
  product_id: number
  product_name: string
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

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

export default function TenderListPage() {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [rows, setRows] = useState<Tender[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  const [formData, setFormData] = useState({
    tender_no: '',
    tender_type: 'public' as TenderType,
    supply_product_id: '' as number | '',
    tender_date: '',
    closing_date: '',
    bond_guarantee_amt: '',
    tender_fees: '',
    currency: 'AED',
  })

  // Auto-generate tender description based on selected product
  const tenderDescription = useMemo(() => {
    if (formData.supply_product_id === '') return ''
    const product = products.find(p => p.product_id === Number(formData.supply_product_id))
    return product ? `SUPPLY OF ${product.product_name.toUpperCase()}` : ''
  }, [formData.supply_product_id, products])

  // Validate dates
  const dateValidation = useMemo(() => {
    if (!formData.tender_date || !formData.closing_date) {
      return { valid: false, message: '' }
    }
    
    const invitationDate = new Date(formData.tender_date)
    const closingDate = new Date(formData.closing_date)
    
    if (closingDate <= invitationDate) {
      return { valid: false, message: 'Closing date must be after invitation date' }
    }
    
    return { valid: true, message: '' }
  }, [formData.tender_date, formData.closing_date])

  const canSubmit = useMemo(() => {
    if (!formData.tender_no.trim() || !formData.supply_product_id) return false
    if (!formData.tender_date || !formData.closing_date) return false
    return dateValidation.valid
  }, [formData, dateValidation])

  useEffect(() => {
    fetchTenders()
    fetchProducts()
  }, [])

  const fetchTenders = () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    
    setLoading(true)
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
  }

  const fetchProducts = () => {
    fetch(`${API}/product_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: Product[]) => setProducts(Array.isArray(data) ? data : []))
  }

  const handleRowClick = (tender: Tender) => {
    setSelectedTender(tender)
    setFormData({
      tender_no: tender.tender_no,
      tender_type: tender.tender_type,
      supply_product_id: tender.supply_product_id || '',
      tender_date: tender.tender_date || '',
      closing_date: tender.closing_date || '',
      bond_guarantee_amt: tender.bond_guarantee_amt ? formatNumber(tender.bond_guarantee_amt) : '',
      tender_fees: tender.tender_fees ? formatNumber(tender.tender_fees) : '',
      currency: tender.currency,
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleCreate = () => {
    setSelectedTender(null)
    setFormData({
      tender_no: '',
      tender_type: 'public',
      supply_product_id: '',
      tender_date: '',
      closing_date: '',
      bond_guarantee_amt: '',
      tender_fees: '',
      currency: 'AED',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedTender(null)
    setFormData({
      tender_no: '',
      tender_type: 'public',
      supply_product_id: '',
      tender_date: '',
      closing_date: '',
      bond_guarantee_amt: '',
      tender_fees: '',
      currency: 'AED',
    })
    setError(null)
  }

  const handleAmountChange = (field: 'bond_guarantee_amt' | 'tender_fees', value: string) => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, [field]: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError(dateValidation.message || 'Please fill all required fields.')
      return
    }

    setIsSaving(true)

    const payload = {
      tender_no: formData.tender_no,
      tender_description: tenderDescription,
      tender_type: formData.tender_type,
      supply_product_id: Number(formData.supply_product_id),
      tender_date: formData.tender_date,
      closing_date: formData.closing_date,
      bond_guarantee_amt: parseFormattedNumber(formData.bond_guarantee_amt),
      tender_fees: parseFormattedNumber(formData.tender_fees),
      currency: formData.currency,
      
    }

    try {
      const url = selectedTender
        ? `${API}/tender/${selectedTender.tender_id}`
        : `${API}/tender`
      
      const method = selectedTender ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchTenders()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        const msg =
          Array.isArray(err?.detail)
            ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
            : typeof err?.detail === 'string'
            ? err.detail
            : 'Failed to save tender'
        setError(msg)
      }
    } catch (error) {
      console.error('Error saving tender:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTender) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete tender "${selectedTender.tender_no}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/tender/${selectedTender.tender_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        fetchTenders()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete tender')
      }
    } catch (error) {
      console.error('Error deleting tender:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  const renderAmount = (value: number | null): string => {
    if (value === null || value === undefined) return ''
    return formatNumber(value)
  }

  // Create a map of products for display
  const productMap = useMemo(() => {
    const map = new Map<number, string>()
    products.forEach(p => map.set(p.product_id, p.product_name))
    return map
  }, [products])

  // Get product name by ID
  const getProductName = (productId: number | null | undefined): string => {
    if (!productId) return 'N/A'
    return productMap.get(productId) || 'Unknown Product'
  }

  // Build JSON for full tender listing report
  const buildFullReportJson = () => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "TENDER MASTER REPORT" },
    })

    // Summary section
    components.push({
      type: "subheader",
      props: { text: "Summary" }
    })

    const publicTenders = rows.filter(t => t.tender_type === 'public').length
    const selectedTenders = rows.filter(t => t.tender_type === 'selected').length

    components.push({
      type: "table",
      props: {
        headers: ["Metric", "Value"],
        rows: [
          ["Total Tenders", rows.length.toString()],
          ["Public Tenders", publicTenders.toString()],
          ["Selected Tenders", selectedTenders.toString()],
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

    // Tender listings
    components.push({
      type: "subheader",
      props: { text: "Tender Listings" }
    })

    const tableRows = rows.map(tender => [
      tender.tender_id.toString(),
      tender.tender_no,
      tender.tender_description,
      tender.tender_type.charAt(0).toUpperCase() + tender.tender_type.slice(1),
      tender.tender_date || 'N/A',
      tender.closing_date || 'N/A',
      tender.tender_fees ? `AED ${renderAmount(tender.tender_fees)}` : 'N/A',
      tender.currency,
      tender.bond_guarantee_amt ? `AED ${renderAmount(tender.bond_guarantee_amt)}` : 'N/A',
    ])

    components.push({
      type: "table",
      props: {
        headers: ["ID", "Tender No", "Description", "Type", "Invitation Date", "Closing Date", "Fees", "Bond Amount"],
        rows: tableRows,
      },
    })

    return {
      company: "Tender Master",
      reportName: `Tender Master Report - ${new Date().toLocaleDateString()}`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Build JSON for single tender report
  const buildSingleTenderReportJson = (tender: Tender) => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "TENDER DETAILS REPORT" },
    })

    // Tender details
    components.push({
      type: "subheader",
      props: { text: `Tender No: ${tender.tender_no}` }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["Tender ID", tender.tender_id.toString()],
          ["Tender Number", tender.tender_no],
          ["Description", tender.tender_description],
          ["Product", getProductName(tender.supply_product_id)],
          ["Type", tender.tender_type.charAt(0).toUpperCase() + tender.tender_type.slice(1)],
          ["Invitation Date", tender.tender_date || 'N/A'],
          ["Closing Date", tender.closing_date || 'N/A'],
          ["Tender Fees", tender.tender_fees ? `AED ${renderAmount(tender.tender_fees)}` : 'N/A'],
          ["Currency", tender.currency],
          ["Bond Guarantee Amount", tender.bond_guarantee_amt ? `AED ${renderAmount(tender.bond_guarantee_amt)}` : 'N/A'],
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
      company: tender.tender_no,
      reportName: `${tender.tender_no} - Tender Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for all tenders
  const handleGenerateFullReport = async () => {
    if (rows.length === 0) {
      alert('No tenders to generate report')
      return
    }

    setIsGeneratingReport(true)
    try {
      const reportJson = buildFullReportJson()
      await generatePDF(reportJson, 'download', 'tender-master-report.pdf')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate report for single tender
  const handleGenerateSingleReport = async () => {
    if (!selectedTender) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildSingleTenderReportJson(selectedTender)
      await generatePDF(reportJson, 'download', `${selectedTender.tender_no.replace(/\s+/g, '-')}-report.pdf`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const columns: Column<Tender>[] = [
    { key: 'tender_id', header: 'ID' },
    { key: 'tender_no', header: 'Tender No' },
    { key: 'tender_description', header: 'Description' },
    { key: 'tender_type', header: 'Type' },
    { key: 'tender_date', header: 'Invitation Date' },
    { key: 'closing_date', header: 'Closing Date' },
    { key: 'currency', header: 'Currency' },
    { key: 'tender_fees', header: 'Fees' },
    { key: 'bond_guarantee_amt', header: 'Bond Amount' },
  ]

  const formattedRows = rows.map(row => ({
    ...row,
    tender_fees: renderAmount(row.tender_fees) as any,
    bond_guarantee_amt: renderAmount(row.bond_guarantee_amt) as any,
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tender Master</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport || rows.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingReport && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            📊 Generate Report
          </button>
          <button
            onClick={handleCreate}
            className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            + Create
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error && !isModalOpen ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length ? (
        <CustomTable
          data={formattedRows}
          columns={columns}
          idField="tender_id"
          onRowClick={(formattedRow) => {
            const originalRow = rows.find(r => r.tender_id === formattedRow.tender_id)
            if (originalRow) handleRowClick(originalRow)
          }}
        />
      ) : (
        <p className="text-gray-600">No tenders found.</p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedTender ? 'Edit Tender' : 'Create Tender'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tender No *
                  </label>
                  <input
                    type="text"
                    value={formData.tender_no}
                    onChange={(e) =>
                      setFormData({ ...formData, tender_no: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={formData.supply_product_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supply_product_id: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tender Type
                  </label>
                  <select
                    value={formData.tender_type}
                    onChange={(e) =>
                      setFormData({ ...formData, tender_type: e.target.value as TenderType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="public">Public</option>
                    <option value="selected">Selected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tender Description (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={tenderDescription}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Select a product to generate description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tender Invitation Date *
                    </label>
                    <input
                      type="date"
                      value={formData.tender_date}
                      onChange={(e) =>
                        setFormData({ ...formData, tender_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tender Closing Date *
                    </label>
                    <input
                      type="date"
                      value={formData.closing_date}
                      onChange={(e) =>
                        setFormData({ ...formData, closing_date: e.target.value })
                      }
                      min={formData.tender_date || undefined}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        dateValidation.message ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {dateValidation.message && (
                      <p className="mt-1 text-sm text-red-600">{dateValidation.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                                    <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tender Bond Amount (AED)
                    </label>
                    <input
                      type="text"
                      value={formData.bond_guarantee_amt}
                      onChange={(e) => handleAmountChange('bond_guarantee_amt', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tender Fees (AED)
                    </label>
                    <input
                      type="text"
                      value={formData.tender_fees}
                      onChange={(e) => handleAmountChange('tender_fees', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                {/* Left side: Delete and Generate Report buttons */}
                <div className="flex gap-2">
                  {selectedTender && (
                    <>
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
                    </>
                  )}
                </div>

                {/* Right side: Cancel and Save buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !canSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}