// src/app/dashboard/item_master/page.tsx
'use client'

import { useEffect, useState } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

interface Item {
  item_id: number
  product_id: number
  item_description: string
  item_short_description?: string | null
  hs_code: string | null
}

interface Product {
  product_id: number
  product_name: string
}

interface ItemWithProduct extends Item {
  product_name: string
}

export default function ItemListPage() {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [items, setItems] = useState<ItemWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemWithProduct | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  const [formData, setFormData] = useState({
    item_description: '',
    item_short_description: '',
    hs_code: '',
    product_id: '' as number | '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      fetch(`${API}/item_master`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(res => res.json()),
      fetch(`${API}/product_master`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(res => res.json()),
    ])
      .then(([itemsData, productsData]: [Item[], Product[]]) => {
        setProducts(productsData)
        const merged = itemsData.map(item => {
          const product = productsData.find(p => p.product_id === item.product_id)
          return {
            ...item,
            product_name: product ? product.product_name : 'Unknown',
          }
        })
        setItems(merged)
      })
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoading(false))
  }

  const handleRowClick = (item: ItemWithProduct) => {
    setSelectedItem(item)
    setFormData({
      item_description: item.item_description,
      item_short_description: item.item_short_description || '',
      hs_code: item.hs_code || '',
      product_id: item.product_id,
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleCreate = () => {
    setSelectedItem(null)
    setFormData({
      item_description: '',
      item_short_description: '',
      hs_code: '',
      product_id: '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
    setFormData({
      item_description: '',
      item_short_description: '',
      hs_code: '',
      product_id: '',
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.product_id) {
      setError('Please select a product')
      return
    }

    setIsSaving(true)

    const payload = {
      item_description: formData.item_description,
      item_short_description:
  formData.item_short_description.trim() === ''
    ? selectedItem?.item_short_description ?? ''
    : formData.item_short_description.trim(),

      hs_code: formData.hs_code,
      product_id: Number(formData.product_id),
    }


    console.log('Submitting payload:', payload)

    try {
      const url = selectedItem
        ? `${API}/item_master/${selectedItem.item_id}`
        : `${API}/item_master`

      const method = selectedItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log('Item saved successfully')
        fetchData()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this item? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/item_master/${selectedItem.item_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        fetchData()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  // Build JSON for full item listing report
  const buildFullReportJson = () => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "ITEM MASTER REPORT" },
    })

    // Summary section
    components.push({
      type: "subheader",
      props: { text: "Summary" }
    })

    // Count items by product
    const productCounts = new Map<string, number>()
    items.forEach(item => {
      const count = productCounts.get(item.product_name) || 0
      productCounts.set(item.product_name, count + 1)
    })

    const summaryRows = [
      ["Total Items", items.length.toString()],
      ["Total Products", new Set(items.map(i => i.product_id)).size.toString()],
      ["Report Generated", new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })],
    ]

    components.push({
      type: "table",
      props: {
        headers: ["Metric", "Value"],
        rows: summaryRows,
      },
    })

    // Item listings
    components.push({
      type: "subheader",
      props: { text: "Item Listings" }
    })

    const tableRows = items.map(item => [
      item.item_id.toString(),
      item.product_name,
      item.item_short_description || item.item_description.substring(0, 50) + (item.item_description.length > 50 ? '...' : ''),
      item.hs_code || 'N/A',
    ])

    components.push({
      type: "table",
      props: {
        headers: ["ID", "Product", "Short Description", "HS Code"],
        rows: tableRows,
      },
    })

    return {
      company: "Item Master",
      reportName: `Item Master Report - ${new Date().toLocaleDateString()}`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Build JSON for single item report
  const buildSingleItemReportJson = (item: ItemWithProduct) => {
    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "ITEM DETAILS REPORT" },
    })

    // Item details
    components.push({
      type: "subheader",
      props: { text: item.item_short_description || item.item_description }
    })

    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["Item ID", item.item_id.toString()],
          ["Product", item.product_name],
          ["Short Description", item.item_short_description || 'N/A'],
          ["Full Description", item.item_description],
          ["HS Code", item.hs_code || 'N/A'],
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
      company: item.product_name,
      reportName: `Item ${item.item_id} - Item Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for all items
  const handleGenerateFullReport = async () => {
    if (items.length === 0) {
      alert('No items to generate report')
      return
    }

    setIsGeneratingReport(true)
    try {
      const reportJson = buildFullReportJson()
      await generatePDF(reportJson, 'download', 'item-master-report.pdf')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate report for single item
  const handleGenerateSingleReport = async () => {
    if (!selectedItem) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildSingleItemReportJson(selectedItem)
      await generatePDF(reportJson, 'download', `item-${selectedItem.item_id}-report.pdf`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const columns: Column<ItemWithProduct>[] = [
    { key: 'item_id', header: 'ID' },
    { key: 'product_name', header: 'Product Name' },
    { key: 'item_short_description', header: 'Short Description' },
    { key: 'hs_code', header: 'HS Code' },
  ]

  // Format items to show short description or truncated description
  const formattedItems = items.map(item => ({
    ...item,
    item_short_description: item.item_short_description || 
      (item.item_description.length > 50 
        ? item.item_description.substring(0, 50) + '...' 
        : item.item_description) as any
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Item Master</h1>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport || items.length === 0}
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
      ) : formattedItems.length > 0 ? (
        <CustomTable
          data={formattedItems}
          columns={columns}
          idField="item_id"
          onRowClick={(formattedItem) => {
            const originalItem = items.find(i => i.item_id === formattedItem.item_id)
            if (originalItem) handleRowClick(originalItem)
          }}
        />
      ) : (
        <p className="text-gray-600">No items found.</p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedItem ? 'Edit Item' : 'Create Item'}
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
                    Product *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        product_id: e.target.value === '' ? '' : Number(e.target.value)
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
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.item_short_description}
                    onChange={(e) =>
                      setFormData({ ...formData, item_short_description: e.target.value })
                    }
                    placeholder="Brief description for listings"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Description *
                  </label>
                  <textarea
                    value={formData.item_description}
                    onChange={(e) =>
                      setFormData({ ...formData, item_description: e.target.value })
                    }
                    rows={4}
                    placeholder="Complete detailed description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HS Code *
                  </label>
                  <input
                    type="text"
                    value={formData.hs_code}
                    onChange={(e) =>
                      setFormData({ ...formData, hs_code: e.target.value })
                    }
                    placeholder="Harmonized System Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                {/* Left side: Delete and Generate Report buttons */}
                <div className="flex gap-2">
                  {selectedItem && (
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