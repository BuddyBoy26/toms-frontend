// src/app/dashboard/product_master/page.tsx
'use client'

import { useEffect, useState } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

interface Product {
  product_id: number
  product_name: string
  company_id?: number
}

export default function ProductListPage() {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  const [formData, setFormData] = useState({
    product_name: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = () => {
    setLoading(true)
    fetch(`${API}/product_master`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Product[]) => setProducts(data.sort((a, b) => a.product_id - b.product_id)))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false))
  }

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      product_name: product.product_name,
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleCreate = () => {
    setSelectedProduct(null)
    setFormData({
      product_name: '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
    setFormData({
      product_name: '',
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    const payload = {
      product_name: formData.product_name,
    }

    try {
      const url = selectedProduct
        ? `${API}/product_master/${selectedProduct.product_id}`
        : `${API}/product_master`
      
      const method = selectedProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchProducts()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduct) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedProduct.product_name}"? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/product_master/${selectedProduct.product_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        fetchProducts()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  // Build JSON for full product listing report
  const buildFullReportJson = () => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "PRODUCT MASTER REPORT" },
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
          ["Total Products", products.length.toString()],
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

    // Product listings
    components.push({
      type: "subheader",
      props: { text: "Product Listings" }
    })

    const tableRows = products.map(product => [
      product.product_id.toString(),
      product.product_name,
    ])

    components.push({
      type: "table",
      props: {
        headers: ["ID", "Product Name"],
        rows: tableRows,
      },
    })

    return {
      company: "Product Master",
      reportName: `Product Master Report - ${new Date().toLocaleDateString()}`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Build JSON for single product report
  const buildSingleProductReportJson = (product: Product) => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "PRODUCT DETAILS REPORT" },
    })

    // Product details
    components.push({
      type: "subheader",
      props: { text: product.product_name }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["Product ID", product.product_id.toString()],
          ["Product Name", product.product_name],
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
      company: product.product_name,
      reportName: `${product.product_name} - Product Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for all products
  const handleGenerateFullReport = async () => {
    if (products.length === 0) {
      alert('No products to generate report')
      return
    }

    setIsGeneratingReport(true)
    try {
      const reportJson = buildFullReportJson()
      await generatePDF(reportJson, 'download', 'product-master-report.pdf')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate report for single product
  const handleGenerateSingleReport = async () => {
    if (!selectedProduct) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildSingleProductReportJson(selectedProduct)
      await generatePDF(reportJson, 'download', `${selectedProduct.product_name.replace(/\s+/g, '-')}-report.pdf`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const columns: Column<Product>[] = [
    { key: 'product_id', header: 'ID' },
    { key: 'product_name', header: 'Product Name' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Product Master</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport || products.length === 0}
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
      ) : products.length > 0 ? (
        <CustomTable
          data={products}
          columns={columns}
          idField="product_id"
          onRowClick={handleRowClick}
        />
      ) : (
        <p className="text-gray-600">No products found.</p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedProduct ? 'Edit Product' : 'Create Product'}
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                {/* Left side: Delete and Generate Report buttons */}
                <div className="flex gap-2">
                  {selectedProduct && (
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