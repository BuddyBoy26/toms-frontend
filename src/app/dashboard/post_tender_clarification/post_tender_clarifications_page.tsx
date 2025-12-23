// src/app/dashboard/post_tender_clarifications/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'

interface TenderingCompany {
  tendering_companies_id: number
  company_id: number
  tender_id: number
  company?: { company_id: number; company_name: string }
  tender?: { tender_id: number; tender_no: string; tender_description: string }
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
  tendering_company?: TenderingCompany
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

export default function PostTenderClarificationsPage() {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [rows, setRows] = useState<PostTenderClarification[]>([])
  const [tenderingCompanies, setTenderingCompanies] = useState<TenderingCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPTC, setSelectedPTC] = useState<PostTenderClarification | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    tc_id: '' as number | '',
    ptc_no: '',
    ptc_ref_no: '',
    ptc_date: '',
    ptc_received_date: '',
    ptc_reply_required_by: '',
    ptc_reply_submission_date: '',
  })

  useEffect(() => {
    fetchPTCs()
    fetchTenderingCompanies()
  }, [])

  const fetchPTCs = () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    
    setLoading(true)
    fetch(`${API}/post_tender_clarifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) throw new Error(`Failed to load clarifications (${r.status})`)
        return r.json()
      })
      .then((data: PostTenderClarification[]) => setRows(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  const fetchTenderingCompanies = () => {
    fetch(`${API}/tendering_companies`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(r => r.json())
      .then((data: TenderingCompany[]) => setTenderingCompanies(Array.isArray(data) ? data : []))
  }

  // Create a map for tendering companies display
  const tenderingCompanyMap = useMemo(() => {
    const map = new Map<number, string>()
    tenderingCompanies.forEach(tc => {
      const companyName = tc.company?.company_name || 'Unknown Company'
      const tenderNo = tc.tender?.tender_no || 'Unknown Tender'
      map.set(tc.tendering_companies_id, `${companyName} - ${tenderNo}`)
    })
    return map
  }, [tenderingCompanies])

  const getTenderingCompanyLabel = (tc_id: number): string => {
    return tenderingCompanyMap.get(tc_id) || 'Unknown'
  }

  const handleRowClick = (ptc: PostTenderClarification) => {
    setSelectedPTC(ptc)
    setFormData({
      tc_id: ptc.tc_id,
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
      tc_id: '',
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
      tc_id: '',
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

    if (!formData.tc_id) {
      setError('Please select a tendering company')
      return
    }

    setIsSaving(true)

    const payload = {
      tc_id: Number(formData.tc_id),
      ptc_no: Number(formData.ptc_no),
      ptc_ref_no: formData.ptc_ref_no,
      ptc_date: formData.ptc_date,
      ptc_received_date: formData.ptc_received_date,
      ptc_reply_required_by: formData.ptc_reply_required_by,
      ptc_reply_submission_date: formData.ptc_reply_submission_date || null,
    }

    try {
      const url = selectedPTC
        ? `${API}/post_tender_clarifications/${selectedPTC.ptc_id}`
        : `${API}/post_tender_clarifications`
      
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
        fetchPTCs()
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
      const response = await fetch(`${API}/post_tender_clarifications/${selectedPTC.ptc_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        fetchPTCs()
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

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-GB')
  }

  const columns: Column<PostTenderClarification>[] = [
    { key: 'ptc_id', header: 'ID' },
    { key: 'tc_id', header: 'Tendering Company' },
    { key: 'ptc_no', header: 'PTC No' },
    { key: 'ptc_ref_no', header: 'Ref No' },
    { key: 'ptc_date', header: 'PTC Date' },
    { key: 'ptc_received_date', header: 'Received Date' },
    { key: 'ptc_reply_required_by', header: 'Reply Required By' },
    { key: 'ptc_reply_submission_date', header: 'Reply Submitted' },
  ]

  const formattedRows = rows.map(row => ({
    ...row,
    tc_id: getTenderingCompanyLabel(row.tc_id) as any,
    ptc_date: formatDate(row.ptc_date) as any,
    ptc_received_date: formatDate(row.ptc_received_date) as any,
    ptc_reply_required_by: formatDate(row.ptc_reply_required_by) as any,
    ptc_reply_submission_date: formatDate(row.ptc_reply_submission_date) as any,
  }))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Post Tender Clarifications</h1>
        <button
          onClick={handleCreate}
          className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error && !isModalOpen ? (
        <p className="text-red-600">{error}</p>
      ) : rows.length ? (
        <CustomTable
          data={formattedRows}
          columns={columns}
          idField="ptc_id"
          onRowClick={(formattedRow) => {
            const originalRow = rows.find(r => r.ptc_id === formattedRow.ptc_id)
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tendering Company *
                  </label>
                  <select
                    value={formData.tc_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tc_id: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">-- Select Tendering Company --</option>
                    {tenderingCompanies.map(tc => (
                      <option key={tc.tendering_companies_id} value={tc.tendering_companies_id}>
                        {getTenderingCompanyLabel(tc.tendering_companies_id)}
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
                {/* Left side: Delete button */}
                <div className="flex gap-2">
                  {selectedPTC && (
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
