// src/app/dashboard/material_performance_guarantee/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface OrderDetail {
  order_id: number
  po_number: string
  order_description: string
}

const formatNumber = (value: string): string => {
  if (value === '' || value === null || value === undefined) return ''
  const numStr = String(value).replace(/[^\d.]/g, '')
  if (!numStr) return ''
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 4)}`
  }
  return formattedInteger
}

const parseFormattedNumber = (value: string): number | null => {
  if (!value) return null
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export default function MPGCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    order_id: '' as number | '',
    mpg_no: '',
    participated: false,
    mpg_bank_or_deposit: 0, // 0: Bank, 1: Deposit
    mpg_issuing_bank: '',
    mpg_deposit_receipt_no: '',
    mpg_value: '',
    mpg_expiry_date: '',
    mpg_submitted_date: '',
    mpg_release_date_dewa: '',
    mpg_release_date_bank: '',
    mpg_extension_dates: [] as string[],
    remarks: '',
    pending_status: 'NOT Issued',
  })

  const [newExtensionDate, setNewExtensionDate] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load POs'))
      .finally(() => setLoading(false))
  }, [API])

  const handleAmountChange = (value: string) => {
    setFormData({ ...formData, mpg_value: formatNumber(value) })
  }

  const addExtensionDate = () => {
    if (newExtensionDate) {
      setFormData({
        ...formData,
        mpg_extension_dates: [...formData.mpg_extension_dates, newExtensionDate]
      })
      setNewExtensionDate('')
    }
  }

  const removeExtensionDate = (index: number) => {
    setFormData({
      ...formData,
      mpg_extension_dates: formData.mpg_extension_dates.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.order_id) {
      setError('Please select a Purchase Order.')
      return
    }

    setSaving(true)
    const payload = {
      order_id: Number(formData.order_id),
      mpg_no: formData.mpg_no,
      participated: formData.participated ? 1 : 0,
      mpg_bank_or_deposit: formData.mpg_bank_or_deposit,
      mpg_issuing_bank: formData.mpg_bank_or_deposit === 0 ? formData.mpg_issuing_bank : null,
      mpg_deposit_receipt_no: formData.mpg_bank_or_deposit === 1 ? formData.mpg_deposit_receipt_no : null,
      mpg_value: parseFormattedNumber(formData.mpg_value) || 0,
      mpg_expiry_date: formData.mpg_expiry_date,
      mpg_submitted_date: formData.mpg_submitted_date || null,
      mpg_release_date_dewa: formData.mpg_release_date_dewa || null,
      mpg_release_date_bank: formData.mpg_release_date_bank || null,
      mpg_extension_dates: formData.mpg_extension_dates.length > 0 ? formData.mpg_extension_dates : null,
      remarks: formData.remarks || null,
      pending_status: formData.pending_status,
    }

    try {
      const response = await fetch(`${API}/material_performance_guarantee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/material_performance_guarantee')
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to create MPG')
      }
    } catch (error) {
      console.error(error)
      setError('An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-center">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Create Material Performance Guarantee</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order (PO) *</label>
              <select
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">-- Select PO --</option>
                {orders.map(o => (
                  <option key={o.order_id} value={o.order_id}>{o.po_number} - {o.order_description}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MPG Number *</label>
              <input
                type="text"
                value={formData.mpg_no}
                onChange={(e) => setFormData({ ...formData, mpg_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="participated"
                checked={formData.participated}
                onChange={(e) => setFormData({ ...formData, participated: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="participated" className="text-sm font-medium text-gray-700">Participated</label>
            </div>
          </div>
        </div>

        {/* Guarantee Type Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Guarantee Details</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.mpg_bank_or_deposit === 0}
                  onChange={() => setFormData({ ...formData, mpg_bank_or_deposit: 0 })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Bank Guarantee</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.mpg_bank_or_deposit === 1}
                  onChange={() => setFormData({ ...formData, mpg_bank_or_deposit: 1 })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Deposit</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.mpg_bank_or_deposit === 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Bank</label>
                <input
                  type="text"
                  value={formData.mpg_issuing_bank}
                  onChange={(e) => setFormData({ ...formData, mpg_issuing_bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Receipt No</label>
                <input
                  type="text"
                  value={formData.mpg_deposit_receipt_no}
                  onChange={(e) => setFormData({ ...formData, mpg_deposit_receipt_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MPG Value *</label>
              <input
                type="text"
                value={formData.mpg_value}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Dates & Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Dates & Status Tracking</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                value={formData.mpg_expiry_date}
                onChange={(e) => setFormData({ ...formData, mpg_expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
              <input
                type="date"
                value={formData.mpg_submitted_date}
                onChange={(e) => setFormData({ ...formData, mpg_submitted_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DEWA Release Date</label>
              <input
                type="date"
                value={formData.mpg_release_date_dewa}
                onChange={(e) => setFormData({ ...formData, mpg_release_date_dewa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Release Date</label>
              <input
                type="date"
                value={formData.mpg_release_date_bank}
                onChange={(e) => setFormData({ ...formData, mpg_release_date_bank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pending Status *</label>
              <select
                value={formData.pending_status}
                onChange={(e) => setFormData({ ...formData, pending_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="NOT Issued">NOT Issued</option>
                <option value="Issued / Extended">Issued / Extended</option>
                <option value="Extension Required">Extension Required</option>
                <option value="NOT Released">NOT Released</option>
                <option value="Released">Released</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Extension Dates */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Extension Dates</h2>
          
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={newExtensionDate}
              onChange={(e) => setNewExtensionDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={addExtensionDate}
              disabled={!newExtensionDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition text-sm"
            >
              + Add
            </button>
          </div>

          {formData.mpg_extension_dates.length > 0 && (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Extension Date</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.mpg_extension_dates.map((date, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{new Date(date).toLocaleDateString('en-GB')}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeExtensionDate(index)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/material_performance_guarantee')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {saving ? 'Saving...' : 'Create Guarantee'}
          </button>
        </div>
      </form>
    </div>
  )
}