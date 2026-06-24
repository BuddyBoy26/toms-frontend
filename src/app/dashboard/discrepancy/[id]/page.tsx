// src/app/dashboard/discrepancies/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'

interface OrderDetail { order_id: number; po_number: string; order_description: string }
interface OrderItemDetail { order_item_detail_id: number; item_no_dewa: string; item_master_description: string }
interface LotMonitoring { lot_id: number; order_id: number; order_item_detail_id: number; item_lot_no: string | null }

const formatDateString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function DiscrepancyEditPage() {
  usePageTitle(`Edit Discrepancy`)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([])
  const [allLots, setAllLots] = useState<LotMonitoring[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [headerData, setHeaderData] = useState({
    order_id: '' as number | '',
    order_item_detail_id: '' as number | '',
    lot_id: '' as number | '',
    dewa_letter_ref: '',
    letter_date: '',
    total_discrepant_units: '',
  })

  // Dynamic Rows State
  const [rows, setRows] = useState([
    { qty: '', nature_of_discrepancy: '', remarks: '', pending_status: true, delivery_note_no: '', delivery_date: '' }
  ])

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    fetch(`${API}/discrepancy/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(async (discData) => {
        const ordersRes = await fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } })
        setOrders(await ordersRes.json())

        const lotsRes = await fetch(`${API}/lot_monitoring`, { headers: { Authorization: `Bearer ${token}` } })
        const lots = await lotsRes.json()
        const currentLot = lots.find((l: any) => l.lot_id === discData.lot_id)
        const currentOrderId = currentLot?.order_id || ''

        if (currentOrderId !== '') {
          const [itemsR, scopeLotsR] = await Promise.all([
            fetch(`${API}/order_item_detail?order_id=${currentOrderId}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API}/lot_monitoring?order_id=${currentOrderId}`, { headers: { Authorization: `Bearer ${token}` } })
          ])
          setOrderItems(await itemsR.json())
          setAllLots(await scopeLotsR.json())
        }

        setHeaderData({
          order_id: currentOrderId,
          order_item_detail_id: currentLot?.order_item_detail_id || '',
          lot_id: discData.lot_id,
          dewa_letter_ref: discData.dewa_letter_ref || '',
          letter_date: formatDateString(discData.letter_date),
          total_discrepant_units: discData.total_discrepant_units || '',
        })

        // Populate rows with the JSON array from the database
        if (discData.details && Array.isArray(discData.details)) {
          setRows(discData.details.map((d: any) => ({
            ...d,
            delivery_date: formatDateString(d.delivery_date)
          })))
        }
      })
      .catch(() => setError('Failed to load discrepancy data'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleOrderChange = async (orderId: string) => {
    const parsedId = orderId === '' ? '' : Number(orderId)
    setHeaderData(prev => ({ ...prev, order_id: parsedId, order_item_detail_id: '', lot_id: '' }))

    if (parsedId) {
      const token = localStorage.getItem('kkabbas_token')
      const [itemsRes, lotsRes] = await Promise.all([
        fetch(`${API}/order_item_detail?order_id=${parsedId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/lot_monitoring?order_id=${parsedId}`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setOrderItems(await itemsRes.json())
      setAllLots(await lotsRes.json())
    }
  }

  const availableLots = allLots.filter(l => l.order_item_detail_id === headerData.order_item_detail_id)
  const uniqueLots = useMemo(() => {
    const seen = new Set()
    return availableLots.filter(lot => {
      const num = lot.item_lot_no || 'N/A'
      if (seen.has(num)) return false
      seen.add(num)
      return true
    })
  }, [availableLots])

  const addRow = () => {
    setRows([...rows, { qty: '', nature_of_discrepancy: '', remarks: '', pending_status: true, delivery_note_no: '', delivery_date: '' }])
  }

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!headerData.lot_id) {
      setError('Lot Number is required.')
      return
    }

    const currentTotal = rows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
    if (currentTotal !== Number(headerData.total_discrepant_units)) {
      setError(`Quantity mismatch: The sum of row quantities (${currentTotal}) must equal the total units with discrepancy (${headerData.total_discrepant_units}).`)
      return
    }

    setSaving(true)
    const payload = {
      lot_id: Number(headerData.lot_id),
      dewa_letter_ref: headerData.dewa_letter_ref || null,
      letter_date: headerData.letter_date || null,
      total_discrepant_units: headerData.total_discrepant_units ? Number(headerData.total_discrepant_units) : null,
      details: rows.map(r => ({
        qty: Number(r.qty),
        nature_of_discrepancy: r.nature_of_discrepancy,
        remarks: r.remarks || null,
        pending_status: r.pending_status,
        delivery_note_no: r.delivery_note_no || null,
        delivery_date: r.delivery_date || null
      }))
    }

    try {
      const res = await fetch(`${API}/discrepancy/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/dashboard/discrepancies')
      } else {
        const err = await res.json().catch(() => null)
        setError(err?.detail || 'Failed to update discrepancy')
      }
    } catch (error) {
      setError('An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-4">Loading data...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Discrepancy Record</h1>
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
        
        {/* TOP SECTION: PO, ITEM, LOT */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Item Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number *</label>
              <select value={headerData.order_id} onChange={(e) => handleOrderChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required>
                <option value="">-- Select PO --</option>
                {orders.map(o => <option key={o.order_id} value={o.order_id}>{o.po_number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item No. *</label>
              <select value={headerData.order_item_detail_id} onChange={(e) => setHeaderData({...headerData, order_item_detail_id: Number(e.target.value)})} disabled={!headerData.order_id} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required>
                <option value="">-- Select Item --</option>
                {orderItems.map(i => <option key={i.order_item_detail_id} value={i.order_item_detail_id}>{i.item_no_dewa}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot no. *</label>
              <select value={headerData.lot_id} onChange={(e) => setHeaderData({...headerData, lot_id: Number(e.target.value)})} disabled={!headerData.order_item_detail_id} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required>
                <option value="">-- Select Lot --</option>
                {uniqueLots.map(l => <option key={l.lot_id} value={l.lot_id}>{l.item_lot_no || 'N/A'}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* MID SECTION: Letter Ref & Total Units */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Header Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">DEWA Letter Ref. *</label>
              <input type="text" value={headerData.dewa_letter_ref} onChange={e => setHeaderData({...headerData, dewa_letter_ref: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dated *</label>
              <input type="date" value={headerData.letter_date} onChange={e => setHeaderData({...headerData, letter_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Units with Discrepancy *</label>
              <input type="number" value={headerData.total_discrepant_units} onChange={e => setHeaderData({...headerData, total_discrepant_units: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required min="1" />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Dynamic Rows Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Discrepancy Details</h3>
            <button
              type="button"
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
            >
              + Add Row
            </button>
          </div>

          <div className="border border-gray-200 rounded-md overflow-x-auto bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nature of Discrepancy</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Pending Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Note No.</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input type="number" value={row.qty} onChange={e => handleRowChange(index, 'qty', e.target.value)} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" required min="1" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.nature_of_discrepancy} onChange={e => handleRowChange(index, 'nature_of_discrepancy', e.target.value)} className="w-full min-w-[200px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" required />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.remarks} onChange={e => handleRowChange(index, 'remarks', e.target.value)} className="w-full min-w-[150px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-sm text-gray-700">
                          <input type="radio" checked={row.pending_status === true} onChange={() => handleRowChange(index, 'pending_status', true)} className="w-4 h-4 text-green-600 focus:ring-green-500" /> Yes
                        </label>
                        <label className="flex items-center gap-1 text-sm text-gray-700">
                          <input type="radio" checked={row.pending_status === false} onChange={() => handleRowChange(index, 'pending_status', false)} className="w-4 h-4 text-green-600 focus:ring-green-500" /> No
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={row.delivery_note_no} onChange={e => handleRowChange(index, 'delivery_note_no', e.target.value)} className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="date" value={row.delivery_date} onChange={e => handleRowChange(index, 'delivery_date', e.target.value)} className="w-36 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 italic">Note: The sum of row quantities must match the "Total Units with Discrepancy" header value.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => router.push('/dashboard/discrepancies')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {saving ? 'Updating...' : 'Update Discrepancies'}
          </button>
        </div>
      </form>
    </div>
  )
}