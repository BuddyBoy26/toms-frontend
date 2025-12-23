// src/app/dashboard/delivery_procedure/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'
type CepaDduEnum = 0 | 1 // 0: CEPA, 1: DDU
type CdExemptionEnum = 0 | 1 // 0: Not Exempted, 1: Exempted
type DocumentStatusEnum = 0 | 1 | 2 // 0: Not received, 1: Partial, 2: All received

interface OrderDetail {
  order_id: number
  po_number: string
  order_description: string
}

interface OrderItemDetail {
  order_item_detail_id: number
  order_id: number
  item_id: number
  item_description: string
  item_master_description: string
  item_no_dewa: string
  item_quantity: number
  item_unit_price: number
  currency: CurrencyEnum
}

interface LotMonitoring {
  lot_id: number
  order_item_detail_id: number
  order_id: number
  shipment_no: string | null
  item_lot_no: string | null
  quantity: number
  item_unit_price: number
  currency: CurrencyEnum
  
  // Dates that we'll auto-populate
  etd_date: string | null
  eta_date: string | null
  actual_dispatch_date: string | null
  actual_arrival_date: string | null
  asn_date: string | null
  dispatch_clearance_date: string | null
}

export default function DeliveryProcedureCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([])
  const [allLots, setAllLots] = useState<LotMonitoring[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Dropdowns for selection
    order_id: '' as number | '',
    shipment_no: '',
    order_item_detail_id: '' as number | '',
    lot_id: '' as number | '',
    
    // Auto-populated from selections
    item_no_dewa: '',
    lot_no_dewa: '',
    
    // Shipment Dates (auto-populated from lot)
    shipment_etd: '',
    shipment_eta: '',
    shipment_atd: '',
    shipment_ata: '',
    
    // Document Status
    document_status: 0 as DocumentStatusEnum, // 0: Not received, 1: Partial, 2: All received
    document_received: false, // Helper for radio button (true = received)
    remarks_document_status: '',
    receive_shipping_docs_date: '',
    
    // CD Exemption
    cd_exemption: 0 as CdExemptionEnum,
    cd_exemption_submitted: '',
    cd_exemption_recieved_date: '',
    
    // CEPA/DDU
    cepa_ddu: 0 as CepaDduEnum,
    cepa_ddu_date: '',
    
    // Submission & Processing
    authorization_letter_date: '',
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

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders()
  }, [])

  // Fetch order items and lots when order is selected
  useEffect(() => {
    if (formData.order_id) {
      fetchOrderItemsAndLots()
    }
  }, [formData.order_id])

  const fetchOrders = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API}/order_detail`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderItemsAndLots = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token || !formData.order_id) return

    setLoading(true)
    try {
      const [itemsRes, lotsRes] = await Promise.all([
        fetch(`${API}/order_item_detail?order_id=${formData.order_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/lot_monitoring?order_id=${formData.order_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [itemsData, lotsData] = await Promise.all([
        itemsRes.json(),
        lotsRes.json(),
      ])

      setOrderItems(Array.isArray(itemsData) ? itemsData : [])
      setAllLots(Array.isArray(lotsData) ? lotsData : [])
    } catch (e: any) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Get unique shipment numbers from lots for the selected order
  const availableShipments = useMemo(() => {
    if (!formData.order_id) return []
    const shipments = allLots
      .filter(lot => lot.order_id === formData.order_id && lot.shipment_no)
      .map(lot => lot.shipment_no)
      .filter((value, index, self) => self.indexOf(value) === index) // unique
    return shipments.filter(Boolean) as string[]
  }, [formData.order_id, allLots])

  // Get items that have lots with the selected shipment
  const availableItems = useMemo(() => {
    if (!formData.shipment_no) return []
    
    const itemIdsWithShipment = allLots
      .filter(lot => lot.shipment_no === formData.shipment_no)
      .map(lot => lot.order_item_detail_id)
      .filter((value, index, self) => self.indexOf(value) === index) // unique

    return orderItems.filter(item => itemIdsWithShipment.includes(item.order_item_detail_id))
  }, [formData.shipment_no, allLots, orderItems])

  // Get lots for the selected item and shipment
  const availableLots = useMemo(() => {
    if (!formData.order_item_detail_id || !formData.shipment_no) return []
    
    return allLots.filter(
      lot => 
        lot.order_item_detail_id === formData.order_item_detail_id &&
        lot.shipment_no === formData.shipment_no
    )
  }, [formData.order_item_detail_id, formData.shipment_no, allLots])

  const handleOrderChange = (orderId: string) => {
    const id = orderId === '' ? '' : Number(orderId)
    setFormData({
      ...formData,
      order_id: id,
      shipment_no: '',
      order_item_detail_id: '',
      lot_id: '',
      item_no_dewa: '',
      lot_no_dewa: '',
      shipment_etd: '',
      shipment_eta: '',
      shipment_atd: '',
      shipment_ata: '',
      asn_date: '',
    })
  }

  const handleShipmentChange = (shipmentNo: string) => {
    setFormData({
      ...formData,
      shipment_no: shipmentNo,
      order_item_detail_id: '',
      lot_id: '',
      item_no_dewa: '',
      lot_no_dewa: '',
      shipment_etd: '',
      shipment_eta: '',
      shipment_atd: '',
      shipment_ata: '',
      asn_date: '',
    })
  }

  const handleItemChange = (itemId: string) => {
    const id = itemId === '' ? '' : Number(itemId)
    const selectedItem = orderItems.find(item => item.order_item_detail_id === id)
    
    setFormData({
      ...formData,
      order_item_detail_id: id,
      lot_id: '',
      item_no_dewa: selectedItem?.item_no_dewa || '',
      lot_no_dewa: '',
      shipment_etd: '',
      shipment_eta: '',
      shipment_atd: '',
      shipment_ata: '',
      asn_date: '',
    })
  }

  const handleLotChange = (lotId: string) => {
    const id = lotId === '' ? '' : Number(lotId)
    const selectedLot = allLots.find(lot => lot.lot_id === id)
    
    if (selectedLot) {
      setFormData({
        ...formData,
        lot_id: id,
        lot_no_dewa: selectedLot.item_lot_no || '',
        shipment_etd: selectedLot.etd_date || '',
        shipment_eta: selectedLot.eta_date || '',
        shipment_atd: selectedLot.actual_dispatch_date || '',
        shipment_ata: selectedLot.actual_arrival_date || '',
        asn_date: selectedLot.asn_date || '',
      })
    } else {
      setFormData({
        ...formData,
        lot_id: id,
        lot_no_dewa: '',
        shipment_etd: '',
        shipment_eta: '',
        shipment_atd: '',
        shipment_ata: '',
        asn_date: '',
      })
    }
  }

  const handleDocumentReceivedChange = (received: boolean) => {
    setFormData({
      ...formData,
      document_received: received,
      document_status: received ? 1 : 0, // If received, default to partial
      receive_shipping_docs_date: received ? formData.receive_shipping_docs_date : '',
      remarks_document_status: received ? formData.remarks_document_status : '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.lot_id || !formData.order_item_detail_id) {
      setError('Please select all required fields (PO, Shipment, Item, and Lot)')
      return
    }

    setSaving(true)

    const payload = {
      lot_id: Number(formData.lot_id),
      order_item_detail_id: Number(formData.order_item_detail_id),
      item_no_dewa: formData.item_no_dewa || null,
      lot_no_dewa: formData.lot_no_dewa || null,
      shipment_no: formData.shipment_no || null,
      
      shipment_etd: formData.shipment_etd || null,
      shipment_eta: formData.shipment_eta || null,
      shipment_atd: formData.shipment_atd || null,
      shipment_ata: formData.shipment_ata || null,
      
      document_status: formData.document_status,
      remarks_document_status: formData.remarks_document_status || null,
      receive_shipping_docs_date: formData.receive_shipping_docs_date || null,
      
      cd_exemption: formData.cd_exemption,
      cd_exemption_submitted: formData.cd_exemption_submitted || null,
      cd_exemption_recieved_date: formData.cd_exemption_recieved_date || null,
      
      cepa_ddu: formData.cepa_ddu,
      cepa_ddu_date: formData.cepa_ddu_date || null,
      
      authorization_letter_date: formData.authorization_letter_date || null,
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

    console.log("Submitting payload:", payload)

    try {
      const response = await fetch(`${API}/delivery_procedure`, {
        method: 'POST',
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
        setError(err?.detail || 'Failed to create delivery procedure')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Create Delivery Procedure</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selection Section - PO → Shipment → Item → Lot */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Selection (Cascading Filters)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PO Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order (PO) *
              </label>
              <select
                value={formData.order_id}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">-- Select PO --</option>
                {orders.map(order => (
                  <option key={order.order_id} value={order.order_id}>
                    {order.po_number} - {order.order_description}
                  </option>
                ))}
              </select>
            </div>

            {/* Shipment Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipment Number *
              </label>
              <select
                value={formData.shipment_no}
                onChange={(e) => handleShipmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!formData.order_id}
                required
              >
                <option value="">-- Select Shipment --</option>
                {availableShipments.map(shipment => (
                  <option key={shipment} value={shipment}>
                    {shipment}
                  </option>
                ))}
              </select>
              {!formData.order_id && (
                <p className="text-xs text-gray-500 mt-1">Select PO first</p>
              )}
            </div>

            {/* Item Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item (DEWA Item No) *
              </label>
              <select
                value={formData.order_item_detail_id}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!formData.shipment_no}
                required
              >
                <option value="">-- Select Item --</option>
                {availableItems.map(item => (
                  <option key={item.order_item_detail_id} value={item.order_item_detail_id}>
                    {item.item_no_dewa} - {item.item_master_description || item.item_description}
                  </option>
                ))}
              </select>
              {!formData.shipment_no && (
                <p className="text-xs text-gray-500 mt-1">Select Shipment first</p>
              )}
            </div>

            {/* Lot Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot Number *
              </label>
              <select
                value={formData.lot_id}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!formData.order_item_detail_id}
                required
              >
                <option value="">-- Select Lot --</option>
                {availableLots.map(lot => (
                  <option key={lot.lot_id} value={lot.lot_id}>
                    Lot #{lot.lot_id} - {lot.item_lot_no || 'N/A'}
                  </option>
                ))}
              </select>
              {!formData.order_item_detail_id && (
                <p className="text-xs text-gray-500 mt-1">Select Item first</p>
              )}
            </div>

            {/* Auto-populated: Lot No DEWA (Read-only) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot No (DEWA) - Auto-populated
              </label>
              <input
                type="text"
                value={formData.lot_no_dewa}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                placeholder="Will auto-populate when lot is selected"
              />
            </div>
          </div>
        </div>

        {/* Shipment Dates - Auto-populated from Lot */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Shipment Dates (Auto-populated from Lot)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ETD Date</label>
              <input
                type="date"
                value={formData.shipment_etd}
                onChange={(e) => setFormData({ ...formData, shipment_etd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ETA Date</label>
              <input
                type="date"
                value={formData.shipment_eta}
                onChange={(e) => setFormData({ ...formData, shipment_eta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Dispatch (ATD)</label>
              <input
                type="date"
                value={formData.shipment_atd}
                onChange={(e) => setFormData({ ...formData, shipment_atd: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Arrival (ATA)</label>
              <input
                type="date"
                value={formData.shipment_ata}
                onChange={(e) => setFormData({ ...formData, shipment_ata: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Document Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Document Status</h2>
          
          {/* Radio buttons for Document Received */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documents Received?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!formData.document_received}
                  onChange={() => handleDocumentReceivedChange(false)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm text-gray-700">Not Received</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.document_received}
                  onChange={() => handleDocumentReceivedChange(true)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm text-gray-700">Received</span>
              </label>
            </div>
          </div>

          {/* Show additional fields if documents are received */}
          {formData.document_received && (
            <div className="space-y-4 pl-4 border-l-2 border-green-200">
              {/* Partial or All Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Receipt Status
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.document_status === 1}
                      onChange={() => setFormData({ ...formData, document_status: 1 })}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm text-gray-700">Partial Documents</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.document_status === 2}
                      onChange={() => setFormData({ ...formData, document_status: 2 })}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm text-gray-700">All Documents</span>
                  </label>
                </div>
              </div>

              {/* Date Received */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Shipping Documents Received
                </label>
                <input
                  type="date"
                  value={formData.receive_shipping_docs_date}
                  onChange={(e) => setFormData({ ...formData, receive_shipping_docs_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks on Document Status
                </label>
                <textarea
                  value={formData.remarks_document_status}
                  onChange={(e) => setFormData({ ...formData, remarks_document_status: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter any remarks about document status..."
                />
              </div>
            </div>
          )}
        </div>

        {/* CD Exemption */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">CD Exemption</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CD Exemption Status
              </label>
              <select
                value={formData.cd_exemption}
                onChange={(e) => setFormData({ ...formData, cd_exemption: Number(e.target.value) as CdExemptionEnum })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="0">Not Exempted</option>
                <option value="1">Exempted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CD Exemption Submitted Date
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">CEPA / DDU</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEPA / DDU Type
              </label>
              <select
                value={formData.cepa_ddu}
                onChange={(e) => setFormData({ ...formData, cepa_ddu: Number(e.target.value) as CepaDduEnum })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="0">CEPA</option>
                <option value="1">DDU</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEPA / DDU Date
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Submission & Processing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authorization Letter Date
              </label>
              <input
                type="date"
                value={formData.authorization_letter_date}
                onChange={(e) => setFormData({ ...formData, authorization_letter_date: e.target.value })}
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">ASN (Advanced Shipping Notice) Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ASN Number
              </label>
              <input
                type="text"
                value={formData.asn_no}
                onChange={(e) => setFormData({ ...formData, asn_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter ASN number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ASN Date (Auto-populated from Lot)
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Delivery Note & Gate Pass</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Note Number
              </label>
              <input
                type="text"
                value={formData.delivery_note_no}
                onChange={(e) => setFormData({ ...formData, delivery_note_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter delivery note number"
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Final Delivery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End of Delivery Remarks
              </label>
              <textarea
                value={formData.end_of_delivery_remarks}
                onChange={(e) => setFormData({ ...formData, end_of_delivery_remarks: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter any final remarks about the delivery..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/delivery_procedure')}
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
            {saving ? 'Creating...' : 'Create Delivery Procedure'}
          </button>
        </div>
      </form>
    </div>
  )
}