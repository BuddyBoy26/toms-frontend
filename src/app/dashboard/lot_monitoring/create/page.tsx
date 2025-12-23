// src/app/dashboard/lot_monitoring/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface Order {
  order_id: number
  order_no: string
  order_description: string
}

interface OrderItemDetail {
  order_item_detail_id: number
  order_id: number
  item_description: string
  currency: CurrencyEnum
  item_unit_price: number
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

export default function LotMonitoringCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([])
  const [filteredOrderItems, setFilteredOrderItems] = useState<OrderItemDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Lot Monitoring Information
    order_id: '' as number | '',
    order_item_detail_id: '' as number | '',
    order_description: '',
    shipment_no: '',
    item_lot_no: '',
    item_unit_price: '',
    currency: 'AED' as CurrencyEnum,
    quantity: '',
    item_total_value: '',
    po_line_no: '',
    contractual_delivery_date: '',

    // Inspection - Before Inspection
    inspection_call_date_tent: '',
    inspection_call_date_act: '',
    inspection_date_advised: '',
    no_of_inspection_days: '',
    inspection_at: '',
    actual_inspection_date: '',

    // Inspection - After Inspection
    units_inspected: '',
    after_inspection_pending_quantity: '',
    after_inspection_pending_lot_id: '',
    mom_date: '',
    dispatch_clearance_date: '',
    inspection_delay_days: '',
    dispatch_clearance_delay: '',

    // Shipment Details
    etd_date: '',
    actual_dispatch_date: '',
    eta_date: '',
    actual_arrival_date: '',

    // Delivery Authorisation
    requested_delivery_date: '',
    customs_duty_exemption_date: '',
    asn_date: '',

    // Delivery Details
    actual_delivery_date: '',
    meter_delivery_date: '',
    delivery_note_no: '',
    delivered_quantity: '',
    pending_quantity: '',
    remarks_on_delivery: '',
    delivery_total_value: '',
    grn_no: '',
    pending_lot_id: '',

    // Delay Details
    main_units_delay_days: '',
    accessories_delay_days: '',
    delay_by_dewa: '',
    other_delay_by_dewa: '',
    reason_for_other_delay: '',

    // Payment Details
    contractual_payment_date: '',
    invoice_no: '',
    invoice_date: '',
    invoice_value: '',
    srm_invoice_no: '',
    srm_invoice_date: '',
    srm_invoice_value: '',
    payment_amount_received: '',
    payment_received_date: '',
    delay_in_payment_days: '',
    reason_for_payment_delay: '',

    // Commission Details
    commission_amount_for_lot: '',
    commission_amount_for_delivered_quantity: '',
    commission_invoice_no: '',
    commission_invoice_date: '',
    commission_amount_invoiced: '',
    balance_commission_amount: '',

    // Summary for LD Calculation
    ld_delay_units_or_meters: 0, // 0: units, 1: meters
    ld_delay_units: '',
    ld_delay_meters: '',

    // Miscellaneous Delays
    delay_dewa_authorisation_days: '',
    remarks_delay: '',
    force_majeure: 0, // 0: No, 1: Yes
    force_majeure_days: '',

    actual_delay_for_ld: '',
    actual_ld_amount: '',
    max_ld_amount: '',
    chargeable_ld_amount: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    setLoading(true)
    Promise.all([
      fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/order_item_detail`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([ordersRes, itemsRes]) => Promise.all([ordersRes.json(), itemsRes.json()]))
      .then(([ordersData, itemsData]) => {
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setOrderItems(Array.isArray(itemsData) ? itemsData : [])
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => {setLoading(false)
        console.log('Loaded orders and order items')
        console.log('Orders:', orders)
        console.log('Order Items:', orderItems)
      })
  }, [API])

  
  // Handle order selection - filter order items
  const handleOrderChange = (orderId: string) => {
    const orderIdNum = orderId === '' ? '' : Number(orderId)
    setFormData({ 
      ...formData, 
      order_id: orderIdNum,
      order_item_detail_id: '', // Reset item selection
      item_unit_price: '',
      currency: 'AED',
      item_total_value: '',
    })
    
    if (orderId !== '') {
      const selectedOrder = orders.find(o => o.order_id === Number(orderId))
      const filtered = orderItems.filter(item => item.order_id === Number(orderId))
      setFilteredOrderItems(filtered)
      
      if (selectedOrder) {
        setFormData(prev => ({
          ...prev,
          order_id: orderIdNum,
          order_description: selectedOrder.order_description,
          order_item_detail_id: '',
          item_unit_price: '',
          currency: 'AED',
          item_total_value: '',
        }))
      }
    } else {
      setFilteredOrderItems([])
    }
  }

  // Handle order item selection - populate currency and unit price
  const handleOrderItemChange = (itemId: string) => {
    const itemIdNum = itemId === '' ? '' : Number(itemId)
    
    if (itemId !== '') {
      const selectedItem = orderItems.find(i => i.order_item_detail_id === Number(itemId))
      if (selectedItem) {
        const formattedPrice = formatNumber(String(selectedItem.item_unit_price))
        setFormData({
          ...formData,
          order_item_detail_id: itemIdNum,
          item_unit_price: formattedPrice,
          currency: selectedItem.currency || 'AED',
          item_total_value: '', // Reset until quantity is entered
        })
      }
    } else {
      setFormData({
        ...formData,
        order_item_detail_id: itemIdNum,
        item_unit_price: '',
        currency: 'AED',
        item_total_value: '',
      })
    }
  }

  // Auto-calculate item_total_value when quantity or unit price changes
  const handleQuantityChange = (value: string) => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, quantity: formatted })
    
    // Calculate total value
    const qty = parseFormattedNumber(formatted)
    const unitPrice = parseFormattedNumber(formData.item_unit_price)
    
    if (qty !== null && unitPrice !== null && qty > 0 && unitPrice > 0) {
      const total = qty * unitPrice
      setFormData(prev => ({
        ...prev,
        quantity: formatted,
        item_total_value: formatNumber(String(total))
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        quantity: formatted,
        item_total_value: ''
      }))
    }
  }

  const handleAmountChange = (value: string, field: string) => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, [field]: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.order_id || !formData.order_item_detail_id) {
      setError('Please select both order and order item')
      return
    }

    if (!formData.quantity || parseFormattedNumber(formData.quantity) === null) {
      setError('Please enter a valid quantity')
      return
    }

    if (!formData.item_unit_price || parseFormattedNumber(formData.item_unit_price) === null) {
      setError('Please enter a valid unit price')
      return
    }

    setSaving(true)

    const payload = {
      order_id: Number(formData.order_id),
      order_item_detail_id: Number(formData.order_item_detail_id),
      order_description: formData.order_description || null,
      shipment_no: formData.shipment_no || null,
      item_lot_no: formData.item_lot_no || null,
      item_unit_price: parseFormattedNumber(formData.item_unit_price),
      currency: formData.currency,
      quantity: parseFormattedNumber(formData.quantity),
      item_total_value: parseFormattedNumber(formData.item_total_value),
      po_line_no: formData.po_line_no || null,
      contractual_delivery_date: formData.contractual_delivery_date || null,

      // Inspection - Before
      inspection_call_date_tent: formData.inspection_call_date_tent || null,
      inspection_call_date_act: formData.inspection_call_date_act || null,
      inspection_date_advised: formData.inspection_date_advised || null,
      no_of_inspection_days: formData.no_of_inspection_days ? Number(formData.no_of_inspection_days) : null,
      inspection_at: formData.inspection_at || null,
      actual_inspection_date: formData.actual_inspection_date || null,

      // Inspection - After
      units_inspected: formData.units_inspected ? Number(formData.units_inspected) : null,
      after_inspection_pending_quantity: formData.after_inspection_pending_quantity ? Number(formData.after_inspection_pending_quantity) : null,
      after_inspection_pending_lot_id: formData.after_inspection_pending_lot_id ? Number(formData.after_inspection_pending_lot_id) : null,
      mom_date: formData.mom_date || null,
      dispatch_clearance_date: formData.dispatch_clearance_date || null,
      inspection_delay_days: formData.inspection_delay_days ? Number(formData.inspection_delay_days) : null,
      dispatch_clearance_delay: formData.dispatch_clearance_delay ? Number(formData.dispatch_clearance_delay) : null,

      // Shipment
      etd_date: formData.etd_date || null,
      actual_dispatch_date: formData.actual_dispatch_date || null,
      eta_date: formData.eta_date || null,
      actual_arrival_date: formData.actual_arrival_date || null,

      // Delivery Authorisation
      requested_delivery_date: formData.requested_delivery_date || null,
      customs_duty_exemption_date: formData.customs_duty_exemption_date || null,
      asn_date: formData.asn_date || null,

      // Delivery Details
      actual_delivery_date: formData.actual_delivery_date || null,
      meter_delivery_date: formData.meter_delivery_date || null,
      delivery_note_no: formData.delivery_note_no || null,
      delivered_quantity: formData.delivered_quantity ? Number(formData.delivered_quantity) : null,
      pending_quantity: formData.pending_quantity ? Number(formData.pending_quantity) : null,
      remarks_on_delivery: formData.remarks_on_delivery || null,
      delivery_total_value: parseFormattedNumber(formData.delivery_total_value),
      grn_no: formData.grn_no || null,
      pending_lot_id: formData.pending_lot_id ? Number(formData.pending_lot_id) : null,

      // Delay Details
      main_units_delay_days: formData.main_units_delay_days ? Number(formData.main_units_delay_days) : null,
      accessories_delay_days: formData.accessories_delay_days ? Number(formData.accessories_delay_days) : null,
      delay_by_dewa: formData.delay_by_dewa ? Number(formData.delay_by_dewa) : null,
      other_delay_by_dewa: formData.other_delay_by_dewa ? Number(formData.other_delay_by_dewa) : null,
      reason_for_other_delay: formData.reason_for_other_delay || null,

      // Payment Details
      contractual_payment_date: formData.contractual_payment_date || null,
      invoice_no: formData.invoice_no || null,
      invoice_date: formData.invoice_date || null,
      invoice_value: parseFormattedNumber(formData.invoice_value),
      srm_invoice_no: formData.srm_invoice_no || null,
      srm_invoice_date: formData.srm_invoice_date || null,
      srm_invoice_value: parseFormattedNumber(formData.srm_invoice_value),
      payment_amount_received: parseFormattedNumber(formData.payment_amount_received),
      payment_received_date: formData.payment_received_date || null,
      delay_in_payment_days: formData.delay_in_payment_days ? Number(formData.delay_in_payment_days) : null,
      reason_for_payment_delay: formData.reason_for_payment_delay || null,

      // Commission Details
      commission_amount_for_lot: parseFormattedNumber(formData.commission_amount_for_lot),
      commission_amount_for_delivered_quantity: parseFormattedNumber(formData.commission_amount_for_delivered_quantity),
      commission_invoice_no: formData.commission_invoice_no || null,
      commission_invoice_date: formData.commission_invoice_date || null,
      commission_amount_invoiced: parseFormattedNumber(formData.commission_amount_invoiced),
      balance_commission_amount: parseFormattedNumber(formData.balance_commission_amount),

      // LD Calculation
      ld_delay_units_or_meters: formData.ld_delay_units_or_meters,
      ld_delay_units: formData.ld_delay_units ? Number(formData.ld_delay_units) : null,
      ld_delay_meters: formData.ld_delay_meters ? Number(formData.ld_delay_meters) : null,

      // Miscellaneous Delays
      delay_dewa_authorisation_days: formData.delay_dewa_authorisation_days ? Number(formData.delay_dewa_authorisation_days) : null,
      remarks_delay: formData.remarks_delay || null,
      force_majeure: formData.force_majeure,
      force_majeure_days: formData.force_majeure_days ? Number(formData.force_majeure_days) : null,

      actual_delay_for_ld: formData.actual_delay_for_ld ? Number(formData.actual_delay_for_ld) : null,
      actual_ld_amount: parseFormattedNumber(formData.actual_ld_amount),
      max_ld_amount: parseFormattedNumber(formData.max_ld_amount),
      chargeable_ld_amount: parseFormattedNumber(formData.chargeable_ld_amount),
    }

    console.log("Payload", payload)

    try {
      const response = await fetch(`${API}/lot_monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/lot_monitoring')
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to create lot monitoring record')
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
        <h1 className="text-2xl font-bold">Create Lot Monitoring</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lot Monitoring Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Lot Monitoring Information</h2>
          <div className="space-y-3">
            {/* Order and Order Item */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order *</label>
                <select
                  value={formData.order_id}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.order_id} value={o.order_id}>{o.order_no} - {o.order_description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Item *</label>
                <select
                  value={formData.order_item_detail_id}
                  onChange={(e) => handleOrderItemChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={!formData.order_id}
                >
                  <option value="">-- Select Order Item --</option>
                  {filteredOrderItems.map(item => (
                    <option key={item.order_item_detail_id} value={item.order_item_detail_id}>
                      {item.item_description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shipment No, Item Lot No, PO Line No */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipment No</label>
                <input
                  type="text"
                  value={formData.shipment_no}
                  onChange={(e) => setFormData({ ...formData, shipment_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Lot No</label>
                <input
                  type="text"
                  value={formData.item_lot_no}
                  onChange={(e) => setFormData({ ...formData, item_lot_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Line No</label>
                <input
                  type="text"
                  value={formData.po_line_no}
                  onChange={(e) => setFormData({ ...formData, po_line_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Unit Price, Currency, Quantity, Total Value */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                <input
                  type="text"
                  value={formData.item_unit_price}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  placeholder="Auto-populated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="0.0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                <input
                  type="text"
                  value={formData.item_total_value}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>

            {/* Contractual Delivery Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contractual Delivery Date</label>
                <input
                  type="date"
                  value={formData.contractual_delivery_date}
                  onChange={(e) => setFormData({ ...formData, contractual_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inspection - Before Inspection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Inspection - Before Inspection</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Call Date (Tentative)</label>
                <input
                  type="date"
                  value={formData.inspection_call_date_tent}
                  onChange={(e) => setFormData({ ...formData, inspection_call_date_tent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Call Date (Actual)</label>
                <input
                  type="date"
                  value={formData.inspection_call_date_act}
                  onChange={(e) => setFormData({ ...formData, inspection_call_date_act: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date Advised</label>
                <input
                  type="date"
                  value={formData.inspection_date_advised}
                  onChange={(e) => setFormData({ ...formData, inspection_date_advised: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. of Inspection Days</label>
                <input
                  type="number"
                  value={formData.no_of_inspection_days}
                  onChange={(e) => setFormData({ ...formData, no_of_inspection_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection At</label>
                <input
                  type="text"
                  value={formData.inspection_at}
                  onChange={(e) => setFormData({ ...formData, inspection_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Inspection Date</label>
                <input
                  type="date"
                  value={formData.actual_inspection_date}
                  onChange={(e) => setFormData({ ...formData, actual_inspection_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inspection - After Inspection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Inspection - After Inspection</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units Inspected</label>
                <input
                  type="number"
                  value={formData.units_inspected}
                  onChange={(e) => setFormData({ ...formData, units_inspected: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pending Quantity</label>
                <input
                  type="number"
                  value={formData.after_inspection_pending_quantity}
                  onChange={(e) => setFormData({ ...formData, after_inspection_pending_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pending Lot ID</label>
                <input
                  type="number"
                  value={formData.after_inspection_pending_lot_id}
                  onChange={(e) => setFormData({ ...formData, after_inspection_pending_lot_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MOM Date</label>
                <input
                  type="date"
                  value={formData.mom_date}
                  onChange={(e) => setFormData({ ...formData, mom_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Clearance Date</label>
                <input
                  type="date"
                  value={formData.dispatch_clearance_date}
                  onChange={(e) => setFormData({ ...formData, dispatch_clearance_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Delay (Days)</label>
                <input
                  type="number"
                  value={formData.inspection_delay_days}
                  onChange={(e) => setFormData({ ...formData, inspection_delay_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Clearance Delay</label>
                <input
                  type="number"
                  value={formData.dispatch_clearance_delay}
                  onChange={(e) => setFormData({ ...formData, dispatch_clearance_delay: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Shipment Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ETD Date</label>
                <input
                  type="date"
                  value={formData.etd_date}
                  onChange={(e) => setFormData({ ...formData, etd_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Dispatch Date</label>
                <input
                  type="date"
                  value={formData.actual_dispatch_date}
                  onChange={(e) => setFormData({ ...formData, actual_dispatch_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ETA Date</label>
                <input
                  type="date"
                  value={formData.eta_date}
                  onChange={(e) => setFormData({ ...formData, eta_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Arrival Date</label>
                <input
                  type="date"
                  value={formData.actual_arrival_date}
                  onChange={(e) => setFormData({ ...formData, actual_arrival_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Authorisation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Delivery Authorisation</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Delivery Date</label>
                <input
                  type="date"
                  value={formData.requested_delivery_date}
                  onChange={(e) => setFormData({ ...formData, requested_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customs Duty Exemption Date</label>
                <input
                  type="date"
                  value={formData.customs_duty_exemption_date}
                  onChange={(e) => setFormData({ ...formData, customs_duty_exemption_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ASN Date</label>
                <input
                  type="date"
                  value={formData.asn_date}
                  onChange={(e) => setFormData({ ...formData, asn_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Delivery Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Delivery Date</label>
                <input
                  type="date"
                  value={formData.actual_delivery_date}
                  onChange={(e) => setFormData({ ...formData, actual_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meter Delivery Date</label>
                <input
                  type="date"
                  value={formData.meter_delivery_date}
                  onChange={(e) => setFormData({ ...formData, meter_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note No</label>
                <input
                  type="text"
                  value={formData.delivery_note_no}
                  onChange={(e) => setFormData({ ...formData, delivery_note_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GRN No</label>
                <input
                  type="text"
                  value={formData.grn_no}
                  onChange={(e) => setFormData({ ...formData, grn_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivered Quantity</label>
                <input
                  type="number"
                  value={formData.delivered_quantity}
                  onChange={(e) => setFormData({ ...formData, delivered_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pending Quantity</label>
                <input
                  type="number"
                  value={formData.pending_quantity}
                  onChange={(e) => setFormData({ ...formData, pending_quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pending Lot ID</label>
                <input
                  type="number"
                  value={formData.pending_lot_id}
                  onChange={(e) => setFormData({ ...formData, pending_lot_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Total Value</label>
                <input
                  type="text"
                  value={formData.delivery_total_value}
                  onChange={(e) => handleAmountChange(e.target.value, 'delivery_total_value')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks on Delivery</label>
              <textarea
                value={formData.remarks_on_delivery}
                onChange={(e) => setFormData({ ...formData, remarks_on_delivery: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Delay Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Delay Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Units Delay (Days)</label>
                <input
                  type="number"
                  value={formData.main_units_delay_days}
                  onChange={(e) => setFormData({ ...formData, main_units_delay_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accessories Delay (Days)</label>
                <input
                  type="number"
                  value={formData.accessories_delay_days}
                  onChange={(e) => setFormData({ ...formData, accessories_delay_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delay by DEWA</label>
                <input
                  type="number"
                  value={formData.delay_by_dewa}
                  onChange={(e) => setFormData({ ...formData, delay_by_dewa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other Delay by DEWA</label>
                <input
                  type="number"
                  value={formData.other_delay_by_dewa}
                  onChange={(e) => setFormData({ ...formData, other_delay_by_dewa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Other Delay</label>
              <textarea
                value={formData.reason_for_other_delay}
                onChange={(e) => setFormData({ ...formData, reason_for_other_delay: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Payment Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contractual Payment Date</label>
                <input
                  type="date"
                  value={formData.contractual_payment_date}
                  onChange={(e) => setFormData({ ...formData, contractual_payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                <input
                  type="text"
                  value={formData.invoice_no}
                  onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Value</label>
                <input
                  type="text"
                  value={formData.invoice_value}
                  onChange={(e) => handleAmountChange(e.target.value, 'invoice_value')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SRM Invoice No</label>
                <input
                  type="text"
                  value={formData.srm_invoice_no}
                  onChange={(e) => setFormData({ ...formData, srm_invoice_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SRM Invoice Date</label>
                <input
                  type="date"
                  value={formData.srm_invoice_date}
                  onChange={(e) => setFormData({ ...formData, srm_invoice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SRM Invoice Value</label>
                <input
                  type="text"
                  value={formData.srm_invoice_value}
                  onChange={(e) => handleAmountChange(e.target.value, 'srm_invoice_value')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount Received</label>
                <input
                  type="text"
                  value={formData.payment_amount_received}
                  onChange={(e) => handleAmountChange(e.target.value, 'payment_amount_received')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Received Date</label>
                <input
                  type="date"
                  value={formData.payment_received_date}
                  onChange={(e) => setFormData({ ...formData, payment_received_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delay in Payment (Days)</label>
                <input
                  type="number"
                  value={formData.delay_in_payment_days}
                  onChange={(e) => setFormData({ ...formData, delay_in_payment_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Payment Delay</label>
              <textarea
                value={formData.reason_for_payment_delay}
                onChange={(e) => setFormData({ ...formData, reason_for_payment_delay: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Commission Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Commission Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount for Lot</label>
                <input
                  type="text"
                  value={formData.commission_amount_for_lot}
                  onChange={(e) => handleAmountChange(e.target.value, 'commission_amount_for_lot')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission for Delivered Qty</label>
                <input
                  type="text"
                  value={formData.commission_amount_for_delivered_quantity}
                  onChange={(e) => handleAmountChange(e.target.value, 'commission_amount_for_delivered_quantity')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Invoice No</label>
                <input
                  type="text"
                  value={formData.commission_invoice_no}
                  onChange={(e) => setFormData({ ...formData, commission_invoice_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Invoice Date</label>
                <input
                  type="date"
                  value={formData.commission_invoice_date}
                  onChange={(e) => setFormData({ ...formData, commission_invoice_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount Invoiced</label>
                <input
                  type="text"
                  value={formData.commission_amount_invoiced}
                  onChange={(e) => handleAmountChange(e.target.value, 'commission_amount_invoiced')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance Commission Amount</label>
                <input
                  type="text"
                  value={formData.balance_commission_amount}
                  onChange={(e) => handleAmountChange(e.target.value, 'balance_commission_amount')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary for LD Calculation */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-3">Summary for LD Calculation</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 mb-3">
              <label className="text-sm font-medium text-gray-700">LD Delay Type:</label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.ld_delay_units_or_meters === 0}
                  onChange={() => setFormData({ ...formData, ld_delay_units_or_meters: 0 })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">Units</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.ld_delay_units_or_meters === 1}
                  onChange={() => setFormData({ ...formData, ld_delay_units_or_meters: 1 })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">Meters</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LD Delay Units</label>
                <input
                  type="number"
                  value={formData.ld_delay_units}
                  onChange={(e) => setFormData({ ...formData, ld_delay_units: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LD Delay Meters</label>
                <input
                  type="number"
                  value={formData.ld_delay_meters}
                  onChange={(e) => setFormData({ ...formData, ld_delay_meters: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Miscellaneous Delays */}
            <h3 className="text-md font-semibold mt-4 mb-2">Miscellaneous Delays</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DEWA Authorisation Delay (Days)</label>
                <input
                  type="number"
                  value={formData.delay_dewa_authorisation_days}
                  onChange={(e) => setFormData({ ...formData, delay_dewa_authorisation_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Force Majeure</label>
                <select
                  value={formData.force_majeure}
                  onChange={(e) => setFormData({ ...formData, force_majeure: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Force Majeure Days</label>
                <input
                  type="number"
                  value={formData.force_majeure_days}
                  onChange={(e) => setFormData({ ...formData, force_majeure_days: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={formData.force_majeure === 0}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks on Delay</label>
              <textarea
                value={formData.remarks_delay}
                onChange={(e) => setFormData({ ...formData, remarks_delay: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* LD Amounts */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Delay for LD</label>
                <input
                  type="number"
                  value={formData.actual_delay_for_ld}
                  onChange={(e) => setFormData({ ...formData, actual_delay_for_ld: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual LD Amount</label>
                <input
                  type="text"
                  value={formData.actual_ld_amount}
                  onChange={(e) => handleAmountChange(e.target.value, 'actual_ld_amount')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max LD Amount</label>
                <input
                  type="text"
                  value={formData.max_ld_amount}
                  onChange={(e) => handleAmountChange(e.target.value, 'max_ld_amount')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chargeable LD Amount</label>
                <input
                  type="text"
                  value={formData.chargeable_ld_amount}
                  onChange={(e) => handleAmountChange(e.target.value, 'chargeable_ld_amount')}
                  placeholder="0.00"
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
            onClick={() => router.push('/dashboard/lot_monitoring')}
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


