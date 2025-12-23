// src/app/dashboard/delivery_procedure/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

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

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
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
  return type === 0 ? 'CEPA' : 'DDU'
}

export default function DeliveryProcedurePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [procedures, setProcedures] = useState<DeliveryProcedure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProcedures()
  }, [])

  const fetchProcedures = async () => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API}/delivery_procedure`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch delivery procedures')
      }

      const data = await response.json()
      setProcedures(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || 'Failed to load delivery procedures')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this delivery procedure?')) {
      return
    }

    const token = localStorage.getItem('kkabbas_token')
    try {
      const response = await fetch(`${API}/delivery_procedure/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to delete delivery procedure')
      }

      await fetchProcedures()
    } catch (e: any) {
      setError(e.message || 'Failed to delete')
    }
  }

  type DisplayProcedure = {
    dp_id: number
    lot_id: number
    item_no_dewa: string
    lot_no_dewa: string
    document_status: string
    cd_exemption: string
    cepa_ddu: string
    asn_no: string
    delivery_note_no: string
    delivery_date: string
  }

  const columns: Column<DisplayProcedure>[] = [
    { key: 'dp_id', header: 'DP ID' },
    { key: 'lot_id', header: 'Lot ID' },
    { key: 'item_no_dewa', header: 'Item No (DEWA)' },
    { key: 'lot_no_dewa', header: 'Lot No (DEWA)' },
    { key: 'document_status', header: 'Document Status' },
    { key: 'cd_exemption', header: 'CD Exemption' },
    { key: 'cepa_ddu', header: 'CEPA/DDU' },
    { key: 'asn_no', header: 'ASN No' },
    { key: 'delivery_note_no', header: 'Delivery Note No' },
    { key: 'delivery_date', header: 'Delivery Date' },
  ]

  const formattedRows: DisplayProcedure[] = procedures.map(proc => ({
    dp_id: proc.dp_id,
    lot_id: proc.lot_id,
    item_no_dewa: proc.item_no_dewa || 'N/A',
    lot_no_dewa: proc.lot_no_dewa || 'N/A',
    document_status: getDocumentStatusLabel(proc.document_status),
    cd_exemption: getCDExemptionLabel(proc.cd_exemption),
    cepa_ddu: getCEPADDULabel(proc.cepa_ddu),
    asn_no: proc.asn_no || 'N/A',
    delivery_note_no: proc.delivery_note_no || 'N/A',
    delivery_date: formatDate(proc.delivery_date),
  }))

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Delivery Procedures</h1>
        <button
          onClick={() => router.push('/dashboard/delivery_procedure/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create New
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

{loading ? (
  <div className="py-10 text-center text-gray-500">
    Loading delivery procedures...
  </div>
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