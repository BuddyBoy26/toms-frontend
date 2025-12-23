// src/app/dashboard/lot_monitoring/[id]/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Loader from '@/components/Loader'
import { generatePDF } from '@/utils/pdfGenerator'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface OrderItemDetail {
  order_item_detail_id: number
  order_id: number
  order_description: string
  item_description: string
  unit_price: number
  currency: string
}

interface LotMonitoring {
  lot_id: number
  order_item_detail_id: number
  order_id: number
  order_description: string
  shipment_no: string | null
  item_lot_no: string | null
  item_unit_price: number
  currency: string
  quantity: number
  item_total_value: number
  contractual_delivery_date: string | null
  
  inspection_call_date_tent: string | null
  inspection_call_date_act: string | null
  inspection_date_advised: string | null
  no_of_inspection_days: number | null
  inspection_at: string | null
  actual_inspection_date: string | null
  
  units_inspected: number | null
  after_inspection_pending_quantity: number | null
  after_inspection_pending_lot_id: number | null
  mom_date: string | null
  dispatch_clearance_date: string | null
  inspection_delay_days: number | null
  dispatch_clearance_delay: number | null
  
  etd_date: string | null
  actual_dispatch_date: string | null
  eta_date: string | null
  actual_arrival_date: string | null
  
  requested_delivery_date: string | null
  customs_duty_exemption_date: string | null
  asn_date: string | null
  
  actual_delivery_date: string | null
  meter_delivery_date: string | null
  delivery_note_no: string | null
  delivered_quantity: number | null
  pending_quantity: number | null
  remarks_on_delivery: string | null
  delivery_total_value: number | null
  grn_no: string | null
  pending_lot_id: number | null
  
  main_units_delay_days: number | null
  accessories_delay_days: number | null
  delay_by_dewa: number | null
  other_delay_by_dewa: number | null
  reason_for_other_delay: string | null
  
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
  
  commission_amount_for_lot: number | null
  commission_amount_for_delivered_quantity: number | null
  commission_invoice_no: string | null
  commission_invoice_date: string | null
  commission_amount_invoiced: number | null
  balance_commission_amount: number | null
  
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

interface ExistingLot {
  lot_id: number
  order_item_detail_id: number
}

interface Discrepancy {
  discrepancy_id: number
  lot_id: number
  unit_sl_nos: string | null
  discrepancies: string
  pending_status: boolean
  delivery_note_no: string | null
  delivery_date: string | null
}

interface DiscrepancyEdit extends Discrepancy {
  isEditing?: boolean
  isNew?: boolean
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

// Utility functions for number formatting
const formatNumber = (value: string | number): string => {
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

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-GB')
}

export default function LotMonitoringEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([])
  const [existingLots, setExistingLots] = useState<ExistingLot[]>([])
  const [originalLot, setOriginalLot] = useState<LotMonitoring | null>(null)
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDiscrepancies, setIsSavingDiscrepancies] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discrepancyError, setDiscrepancyError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Lot Monitoring Information
    order_item_detail_id: '' as number | '',
    order_id: '' as number | '',
    order_description: '',
    shipment_no: '',
    item_lot_no: '',
    item_unit_price: '',
    currency: 'AED' as CurrencyEnum,
    quantity: '',
    item_total_value: '',
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
    after_inspection_pending_lot_id: '' as number | '',
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
    pending_lot_id: '' as number | '',

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

    // Summary for LD calculation
    ld_delay_units_or_meters: '0',
    ld_delay_units: '',
    ld_delay_meters: '',

    // Miscellaneous delays
    delay_dewa_authorisation_days: '',
    remarks_delay: '',
    force_majeure: '0',
    force_majeure_days: '',

    actual_delay_for_ld: '',
    actual_ld_amount: '',
    max_ld_amount: '',
    chargeable_ld_amount: '',
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
      const [lotRes, orderItemsRes, lotsRes, discrepanciesRes] = await Promise.all([
        fetch(`${API}/lot_monitoring/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/order_item_detail`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/lot_monitoring`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/discrepancies?lot_id=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const [lotData, orderItemsData, lotsData, discrepanciesData] = await Promise.all([
        lotRes.json(),
        orderItemsRes.json(),
        lotsRes.json(),
        discrepanciesRes.json()
      ])

      const lot = lotData as LotMonitoring
      setOriginalLot(lot)

      setFormData({
        order_item_detail_id: lot.order_item_detail_id,
        order_id: lot.order_id,
        order_description: lot.order_description || '',
        shipment_no: lot.shipment_no || '',
        item_lot_no: lot.item_lot_no || '',
        item_unit_price: lot.item_unit_price ? formatNumber(lot.item_unit_price) : '',
        currency: lot.currency as CurrencyEnum,
        quantity: lot.quantity ? formatNumber(lot.quantity) : '',
        item_total_value: lot.item_total_value ? formatNumber(lot.item_total_value) : '',
        contractual_delivery_date: lot.contractual_delivery_date || '',

        inspection_call_date_tent: lot.inspection_call_date_tent || '',
        inspection_call_date_act: lot.inspection_call_date_act || '',
        inspection_date_advised: lot.inspection_date_advised || '',
        no_of_inspection_days: lot.no_of_inspection_days ? String(lot.no_of_inspection_days) : '',
        inspection_at: lot.inspection_at || '',
        actual_inspection_date: lot.actual_inspection_date || '',

        units_inspected: lot.units_inspected ? String(lot.units_inspected) : '',
        after_inspection_pending_quantity: lot.after_inspection_pending_quantity ? String(lot.after_inspection_pending_quantity) : '',
        after_inspection_pending_lot_id: lot.after_inspection_pending_lot_id || '',
        mom_date: lot.mom_date || '',
        dispatch_clearance_date: lot.dispatch_clearance_date || '',
        inspection_delay_days: lot.inspection_delay_days ? String(lot.inspection_delay_days) : '',
        dispatch_clearance_delay: lot.dispatch_clearance_delay ? String(lot.dispatch_clearance_delay) : '',

        etd_date: lot.etd_date || '',
        actual_dispatch_date: lot.actual_dispatch_date || '',
        eta_date: lot.eta_date || '',
        actual_arrival_date: lot.actual_arrival_date || '',

        requested_delivery_date: lot.requested_delivery_date || '',
        customs_duty_exemption_date: lot.customs_duty_exemption_date || '',
        asn_date: lot.asn_date || '',

        actual_delivery_date: lot.actual_delivery_date || '',
        meter_delivery_date: lot.meter_delivery_date || '',
        delivery_note_no: lot.delivery_note_no || '',
        delivered_quantity: lot.delivered_quantity ? String(lot.delivered_quantity) : '',
        pending_quantity: lot.pending_quantity ? String(lot.pending_quantity) : '',
        remarks_on_delivery: lot.remarks_on_delivery || '',
        delivery_total_value: lot.delivery_total_value ? formatNumber(lot.delivery_total_value) : '',
        grn_no: lot.grn_no || '',
        pending_lot_id: lot.pending_lot_id || '',

        main_units_delay_days: lot.main_units_delay_days ? String(lot.main_units_delay_days) : '',
        accessories_delay_days: lot.accessories_delay_days ? String(lot.accessories_delay_days) : '',
        delay_by_dewa: lot.delay_by_dewa ? String(lot.delay_by_dewa) : '',
        other_delay_by_dewa: lot.other_delay_by_dewa ? String(lot.other_delay_by_dewa) : '',
        reason_for_other_delay: lot.reason_for_other_delay || '',

        contractual_payment_date: lot.contractual_payment_date || '',
        invoice_no: lot.invoice_no || '',
        invoice_date: lot.invoice_date || '',
        invoice_value: lot.invoice_value ? formatNumber(lot.invoice_value) : '',
        srm_invoice_no: lot.srm_invoice_no || '',
        srm_invoice_date: lot.srm_invoice_date || '',
        srm_invoice_value: lot.srm_invoice_value ? formatNumber(lot.srm_invoice_value) : '',
        payment_amount_received: lot.payment_amount_received ? formatNumber(lot.payment_amount_received) : '',
        payment_received_date: lot.payment_received_date || '',
        delay_in_payment_days: lot.delay_in_payment_days ? String(lot.delay_in_payment_days) : '',
        reason_for_payment_delay: lot.reason_for_payment_delay || '',

        commission_amount_for_lot: lot.commission_amount_for_lot ? formatNumber(lot.commission_amount_for_lot) : '',
        commission_amount_for_delivered_quantity: lot.commission_amount_for_delivered_quantity ? formatNumber(lot.commission_amount_for_delivered_quantity) : '',
        commission_invoice_no: lot.commission_invoice_no || '',
        commission_invoice_date: lot.commission_invoice_date || '',
        commission_amount_invoiced: lot.commission_amount_invoiced ? formatNumber(lot.commission_amount_invoiced) : '',
        balance_commission_amount: lot.balance_commission_amount ? formatNumber(lot.balance_commission_amount) : '',

        ld_delay_units_or_meters: lot.ld_delay_units_or_meters ? String(lot.ld_delay_units_or_meters) : '0',
        ld_delay_units: lot.ld_delay_units ? String(lot.ld_delay_units) : '',
        ld_delay_meters: lot.ld_delay_meters ? String(lot.ld_delay_meters) : '',
        delay_dewa_authorisation_days: lot.delay_dewa_authorisation_days ? String(lot.delay_dewa_authorisation_days) : '',
        remarks_delay: lot.remarks_delay || '',
        force_majeure: lot.force_majeure ? String(lot.force_majeure) : '0',
        force_majeure_days: lot.force_majeure_days ? String(lot.force_majeure_days) : '',

        actual_delay_for_ld: lot.actual_delay_for_ld ? String(lot.actual_delay_for_ld) : '',
        actual_ld_amount: lot.actual_ld_amount ? formatNumber(lot.actual_ld_amount) : '',
        max_ld_amount: lot.max_ld_amount ? formatNumber(lot.max_ld_amount) : '',
        chargeable_ld_amount: lot.chargeable_ld_amount ? formatNumber(lot.chargeable_ld_amount) : '',
      })

      setOrderItems(Array.isArray(orderItemsData) ? orderItemsData : [])
      setExistingLots(Array.isArray(lotsData) ? lotsData : [])
      setDiscrepancies(Array.isArray(discrepanciesData) ? discrepanciesData : [])
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAmountChange = (field: string, value: string) => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, [field]: formatted })
  }

  // Build JSON for single lot report
  const buildLotReportJson = () => {
    if (!originalLot) return null

    const components: any[] = []

    // Header
    components.push({
      type: "header",
      style: {
        wrapper: "px-0 py-2",
        title: "text-3xl font-extrabold tracking-wide text-black center"
      },
      props: { text: "LOT MONITORING REPORT" },
    })

    // Lot details
    components.push({
      type: "subheader",
      props: { text: `Lot #${originalLot.lot_id}` }
    })

    // Basic Information
    components.push({
      type: "table",
      props: {
        headers: ["Field", "Value"],
        rows: [
          ["Lot ID", originalLot.lot_id.toString()],
          ["Order Item Detail ID", originalLot.order_item_detail_id.toString()],
          ["Order Description", originalLot.order_description || 'N/A'],
          ["Shipment No", originalLot.shipment_no || 'N/A'],
          ["Item Lot No", originalLot.item_lot_no || 'N/A'],
          ["Item Unit Price", `${formatCurrency(originalLot.item_unit_price)} ${originalLot.currency}`],
          ["Quantity", formatCurrency(originalLot.quantity)],
          ["Item Total Value", `${formatCurrency(originalLot.item_total_value)} ${originalLot.currency}`],
          ["Contractual Delivery Date", formatDate(originalLot.contractual_delivery_date)],
        ],
      },
    })

    // Inspection Details
    if (originalLot.inspection_call_date_tent || originalLot.actual_inspection_date || originalLot.units_inspected) {
      components.push({
        type: "subheader",
        props: { text: "Inspection Details" }
      })

      const inspectionRows: string[][] = []
      if (originalLot.inspection_call_date_tent) inspectionRows.push(["Inspection Call Date (Tentative)", formatDate(originalLot.inspection_call_date_tent)])
      if (originalLot.inspection_call_date_act) inspectionRows.push(["Inspection Call Date (Actual)", formatDate(originalLot.inspection_call_date_act)])
      if (originalLot.inspection_date_advised) inspectionRows.push(["Inspection Date Advised", formatDate(originalLot.inspection_date_advised)])
      if (originalLot.no_of_inspection_days) inspectionRows.push(["No. of Inspection Days", originalLot.no_of_inspection_days.toString()])
      if (originalLot.inspection_at) inspectionRows.push(["Inspection At", originalLot.inspection_at])
      if (originalLot.actual_inspection_date) inspectionRows.push(["Actual Inspection Date", formatDate(originalLot.actual_inspection_date)])
      if (originalLot.units_inspected) inspectionRows.push(["Units Inspected", originalLot.units_inspected.toString()])
      if (originalLot.inspection_delay_days) inspectionRows.push(["Inspection Delay (Days)", originalLot.inspection_delay_days.toString()])

      if (inspectionRows.length > 0) {
        components.push({
          type: "table",
          props: {
            headers: ["Field", "Value"],
            rows: inspectionRows,
          },
        })
      }
    }

    // Delivery Details
    if (originalLot.actual_delivery_date || originalLot.delivered_quantity || originalLot.delivery_total_value) {
      components.push({
        type: "subheader",
        props: { text: "Delivery Details" }
      })

      const deliveryRows: string[][] = []
      if (originalLot.actual_delivery_date) deliveryRows.push(["Actual Delivery Date", formatDate(originalLot.actual_delivery_date)])
      if (originalLot.meter_delivery_date) deliveryRows.push(["Meter Delivery Date", formatDate(originalLot.meter_delivery_date)])
      if (originalLot.delivery_note_no) deliveryRows.push(["Delivery Note No", originalLot.delivery_note_no])
      if (originalLot.delivered_quantity) deliveryRows.push(["Delivered Quantity", originalLot.delivered_quantity.toString()])
      if (originalLot.pending_quantity) deliveryRows.push(["Pending Quantity", originalLot.pending_quantity.toString()])
      if (originalLot.delivery_total_value) deliveryRows.push(["Delivery Total Value", formatCurrency(originalLot.delivery_total_value)])
      if (originalLot.grn_no) deliveryRows.push(["GRN No", originalLot.grn_no])

      if (deliveryRows.length > 0) {
        components.push({
          type: "table",
          props: {
            headers: ["Field", "Value"],
            rows: deliveryRows,
          },
        })
      }
    }

    // Payment Details
    if (originalLot.invoice_no || originalLot.payment_amount_received) {
      components.push({
        type: "subheader",
        props: { text: "Payment Details" }
      })

      const paymentRows: string[][] = []
      if (originalLot.contractual_payment_date) paymentRows.push(["Contractual Payment Date", formatDate(originalLot.contractual_payment_date)])
      if (originalLot.invoice_no) paymentRows.push(["Invoice No", originalLot.invoice_no])
      if (originalLot.invoice_date) paymentRows.push(["Invoice Date", formatDate(originalLot.invoice_date)])
      if (originalLot.invoice_value) paymentRows.push(["Invoice Value", formatCurrency(originalLot.invoice_value)])
      if (originalLot.srm_invoice_no) paymentRows.push(["SRM Invoice No", originalLot.srm_invoice_no])
      if (originalLot.srm_invoice_date) paymentRows.push(["SRM Invoice Date", formatDate(originalLot.srm_invoice_date)])
      if (originalLot.srm_invoice_value) paymentRows.push(["SRM Invoice Value", formatCurrency(originalLot.srm_invoice_value)])
      if (originalLot.payment_amount_received) paymentRows.push(["Payment Amount Received", formatCurrency(originalLot.payment_amount_received)])
      if (originalLot.payment_received_date) paymentRows.push(["Payment Received Date", formatDate(originalLot.payment_received_date)])
      if (originalLot.delay_in_payment_days) paymentRows.push(["Delay in Payment (Days)", originalLot.delay_in_payment_days.toString()])

      if (paymentRows.length > 0) {
        components.push({
          type: "table",
          props: {
            headers: ["Field", "Value"],
            rows: paymentRows,
          },
        })
      }
    }

    // Commission Details
    if (originalLot.commission_amount_for_lot || originalLot.commission_amount_invoiced) {
      components.push({
        type: "subheader",
        props: { text: "Commission Details" }
      })

      const commissionRows: string[][] = []
      if (originalLot.commission_amount_for_lot) commissionRows.push(["Commission Amount for Lot", formatCurrency(originalLot.commission_amount_for_lot)])
      if (originalLot.commission_amount_for_delivered_quantity) commissionRows.push(["Commission Amount for Delivered Qty", formatCurrency(originalLot.commission_amount_for_delivered_quantity)])
      if (originalLot.commission_invoice_no) commissionRows.push(["Commission Invoice No", originalLot.commission_invoice_no])
      if (originalLot.commission_invoice_date) commissionRows.push(["Commission Invoice Date", formatDate(originalLot.commission_invoice_date)])
      if (originalLot.commission_amount_invoiced) commissionRows.push(["Commission Amount Invoiced", formatCurrency(originalLot.commission_amount_invoiced)])
      if (originalLot.balance_commission_amount) commissionRows.push(["Balance Commission Amount", formatCurrency(originalLot.balance_commission_amount)])

      if (commissionRows.length > 0) {
        components.push({
          type: "table",
          props: {
            headers: ["Field", "Value"],
            rows: commissionRows,
          },
        })
      }
    }

    // LD Calculation Summary
    if (originalLot.actual_ld_amount || originalLot.chargeable_ld_amount) {
      components.push({
        type: "subheader",
        props: { text: "Liquidated Damages Summary" }
      })

      const ldRows: string[][] = []
      if (originalLot.ld_delay_units_or_meters !== null) ldRows.push(["LD Delay Type", originalLot.ld_delay_units_or_meters === 0 ? 'Units' : 'Meters'])
      if (originalLot.ld_delay_units) ldRows.push(["LD Delay Units", originalLot.ld_delay_units.toString()])
      if (originalLot.ld_delay_meters) ldRows.push(["LD Delay Meters", originalLot.ld_delay_meters.toString()])
      if (originalLot.actual_delay_for_ld) ldRows.push(["Actual Delay for LD (Days)", originalLot.actual_delay_for_ld.toString()])
      if (originalLot.actual_ld_amount) ldRows.push(["Actual LD Amount", formatCurrency(originalLot.actual_ld_amount)])
      if (originalLot.max_ld_amount) ldRows.push(["Max LD Amount", formatCurrency(originalLot.max_ld_amount)])
      if (originalLot.chargeable_ld_amount) ldRows.push(["Chargeable LD Amount", formatCurrency(originalLot.chargeable_ld_amount)])

      if (ldRows.length > 0) {
        components.push({
          type: "table",
          props: {
            headers: ["Field", "Value"],
            rows: ldRows,
          },
        })
      }
    }

    // Footer
    components.push({
      type: "table",
      props: {
        headers: ["Report Information", ""],
        rows: [
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
      company: "Lot Monitoring",
      reportName: `Lot #${originalLot.lot_id} - Monitoring Report`,
      assets: {
        backgroundImage: "https://ik.imagekit.io/pritvik/Reports%20-%20generic%20bg.png",
      },
      components,
    }
  }

  // Generate report for single lot
  const handleGenerateReport = async () => {
    if (!originalLot) return

    setIsGeneratingReport(true)
    try {
      const reportJson = buildLotReportJson()
      if (reportJson) {
        await generatePDF(reportJson, 'download', `lot-${originalLot.lot_id}-report.pdf`)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    const payload = {
      order_item_detail_id: Number(formData.order_item_detail_id),
      order_id: Number(formData.order_id),
      order_description: formData.order_description || null,
      shipment_no: formData.shipment_no || null,
      item_lot_no: formData.item_lot_no || null,
      item_unit_price: parseFormattedNumber(formData.item_unit_price),
      currency: formData.currency,
      quantity: parseFormattedNumber(formData.quantity),
      item_total_value: parseFormattedNumber(formData.item_total_value),
      contractual_delivery_date: formData.contractual_delivery_date || null,

      inspection_call_date_tent: formData.inspection_call_date_tent || null,
      inspection_call_date_act: formData.inspection_call_date_act || null,
      inspection_date_advised: formData.inspection_date_advised || null,
      no_of_inspection_days: formData.no_of_inspection_days === '' ? null : Number(formData.no_of_inspection_days),
      inspection_at: formData.inspection_at || null,
      actual_inspection_date: formData.actual_inspection_date || null,

      units_inspected: formData.units_inspected === '' ? null : Number(formData.units_inspected),
      after_inspection_pending_quantity: formData.after_inspection_pending_quantity === '' ? null : Number(formData.after_inspection_pending_quantity),
      after_inspection_pending_lot_id: formData.after_inspection_pending_lot_id === '' ? null : Number(formData.after_inspection_pending_lot_id),
      mom_date: formData.mom_date || null,
      dispatch_clearance_date: formData.dispatch_clearance_date || null,
      inspection_delay_days: formData.inspection_delay_days === '' ? null : Number(formData.inspection_delay_days),
      dispatch_clearance_delay: formData.dispatch_clearance_delay === '' ? null : Number(formData.dispatch_clearance_delay),

      etd_date: formData.etd_date || null,
      actual_dispatch_date: formData.actual_dispatch_date || null,
      eta_date: formData.eta_date || null,
      actual_arrival_date: formData.actual_arrival_date || null,

      requested_delivery_date: formData.requested_delivery_date || null,
      customs_duty_exemption_date: formData.customs_duty_exemption_date || null,
      asn_date: formData.asn_date || null,

      actual_delivery_date: formData.actual_delivery_date || null,
      meter_delivery_date: formData.meter_delivery_date || null,
      delivery_note_no: formData.delivery_note_no || null,
      delivered_quantity: formData.delivered_quantity === '' ? null : Number(formData.delivered_quantity),
      pending_quantity: formData.pending_quantity === '' ? null : Number(formData.pending_quantity),
      remarks_on_delivery: formData.remarks_on_delivery || null,
      delivery_total_value: parseFormattedNumber(formData.delivery_total_value),
      grn_no: formData.grn_no || null,
      pending_lot_id: formData.pending_lot_id === '' ? null : Number(formData.pending_lot_id),

      main_units_delay_days: formData.main_units_delay_days === '' ? null : Number(formData.main_units_delay_days),
      accessories_delay_days: formData.accessories_delay_days === '' ? null : Number(formData.accessories_delay_days),
      delay_by_dewa: formData.delay_by_dewa === '' ? null : Number(formData.delay_by_dewa),
      other_delay_by_dewa: formData.other_delay_by_dewa === '' ? null : Number(formData.other_delay_by_dewa),
      reason_for_other_delay: formData.reason_for_other_delay || null,

      contractual_payment_date: formData.contractual_payment_date || null,
      invoice_no: formData.invoice_no || null,
      invoice_date: formData.invoice_date || null,
      invoice_value: parseFormattedNumber(formData.invoice_value),
      srm_invoice_no: formData.srm_invoice_no || null,
      srm_invoice_date: formData.srm_invoice_date || null,
      srm_invoice_value: parseFormattedNumber(formData.srm_invoice_value),
      payment_amount_received: parseFormattedNumber(formData.payment_amount_received),
      payment_received_date: formData.payment_received_date || null,
      delay_in_payment_days: formData.delay_in_payment_days === '' ? null : Number(formData.delay_in_payment_days),
      reason_for_payment_delay: formData.reason_for_payment_delay || null,

      commission_amount_for_lot: parseFormattedNumber(formData.commission_amount_for_lot),
      commission_amount_for_delivered_quantity: parseFormattedNumber(formData.commission_amount_for_delivered_quantity),
      commission_invoice_no: formData.commission_invoice_no || null,
      commission_invoice_date: formData.commission_invoice_date || null,
      commission_amount_invoiced: parseFormattedNumber(formData.commission_amount_invoiced),
      balance_commission_amount: parseFormattedNumber(formData.balance_commission_amount),

      ld_delay_units_or_meters: formData.ld_delay_units_or_meters === '' ? null : Number(formData.ld_delay_units_or_meters),
      ld_delay_units: formData.ld_delay_units === '' ? null : Number(formData.ld_delay_units),
      ld_delay_meters: formData.ld_delay_meters === '' ? null : Number(formData.ld_delay_meters),

      delay_dewa_authorisation_days: formData.delay_dewa_authorisation_days === '' ? null : Number(formData.delay_dewa_authorisation_days),
      remarks_delay: formData.remarks_delay || null,
      force_majeure: formData.force_majeure === '' ? null : Number(formData.force_majeure),
      force_majeure_days: formData.force_majeure_days === '' ? null : Number(formData.force_majeure_days),

      actual_delay_for_ld: formData.actual_delay_for_ld === '' ? null : Number(formData.actual_delay_for_ld),
      actual_ld_amount: parseFormattedNumber(formData.actual_ld_amount),
      max_ld_amount: parseFormattedNumber(formData.max_ld_amount),
      chargeable_ld_amount: parseFormattedNumber(formData.chargeable_ld_amount),
    }

    try {
      const response = await fetch(`${API}/lot_monitoring/${id}`, {
        method: 'PUT',
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
        const msg =
          Array.isArray(err?.detail)
            ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
            : typeof err?.detail === 'string'
            ? err.detail
            : 'Failed to update lot monitoring'
        setError(msg)
      }
    } catch (error) {
      console.error('Error updating lot monitoring:', error)
      setError('An error occurred while updating')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!originalLot) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Lot #${originalLot.lot_id}? This action cannot be undone.`
    )
    
    if (!confirmDelete) return
    
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch(`${API}/lot_monitoring/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
      })

      if (response.ok) {
        router.push('/dashboard/lot_monitoring')
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to delete lot')
      }
    } catch (error) {
      console.error('Error deleting lot:', error)
      setError('An error occurred while deleting')
    } finally {
      setIsSaving(false)
    }
  }

  // Discrepancy Management Functions
  const addNewDiscrepancy = () => {
    const newDiscrepancy: DiscrepancyEdit = {
      discrepancy_id: Date.now(), // Temporary ID
      lot_id: Number(id),
      unit_sl_nos: '',
      discrepancies: '',
      pending_status: true,
      delivery_note_no: '',
      delivery_date: '',
      isNew: true,
      isEditing: true,
    }
    setDiscrepancies([...discrepancies, newDiscrepancy])
  }

  const updateDiscrepancyField = (discrepancyId: number, field: keyof Discrepancy, value: any) => {
    setDiscrepancies(discrepancies.map(d => 
      d.discrepancy_id === discrepancyId ? { ...d, [field]: value } : d
    ))
  }

  const toggleEditDiscrepancy = (discrepancyId: number) => {
    setDiscrepancies(discrepancies.map(d => 
      d.discrepancy_id === discrepancyId ? { ...d, isEditing: !d.isEditing } : d
    ))
  }

  const deleteDiscrepancy = async (discrepancyId: number, isNew: boolean) => {
    if (!isNew) {
      // Existing discrepancy - delete from backend
      const confirmDelete = window.confirm('Are you sure you want to delete this discrepancy?')
      if (!confirmDelete) return

      try {
        const response = await fetch(`${API}/discrepancies/${discrepancyId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
          },
        })

        if (response.ok) {
          setDiscrepancies(discrepancies.filter(d => d.discrepancy_id !== discrepancyId))
        } else {
          setDiscrepancyError('Failed to delete discrepancy')
        }
      } catch (error) {
        console.error('Error deleting discrepancy:', error)
        setDiscrepancyError('An error occurred while deleting')
      }
    } else {
      // New discrepancy - just remove from state
      setDiscrepancies(discrepancies.filter(d => d.discrepancy_id !== discrepancyId))
    }
  }

  const saveAllDiscrepancies = async () => {
    setDiscrepancyError(null)
    setIsSavingDiscrepancies(true)

    try {
      const promises = discrepancies.map(async (disc) => {
        if (!disc.discrepancies.trim()) {
          throw new Error('Discrepancy description is required')
        }

        const payload = {
          lot_id: Number(id),
          unit_sl_nos: disc.unit_sl_nos || null,
          discrepancies: disc.discrepancies,
          pending_status: disc.pending_status,
          delivery_note_no: disc.delivery_note_no || null,
          delivery_date: disc.delivery_date || null,
        }

        if (disc.isNew) {
          // Create new discrepancy
          const response = await fetch(`${API}/discrepancies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
            },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            throw new Error('Failed to create discrepancy')
          }
          return response.json()
        } else {
          // Update existing discrepancy
          const response = await fetch(`${API}/discrepancies/${disc.discrepancy_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
            },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            throw new Error('Failed to update discrepancy')
          }
          return response.json()
        }
      })

      await Promise.all(promises)
      
      // Refresh discrepancies data
      const token = localStorage.getItem('kkabbas_token')
      const response = await fetch(`${API}/discrepancies?lot_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const freshData = await response.json()
      setDiscrepancies(Array.isArray(freshData) ? freshData : [])
      
      alert('Discrepancies saved successfully!')
    } catch (error: any) {
      console.error('Error saving discrepancies:', error)
      setDiscrepancyError(error.message || 'An error occurred while saving discrepancies')
    } finally {
      setIsSavingDiscrepancies(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Edit Lot Monitoring #{id}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lot Monitoring Information */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Lot Monitoring Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Item Detail *
                </label>
                <select
                  value={formData.order_item_detail_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order_item_detail_id: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">-- Select Order Item --</option>
                  {orderItems.map(oi => (
                    <option key={oi.order_item_detail_id} value={oi.order_item_detail_id}>
                      {oi.item_description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID (Auto-populated)
                </label>
                <input
                  type="text"
                  value={formData.order_id}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Description (Auto-populated)
                </label>
                <input
                  type="text"
                  value={formData.order_description}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipment No
                </label>
                <input
                  type="text"
                  value={formData.shipment_no}
                  onChange={(e) =>
                    setFormData({ ...formData, shipment_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Lot No
                </label>
                <input
                  type="text"
                  value={formData.item_lot_no}
                  onChange={(e) =>
                    setFormData({ ...formData, item_lot_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Unit Price *
                </label>
                <input
                  type="text"
                  value={formData.item_unit_price}
                  onChange={(e) => handleAmountChange('item_unit_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value as CurrencyEnum })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="AED">AED</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => handleAmountChange('quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Total Value *
                </label>
                <input
                  type="text"
                  value={formData.item_total_value}
                  onChange={(e) => handleAmountChange('item_total_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contractual Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.contractual_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, contractual_delivery_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Inspection - Before Inspection</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Call Date (Tentative)
                </label>
                <input
                  type="date"
                  value={formData.inspection_call_date_tent}
                  onChange={(e) =>
                    setFormData({ ...formData, inspection_call_date_tent: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Call Date (Actual)
                </label>
                <input
                  type="date"
                  value={formData.inspection_call_date_act}
                  onChange={(e) =>
                    setFormData({ ...formData, inspection_call_date_act: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Date Advised
                </label>
                <input
                  type="date"
                  value={formData.inspection_date_advised}
                  onChange={(e) =>
                    setFormData({ ...formData, inspection_date_advised: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. of Inspection Days
                </label>
                <input
                  type="number"
                  value={formData.no_of_inspection_days}
                  onChange={(e) =>
                    setFormData({ ...formData, no_of_inspection_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection At
                </label>
                <input
                  type="text"
                  value={formData.inspection_at}
                  onChange={(e) =>
                    setFormData({ ...formData, inspection_at: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Inspection Date
                </label>
                <input
                  type="date"
                  value={formData.actual_inspection_date}
                  onChange={(e) =>
                    setFormData({ ...formData, actual_inspection_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inspection - After Inspection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Inspection - After Inspection</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Units Inspected
                </label>
                <input
                  type="number"
                  value={formData.units_inspected}
                  onChange={(e) =>
                    setFormData({ ...formData, units_inspected: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pending Quantity (After Inspection)
                </label>
                <input
                  type="number"
                  value={formData.after_inspection_pending_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, after_inspection_pending_quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pending Lot Reference (After Inspection)
                </label>
                <select
                  value={formData.after_inspection_pending_lot_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      after_inspection_pending_lot_id: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- None --</option>
                  {existingLots.map(lot => (
                    <option key={lot.lot_id} value={lot.lot_id}>
                      Lot #{lot.lot_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MOM Date
                </label>
                <input
                  type="date"
                  value={formData.mom_date}
                  onChange={(e) =>
                    setFormData({ ...formData, mom_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch Clearance Date
                </label>
                <input
                  type="date"
                  value={formData.dispatch_clearance_date}
                  onChange={(e) =>
                    setFormData({ ...formData, dispatch_clearance_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Delay (Days)
                </label>
                <input
                  type="number"
                  value={formData.inspection_delay_days}
                  onChange={(e) =>
                    setFormData({ ...formData, inspection_delay_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch Clearance Delay (Days)
                </label>
                <input
                  type="number"
                  value={formData.dispatch_clearance_delay}
                  onChange={(e) =>
                    setFormData({ ...formData, dispatch_clearance_delay: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Shipment Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ETD Date
                </label>
                <input
                  type="date"
                  value={formData.etd_date}
                  onChange={(e) =>
                    setFormData({ ...formData, etd_date: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, actual_dispatch_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ETA Date
                </label>
                <input
                  type="date"
                  value={formData.eta_date}
                  onChange={(e) =>
                    setFormData({ ...formData, eta_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Arrival Date
                </label>
                <input
                  type="date"
                  value={formData.actual_arrival_date}
                  onChange={(e) =>
                    setFormData({ ...formData, actual_arrival_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Authorisation */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Delivery Authorisation</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.requested_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, requested_delivery_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customs Duty Exemption Date
                </label>
                <input
                  type="date"
                  value={formData.customs_duty_exemption_date}
                  onChange={(e) =>
                    setFormData({ ...formData, customs_duty_exemption_date: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, asn_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Delivery Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.actual_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, actual_delivery_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meter Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.meter_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, meter_delivery_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Note No
                </label>
                <input
                  type="text"
                  value={formData.delivery_note_no}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_note_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivered Quantity
                </label>
                <input
                  type="number"
                  value={formData.delivered_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, delivered_quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pending Quantity
                </label>
                <input
                  type="number"
                  value={formData.pending_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, pending_quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Total Value
                </label>
                <input
                  type="text"
                  value={formData.delivery_total_value}
                  onChange={(e) => handleAmountChange('delivery_total_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GRN No
                </label>
                <input
                  type="text"
                  value={formData.grn_no}
                  onChange={(e) =>
                    setFormData({ ...formData, grn_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pending Lot Reference
                </label>
                <select
                  value={formData.pending_lot_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pending_lot_id: e.target.value === '' ? '' : Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- None --</option>
                  {existingLots.map(lot => (
                    <option key={lot.lot_id} value={lot.lot_id}>
                      Lot #{lot.lot_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks on Delivery
              </label>
              <textarea
                value={formData.remarks_on_delivery}
                onChange={(e) =>
                  setFormData({ ...formData, remarks_on_delivery: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Delay Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Delay Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Units Delay (Days)
                </label>
                <input
                  type="number"
                  value={formData.main_units_delay_days}
                  onChange={(e) =>
                    setFormData({ ...formData, main_units_delay_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accessories Delay (Days)
                </label>
                <input
                  type="number"
                  value={formData.accessories_delay_days}
                  onChange={(e) =>
                    setFormData({ ...formData, accessories_delay_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay by DEWA (Days)
                </label>
                <input
                  type="number"
                  value={formData.delay_by_dewa}
                  onChange={(e) =>
                    setFormData({ ...formData, delay_by_dewa: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Delay by DEWA (Days)
                </label>
                <input
                  type="number"
                  value={formData.other_delay_by_dewa}
                  onChange={(e) =>
                    setFormData({ ...formData, other_delay_by_dewa: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Other Delay
              </label>
              <textarea
                value={formData.reason_for_other_delay}
                onChange={(e) =>
                  setFormData({ ...formData, reason_for_other_delay: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Payment Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contractual Payment Date
                </label>
                <input
                  type="date"
                  value={formData.contractual_payment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, contractual_payment_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice No
                </label>
                <input
                  type="text"
                  value={formData.invoice_no}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Value
                </label>
                <input
                  type="text"
                  value={formData.invoice_value}
                  onChange={(e) => handleAmountChange('invoice_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SRM Invoice No
                </label>
                <input
                  type="text"
                  value={formData.srm_invoice_no}
                  onChange={(e) =>
                    setFormData({ ...formData, srm_invoice_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SRM Invoice Date
                </label>
                <input
                  type="date"
                  value={formData.srm_invoice_date}
                  onChange={(e) =>
                    setFormData({ ...formData, srm_invoice_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SRM Invoice Value
                </label>
                <input
                  type="text"
                  value={formData.srm_invoice_value}
                  onChange={(e) => handleAmountChange('srm_invoice_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount Received
                </label>
                <input
                  type="text"
                  value={formData.payment_amount_received}
                  onChange={(e) => handleAmountChange('payment_amount_received', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Received Date
                </label>
                <input
                  type="date"
                  value={formData.payment_received_date}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_received_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay in Payment (Days)
                </label>
                <input
                  type="number"
                  value={formData.delay_in_payment_days}
                  onChange={(e) =>
                    setFormData({ ...formData, delay_in_payment_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Payment Delay
              </label>
              <textarea
                value={formData.reason_for_payment_delay}
                onChange={(e) =>
                  setFormData({ ...formData, reason_for_payment_delay: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Commission Details */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Commission Details</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Amount for Lot
                </label>
                <input
                  type="text"
                  value={formData.commission_amount_for_lot}
                  onChange={(e) => handleAmountChange('commission_amount_for_lot', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Amount for Delivered Quantity
                </label>
                <input
                  type="text"
                  value={formData.commission_amount_for_delivered_quantity}
                  onChange={(e) => handleAmountChange('commission_amount_for_delivered_quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Invoice No
                </label>
                <input
                  type="text"
                  value={formData.commission_invoice_no}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_invoice_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Invoice Date
                </label>
                <input
                  type="date"
                  value={formData.commission_invoice_date}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_invoice_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Amount Invoiced
                </label>
                <input
                  type="text"
                  value={formData.commission_amount_invoiced}
                  onChange={(e) => handleAmountChange('commission_amount_invoiced', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Commission Amount
                </label>
                <input
                  type="text"
                  value={formData.balance_commission_amount}
                  onChange={(e) => handleAmountChange('balance_commission_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary for LD Calculation */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 pb-2 ">Summary for LD Calculation</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LD Delay Units or Meters
                </label>
                <select
                  value={formData.ld_delay_units_or_meters}
                  onChange={(e) =>
                    setFormData({ ...formData, ld_delay_units_or_meters: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="0">Units</option>
                  <option value="1">Meters</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LD Delay Units
                </label>
                <input
                  type="number"
                  value={formData.ld_delay_units}
                  onChange={(e) =>
                    setFormData({ ...formData, ld_delay_units: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LD Delay Meters
                </label>
                <input
                  type="number"
                  value={formData.ld_delay_meters}
                  onChange={(e) =>
                    setFormData({ ...formData, ld_delay_meters: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay DEWA Authorisation (Days)
                </label>
                <input
                  type="number"
                  value={formData.delay_dewa_authorisation_days}
                  onChange={(e) =>
                    setFormData({ ...formData, delay_dewa_authorisation_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Force Majeure
                </label>
                <select
                  value={formData.force_majeure}
                  onChange={(e) =>
                    setFormData({ ...formData, force_majeure: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Force Majeure Days
                </label>
                <input
                  type="number"
                  value={formData.force_majeure_days}
                  onChange={(e) =>
                    setFormData({ ...formData, force_majeure_days: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks on Delay
              </label>
              <textarea
                value={formData.remarks_delay}
                onChange={(e) =>
                  setFormData({ ...formData, remarks_delay: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Delay for LD (Days)
                </label>
                <input
                  type="number"
                  value={formData.actual_delay_for_ld}
                  onChange={(e) =>
                    setFormData({ ...formData, actual_delay_for_ld: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual LD Amount
                </label>
                <input
                  type="text"
                  value={formData.actual_ld_amount}
                  onChange={(e) => handleAmountChange('actual_ld_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max LD Amount
                </label>
                <input
                  type="text"
                  value={formData.max_ld_amount}
                  onChange={(e) => handleAmountChange('max_ld_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chargeable LD Amount
                </label>
                <input
                  type="text"
                  value={formData.chargeable_ld_amount}
                  onChange={(e) => handleAmountChange('chargeable_ld_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Discrepancies Section */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <h2 className="text-lg font-semibold">Discrepancies</h2>
            <button
              type="button"
              onClick={addNewDiscrepancy}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
            >
              + Add Discrepancy
            </button>
          </div>

          {discrepancyError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {discrepancyError}
            </div>
          )}

          {discrepancies.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No discrepancies found. Click "Add Discrepancy" to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Unit SL Nos
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discrepancies *
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Delivery Note
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Delivery Date
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discrepancies.map((disc) => (
                    <tr key={disc.discrepancy_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={disc.unit_sl_nos || ''}
                          onChange={(e) => updateDiscrepancyField(disc.discrepancy_id, 'unit_sl_nos', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="e.g., 1-5, 10"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          value={disc.discrepancies}
                          onChange={(e) => updateDiscrepancyField(disc.discrepancy_id, 'discrepancies', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Describe the discrepancy..."
                          required
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={disc.pending_status ? 'true' : 'false'}
                          onChange={(e) => updateDiscrepancyField(disc.discrepancy_id, 'pending_status', e.target.value === 'true')}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="true">Pending</option>
                          <option value="false">Resolved</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={disc.delivery_note_no || ''}
                          onChange={(e) => updateDiscrepancyField(disc.discrepancy_id, 'delivery_note_no', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Note #"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={disc.delivery_date || ''}
                          onChange={(e) => updateDiscrepancyField(disc.discrepancy_id, 'delivery_date', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => deleteDiscrepancy(disc.discrepancy_id, disc.isNew || false)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete discrepancy"
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

          {discrepancies.length > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={saveAllDiscrepancies}
                disabled={isSavingDiscrepancies}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingDiscrepancies && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isSavingDiscrepancies ? 'Saving Discrepancies...' : 'Save All Discrepancies'}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          {/* Left side: Delete and Generate Report buttons */}
          <div className="flex gap-2">
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
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isGeneratingReport && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              📄 Report
            </button>
          </div>

          {/* Right side: Cancel and Save buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/lot_monitoring')}
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
        </div>
      </form>
    </div>
  )
}