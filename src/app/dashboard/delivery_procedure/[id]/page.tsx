// src/app/dashboard/delivery_procedure/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Loader from '@/components/Loader'

interface LotMonitoring {
  lot_id: number
  order_item_detail_id: number
  item_lot_no: string | null
  shipment_no: string | null
  etd_date: string | null
  dispatch_clearance_date: string | null
  eta_date: string | null
  actual_dispatch_date: string | null
  asn_date: string | null
}

interface OrderItemDetail {
  order_item_detail_id: number
  item_no_dewa: string
  item_description: string
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

export default function DeliveryProcedureEditPage() {
  const router = useRouter()
  const params = useParams()
  const dpId = params.id as string
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [lots, setLots] = useState<LotMonitoring[]>([])
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    lot_id: '' as number | '',
    order_item_detail_id: '' as number | '',
    item_no_dewa: '',
    lot_no_dewa: '',
    
    // Shipment Dates (auto-populated)
    shipment_etd: '',
    dispatch_clearance_date: '',
    shipment_eta: '',
    actual_dispatch_date: '',
    
    // Document Status
    document_status: '' as number | '',
    receive_shipping_docs_date: '',
    
    // CD Exemption
    cd_exemption: '' as number | '',
    cd_exemption_submitted: '',
    cd_exemption_recieved_date: '',
    
    // CEPA/DDU
    cepa_ddu: '' as number | '',
    cepa_ddu_date: '',
    
    // Submission & Processing
    submission_to_cd_accounts_date: '',
    bl_stamped_date: '',
    documents_to_agent_date: '',
    
    // ASN Details
    asn_no: '',
    asn_date: '',
    delivery_intimation_date: '',
    deliver_approval_from_stores_date: '',
    
    // Delivery Note & Gate Pass
    delivery_note_no: '',
    delivery_note_date: '',
    gate_pass_request_date: '',
    gate_pass_received_date: '',
    
    // Final Delivery
    delivery_date: '',
    delivery_date_smart_meters: '',
    end_of_delivery_remarks: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [procedureRes, lotsRes, itemsRes] = await Promise.all([
        fetch(`${API}/delivery_procedure/${dpId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/lot_monitoring`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/order_item_detail`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const [procedureData, lotsData, itemsData] = await Promise.all([
        procedureRes.json(),
        lotsRes.json(),
        itemsRes.json()
      ])

      setLots(Array.isArray(lotsData) ? lotsData : [])
      setOrderItems(Array.isArray(itemsData) ? itemsData : [])

      // Populate form with existing data
      if (procedureData) {
        setFormData({
          lot_id: procedureData.lot_id,
          order_item_detail_id: procedureData.order_item_detail_id,
          item_no_dewa: procedureData.item_no_dewa || '',
          lot_no_dewa: procedureData.lot_no_dewa || '',
          
          shipment_etd: procedureData.shipment_etd || '',
          dispatch_clearance_date: procedureData.dispatch_clearance_date || '',
          shipment_eta: procedureData.shipment_eta || '',
          actual_dispatch_date: procedureData.actual_dispatch_date || '',
          
          document_status: procedureData.document_status === null ? '' : procedureData.document_status,
          receive_shipping_docs_date: procedureData.receive_shipping_docs_date || '',
          
          cd_exemption: procedureData.cd_exemption === null ? '' : procedureData.cd_exemption,
          cd_exemption_submitted: procedureData.cd_exemption_submitted || '',
          cd_exemption_recieved_date: procedureData.cd_exemption_recieved_date || '',
          
          cepa_ddu: procedureData.cepa_ddu === null ? '' : procedureData.cepa_ddu,
          cepa_ddu_date: procedureData.cepa_ddu_date || '',
          
          submission_to_cd_accounts_date: procedureData.submission_to_cd_accounts_date || '',
          bl_stamped_date: procedureData.bl_stamped_date || '',
          documents_to_agent_date: procedureData.documents_to_agent_date || '',
          
          asn_no: procedureData.asn_no || '',
          asn_date: procedureData.asn_date || '',
          delivery_intimation_date: procedureData.delivery_intimation_date || '',
          deliver_approval_from_stores_date: procedureData.deliver_approval_from_stores_date || '',
          
          delivery_note_no: procedureData.delivery_note_no || '',
          delivery_note_date: procedureData.delivery_note_date || '',
          gate_pass_request_date: procedureData.gate_pass_request_date || '',
          gate_pass_received_date: procedureData.gate_pass_received_date || '',
          
          delivery_date: procedureData.delivery_date || '',
          delivery_date_smart_meters: procedureData.delivery_date_smart_meters || '',
          end_of_delivery_remarks: procedureData.end_of_delivery_remarks || '',
        })
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    const payload = {
      lot_id: Number(formData.lot_id),
      order_item_detail_id: Number(formData.order_item_detail_id),
      item_no_dewa: formData.item_no_dewa || null,
      lot_no_dewa: formData.lot_no_dewa || null,
      
      shipment_etd: formData.shipment_etd || null,
      dispatch_clearance_date: formData.dispatch_clearance_date || null,
      shipment_eta: formData.shipment_eta || null,
      actual_dispatch_date: formData.actual_dispatch_date || null,
      
      document_status: formData.document_status === '' ? null : Number(formData.document_status),
      receive_shipping_docs_date: formData.receive_shipping_docs_date || null,
      
      cd_exemption: formData.cd_exemption === '' ? null : Number(formData.cd_exemption),
      cd_exemption_submitted: formData.cd_exemption_submitted || null,
      cd_exemption_recieved_date: formData.cd_exemption_recieved_date || null,
      
      cepa_ddu: formData.cepa_ddu === '' ? null : Number(formData.cepa_ddu),
      cepa_ddu_date: formData.cepa_ddu_date || null,
      
      submission_to_cd_accounts_date: formData.submission_to_cd_accounts_date || null,
      bl_stamped_date: formData.bl_stamped_date || null,
      documents_to_agent_date: formData.documents_to_agent_date || null,
      
      asn_no: formData.asn_no || null,
      asn_date: formData.asn_date || null,
      delivery_intimation_date: formData.delivery_intimation_date || null,
      deliver_approval_from_stores_date: formData.deliver_approval_from_stores_date || null,
      
      delivery_note_no: formData.delivery_note_no || null,
      delivery_note_date: formData.delivery_note_date || null,
      gate_pass_request_date: formData.gate_pass_request_date || null,
      gate_pass_received_date: formData.gate_pass_received_date || null,
      
      delivery_date: formData.delivery_date || null,
      delivery_date_smart_meters: formData.delivery_date_smart_meters || null,
      end_of_delivery_remarks: formData.end_of_delivery_remarks || null,
    }

    try {
      const response = await fetch(`${API}/delivery_procedure/${dpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/delivery_procedure')
      } else {
        const err = await response.json().catch(() => null)
        const msg =
          Array.isArray(err?.detail)
            ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
            : typeof err?.detail === 'string'
            ? err.detail
            : 'Failed to update delivery procedure'
        setError(msg)
      }
    } catch (error) {
      console.error('Error updating delivery procedure:', error)
      setError('An error occurred while updating')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Delivery Procedure #{dpId}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot *
              </label>
              <select
                value={formData.lot_id}
                onChange={(e) => setFormData({ ...formData, lot_id: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">-- Select Lot --</option>
                {lots.map(lot => (
                  <option key={lot.lot_id} value={lot.lot_id}>
                    Lot #{lot.lot_id} - {lot.item_lot_no || 'No Lot Number'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item No (DEWA)
              </label>
              <input
                type="text"
                value={formData.item_no_dewa}
                onChange={(e) => setFormData({ ...formData, item_no_dewa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot No (DEWA)
              </label>
              <input
                type="text"
                value={formData.lot_no_dewa}
                onChange={(e) => setFormData({ ...formData, lot_no_dewa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Shipment Dates */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Shipment Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipment ETD
              </label>
              <input
                type="date"
                value={formData.shipment_etd}
                onChange={(e) => setFormData({ ...formData, shipment_etd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispatch Clearance Date
              </label>
              <input
                type="date"
                value={formData.dispatch_clearance_date}
                onChange={(e) => setFormData({ ...formData, dispatch_clearance_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipment ETA
              </label>
              <input
                type="date"
                value={formData.shipment_eta}
                onChange={(e) => setFormData({ ...formData, shipment_eta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Dispatch Date
              </label>
              <input
                type="date"
                value={formData.actual_dispatch_date}
                onChange={(e) => setFormData({ ...formData, actual_dispatch_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Document Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Document Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Status
              </label>
              <select
                value={formData.document_status}
                onChange={(e) => setFormData({ ...formData, document_status: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select Status --</option>
                <option value="0">Not Received</option>
                <option value="1">Partial</option>
                <option value="2">All Received</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receive Shipping Docs Date
              </label>
              <input
                type="date"
                value={formData.receive_shipping_docs_date}
                onChange={(e) => setFormData({ ...formData, receive_shipping_docs_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* CD Exemption */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">CD Exemption</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CD Exemption
              </label>
              <select
                value={formData.cd_exemption}
                onChange={(e) => setFormData({ ...formData, cd_exemption: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select --</option>
                <option value="0">Not Exempted</option>
                <option value="1">Exempted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CD Exemption Submitted
              </label>
              <input
                type="date"
                value={formData.cd_exemption_submitted}
                onChange={(e) => setFormData({ ...formData, cd_exemption_submitted: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CD Exemption Received Date
              </label>
              <input
                type="date"
                value={formData.cd_exemption_recieved_date}
                onChange={(e) => setFormData({ ...formData, cd_exemption_recieved_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* CEPA/DDU */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">CEPA/DDU</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEPA/DDU
              </label>
              <select
                value={formData.cepa_ddu}
                onChange={(e) => setFormData({ ...formData, cepa_ddu: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select --</option>
                <option value="0">CEPA</option>
                <option value="1">DDU</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEPA/DDU Date
              </label>
              <input
                type="date"
                value={formData.cepa_ddu_date}
                onChange={(e) => setFormData({ ...formData, cepa_ddu_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Submission & Processing */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Submission & Processing</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submission to CD Accounts Date
              </label>
              <input
                type="date"
                value={formData.submission_to_cd_accounts_date}
                onChange={(e) => setFormData({ ...formData, submission_to_cd_accounts_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BL Stamped Date
              </label>
              <input
                type="date"
                value={formData.bl_stamped_date}
                onChange={(e) => setFormData({ ...formData, bl_stamped_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documents to Agent Date
              </label>
              <input
                type="date"
                value={formData.documents_to_agent_date}
                onChange={(e) => setFormData({ ...formData, documents_to_agent_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* ASN Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">ASN Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ASN No
              </label>
              <input
                type="text"
                value={formData.asn_no}
                onChange={(e) => setFormData({ ...formData, asn_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ASN Date
              </label>
              <input
                type="date"
                value={formData.asn_date}
                onChange={(e) => setFormData({ ...formData, asn_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Intimation Date
              </label>
              <input
                type="date"
                value={formData.delivery_intimation_date}
                onChange={(e) => setFormData({ ...formData, delivery_intimation_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Approval from Stores Date
              </label>
              <input
                type="date"
                value={formData.deliver_approval_from_stores_date}
                onChange={(e) => setFormData({ ...formData, deliver_approval_from_stores_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Delivery Note & Gate Pass */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Delivery Note & Gate Pass</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Note No
              </label>
              <input
                type="text"
                value={formData.delivery_note_no}
                onChange={(e) => setFormData({ ...formData, delivery_note_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Note Date
              </label>
              <input
                type="date"
                value={formData.delivery_note_date}
                onChange={(e) => setFormData({ ...formData, delivery_note_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gate Pass Request Date
              </label>
              <input
                type="date"
                value={formData.gate_pass_request_date}
                onChange={(e) => setFormData({ ...formData, gate_pass_request_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gate Pass Received Date
              </label>
              <input
                type="date"
                value={formData.gate_pass_received_date}
                onChange={(e) => setFormData({ ...formData, gate_pass_received_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Final Delivery */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Final Delivery</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date (Smart Meters)
                </label>
                <input
                  type="date"
                  value={formData.delivery_date_smart_meters}
                  onChange={(e) => setFormData({ ...formData, delivery_date_smart_meters: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End of Delivery Remarks
              </label>
              <textarea
                value={formData.end_of_delivery_remarks}
                onChange={(e) => setFormData({ ...formData, end_of_delivery_remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/delivery_procedure')}
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
            {isSaving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  )
}