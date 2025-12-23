// src/app/dashboard/tendering_company_details/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface Company { company_id: number; company_name: string }
interface Tender { 
  tender_id: number; 
  tender_no: string; 
  tender_description: string;
  tender_value: number;
  currency: CurrencyEnum;
  bond_guarantee_amt: number | null;
}

// Utility function for number formatting
const formatNumber = (value: string): string => {
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

export default function TenderingCompanyCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    company_id: '' as number | '',
    tender_id: '' as number | '',
    
    // Header / Receipt section
    tender_receipt_no: '',
    debit_advice_no: '',
    debit_advice_date: '',
    
    // Tender value (auto-populated from tender master)
    tender_value: '',
    tendering_currency: 'AED' as CurrencyEnum,
    
    
    // TBG details section
    tbg_credit_card_option: 0, // 0: TBG, 1: Credit Card
    tbg_no: '',
    tbg_issuing_bank: '',
    tender_deposit_receipt_no: '',
    credit_card_payment_ref: '',
    remarks: '',
    
    // TBG continuation
    tbg_value: '',
    tbg_date: '',
    tbg_expiry_date: '',
    tbg_submitted_date: '',
    tbg_release_date_dewa: '',
    tbg_release_date_bank: '',
    dewa_enbd_ref: '',
    
    // Tender extension dates array
    tender_extension_dates: [] as string[],
    
    // Counter Guarantee section
    cg_bank: '',
    cg_no: '',
    cg_date: '',
    cg_expiry_date: '',
    
    // Delivery Weeks
    delivery_commencement_weeks: '',
    delivery_completion_weeks: '',
    
    // Status flags
    tender_bought: false,
    participated: false,
    result_saved: false,
    evaluations_received: false,
    memo: false,
    po_copies: false,
  })

  // State for the new extension date input
  const [newExtensionDate, setNewExtensionDate] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    setLoading(true)
    Promise.all([
      fetch(`${API}/tender`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/company_master`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([tendRes, compRes]) => Promise.all([tendRes.json(), compRes.json()]))
      .then(([tenderData, companyData]) => {
        setTenders(Array.isArray(tenderData) ? tenderData : [])
        setCompanies(Array.isArray(companyData) ? companyData : [])
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [API])

  // Auto-populate tender value and currency when tender is selected
  const handleTenderChange = (tenderId: string) => {
    const tenderIdNum = tenderId === '' ? '' : Number(tenderId)
    setFormData({ ...formData, tender_id: tenderIdNum })
    
    if (tenderId !== '') {
      const selectedTender = tenders.find(t => t.tender_id === Number(tenderId))
      if (selectedTender) {
        console.log('Selected Tender:', selectedTender)
        setFormData({
          ...formData,
          tender_id: tenderIdNum,
          tender_value: selectedTender.bond_guarantee_amt ? formatNumber(String(selectedTender.bond_guarantee_amt)) : '',
          tendering_currency: selectedTender.currency || 'AED',
          tbg_value: selectedTender.bond_guarantee_amt ? formatNumber(String(selectedTender.bond_guarantee_amt)) : '',
        })
      }
    }
  }

  const handleAmountChange = (value: string, field: 'tbg_value' | 'tender_value') => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, [field]: formatted })
  }

  // Extension dates handlers
  const addExtensionDate = () => {
    if (newExtensionDate) {
      setFormData({
        ...formData,
        tender_extension_dates: [...formData.tender_extension_dates, newExtensionDate]
      })
      setNewExtensionDate('')
    }
  }

  const removeExtensionDate = (index: number) => {
    setFormData({
      ...formData,
      tender_extension_dates: formData.tender_extension_dates.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.company_id || !formData.tender_id) {
      setError('Please select both company and tender')
      return
    }

    setSaving(true)

    const payload = {
      company_id: Number(formData.company_id),
      tender_id: Number(formData.tender_id),
      
      tender_receipt_no: formData.tender_receipt_no || null,
      debit_advice_no: formData.debit_advice_no || null,
      debit_advice_date: formData.debit_advice_date || null,
      
      tender_value: parseFormattedNumber(formData.tender_value),
      
      tbg_credit_card_option: formData.tbg_credit_card_option,
      tbg_no: formData.tbg_no || null,
      tbg_issuing_bank: formData.tbg_issuing_bank || null,
      tender_deposit_receipt_no: formData.tender_deposit_receipt_no || null,
      tendering_currency: formData.tendering_currency,
      credit_card_payment_ref: formData.credit_card_payment_ref || null,
      remarks: formData.remarks || null,
      
      tbg_value: parseFormattedNumber(formData.tbg_value),
      tbg_date: formData.tbg_date || null,
      tbg_expiry_date: formData.tbg_expiry_date || null,
      tbg_submitted_date: formData.tbg_submitted_date || null,
      tbg_release_date_dewa: formData.tbg_release_date_dewa || null,
      tbg_release_date_bank: formData.tbg_release_date_bank || null,
      dewa_enbd_ref: formData.dewa_enbd_ref || null,
      
      tender_extension_dates: formData.tender_extension_dates.length > 0 ? formData.tender_extension_dates : null,
      
      cg_bank: formData.cg_bank || null,
      cg_no: formData.cg_no || null,
      cg_date: formData.cg_date || null,
      cg_expiry_date: formData.cg_expiry_date || null,
      
      delivery_commencement_weeks: formData.delivery_commencement_weeks ? Number(formData.delivery_commencement_weeks) : null,
      delivery_completion_weeks: formData.delivery_completion_weeks ? Number(formData.delivery_completion_weeks) : null,
      
      tender_bought: formData.tender_bought ? 1 : 0,
      participated: formData.participated ? 1 : 0,
      result_saved: formData.result_saved ? 1 : 0,
      evaluations_received: formData.evaluations_received ? 1 : 0,
      memo: formData.memo ? 1 : 0,
      po_copies: formData.po_copies ? 1 : 0,
    }

    console.log("Payload", payload)

    try {
      const response = await fetch(`${API}/tendering_companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/tendering_company_details')
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to create tendering company')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Create Tendering Company Details</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Basic Information</h2>
          <div className="space-y-3">
            {/* Company and Tender - Full Width */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Company --</option>
                  {companies.map(c => (
                    <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tender *</label>
                <select
                  value={formData.tender_id}
                  onChange={(e) => handleTenderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Tender --</option>
                  {tenders.map(t => (
                    <option key={t.tender_id} value={t.tender_id}>{t.tender_no} - {t.tender_description}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receipt, Debit Advice - One Line */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tender Receipt No</label>
                <input
                  type="text"
                  value={formData.tender_receipt_no}
                  onChange={(e) => setFormData({ ...formData, tender_receipt_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debit Advice No</label>
                <input
                  type="text"
                  value={formData.debit_advice_no}
                  onChange={(e) => setFormData({ ...formData, debit_advice_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debit Advice Date</label>
                <input
                  type="date"
                  value={formData.debit_advice_date}
                  onChange={(e) => setFormData({ ...formData, debit_advice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Tender Value and Currency - As Per Tenderer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tender Value (As Per Tenderer)</label>
                <input
                  type="text"
                  value={formData.tender_value}
                  onChange={(e) => handleAmountChange(e.target.value, 'tender_value')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.tendering_currency}
                  onChange={(e) => setFormData({ ...formData, tendering_currency: e.target.value as CurrencyEnum })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="AED">AED</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* Delivery Schedule - One Line */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Commencement (Weeks)</label>
                <input
                  type="number"
                  value={formData.delivery_commencement_weeks}
                  onChange={(e) => setFormData({ ...formData, delivery_commencement_weeks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Number of weeks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Completion (Weeks)</label>
                <input
                  type="number"
                  value={formData.delivery_completion_weeks}
                  onChange={(e) => setFormData({ ...formData, delivery_completion_weeks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Number of weeks"
                />
              </div>
            </div>

            {/* Status Flags - One Line */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Flags</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tender_bought}
                    onChange={(e) => setFormData({ ...formData, tender_bought: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Tender Bought</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.participated}
                    onChange={(e) => setFormData({ ...formData, participated: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Participated</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.result_saved}
                    onChange={(e) => setFormData({ ...formData, result_saved: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Result Saved</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.evaluations_received}
                    onChange={(e) => setFormData({ ...formData, evaluations_received: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Evaluations Received</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Memo</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.po_copies}
                    onChange={(e) => setFormData({ ...formData, po_copies: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">PO Copies</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* TBG / Credit Card Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">TBG / Credit Card Details</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.tbg_credit_card_option === 0}
                  onChange={() => setFormData({ ...formData, tbg_credit_card_option: 0 })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm font-medium">TBG</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.tbg_credit_card_option === 1}
                  onChange={() => setFormData({ ...formData, tbg_credit_card_option: 1 })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm font-medium">Credit Card</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {formData.tbg_credit_card_option === 0 ? (
              // TBG Fields
              <>
                {/* TBG No, Issuing Bank - One Line */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG No</label>
                    <input
                      type="text"
                      value={formData.tbg_no}
                      onChange={(e) => setFormData({ ...formData, tbg_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Issuing Bank</label>
                    <input
                      type="text"
                      value={formData.tbg_issuing_bank}
                      onChange={(e) => setFormData({ ...formData, tbg_issuing_bank: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* TBG Value, Date, Expiry */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Value (AED)</label>
                    <input
                      type="text"
                      value={formData.tbg_value}
                      onChange={(e) => handleAmountChange(e.target.value, 'tbg_value')}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Date</label>
                    <input
                      type="date"
                      value={formData.tbg_date}
                      onChange={(e) => setFormData({ ...formData, tbg_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Expiry Date</label>
                    <input
                      type="date"
                      value={formData.tbg_expiry_date}
                      onChange={(e) => setFormData({ ...formData, tbg_expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* TBG Submitted, Release DEWA, Release Bank - One Line */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Submitted Date</label>
                    <input
                      type="date"
                      value={formData.tbg_submitted_date}
                      onChange={(e) => setFormData({ ...formData, tbg_submitted_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Release Date (DEWA)</label>
                    <input
                      type="date"
                      value={formData.tbg_release_date_dewa}
                      onChange={(e) => setFormData({ ...formData, tbg_release_date_dewa: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Release Date (Bank)</label>
                    <input
                      type="date"
                      value={formData.tbg_release_date_bank}
                      onChange={(e) => setFormData({ ...formData, tbg_release_date_bank: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* DEWA ENBD Ref */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DEWA ENBD Ref</label>
                  <input
                    type="text"
                    value={formData.dewa_enbd_ref}
                    onChange={(e) => setFormData({ ...formData, dewa_enbd_ref: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            ) : (
              // Credit Card Fields
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Card Payment Ref</label>
                    <input
                      type="text"
                      value={formData.credit_card_payment_ref}
                      onChange={(e) => setFormData({ ...formData, credit_card_payment_ref: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tender Deposit Receipt No</label>
                    <input
                      type="text"
                      value={formData.tender_deposit_receipt_no}
                      onChange={(e) => setFormData({ ...formData, tender_deposit_receipt_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TBG Value (AED)</label>
                    <input
                      type="text"
                      value={formData.tbg_value}
                      onChange={(e) => handleAmountChange(e.target.value, 'tbg_value')}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Tender Extension Dates */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Tender Extension Dates</h2>
          
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              + Add
            </button>
          </div>

          {formData.tender_extension_dates.length > 0 && (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.tender_extension_dates.map((date, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">{index + 1}</td>
                      <td className="px-3 py-2 text-sm">{new Date(date).toLocaleDateString('en-GB')}</td>
                      <td className="px-3 py-2 text-sm text-right">
                        <button
                          type="button"
                          onClick={() => removeExtensionDate(index)}
                          className="text-red-600 hover:text-red-800"
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

        {/* Counter Guarantee */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Counter Guarantee Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CG Bank</label>
                <input
                  type="text"
                  value={formData.cg_bank}
                  onChange={(e) => setFormData({ ...formData, cg_bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CG No</label>
                <input
                  type="text"
                  value={formData.cg_no}
                  onChange={(e) => setFormData({ ...formData, cg_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CG Date</label>
                <input
                  type="date"
                  value={formData.cg_date}
                  onChange={(e) => setFormData({ ...formData, cg_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CG Expiry Date</label>
                <input
                  type="date"
                  value={formData.cg_expiry_date}
                  onChange={(e) => setFormData({ ...formData, cg_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/tendering_company_details')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}