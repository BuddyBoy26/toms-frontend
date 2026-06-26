'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'

interface DeliveryProcedure {
  dp_id: number
  lot_id: number
  order_item_detail_id: number
  item_no_dewa: string | null
  lot_no_dewa: string | null
  shipment_etd: string | null
  dispatch_clearance_date: string | null
  shipment_eta: string | null
  actual_dispatch_date: string | null
  document_status: number | null
  receive_shipping_docs_date: string | null
  cd_exemption: number | null
  cd_exemption_submitted: string | null
  cd_exemption_recieved_date: string | null
  cepa_ddu: number | null
  cepa_ddu_date: string | null
  submission_to_cd_accounts_date: string | null
  bl_stamped_date: string | null
  documents_to_agent_date: string | null
  asn_no: string | null
  asn_date: string | null
  delivery_intimation_date: string | null
  deliver_approval_from_stores_date: string | null
  delivery_note_no: string | null
  delivery_note_date: string | null
  gate_pass_request_date: string | null
  gate_pass_received_date: string | null
  delivery_date: string | null
  delivery_date_smart_meters: string | null
  end_of_delivery_remarks: string | null
}

interface Lot {
  lot_id: number
  order_id: number
  shipment_no: string | null
}

interface OrderDetail {
  order_id: number
  po_number: string
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB')
}

const getDocumentStatusLabel = (status: number | null): string => {
  if (status === null) return 'Not Received'
  switch (status) {
    case 0: return 'Not Received'
    case 1: return 'Partial'
    case 2: return 'All Received'
    default: return 'Unknown'
  }
}

const getCDExemptionLabel = (exemption: number | null): string => {
  if (exemption === null) return 'Not Exempted'
  return exemption === 1 ? 'Exempted' : 'Not Exempted'
}

const getCEPADDULabel = (type: number | null): string => {
  if (type === null) return 'N/A'
  return type === 0 ? 'DEWA Exemption' : 'CEPA'
}

type DisplayProcedure = {
  dp_id: number
  po_number: string
  shipment_no: string
  item_no_dewa: string
  lot_no_dewa: string
  document_status: string
  cd_exemption: string
  cepa_ddu: string
  asn_no: string
  delivery_note_no: string
  delivery_date: string
}

export default function DeliveryProcedurePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [procedures, setProcedures] = useState<DeliveryProcedure[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [dpRes, lotsRes, ordersRes] = await Promise.all([
        fetch(`${API}/delivery_procedure`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/lot_monitoring`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!dpRes.ok) throw new Error('Failed to fetch delivery procedures')

      const [dpData, lotsData, ordersData] = await Promise.all([
        dpRes.json(), lotsRes.json(), ordersRes.json()
      ])

      setProcedures(Array.isArray(dpData) ? dpData : [])
      setLots(Array.isArray(lotsData) ? lotsData : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load delivery procedures')
    } finally {
      setLoading(false)
    }
  }

  // Build lookup maps
  const lotMap = useMemo(() => {
    const m = new Map<number, { order_id: number; shipment_no: string | null }>()
    for (const l of lots) m.set(l.lot_id, { order_id: l.order_id, shipment_no: l.shipment_no })
    return m
  }, [lots])

  const orderMap = useMemo(() => {
    const m = new Map<number, string>() // order_id → po_number
    for (const o of orders) m.set(o.order_id, o.po_number)
    return m
  }, [orders])

  const formattedRows: DisplayProcedure[] = useMemo(() => {
    return procedures.map(proc => {
      const lotData = lotMap.get(proc.lot_id)
      const poNumber = lotData ? (orderMap.get(lotData.order_id) ?? '—') : '—'
      const shipmentNo = lotData?.shipment_no || '—'

      return {
        dp_id: proc.dp_id,
        po_number: poNumber,
        shipment_no: shipmentNo,
        item_no_dewa: proc.item_no_dewa || 'N/A',
        lot_no_dewa: proc.lot_no_dewa || 'N/A',
        document_status: getDocumentStatusLabel(proc.document_status),
        cd_exemption: getCDExemptionLabel(proc.cd_exemption),
        cepa_ddu: getCEPADDULabel(proc.cepa_ddu),
        asn_no: proc.asn_no || 'N/A',
        delivery_note_no: proc.delivery_note_no || 'N/A',
        delivery_date: formatDate(proc.delivery_date),
      }
    })
  }, [procedures, lotMap, orderMap])

  const columns: Column<DisplayProcedure>[] = [
    { key: 'dp_id', header: 'DP ID' },
    { key: 'po_number', header: 'PO Number' },
    { key: 'shipment_no', header: 'Shipment No' },
    { key: 'item_no_dewa', header: 'Item No (DEWA)' },
    { key: 'lot_no_dewa', header: 'Lot No (DEWA)' },
    { key: 'document_status', header: 'Document Status' },
    { key: 'cd_exemption', header: 'CD Exemption' },
    { key: 'cepa_ddu', header: 'DEWA Exemption / CEPA' },
    { key: 'asn_no', header: 'ASN No' },
    { key: 'delivery_note_no', header: 'Delivery Note No' },
    { key: 'delivery_date', header: 'Delivery Date' },
  ]

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery Procedures</h1>
        <button
          onClick={() => router.push('/dashboard/delivery_procedure/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition active:scale-95"
        >
          + Create
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <CustomTable<DisplayProcedure>
          columns={columns}
          data={formattedRows}
          idField="dp_id"
          linkPrefix="/dashboard/delivery_procedure"
        />
      )}
    </div>
  )
}