// src/app/dashboard/lot_monitoring/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'  // ADD THIS LINE
import Loader from '@/components/Loader'
import { triggerReminders } from '@/utils/reminderTrigger'
import NumericInput from '@/components/NumericInput'


type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface OrderDetail {
  order_id: number
  po_number: string
  order_description: string
  kka_commission_percent: number
  order_date: string
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
  number_of_lots: number
}

interface LotMonitoring {
  lot_id: number
  order_item_detail_id: number
  order_id: number
  order_description: string | null
  shipment_no: string | null
  item_lot_no: string | null
  item_unit_price: number
  currency: CurrencyEnum
  quantity: number
  item_total_value: number
  weeks: number | null
  contractual_delivery_date: string | null

  // Inspection - Before
  inspection_call_date_tent: string | null
  inspection_call_date_act: string | null
  inspection_date_advised: string | null
  no_of_inspection_days: number | null
  inspection_at: string | null
  actual_inspection_date: string | null

  // Inspection - After
  units_inspected: number | null
  after_inspection_pending_quantity: number | null
  after_inspection_pending_lot_id: number | null
  mom_date: string | null
  dispatch_clearance_date: string | null
  inspection_delay_days: number | null
  dispatch_clearance_delay: number | null

  // Shipment
  etd_date: string | null
  actual_dispatch_date: string | null
  eta_date: string | null
  actual_arrival_date: string | null

  // Delivery Authorisation
  requested_delivery_date: string | null
  customs_duty_exemption_date: string | null
  asn_date: string | null

  // Delivery Details
  actual_delivery_date: string | null
  meter_delivery_date: string | null
  delivery_note_no: string | null
  delivered_quantity: number | null
  pending_quantity: number | null
  remarks_on_delivery: string | null
  delivery_total_value: number | null
  grn_no: string | null
  pending_lot_id: number | null

  // Delay Details
  main_units_delay_days: number | null
  accessories_delay_days: number | null
  delay_by_dewa: number | null
  other_delay_by_dewa: number | null
  reason_for_other_delay: string | null

  // Payment Details
  contractual_payment_date: string | null
  invoice_no: string | null
  invoice_date: string | null
  invoice_value: number | null
  srm_invoice_no: string | null
  srm_invoice_date: string | null
  srm_invoice_value: number | null
  payment_amount_received: number | null
  payment_received_date: string | null
  delay_in_payment_days: number | null
  reason_for_payment_delay: string | null

  // Commission Details
  commission_amount_for_lot: number | null
  commission_amount_for_delivered_quantity: number | null
  commission_invoice_no: string | null
  commission_invoice_date: string | null
  commission_recieved_date: string | null
  commission_amount_invoiced: number | null
  balance_commission_amount: number | null

  // LD Summary
  ld_delay_units_or_meters: number | null
  ld_delay_units: number | null
  ld_delay_meters: number | null
  delay_dewa_authorisation_days: number | null
  remarks_delay: string | null
  force_majeure: number | null
  force_majeure_days: number | null
  actual_delay_for_ld: number | null
  actual_ld_amount: number | null
  max_ld_amount: number | null
  chargeable_ld_amount: number | null
}

// Utility functions for number formatting
const formatNumber = (value: string | number | null): string => {
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

export default function LotMonitoringPage() {
  const router = useRouter()  // ADD THIS LINE
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('')
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([])
  const [lotMonitoringData, setLotMonitoringData] = useState<Map<number, LotMonitoring[]>>(new Map())
  const [allLots, setAllLots] = useState<LotMonitoring[]>([])
  const [commissionRate, setCommissionRate] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [collapsedSections, setCollapsedSections] = useState({
    before: true,
    afterDelivery: true,
    afterPayment: true,
    liquidatedDamages: true,
  });

  const toggleSection = (
    key: keyof typeof collapsedSections
  ) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    if (selectedOrderId !== '') {
      fetchOrderItemsAndLots(selectedOrderId)
    }
  }, [selectedOrderId])


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

  const fetchOrderItemsAndLots = async (orderId: number) => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) return

    setLoading(true)
    console.log('Fetching items and lots for Order ID:', orderId)

    try {
      const [itemsRes, lotsRes] = await Promise.all([
        fetch(`${API}/order_item_detail/?order_id=${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API}/lot_monitoring/?order_id=${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      const [itemsData, lotsData] = await Promise.all([
        itemsRes.json(),
        lotsRes.json(),
      ])

      console.log('Fetched Order Items:', itemsData)

      const items: OrderItemDetail[] =
        Array.isArray(itemsData) ? itemsData : []

      const lots: LotMonitoring[] =
        Array.isArray(lotsData) ? lotsData : []

      setOrderItems(items)
      setAllLots(lots)

      const lotsMap = new Map<number, LotMonitoring[]>()

      items.forEach((item) => {
        const itemLots = lots.filter(
          (lot) =>
            lot.order_item_detail_id ===
            item.order_item_detail_id
        )

        lotsMap.set(
          item.order_item_detail_id,
          itemLots
        )
      })

      setLotMonitoringData(lotsMap)

    } catch (e: any) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderChange = (orderId: string) => {
    const id = orderId === '' ? '' : parseInt(orderId)

    console.log('Selected Order ID:', id)

    setSelectedOrderId(id)

    // Set commission rate from the selected order
    if (id === '') {
      setCommissionRate(0)
    } else {
      const selectedOrder = orders.find((o) => o.order_id === id)
      setCommissionRate(selectedOrder?.kka_commission_percent ?? 0)
      console.log('Commission Rate:', selectedOrder?.kka_commission_percent)
    }

    setOrderItems([])
    setAllLots([])
    setLotMonitoringData(new Map())
  }

  const addNewLot = (orderItemDetailId: number) => {
    const orderItem = orderItems.find(item => item.order_item_detail_id === orderItemDetailId)
    if (!orderItem) return

    const newLot: LotMonitoring = {
      lot_id: Date.now(), // Temporary ID for new lots
      order_item_detail_id: orderItemDetailId,
      order_id: orderItem.order_id,
      order_description: null,
      shipment_no: null,
      item_lot_no: null,
      item_unit_price: orderItem.item_unit_price,
      currency: orderItem.currency,
      quantity: 0,
      item_total_value: 0,
      weeks: null,
      contractual_delivery_date: null,
      inspection_call_date_tent: null,
      inspection_call_date_act: null,
      inspection_date_advised: null,
      no_of_inspection_days: null,
      inspection_at: null,
      actual_inspection_date: null,
      units_inspected: null,
      after_inspection_pending_quantity: null,
      after_inspection_pending_lot_id: null,
      mom_date: null,
      dispatch_clearance_date: null,
      inspection_delay_days: null,
      dispatch_clearance_delay: null,
      etd_date: null,
      actual_dispatch_date: null,
      eta_date: null,
      actual_arrival_date: null,
      requested_delivery_date: null,
      customs_duty_exemption_date: null,
      asn_date: null,
      actual_delivery_date: null,
      meter_delivery_date: null,
      delivery_note_no: null,
      delivered_quantity: null,
      pending_quantity: null,
      remarks_on_delivery: null,
      delivery_total_value: null,
      grn_no: null,
      pending_lot_id: null,
      main_units_delay_days: null,
      accessories_delay_days: null,
      delay_by_dewa: null,
      other_delay_by_dewa: null,
      reason_for_other_delay: null,
      contractual_payment_date: null,
      invoice_no: null,
      invoice_date: null,
      invoice_value: null,
      srm_invoice_no: null,
      srm_invoice_date: null,
      srm_invoice_value: null,
      payment_amount_received: null,
      payment_received_date: null,
      delay_in_payment_days: null,
      reason_for_payment_delay: null,
      commission_amount_for_lot: null,
      commission_amount_for_delivered_quantity: null,
      commission_invoice_no: null,
      commission_invoice_date: null,
      commission_recieved_date: null,
      commission_amount_invoiced: null,
      balance_commission_amount: null,
      ld_delay_units_or_meters: 0,
      ld_delay_units: null,
      ld_delay_meters: null,
      delay_dewa_authorisation_days: null,
      remarks_delay: null,
      force_majeure: 0,
      force_majeure_days: null,
      actual_delay_for_ld: null,
      actual_ld_amount: null,
      max_ld_amount: null,
      chargeable_ld_amount: null,
    }

    const currentLots = lotMonitoringData.get(orderItemDetailId) || []
    const updatedMap = new Map(lotMonitoringData)
    updatedMap.set(orderItemDetailId, [...currentLots, newLot])
    setLotMonitoringData(updatedMap)
  }

  const updateLot = (orderItemDetailId: number, lotIndex: number, field: keyof LotMonitoring, value: any) => {
    const currentLots = lotMonitoringData.get(orderItemDetailId) || []
    const updatedLots = [...currentLots]
    updatedLots[lotIndex] = { ...updatedLots[lotIndex], [field]: value }

    // Auto-calculate item_total_value
    if (field === 'quantity' || field === 'item_unit_price') {
      const quantity = field === 'quantity' ? parseFormattedNumber(String(value)) || 0 : updatedLots[lotIndex].quantity
      const price = field === 'item_unit_price' ? parseFormattedNumber(String(value)) || 0 : updatedLots[lotIndex].item_unit_price
      updatedLots[lotIndex].item_total_value = quantity * price
    }

    console.log('Updated Lot:', updatedLots[lotIndex])

    if (field === 'weeks') {
      const selectedOrder = orders.find(o => o.order_id === updatedLots[lotIndex].order_id)
      if (selectedOrder?.order_date && value) {
        const orderDate = new Date(selectedOrder.order_date)
        orderDate.setDate(orderDate.getDate() + (Number(value) * 7))
        const cdd = orderDate.toISOString().split('T')[0]
        updatedLots[lotIndex].contractual_delivery_date = cdd
        // Also recalculate inspection_call_date_tent
        const d = new Date(cdd)
        d.setDate(d.getDate() - 75)
        updatedLots[lotIndex].inspection_call_date_tent = d.toISOString().split('T')[0]
      }
    }

    // Inspection call date calculation
    if (field === 'contractual_delivery_date') {
      const cdd = updatedLots[lotIndex].contractual_delivery_date;
      if (cdd) {
        const d = new Date(cdd);
        d.setDate(d.getDate() - 75);
        updatedLots[lotIndex].inspection_call_date_tent = d.toISOString().split('T')[0];
      }
    }

    if (field === "dispatch_clearance_date" || field === "actual_inspection_date" || field === "no_of_inspection_days") {
      const dispatchDate = new Date(updatedLots[lotIndex].dispatch_clearance_date ?? '');
      const inspectionDate = new Date(updatedLots[lotIndex].actual_inspection_date ?? '');
      const inspectionDays = Number(updatedLots[lotIndex].no_of_inspection_days) || 0;

      if (!isNaN(dispatchDate.getTime()) && !isNaN(inspectionDate.getTime())) {
        const diffMs = dispatchDate.getTime() - inspectionDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const x = diffDays - inspectionDays + 1;
        updatedLots[lotIndex].dispatch_clearance_delay = x > 0 ? x : 0;
      }
    }

    if (field === "actual_inspection_date" || field === "inspection_date_advised") {
      const advisedDate = new Date(updatedLots[lotIndex].inspection_date_advised ?? '');
      const inspectionDate = new Date(updatedLots[lotIndex].actual_inspection_date ?? '');

      if (!isNaN(advisedDate.getTime()) && !isNaN(inspectionDate.getTime())) {
        const diffMs = inspectionDate.getTime() - advisedDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        updatedLots[lotIndex].inspection_delay_days = diffDays > 0 ? diffDays : 0;
      }
    }

    if (field === "actual_delivery_date") {
      const cdd = updatedLots[lotIndex].actual_delivery_date;
      if (cdd) {
        const d = new Date(cdd);
        d.setDate(d.getDate() - 75);
        updatedLots[lotIndex].contractual_payment_date = d.toISOString().split('T')[0];
      }
    }

    if (field === "meter_delivery_date" || field === "contractual_delivery_date") {
      const meterDeliveryDate = new Date(updatedLots[lotIndex].meter_delivery_date ?? '');
      const contractualDeliveryDate = new Date(updatedLots[lotIndex].contractual_delivery_date ?? '');

      if (!isNaN(meterDeliveryDate.getTime()) && !isNaN(contractualDeliveryDate.getTime())) {
        const diffMs = meterDeliveryDate.getTime() - contractualDeliveryDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        updatedLots[lotIndex].accessories_delay_days = diffDays > 0 ? diffDays : 0;
      }
    }

    if (field === "dispatch_clearance_date" ||
      field === "actual_inspection_date" ||
      field === "inspection_date_advised" ||
      field === "no_of_inspection_days") {
      const x = (updatedLots[lotIndex].dispatch_clearance_delay || 0) + (updatedLots[lotIndex].inspection_delay_days || 0);
      updatedLots[lotIndex].delay_by_dewa = x > 0 ? x : 0;
    }

    if (field === "actual_delivery_date" ||
      field === "contractual_delivery_date" ||
      field === "actual_inspection_date" ||
      field === "inspection_date_advised" ||
      field === "no_of_inspection_days" ||
      field === "dispatch_clearance_date" ||
      field === "other_delay_by_dewa") {
      const x = (updatedLots[lotIndex].main_units_delay_days || 0) - (updatedLots[lotIndex].delay_by_dewa || 0) - (updatedLots[lotIndex].other_delay_by_dewa || 0);
      updatedLots[lotIndex].ld_delay_units = x > 0 ? x : 0;
    }

    if (field === "meter_delivery_date" ||
      field === "contractual_delivery_date" ||
      field === "actual_inspection_date" ||
      field === "inspection_date_advised" ||
      field === "no_of_inspection_days" ||
      field === "dispatch_clearance_date" ||
      field === "other_delay_by_dewa") {
      const x = (updatedLots[lotIndex].accessories_delay_days || 0) - (updatedLots[lotIndex].delay_by_dewa || 0) - (updatedLots[lotIndex].other_delay_by_dewa || 0);
      updatedLots[lotIndex].ld_delay_meters = x > 0 ? x : 0;
    }

    if (field === "actual_delivery_date" || field === "payment_received_date") {
      const contractualPaymentDate = new Date(updatedLots[lotIndex].contractual_payment_date ?? '');
      const paymentReceivedDate = new Date(updatedLots[lotIndex].payment_received_date ?? '');

      if (!isNaN(contractualPaymentDate.getTime()) && !isNaN(paymentReceivedDate.getTime())) {
        const diffMs = paymentReceivedDate.getTime() - contractualPaymentDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        updatedLots[lotIndex].delay_in_payment_days = diffDays > 0 ? diffDays : 0;
      }
    }



    if (field === "contractual_payment_date" || field === "payment_received_date") {
      const contractualPaymentDate = new Date(updatedLots[lotIndex].contractual_payment_date ?? '');
      const paymentReceivedDate = new Date(updatedLots[lotIndex].payment_received_date ?? '');

      if (!isNaN(contractualPaymentDate.getTime()) && !isNaN(paymentReceivedDate.getTime())) {
        const diffMs = paymentReceivedDate.getTime() - contractualPaymentDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        updatedLots[lotIndex].delay_in_payment_days = diffDays > 0 ? diffDays : 0;
      }
    }
    if ((updatedLots[lotIndex].ld_delay_units_or_meters === 0 && updatedLots[lotIndex].force_majeure === 1) && (field === "force_majeure" || field === "ld_delay_units_or_meters" || field === "force_majeure_days" || field === "ld_delay_units")) {
      updatedLots[lotIndex].actual_delay_for_ld = (Number(updatedLots[lotIndex].force_majeure_days!) + Number(updatedLots[lotIndex].ld_delay_units!))
    }

    else if ((updatedLots[lotIndex].ld_delay_units_or_meters === 0 && updatedLots[lotIndex].force_majeure === 0) && (field === "force_majeure" || field === "ld_delay_units_or_meters" || field === "ld_delay_units")) {
      updatedLots[lotIndex].actual_delay_for_ld = (Number(updatedLots[lotIndex].ld_delay_units!))
    }

    else if ((updatedLots[lotIndex].ld_delay_units_or_meters === 1 && updatedLots[lotIndex].force_majeure === 1) && (field === "force_majeure" || field === "ld_delay_units_or_meters" || field === "force_majeure_days" || field === "ld_delay_meters")) {
      updatedLots[lotIndex].actual_delay_for_ld = (Number(updatedLots[lotIndex].force_majeure_days!) + Number(updatedLots[lotIndex].ld_delay_meters!))
    }

    else if ((updatedLots[lotIndex].ld_delay_units_or_meters === 1 && updatedLots[lotIndex].force_majeure === 0) && (field === "force_majeure" || field === "ld_delay_units_or_meters" || field === "ld_delay_meters")) {
      updatedLots[lotIndex].actual_delay_for_ld = (Number(updatedLots[lotIndex].ld_delay_meters!))
    }

    if (field === "quantity" || field === "units_inspected") {
      const x = Number(updatedLots[lotIndex].quantity) - Number(updatedLots[lotIndex].units_inspected || 0)
      updatedLots[lotIndex].after_inspection_pending_quantity = x > 0 ? x : 0
    }

    if (field === "quantity" || field === "delivered_quantity") {
      const x = Number(updatedLots[lotIndex].quantity) - Number(updatedLots[lotIndex].delivered_quantity || 0)
      updatedLots[lotIndex].pending_quantity = x > 0 ? x : 0
    }

    if (field === "item_total_value" || field === "item_unit_price" || field === "quantity" || field === "delivery_total_value") {
      const x = Number(updatedLots[lotIndex].item_total_value) - Number(updatedLots[lotIndex].delivery_total_value || 0)
      updatedLots[lotIndex].commission_amount_for_lot = x > 0 ? x * commissionRate / 100 : 0
    }

    if (field === "item_unit_price" || field === "delivered_quantity") {
      updatedLots[lotIndex].commission_amount_for_delivered_quantity = updatedLots[lotIndex].item_unit_price * (updatedLots[lotIndex].delivered_quantity || 0) * commissionRate / 100
    }

    if (field === "item_total_value" || field === "commission_amount_invoiced") {
      const x = (updatedLots[lotIndex].commission_amount_for_lot || 0) - (updatedLots[lotIndex].commission_amount_invoiced || 0)
      updatedLots[lotIndex].balance_commission_amount = x > 0 ? x : 0
    }

    if (field === "main_units_delay_days" || field === "dispatch_clearance_date" ||
      field === "actual_inspection_date" || field === "inspection_date_advised" ||
      field === "no_of_inspection_days" || field === "other_delay_by_dewa") {
      const x = (updatedLots[lotIndex].main_units_delay_days || 0) - (updatedLots[lotIndex].delay_by_dewa || 0) - (updatedLots[lotIndex].other_delay_by_dewa || 0)
      updatedLots[lotIndex].ld_delay_units = x > 0 ? x : 0
    }

    if (field === "accessories_delay_days" || field === "dispatch_clearance_date" ||
      field === "actual_inspection_date" || field === "inspection_date_advised" ||
      field === "no_of_inspection_days" || field === "other_delay_by_dewa") {
      const x = (updatedLots[lotIndex].accessories_delay_days || 0) - (updatedLots[lotIndex].delay_by_dewa || 0) - (updatedLots[lotIndex].other_delay_by_dewa || 0)
      updatedLots[lotIndex].ld_delay_units = x > 0 ? x : 0
    }
    if (updatedLots[lotIndex].actual_delay_for_ld) {
      updatedLots[lotIndex].actual_ld_amount = (updatedLots[lotIndex].actual_delay_for_ld) / 7 * 0.0125 * (updatedLots[lotIndex].item_total_value)
      updatedLots[lotIndex].max_ld_amount = 0.1 * (updatedLots[lotIndex].item_total_value)
      updatedLots[lotIndex].chargeable_ld_amount = updatedLots[lotIndex].actual_ld_amount < updatedLots[lotIndex].max_ld_amount ? updatedLots[lotIndex].actual_ld_amount : updatedLots[lotIndex].max_ld_amount
    }

    if (field === "inspection_date_advised" || field === "inspection_call_date_act") {
      const inspectionDateAdvised = new Date(updatedLots[lotIndex].inspection_date_advised ?? '');
      const inspectionCallDateActual = new Date(updatedLots[lotIndex].inspection_call_date_act ?? '');

      if (!isNaN(inspectionDateAdvised.getTime()) && !isNaN(inspectionCallDateActual.getTime())) {
        const diffMs = inspectionDateAdvised.getTime() - inspectionCallDateActual.getTime();
        const diffDays = 21 - (diffMs / (1000 * 60 * 60 * 24));
        updatedLots[lotIndex].delay_dewa_authorisation_days = diffDays > 0 ? diffDays : 0;
      }
    }

    



    const updatedMap = new Map(lotMonitoringData)
    updatedMap.set(orderItemDetailId, updatedLots)
    setLotMonitoringData(updatedMap)
  }

  const deleteLot = async (orderItemDetailId: number, lotIndex: number) => {
    const currentLots = lotMonitoringData.get(orderItemDetailId) || []
    const lot = currentLots[lotIndex]

    // If lot has a real lot_id (not temporary), delete from backend
    if (lot.lot_id < Date.now() - 1000000) {
      const confirmDelete = window.confirm('Are you sure you want to delete this lot?')
      if (!confirmDelete) return

      try {
        const token = localStorage.getItem('kkabbas_token')
        const response = await fetch(`${API}/lot_monitoring/${lot.lot_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('Failed to delete lot')
        }
        else {
          triggerReminders('lot_monitoring')
        }
      } catch (e: any) {
        setError(e.message || 'Failed to delete lot')
        return
      }
    }



    // Remove from UI
    const updatedLots = currentLots.filter((_, index) => index !== lotIndex)
    const updatedMap = new Map(lotMonitoringData)
    updatedMap.set(orderItemDetailId, updatedLots)
    setLotMonitoringData(updatedMap)
  }

  const duplicateLot = (orderItemDetailId: number, lotIndex: number) => {
    const currentLots = lotMonitoringData.get(orderItemDetailId) || []
    const sourceLot = currentLots[lotIndex]
    if (!sourceLot) return

    // Deep clone the lot and assign a new temporary lot_id so it's treated as new on save
    const duplicatedLot: LotMonitoring = {
      ...sourceLot,
      lot_id: Date.now() + Math.floor(Math.random() * 1000), // temp id, unique
    }

    const updatedMap = new Map(lotMonitoringData)
    updatedMap.set(orderItemDetailId, [...currentLots, duplicatedLot])
    setLotMonitoringData(updatedMap)
  }

  // Core: saves all lots for one item. No UI side effects (no alert/refetch).
  // Throws on failure so the caller can decide what to do.
  const saveLotsForItem = async (orderItemDetailId: number, token: string) => {
    const lots = lotMonitoringData.get(orderItemDetailId) || []
    if (lots.length === 0) return

    const toDecimal = (val: number | string | null | undefined, places = 4): string | null => {
      if (val === null || val === undefined || val === '') return null
      const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val
      if (isNaN(num)) return null
      return num.toFixed(places)
    }

    for (const lot of lots) {
      const isNewLot = lot.lot_id >= Date.now() - 1000000

      // Add this helper above the payload


      const payload = {
        order_item_detail_id: lot.order_item_detail_id,
        order_id: lot.order_id,
        order_description: lot.order_description,
        shipment_no: lot.shipment_no,
        item_lot_no: lot.item_lot_no,
        item_unit_price: toDecimal(lot.item_unit_price),
        currency: lot.currency,
        quantity: toDecimal(lot.quantity),
        item_total_value: toDecimal(lot.item_total_value),
        weeks: lot.weeks,
        contractual_delivery_date: lot.contractual_delivery_date,
        inspection_call_date_tent: lot.inspection_call_date_tent,
        inspection_call_date_act: lot.inspection_call_date_act,
        inspection_date_advised: lot.inspection_date_advised,
        no_of_inspection_days: lot.no_of_inspection_days,
        inspection_at: lot.inspection_at,
        actual_inspection_date: lot.actual_inspection_date,
        units_inspected: lot.units_inspected,
        after_inspection_pending_quantity: lot.after_inspection_pending_quantity,
        after_inspection_pending_lot_id: lot.after_inspection_pending_lot_id,
        mom_date: lot.mom_date,
        dispatch_clearance_date: lot.dispatch_clearance_date,
        inspection_delay_days: lot.inspection_delay_days,
        dispatch_clearance_delay: lot.dispatch_clearance_delay,
        etd_date: lot.etd_date,
        actual_dispatch_date: lot.actual_dispatch_date,
        eta_date: lot.eta_date,
        actual_arrival_date: lot.actual_arrival_date,
        requested_delivery_date: lot.requested_delivery_date,
        customs_duty_exemption_date: lot.customs_duty_exemption_date,
        asn_date: lot.asn_date,
        actual_delivery_date: lot.actual_delivery_date,
        meter_delivery_date: lot.meter_delivery_date,
        delivery_note_no: lot.delivery_note_no,
        delivered_quantity: lot.delivered_quantity,
        pending_quantity: lot.pending_quantity,
        remarks_on_delivery: lot.remarks_on_delivery,
        delivery_total_value: toDecimal(lot.delivery_total_value),
        grn_no: lot.grn_no,
        pending_lot_id: lot.pending_lot_id,
        main_units_delay_days: lot.main_units_delay_days,
        accessories_delay_days: lot.accessories_delay_days,
        delay_by_dewa: lot.delay_by_dewa,
        other_delay_by_dewa: lot.other_delay_by_dewa,
        reason_for_other_delay: lot.reason_for_other_delay,
        contractual_payment_date: lot.contractual_payment_date,
        invoice_no: lot.invoice_no,
        invoice_date: lot.invoice_date,
        invoice_value: toDecimal(lot.invoice_value),
        srm_invoice_no: lot.srm_invoice_no,
        srm_invoice_date: lot.srm_invoice_date,
        srm_invoice_value: toDecimal(lot.srm_invoice_value),
        payment_amount_received: toDecimal(lot.payment_amount_received),
        payment_received_date: lot.payment_received_date,
        delay_in_payment_days: lot.delay_in_payment_days,
        reason_for_payment_delay: lot.reason_for_payment_delay,
        commission_amount_for_lot: toDecimal(lot.commission_amount_for_lot),
        commission_amount_for_delivered_quantity: toDecimal(lot.commission_amount_for_delivered_quantity),
        commission_invoice_no: lot.commission_invoice_no,
        commission_invoice_date: lot.commission_invoice_date,
        commission_recieved_date: lot.commission_recieved_date,
        commission_amount_invoiced: toDecimal(lot.commission_amount_invoiced),
        balance_commission_amount: toDecimal(lot.balance_commission_amount),
        ld_delay_units_or_meters: lot.ld_delay_units_or_meters,
        ld_delay_units: lot.ld_delay_units,
        ld_delay_meters: lot.ld_delay_meters,
        delay_dewa_authorisation_days: lot.delay_dewa_authorisation_days,
        remarks_delay: lot.remarks_delay,
        force_majeure: lot.force_majeure,
        force_majeure_days: lot.force_majeure_days,
        actual_delay_for_ld: lot.actual_delay_for_ld,
        actual_ld_amount: toDecimal(lot.actual_ld_amount),
        max_ld_amount: toDecimal(lot.max_ld_amount),
        chargeable_ld_amount: toDecimal(lot.chargeable_ld_amount),
      }

      const url = isNewLot
        ? `${API}/lot_monitoring`
        : `${API}/lot_monitoring/${lot.lot_id}`
      const method = isNewLot ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save lot')
      }
      else {
        triggerReminders('lot_monitoring')
      }
    }
  }

  // Wrapper: save lots for a single item (used by the per-item button)
  const saveLots = async (orderItemDetailId: number) => {
    const lots = lotMonitoringData.get(orderItemDetailId) || []
    if (lots.length === 0) return

    setSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('kkabbas_token')
      if (!token) throw new Error('Not authenticated')

      await saveLotsForItem(orderItemDetailId, token)

      // alert('Lots saved successfully!')
      if (selectedOrderId !== '') {
        await fetchOrderItemsAndLots(selectedOrderId)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save lots')
    } finally {
      setSaving(false)
    }
  }

  // Wrapper: save lots for ALL items (used by the global save-all button)
  const saveAllLots = async () => {
    setSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('kkabbas_token')
      if (!token) throw new Error('Not authenticated')

      let itemsSaved = 0
      const failures: string[] = []

      for (const item of orderItems) {
        const lots = lotMonitoringData.get(item.order_item_detail_id) || []
        if (lots.length === 0) continue

        try {
          await saveLotsForItem(item.order_item_detail_id, token)
          itemsSaved++
        } catch (e: any) {
          const label =
            item.item_master_description ||
            item.item_description ||
            `Item ${item.order_item_detail_id}`
          failures.push(`${label}: ${e.message || 'save failed'}`)
        }
      }

      if (itemsSaved === 0 && failures.length === 0) {
        // alert('No lots to save.')
      } else if (failures.length === 0) {
        // alert(`All lots saved successfully for ${itemsSaved} item(s)!`)
      } else {
        setError(
          `Saved ${itemsSaved} item(s). ${failures.length} failed:\n` +
          failures.join('\n')
        )
      }

      if (selectedOrderId !== '') {
        await fetchOrderItemsAndLots(selectedOrderId)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save lots')
    } finally {
      setSaving(false)
    }
  }

  if (loading && orders.length === 0) return <Loader />

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lot Monitoring</h1>
        <button
          onClick={() => router.push('/dashboard/lot_monitoring/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* PO Selection */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-end gap-6">
          <div className="max-w-md flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Purchase Order (PO) *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select PO --</option>
              {orders.map(order => (
                <option key={order.order_id} value={order.order_id}>
                  {order.po_number} - {order.order_description}
                </option>
              ))}
            </select>
          </div>
          {selectedOrderId !== '' && (() => {
            const selectedOrder = orders.find(o => o.order_id === selectedOrderId)
            if (!selectedOrder?.order_date) return null
            const [y, m, d] = selectedOrder.order_date.split('-')
            return (
              <div className="pb-0.5">
                <p className="text-xs text-gray-500 mb-1">PO Commencement Date</p>
                <p className="text-sm font-semibold text-gray-800">{d}/{m}/{y}</p>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Order Items with Lot Monitoring Tables */}
      {selectedOrderId && (
        <div className="space-y-6">
          {loading ? (
            <Loader />
          ) : orderItems.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
              No items found for this order. Please add items to the order first.
            </div>
          ) : (
            orderItems.map((orderItem) => {
              const lots = lotMonitoringData.get(orderItem.order_item_detail_id)?.sort((a, b) => parseInt(a.item_lot_no!) - parseInt(b.item_lot_no!)) || []

              return (
                <div key={orderItem.order_item_detail_id} className="bg-white rounded-lg shadow p-4">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {orderItem.item_master_description || orderItem.item_description}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        DEWA Item No: {orderItem.item_no_dewa} |
                        Unit Price: {formatNumber(orderItem.item_unit_price)} {orderItem.currency} |
                        Total Qty: {orderItem.item_quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => addNewLot(orderItem.order_item_detail_id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      + Add Lot
                    </button>
                  </div>

                  {lots.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-gray-600">No lots created yet. Click "Add Lot" to get started.</p>
                    </div>
                  ) : (
                    <>

                      {/* Table 1: Before Delivery */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-md font-semibold text-blue-700">Before Delivery</h3>

                          <button
                            onClick={() => toggleSection("before")}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            {collapsedSections.before ? "Expand" : "Minimise"}
                          </button>
                        </div>

                        {!collapsedSections.before && (
                          <div className="overflow-x-auto border border-gray-200 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-blue-50">
                                <tr>
                                  {/* Common columns */}
                                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Lot No.</th> */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Lot No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Qty</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Value</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Total Lot Amount</th>

                                  {/* Before Delivery specific columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Shipment No</th>

                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Weeks</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Contractual Delivery</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Inspect Call (Tent)</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Inspect Call (Act)</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Inspect Date Advised</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Inspect Days</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Inspect At</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actual Inspect Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Units Inspected</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Pending Qty (After)</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">MOM Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Dispatch Clear Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Inspn Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Disp Clrn Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">ETD Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actual Dispatch</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">ETA Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actual Arrival</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {lots.map((lot, lotIndex) => (
                                  <tr key={`before-${lot.lot_id}`} className="hover:bg-gray-50">
                                    {/* Common columns */}
                                    {/* <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={lot.item_lot_no || ''}
                                      onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'item_lot_no', e.target.value)}
                                      className="w-10 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                    />
                                  </td> */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.item_lot_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'item_lot_no', e.target.value)}
                                        className="w-10 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>

                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.quantity || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'quantity', e.target.value)}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_unit_price)}
                                        readOnly
                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_total_value)}
                                        readOnly
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded bg-green-300 font-medium"
                                      />
                                    </td>

                                    {/* Before Delivery specific columns */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.shipment_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'shipment_no', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>


                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.weeks || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'weeks', e.target.value)}
                                        className="w-14 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.contractual_delivery_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'contractual_delivery_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-purple-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.inspection_call_date_tent || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'inspection_call_date_tent', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-pink-700 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.inspection_call_date_act || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'inspection_call_date_act', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-pink-700 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.inspection_date_advised || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'inspection_date_advised', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-pink-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.no_of_inspection_days || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'no_of_inspection_days', e.target.value)}
                                        className="w-14 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.inspection_at || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'inspection_at', e.target.value)}
                                        className="w-12 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.actual_inspection_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'actual_inspection_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-pink-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.units_inspected || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'units_inspected', e.target.value)}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.after_inspection_pending_quantity || ''}
                                        readOnly
                                        // onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'after_inspection_pending_quantity', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.mom_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'mom_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.dispatch_clearance_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'dispatch_clearance_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.inspection_delay_days || ''}
                                        readOnly
                                        className="w-12 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.dispatch_clearance_delay || ''}
                                        readOnly
                                        className="w-12 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.etd_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'etd_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.actual_dispatch_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'actual_dispatch_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.eta_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'eta_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.actual_arrival_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'actual_arrival_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => duplicateLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          Duplicate
                                        </button>
                                        |
                                        <button
                                          onClick={() => deleteLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Table 2: After Delivery */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-md font-semibold text-green-700">After Delivery</h3>

                          <button
                            onClick={() => toggleSection("afterDelivery")}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            {collapsedSections.afterDelivery ? "Expand" : "Minimise"}
                          </button>
                        </div>

                        {!collapsedSections.afterDelivery && (
                          <div className="overflow-x-auto border border-gray-200 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-green-50">
                                <tr>
                                  {/* Common columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Lot No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Qty</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Value</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Total Lot Amount</th>

                                  {/* After Delivery specific columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Shipment No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Requested Delivery</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Customs Exemption</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">ASN Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actual Delivery</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Accessories Delivery</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Delivery Note No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Delive- red Qty</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Pending Qty</th>
                                  {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Delivery Value</th> */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">GRN No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Remarks</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Main Units Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Access- ories Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Delay by DEWA</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Other Delay DEWA</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Reason Other Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {lots.map((lot, lotIndex) => (
                                  <tr key={`after-${lot.lot_id}`} className="hover:bg-gray-50">
                                    {/* Common columns */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.item_lot_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'item_lot_no', e.target.value)}
                                        className="w-10 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.quantity || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'quantity', e.target.value)}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_unit_price)}
                                        readOnly
                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_total_value)}
                                        readOnly
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded bg-green-300 font-medium"
                                      />
                                    </td>

                                    {/* After Delivery specific columns */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.shipment_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'shipment_no', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.requested_delivery_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'requested_delivery_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.customs_duty_exemption_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'customs_duty_exemption_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.asn_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'asn_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.actual_delivery_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'actual_delivery_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-purple-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.meter_delivery_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'meter_delivery_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.delivery_note_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'delivery_note_no', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.delivered_quantity || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'delivered_quantity', e.target.value)}
                                        className="w-14 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.pending_quantity || ''}
                                        readOnly
                                        // onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'pending_quantity', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-gray-100 font-medium"
                                      />
                                    </td>
                                    {/* <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={formatNumber(lot.delivery_total_value)}
                                      onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'delivery_total_value', parseFormattedNumber(e.target.value))}
                                      className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                    />
                                  </td> */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.grn_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'grn_no', e.target.value)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.remarks_on_delivery || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'remarks_on_delivery', e.target.value)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.main_units_delay_days || ''}
                                        readOnly
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.accessories_delay_days || ''}
                                        readOnly
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.delay_by_dewa || ''}
                                        readOnly
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.other_delay_by_dewa || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'other_delay_by_dewa', e.target.value)}
                                        className="w-14 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.reason_for_other_delay || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'reason_for_other_delay', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => duplicateLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          Duplicate
                                        </button>
                                        |
                                        <button
                                          onClick={() => deleteLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Table 3: After Payment */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-md font-semibold text-purple-700">Payment Process</h3>

                          <button
                            onClick={() => toggleSection("afterPayment")}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            {collapsedSections.afterPayment ? "Expand" : "Minimise"}
                          </button>
                        </div>

                        {!collapsedSections.afterPayment && (
                          <div className="overflow-x-auto border border-gray-200 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-purple-50">
                                <tr>
                                  {/* Common columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Lot No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Qty</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Value</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Total Lot Amount</th>

                                  {/* After Payment specific columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Shipment No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Contractual Payment Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Invoice No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Invoice Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Invoice Value</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">SRM Invoice No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">SRM Invoice Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">SRM Invoice Value</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Payment Received</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Payment Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Payment Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Reason Payment Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Commission For Lot</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Commission Delivered Qty</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Commission Invoice No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Commission Invoice Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Commission Invoiced</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Commission Received Date</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Balance Commission</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {lots.map((lot, lotIndex) => (
                                  <tr key={`payment-${lot.lot_id}`} className="hover:bg-gray-50">
                                    {/* Common columns */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.item_lot_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'item_lot_no', e.target.value)}
                                        className="w-10 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.quantity || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'quantity', e.target.value)}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_unit_price)}
                                        readOnly
                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_total_value)}
                                        readOnly
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded bg-green-300 font-medium"
                                      />
                                    </td>

                                    {/* After Payment specific columns */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.shipment_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'shipment_no', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.contractual_payment_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'contractual_payment_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-purple-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.invoice_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'invoice_no', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.invoice_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'invoice_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput value={lot.invoice_value}
                                        onChange={(val) => updateLot(orderItem.order_item_detail_id, lotIndex, 'invoice_value', val)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-green-300"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.srm_invoice_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'srm_invoice_no', e.target.value)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.srm_invoice_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'srm_invoice_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-blue-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.srm_invoice_value}
                                        onChange={(val) => updateLot(orderItem.order_item_detail_id, lotIndex, 'srm_invoice_value', val)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.payment_amount_received}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'payment_amount_received', e)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.payment_received_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'payment_received_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-blue-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.delay_in_payment_days || ''}
                                        readOnly
                                        // onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'delay_in_payment_days', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.reason_for_payment_delay || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'reason_for_payment_delay', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.commission_amount_for_lot}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'commission_amount_for_lot', e)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.commission_amount_for_delivered_quantity}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'commission_amount_for_delivered_quantity', e)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.commission_invoice_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'commission_invoice_no', e.target.value)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.commission_invoice_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'commission_invoice_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-blue-300 font-medium"
                                      />
                                    </td>

                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.commission_amount_invoiced}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'commission_amount_invoiced', e)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="date"
                                        value={lot.commission_recieved_date || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'commission_recieved_date', e.target.value)}
                                        className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 bg-blue-300 font-medium"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.balance_commission_amount}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'balance_commission_amount', e)}
                                        className="w-22 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => duplicateLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          Duplicate
                                        </button>
                                        |
                                        <button
                                          onClick={() => deleteLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Table 4: Liquidated Damages */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-md font-semibold text-red-500">Liquidated Damages (LD)</h3>

                          <button
                            onClick={() => toggleSection("liquidatedDamages")}
                            className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            {collapsedSections.liquidatedDamages ? "Expand" : "Minimise"}
                          </button>
                        </div>

                        {!collapsedSections.liquidatedDamages && (
                          <div className="overflow-x-auto border border-gray-200 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-orange-50">
                                <tr>
                                  {/* Common columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Lot No</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Qty</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Value</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item Total Lot Amount</th>

                                  {/* LD specific columns */}
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">LD Units / Accessories</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">LD Delay Units</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">LD Delay Accessr</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Ispn Call Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Force Maj</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Force Maj Days</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Remarks Delay</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actual Delay LD</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actual LD Amount</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Max LD Amount</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Chargeable LD Amount</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {lots.map((lot, lotIndex) => (
                                  <tr key={`ld-${lot.lot_id}`} className="hover:bg-gray-50">
                                    {/* Common columns */}
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.item_lot_no || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'item_lot_no', e.target.value)}
                                        className="w-10 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.quantity || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'quantity', e.target.value)}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_unit_price)}
                                        readOnly
                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={formatNumber(lot.item_total_value)}
                                        readOnly
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded bg-green-300 font-medium"
                                      />
                                    </td>

                                    {/* LD specific columns */}
                                    <td className="px-2 py-2">
                                      <select
                                        value={lot.ld_delay_units_or_meters || 0}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'ld_delay_units_or_meters', Number(e.target.value))}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      >
                                        <option value="0">Units</option>
                                        <option value="1">Accessories</option>
                                      </select>
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.ld_delay_units || ''}
                                        readOnly
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.ld_delay_meters || ''}
                                        readOnly
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.delay_dewa_authorisation_days || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'delay_dewa_authorisation_days', e.target.value)}
                                        className="w-12 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <select
                                        value={lot.force_majeure || 0}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'force_majeure', Number(e.target.value))}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      >
                                        <option value="0">No</option>
                                        <option value="1">Yes</option>
                                      </select>
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.force_majeure_days || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'force_majeure_days', e.target.value)}
                                        className="w-12 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="text"
                                        value={lot.remarks_delay || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'remarks_delay', e.target.value)}
                                        className="w-18 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <input
                                        type="number"
                                        value={lot.actual_delay_for_ld || ''}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'actual_delay_for_ld', e.target.value)}
                                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.actual_ld_amount}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'actual_ld_amount', e)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.max_ld_amount}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'max_ld_amount', e)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <NumericInput
                                        value={lot.chargeable_ld_amount}
                                        onChange={(e) => updateLot(orderItem.order_item_detail_id, lotIndex, 'chargeable_ld_amount', e)}
                                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => duplicateLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                          Duplicate
                                        </button>
                                        |
                                        <button
                                          onClick={() => deleteLot(orderItem.order_item_detail_id, lotIndex)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => saveLots(orderItem.order_item_detail_id)}
                          disabled={saving}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {saving ? 'Saving...' : 'Save All Lots for This Item'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}

          {/* Save All Lots for All Items */}
          {orderItems.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={saveAllLots}
                disabled={saving}
                className="px-6 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 transition disabled:opacity-50 flex items-center gap-2 font-semibold"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {saving ? 'Saving All...' : 'Save All Lots for All Items'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}