// src/app/dashboard/counter_guarantee/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const formatDateString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function CGEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    guarantee_type: 'TBG',
    guarantee_ref_number: '',
    cg_date: '',
    issuing_bank: '',
    expiry_date: '',
    remarks: '',
    pending_status: 'NOT Issued',
  })

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    
    fetch(`${API}/counter_guarantee/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch Counter Guarantee data')
        const data = await res.json()
        
        setFormData({
          guarantee_type: data.guarantee_type || 'TBG',
          guarantee_ref_number: data.guarantee_ref_number || '',
          cg_date: formatDateString(data.cg_date),
          issuing_bank: data.issuing_bank || '',
          expiry_date: formatDateString(data.expiry_date),
          remarks: data.remarks || '',
          pending_status: data.pending_status || 'NOT Issued',
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      guarantee_type: formData.guarantee_type,
      guarantee_ref_number: formData.guarantee_ref_number,
      cg_date: formData.cg_date,
      issuing_bank: formData.issuing_bank || null,
      expiry_date: formData.expiry_date,
      remarks: formData.remarks || null,
      pending_status: formData.pending_status,
    }

    try {
      const response = await fetch(`${API}/counter_guarantee/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/guarantees')
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to update Counter Guarantee')
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
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Counter Guarantee</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form
  onKeyDown={(e) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault()
    }
  }}
  onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Guarantee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Type *</label>
              <select
                value={formData.guarantee_type}
                onChange={(e) => setFormData({ ...formData, guarantee_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="TBG">Tender Bond Guarantee (TBG)</option>
                <option value="PBG">Performance Bond Guarantee (PBG)</option>
                <option value="MPG">Material Performance Guarantee (MPG)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Ref Number *</label>
              <input
                type="text"
                value={formData.guarantee_ref_number}
                onChange={(e) => setFormData({ ...formData, guarantee_ref_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter ref number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Bank</label>
              <input
                type="text"
                value={formData.issuing_bank}
                onChange={(e) => setFormData({ ...formData, issuing_bank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter issuing bank"
              />
            </div>
          </div>
        </div>

        {/* Dates & Status Tracking */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Dates & Status Tracking</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CG Date *</label>
              <input
                type="date"
                value={formData.cg_date}
                onChange={(e) => setFormData({ ...formData, cg_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
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
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Any additional remarks..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboardguarantees')}
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
            {saving ? 'Updating...' : 'Update Counter Guarantee'}
          </button>
        </div>
      </form>
    </div>
  )
}