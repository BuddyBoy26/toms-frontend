// src/app/dashboard/post_tender_clarifications/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
}

interface Company {
  company_id: number
  company_name: string
}

interface TenderingCompany {
  tendering_companies_id: number
  company_id: number
  tender_id: number
}

interface PostTenderClarification {
  ptc_id: number
  tc_id: number
  ptc_no: number
  ptc_ref_no: string
  ptc_date: string
  ptc_received_date: string
  ptc_reply_required_by: string
  ptc_reply_submission_date: string | null
}

// Display type with enriched data
interface PostTenderClarificationDisplay extends PostTenderClarification {
  company_name?: string
  tender_no?: string
  tender_description?: string
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

export default function PostTenderClarificationsPage() {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [rows, setRows] = useState<PostTenderClarification[]>([])
  const [enrichedRows, setEnrichedRows] = useState<PostTenderClarificationDisplay[]>([])
  const [tenderingCompanies, setTenderingCompanies] = useState<TenderingCompany[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPTC, setSelectedPTC] = useState<PostTenderClarificationDisplay | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  const [formData, setFormData] = useState({
    tender_id: '' as number | '',
    company_id: '' as number | '',
    ptc_no: '',
    ptc_ref_no: '',
    ptc_date: '',
    ptc_received_date: '',
    ptc_reply_required_by: '',
    ptc_reply_submission_date: '',
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const [ptcRes, tcRes, tenderRes, companyRes] = await Promise.all([
        fetch(`${API}/post_tender_clarification`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tendering_companies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tender`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/company_master`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const [ptcData, tcData, tenderData, companyData] = await Promise.all([
        ptcRes.json(),
        tcRes.json(),
        tenderRes.json(),
        companyRes.json(),
      ])

      const ptcs: PostTenderClarification[] = Array.isArray(ptcData) ? ptcData : []
      const tcs: TenderingCompany[] = Array.isArray(tcData) ? tcData : []
      const tendersArr: Tender[] = Array.isArray(tenderData) ? tenderData : []
      const companiesArr: Company[] = Array.isArray(companyData) ? companyData : []

      setRows(ptcs)
      setTenderingCompanies(tcs)
      setTenders(tendersArr)
      setCompanies(companiesArr)

      // Create maps for quick lookup
      const companyMap = new Map<number, Company>()
      companiesArr.forEach(c => companyMap.set(c.company_id, c))

      const tenderMap = new Map<number, Tender>()
      tendersArr.forEach(t => tenderMap.set(t.tender_id, t))

      const tcMap = new Map<number, TenderingCompany>()
      tcs.forEach(tc => tcMap.set(tc.tendering_companies_id, tc))

      // Enrich PTCs with company and tender information
      const enriched: PostTenderClarificationDisplay[] = ptcs.map(ptc => {
        const tc = tcMap.get(ptc.tc_id)
        const company = tc ? companyMap.get(tc.company_id) : null
        const tender = tc ? tenderMap.get(tc.tender_id) : null

        return {
          ...ptc,
          company_name: company?.company_name || 'Unknown Company',
          tender_no: tender?.tender_no || 'Unknown Tender',
          tender_description: tender?.tender_description || '',
        }
      })

      setEnrichedRows(enriched)
    } catch (e: any) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Get companies for a specific tender
  const getCompaniesForTender = useMemo(() => {
    if (!formData.tender_id) return []
    
    return tenderingCompanies
      .filter(tc => tc.tender_id === formData.tender_id)
      .map(tc => {
        const company = companies.find(c => c.company_id === tc.company_id)
        return {
          tendering_companies_id: tc.tendering_companies_id,
          company_id: tc.company_id,
          company_name: company?.company_name || 'Unknown Company'
        }
      })
  }, [formData.tender_id, tenderingCompanies, companies])

  const getTenderingCompanyLabel = (tc_id: number): string => {
    const tc = tenderingCompanies.find(t => t.tendering_companies_id === tc_id)
    if (!tc) return 'Unknown'
    
    const company = companies.find(c => c.company_id === tc.company_id)
    const tender = tenders.find(t => t.tender_id === tc.tender_id)
    
    const companyName = company?.company_name || 'Unknown Company'
    const tenderNo = tender?.tender_no || 'Unknown Tender'
    
    return `${companyName} - ${tenderNo}`
  }

  const handleRowClick = (ptc: PostTenderClarificationDisplay) => {
    const tenderingCompany = tenderingCompanies.find(tc => tc.tendering_companies_id === ptc.tc_id)
    
    setSelectedPTC(ptc)
    setFormData({
      tender_id: tenderingCompany?.tender_id || '',
      company_id: tenderingCompany?.company_id || '',
      ptc_no: ptc.ptc_no.toString(),
      ptc_ref_no: ptc.ptc_ref_no,
      ptc_date: ptc.ptc_date,
      ptc_received_date: ptc.ptc_received_date,
      ptc_reply_required_by: ptc.ptc_reply_required_by,
      ptc_reply_submission_date: ptc.ptc_reply_submission_date || '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleCreate = () => {
    setSelectedPTC(null)
    setFormData({
      tender_id: '',
      company_id: '',
      ptc_no: '',
      ptc_ref_no: '',
      ptc_date: '',
      ptc_received_date: '',
      ptc_reply_required_by: '',
      ptc_reply_submission_date: '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedPTC(null)
    setFormData({
      tender_id: '',
      company_id: '',
      ptc_no: '',
      ptc_ref_no: '',
      ptc_date: '',
      ptc_received_date: '',
      ptc_reply_required_by: '',
      ptc_reply_submission_date: '',
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.tender_id || !formData.company_id) {
      setError('Please select both tender and company')
      return
    }

    // Find the tendering_companies_id based on tender_id and company_id
    const tenderingCompany = tenderingCompanies.find(
      tc => tc.tender_id === formData.tender_id && tc.company_id === formData.company_id
    )

    if (!tenderingCompany) {
      setError('Invalid tender and company combination')
      return
    }

    setIsSaving(true)

    const payload = {
      tc_id: tenderingCompany.tendering_companies_id,
      ptc_no: Number(formData.ptc_no),
      ptc_ref_no: formData.ptc_ref_no,
      ptc_date: formData.ptc_date,
      ptc_received_date: formData.ptc_received_date,
      ptc_reply_required_by: formData.ptc_reply_required_by,
      ptc_reply_submission_date: formData.ptc_reply_submission_date || null,
    }

    try {
      const url = selectedPTC
        ? `${API}/post_tender_clarification/${selectedPTC.ptc_id}`
        : `${API}/post_tender_clarification`
      
      const method = selectedPTC ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchAllData()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        const msg =
          Array.isArray(err?.detail)
            ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
            : typeof err?.detail === 'string'
            ? err.detail
            : 'Failed to save clarification'
        setError(msg)
      }
    } catch (error) {
      console.error('Error saving clarification:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPTC) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete clarification "${selectedPTC.ptc_ref_no}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/post_tender_clarification/${selectedPTC.ptc_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        await fetchAllData()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete clarification')
      }
    } catch (error) {
      console.error('Error deleting clarification:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  // Build JSON for full PTC listing report
  const buildFullReportJson = () => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "POST TENDER CLARIFICATIONS REPORT" },
    })

    // Summary section
    components.push({
      type: "subheader",
      props: { text: "Summary" }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Metric", "Value"],
        rows: [
          ["Total Clarifications", enrichedRows.length.toString()],
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

    // PTC listings
    components.push({
      type: "subheader",
      props: { text: "Clarification Listings" }
    })

    const tableRows = enrichedRows.map(ptc => [
      ptc.ptc_id.toString(),
      `${ptc.company_name} - ${ptc.tender_no}`,
      ptc.ptc_no.toString(),
      ptc.ptc_ref_no,
      formatDate(ptc.ptc_date),
      formatDate(ptc.ptc_received_date),
      formatDate(ptc.ptc_reply_required_by),
      formatDate(ptc.ptc_reply_submission_date),
    ])

    components.push({
      type: "table",
      props: {
        headers: ["ID", "Tendering Company", "PTC No", "Ref No", "PTC Date", "Received", "Reply Required", "Reply Submitted"],
        rows: tableRows,
      },
    })

    return {
      company: "Post Tender Clarifications",
      reportName: `PTC Report - ${new Date().toLocaleDateString()}`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Build JSON for single PTC report
  const buildSinglePTCReportJson = (ptc: PostTenderClarificationDisplay) => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "POST TENDER CLARIFICATION DETAILS" },
    })

    // PTC details
    components.push({
      type: "subheader",
      props: { text: `PTC Ref: ${ptc.ptc_ref_no}` }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["PTC ID", ptc.ptc_id.toString()],
          ["Company", ptc.company_name || 'N/A'],
          ["Tender", ptc.tender_no || 'N/A'],
          ["Tender Description", ptc.tender_description || 'N/A'],
          ["PTC No", ptc.ptc_no.toString()],
          ["PTC Ref No", ptc.ptc_ref_no],
          ["PTC Date", formatDate(ptc.ptc_date)],
          ["Received Date", formatDate(ptc.ptc_received_date)],
          ["Reply Required By", formatDate(ptc.ptc_reply_required_by)],
          ["Reply Submission Date", formatDate(ptc.ptc_reply_submission_date)],
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
      company: ptc.ptc_ref_no,
      reportName: `${ptc.ptc_ref_no} - PTC Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for all PTCs
  const handleGenerateFullReport = async () => {
    if (enrichedRows.length === 0) {
      alert('No clarifications to generate report')
      return
    }

    setIsGeneratingReport(true)
    try {
      const reportJson = buildFullReportJson()
      await generatePDF(reportJson, 'download', 'post-tender-clarifications-report.pdf')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate report for single PTC
  const handleGenerateSingleReport = async () => {
    if (!selectedPTC) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildSinglePTCReportJson(selectedPTC)
      await generatePDF(reportJson, 'download', `${selectedPTC.ptc_ref_no.replace(/\s+/g, '-')}-report.pdf`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-GB')
  }

  // Create display type for table with formatted data
  type PTCTableDisplay = {
    ptc_id: number
    company_name: string
    tender_no: string
    ptc_no: number
    ptc_ref_no: string
    ptc_date: string
    ptc_received_date: string
    ptc_reply_required_by: string
    ptc_reply_submission_date: string
  }

  const columns: Column<PTCTableDisplay>[] = [
    { key: 'ptc_id', header: 'ID' },
    { key: 'company_name', header: 'Company' },
    { key: 'tender_no', header: 'Tender' },
    { key: 'ptc_no', header: 'PTC No' },
    { key: 'ptc_ref_no', header: 'Ref No' },
    { key: 'ptc_date', header: 'PTC Date' },
    { key: 'ptc_received_date', header: 'Received Date' },
    { key: 'ptc_reply_required_by', header: 'Reply Required By' },
    { key: 'ptc_reply_submission_date', header: 'Reply Submitted' },
  ]

  const formattedRows: PTCTableDisplay[] = enrichedRows.map(row => ({
    ptc_id: row.ptc_id,
    company_name: row.company_name || 'Unknown Company',
    tender_no: row.tender_no || 'Unknown Tender',
    ptc_no: row.ptc_no,
    ptc_ref_no: row.ptc_ref_no,
    ptc_date: formatDate(row.ptc_date),
    ptc_received_date: formatDate(row.ptc_received_date),
    ptc_reply_required_by: formatDate(row.ptc_reply_required_by),
    ptc_reply_submission_date: formatDate(row.ptc_reply_submission_date),
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Post Tender Clarifications</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport || enrichedRows.length === 0}
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
      ) : enrichedRows.length ? (
        <CustomTable
          data={formattedRows}
          columns={columns}
          idField="ptc_id"
          onRowClick={(formattedRow) => {
            const originalRow = enrichedRows.find(r => r.ptc_id === formattedRow.ptc_id)
            if (originalRow) handleRowClick(originalRow)
          }}
        />
      ) : (
        <p className="text-gray-600">No clarifications found.</p>
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
                {selectedPTC ? 'Edit Post Tender Clarification' : 'Create Post Tender Clarification'}
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
                {/* Tender Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tender *
                  </label>
                  <select
                    value={formData.tender_id}
                    onChange={(e) => {
                      const tenderId = e.target.value === '' ? '' : Number(e.target.value)
                      setFormData({
                        ...formData,
                        tender_id: tenderId,
                        company_id: '', // Reset company selection when tender changes
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">-- Select Tender --</option>
                    {tenders.map(tender => (
                      <option key={tender.tender_id} value={tender.tender_id}>
                        {tender.tender_no} - {tender.tender_description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Selection - Only enabled if tender is selected */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        company_id: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={!formData.tender_id}
                  >
                    <option value="">
                      {formData.tender_id 
                        ? '-- Select Company --' 
                        : '-- Select Tender First --'}
                    </option>
                    {getCompaniesForTender.map(tc => (
                      <option key={tc.tendering_companies_id} value={tc.company_id}>
                        {tc.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PTC No *
                    </label>
                    <input
                      type="number"
                      value={formData.ptc_no}
                      onChange={(e) =>
                        setFormData({ ...formData, ptc_no: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PTC Ref No *
                    </label>
                    <input
                      type="text"
                      value={formData.ptc_ref_no}
                      onChange={(e) =>
                        setFormData({ ...formData, ptc_ref_no: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PTC Date *
                    </label>
                    <input
                      type="date"
                      value={formData.ptc_date}
                      onChange={(e) =>
                        setFormData({ ...formData, ptc_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received Date *
                    </label>
                    <input
                      type="date"
                      value={formData.ptc_received_date}
                      onChange={(e) =>
                        setFormData({ ...formData, ptc_received_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reply Required By *
                    </label>
                    <input
                      type="date"
                      value={formData.ptc_reply_required_by}
                      onChange={(e) =>
                        setFormData({ ...formData, ptc_reply_required_by: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reply Submission Date
                    </label>
                    <input
                      type="date"
                      value={formData.ptc_reply_submission_date}
                      onChange={(e) =>
                        setFormData({ ...formData, ptc_reply_submission_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                {/* Left side: Delete and Generate Report buttons */}
                <div className="flex gap-2">
                  {selectedPTC && (
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
                    disabled={isSaving}
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