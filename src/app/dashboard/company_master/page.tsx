// src/app/dashboard/company_master/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import { allCountries } from 'country-telephone-data'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

interface Company {
  company_id: number
  company_name: string
  business_description: string
  country?: string | null
}

type Country = {
  iso2: string
  name: string
  dialCode: string
}

export default function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    business_description: '',
    country: 'ae',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  // Comprehensive mapping for common country code variations and non-standard codes
  const countryCodeMapping: Record<string, string> = {
    // UK variations
    'uk': 'gb',
    'en': 'gb',
    'eng': 'gb',
    'england': 'gb',
    'scotland': 'gb',
    'wales': 'gb',
    'northern ireland': 'gb',
    
    // USA variations
    'usa': 'us',
    'united states': 'us',
    'america': 'us',
    
    // UAE variations
    'uae': 'ae',
    'emirates': 'ae',
    
    // Netherlands variations
    'nl': 'nl',
    'holland': 'nl',
    
    // South Korea variations
    'south korea': 'kr',
    'korea': 'kr',
    
    // China variations
    'prc': 'cn',
    'china': 'cn',
    
    // Russia variations
    'russia': 'ru',
    
    // India variations
    'india': 'in',
    
    // Germany variations
    'germany': 'de',
    
    // France variations
    'france': 'fr',
    
    // Spain variations
    'spain': 'es',
    
    // Italy variations
    'italy': 'it',
    
    // Japan variations
    'japan': 'jp',
    
    // Australia variations
    'australia': 'au',
    
    // Canada variations
    'canada': 'ca',
    
    // Brazil variations
    'brazil': 'br',
    
    // Mexico variations
    'mexico': 'mx',
    
    // Saudi Arabia variations
    'saudi': 'sa',
    'saudi arabia': 'sa',
    'ksa': 'sa',
    
    // Qatar variations
    'qatar': 'qa',
    
    // Kuwait variations
    'kuwait': 'kw',
    
    // Bahrain variations
    'bahrain': 'bh',
    
    // Oman variations
    'oman': 'om',
    
    // Egypt variations
    'egypt': 'eg',
    
    // South Africa variations
    'south africa': 'za',
    
    // Turkey variations
    'turkey': 'tr',
    
    // Pakistan variations
    'pakistan': 'pk',
    
    // Bangladesh variations
    'bangladesh': 'bd',
    
    // Sri Lanka variations
    'sri lanka': 'lk',
    
    // Singapore variations
    'singapore': 'sg',
    
    // Malaysia variations
    'malaysia': 'my',
    
    // Indonesia variations
    'indonesia': 'id',
    
    // Thailand variations
    'thailand': 'th',
    
    // Philippines variations
    'philippines': 'ph',
    
    // Vietnam variations
    'vietnam': 'vn',
    
    // New Zealand variations
    'new zealand': 'nz',
    
    // Switzerland variations
    'switzerland': 'ch',
    
    // Sweden variations
    'sweden': 'se',
    
    // Norway variations
    'norway': 'no',
    
    // Denmark variations
    'denmark': 'dk',
    
    // Finland variations
    'finland': 'fi',
    
    // Poland variations
    'poland': 'pl',
    
    // Greece variations
    'greece': 'gr',
    
    // Portugal variations
    'portugal': 'pt',
    
    // Austria variations
    'austria': 'at',
    
    // Belgium variations
    'belgium': 'be',
    
    // Ireland variations
    'ireland': 'ie',
    
    // Czech Republic variations
    'czech': 'cz',
    'czech republic': 'cz',
    
    // Hungary variations
    'hungary': 'hu',
    
    // Romania variations
    'romania': 'ro',
    
    // Argentina variations
    'argentina': 'ar',
    
    // Chile variations
    'chile': 'cl',
    
    // Colombia variations
    'colombia': 'co',
    
    // Peru variations
    'peru': 'pe',
    
    // Venezuela variations
    'venezuela': 've',
    
    // Israel variations
    'israel': 'il',
    
    // Iran variations
    'iran': 'ir',
    
    // Iraq variations
    'iraq': 'iq',
    
    // Jordan variations
    'jordan': 'jo',
    
    // Lebanon variations
    'lebanon': 'lb',
    
    // Morocco variations
    'morocco': 'ma',
    
    // Algeria variations
    'algeria': 'dz',
    
    // Tunisia variations
    'tunisia': 'tn',
    
    // Kenya variations
    'kenya': 'ke',
    
    // Nigeria variations
    'nigeria': 'ng',
    
    // Ghana variations
    'ghana': 'gh',
    
    // Ethiopia variations
    'ethiopia': 'et',
  }

  // Create a map of country codes to names for display
  const countryMap = useMemo(() => {
    const map = new Map<string, string>()
    allCountries.forEach((c: Country) => {
      map.set(c.iso2.toLowerCase(), c.name)
    })
    return map
  }, [])

  // Create a reverse map for finding ISO2 codes by country name
  const countryNameToCode = useMemo(() => {
    const map = new Map<string, string>()
    allCountries.forEach((c: Country) => {
      map.set(c.name.toLowerCase(), c.iso2.toLowerCase())
    })
    return map
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = () => {
    setLoading(true)
    fetch(`${API}/company_master`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
      .then(res => res.json())
      .then((data: Company[]) => {
        console.log('Fetched companies:', data)
        setCompanies(data)
      })
      .catch(err => {
        console.error('Failed to fetch companies:', err)
        setError('Failed to load companies')
      })
      .finally(() => setLoading(false))
  }

  // Normalize country code - try multiple strategies
  const normalizeCountryCode = (countryValue: string | null | undefined): string => {
    if (!countryValue) return 'ae'
    
    const normalized = countryValue.toLowerCase().trim()
    
    // Strategy 1: Direct mapping
    if (countryCodeMapping[normalized]) {
      return countryCodeMapping[normalized]
    }
    
    // Strategy 2: Check if it's already a valid ISO2 code
    if (countryMap.has(normalized)) {
      return normalized
    }
    
    // Strategy 3: Try to find by country name
    if (countryNameToCode.has(normalized)) {
      return countryNameToCode.get(normalized)!
    }
    
    // Strategy 4: If it's 2 characters, assume it's ISO2 code (even if not found)
    if (normalized.length === 2) {
      return normalized
    }
    
    // Default fallback
    console.warn(`Could not normalize country code: ${countryValue}`)
    return 'ae'
  }

  const handleRowClick = (company: Company) => {
    console.log('=== Company Click Debug ===')
    console.log('Full company object:', company)
    console.log('Country value:', company.country)
    console.log('Country type:', typeof company.country)
    
    const countryCode = normalizeCountryCode(company.country)
    
    console.log('Normalized country code:', countryCode)
    
    setSelectedCompany(company)
    setFormData({
      company_name: company.company_name,
      business_description: company.business_description,
      country: countryCode,
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleCreate = () => {
    setSelectedCompany(null)
    setFormData({
      company_name: '',
      business_description: '',
      country: 'ae',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedCompany(null)
    setFormData({
      company_name: '',
      business_description: '',
      country: 'ae',
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    try {
      const url = selectedCompany
        ? `${API}/company_master/${selectedCompany.company_id}`
        : `${API}/company_master`
      
      const method = selectedCompany ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCompanies()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        if (Array.isArray(err?.detail)) {
          const msg = err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          setError(msg)
        } else if (typeof err?.detail === 'string') {
          setError(err.detail)
        } else {
          setError('Failed to save company')
        }
      }
    } catch (error) {
      console.error('Error saving company:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCompany) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedCompany.company_name}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/company_master/${selectedCompany.company_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        fetchCompanies()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  // Build JSON for full company listing report
  const buildFullReportJson = () => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "COMPANY MASTER REPORT" },
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
          ["Total Companies", companies.length.toString()],
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

    // Company listings
    components.push({
      type: "subheader",
      props: { text: "Company Listings" }
    })

    const tableRows = companies.map(company => [
      company.company_id.toString(),
      company.company_name,
      company.business_description,
      getCountryName(company.country)
    ])

    components.push({
      type: "table",
      props: {
        headers: ["ID", "Company Name", "Business Description", "Country"],
        rows: tableRows,
      },
    })

    return {
      company: "Company Master",
      reportName: `Company Master Report - ${new Date().toLocaleDateString()}`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Build JSON for single company report
  const buildSingleCompanyReportJson = (company: Company) => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "COMPANY DETAILS REPORT" },
    })

    // Company details
    components.push({
      type: "subheader",
      props: { text: company.company_name }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["Company ID", company.company_id.toString()],
          ["Company Name", company.company_name],
          ["Business Description", company.business_description],
          ["Country", getCountryName(company.country)],
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
      company: company.company_name,
      reportName: `${company.company_name} - Company Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for all companies
  const handleGenerateFullReport = async () => {
    if (companies.length === 0) {
      alert('No companies to generate report')
      return
    }

    setIsGeneratingReport(true)
    try {
      const reportJson = buildFullReportJson()
      await generatePDF(reportJson, 'download', 'company-master-report.pdf')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate report for single company
  const handleGenerateSingleReport = async () => {
    if (!selectedCompany) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildSingleCompanyReportJson(selectedCompany)
      await generatePDF(reportJson, 'download', `${selectedCompany.company_name.replace(/\s+/g, '-')}-report.pdf`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Get country name for display
  const getCountryName = (countryCode: string | null | undefined): string => {
    if (!countryCode) return 'N/A'
    
    const normalizedCode = normalizeCountryCode(countryCode)
    return countryMap.get(normalizedCode) || countryCode.toUpperCase()
  }

  const columns: Column<Company>[] = [
    { key: 'company_id', header: 'ID' },
    { key: 'company_name', header: 'Name' },
    { key: 'business_description', header: 'Description' },
    { key: 'country', header: 'Country' },
  ]

  // Format companies data to show country names instead of codes
  const formattedCompanies = useMemo(() => {
    return companies.map(company => ({
      ...company,
      country: getCountryName(company.country) as any,
    }))
  }, [companies, countryMap])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Company Master</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport || companies.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingReport && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            📊 Generate Report
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            + Create
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : error && !isModalOpen ? (
        <p className="text-red-600">{error}</p>
      ) : formattedCompanies.length > 0 ? (
        <CustomTable
          data={formattedCompanies}
          columns={columns}
          idField="company_id"
          onRowClick={(formattedCompany) => {
            const originalCompany = companies.find(c => c.company_id === formattedCompany.company_id)
            if (originalCompany) handleRowClick(originalCompany)
          }}
        />
      ) : (
        <p className="text-gray-600">No companies found.</p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedCompany ? 'Edit Company' : 'Create Company'}
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
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description *
                  </label>
                  <textarea
                    value={formData.business_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        business_description: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.country.toLowerCase()}
                    onChange={(e) => {
                      console.log('Country changed to:', e.target.value)
                      setFormData({ ...formData, country: e.target.value.toLowerCase() })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {allCountries
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c: Country) => (
                        <option key={c.iso2} value={c.iso2.toLowerCase()}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {formData.country.toUpperCase()} - {getCountryName(formData.country)}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                {/* Left side: Delete and Generate Report buttons */}
                <div className="flex gap-2">
                  {selectedCompany && (
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