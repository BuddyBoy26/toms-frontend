// src/app/dashboard/delivery_procedure/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lot { lot_id: string }
interface OrderItem { order_item_detail_id: number; item_description: string }
interface DP {
  dp_id: number
  lot_id: string
  order_item_detail_id: number
  shipment_etd: string | null
  shipment_eta: string | null
  receive_shipping_docs_status: string | null
  receive_shipping_docs_date: string | null
  delivery_approval_date: string | null
  customs_exemption_date: string | null
  cd_to_clearing_agent_date: string | null
  asn_no: string | null
  asn_date: string | null
  delivery_email_date: string | null
  delivery_note_no: string | null
  dn_date: string | null
  gate_pass_creation_date: string | null
}

const DOC_STATUS = [
  'All documents received',
  'Partial documents received',
]

export default function DeliveryProcedureDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [lots, setLots] = useState<Lot[]>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [dp, setDp] = useState<DP | null>(null)

  const [lotId, setLotId] = useState('')
  const [orderItemDesc, setOrderItemDesc] = useState('')
  const [shipmentEtd, setShipmentEtd] = useState('')
  const [shipmentEta, setShipmentEta] = useState('')
  const [docsStatus, setDocsStatus] = useState('')
  const [receiveDocsDate, setReceiveDocsDate] = useState('')
  const [deliveryApprovalDate, setDeliveryApprovalDate] = useState('')
  const [customsExemptionDate, setCustomsExemptionDate] = useState('')
  const [cdToAgentDate, setCdToAgentDate] = useState('')
  const [asnNo, setAsnNo] = useState('')
  const [asnDate, setAsnDate] = useState('')
  const [deliveryEmailDate, setDeliveryEmailDate] = useState('')
  const [deliveryNoteNo, setDeliveryNoteNo] = useState('')
  const [dnDate, setDnDate] = useState('')
  const [gatePassDate, setGatePassDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/lot_monitoring`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(r => r.json()),
      fetch(`${API}/order_item_detail`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(r => r.json()),
      fetch(`${API}/delivery_procedure/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
      }).then(r => r.json()),
    ])
      .then(([ls, oi, d]: [Lot[], OrderItem[], DP]) => {
        setLots(ls)
        setItems(oi)
        setDp(d)
        setLotId(d.lot_id)
        const itm = oi.find(i => i.order_item_detail_id === d.order_item_detail_id)
        setOrderItemDesc(itm?.item_description || '')
        setShipmentEtd(d.shipment_etd || '')
        setShipmentEta(d.shipment_eta || '')
        setDocsStatus(d.receive_shipping_docs_status || '')
        setReceiveDocsDate(d.receive_shipping_docs_date || '')
        setDeliveryApprovalDate(d.delivery_approval_date || '')
        setCustomsExemptionDate(d.customs_exemption_date || '')
        setCdToAgentDate(d.cd_to_clearing_agent_date || '')
        setAsnNo(d.asn_no || '')
        setAsnDate(d.asn_date || '')
        setDeliveryEmailDate(d.delivery_email_date || '')
        setDeliveryNoteNo(d.delivery_note_no || '')
        setDnDate(d.dn_date || '')
        setGatePassDate(d.gate_pass_creation_date || '')
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    if (!lots.find(l => l.lot_id === lotId)) {
      setError('Select a valid Lot ID')
      setSaving(false)
      return
    }
    const oi = items.find(i => i.item_description === orderItemDesc)
    if (!oi) {
      setError('Select a valid Order Item')
      setSaving(false)
      return
    }

    const payload = {
      lot_id: lotId,
      order_item_detail_id: oi.order_item_detail_id,
      shipment_etd: shipmentEtd || null,
      shipment_eta: shipmentEta || null,
      receive_shipping_docs_status: docsStatus || null,
      receive_shipping_docs_date: receiveDocsDate || null,
      delivery_approval_date: deliveryApprovalDate || null,
      customs_exemption_date: customsExemptionDate || null,
      cd_to_clearing_agent_date: cdToAgentDate || null,
      asn_no: asnNo || null,
      asn_date: asnDate || null,
      delivery_email_date: deliveryEmailDate || null,
      delivery_note_no: deliveryNoteNo || null,
      dn_date: dnDate || null,
      gate_pass_creation_date: gatePassDate || null,
    }

    const res = await fetch(`${API}/delivery_procedure/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to save')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this record?')) return
    await fetch(`${API}/delivery_procedure/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
    router.push('/dashboard/delivery_procedure')
  }

  if (loading) return <p>Loading…</p>
  if (!dp) return <p className="text-red-600">Not found.</p>

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Delivery Procedure #{dp.dp_id}</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium">Lot ID</label>
          <input
            list="lots"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={lotId}
            onChange={e => setLotId(e.target.value)}
            required
          />
          <datalist id="lots">
            {lots.map(l => (
              <option key={l.lot_id} value={l.lot_id} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium">Order Item</label>
          <input
            list="orderItems"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={orderItemDesc}
            onChange={e => setOrderItemDesc(e.target.value)}
            required
          />
          <datalist id="orderItems">
            {items.map(i => (
              <option key={i.order_item_detail_id} value={i.item_description} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Shipment ETD</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={shipmentEtd}
              onChange={e => setShipmentEtd(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Shipment ETA</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={shipmentEta}
              onChange={e => setShipmentEta(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Docs Received Status</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={docsStatus}
            onChange={e => setDocsStatus(e.target.value)}
          >
            {DOC_STATUS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Docs Received Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={receiveDocsDate}
            onChange={e => setReceiveDocsDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Delivery Approval Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={deliveryApprovalDate}
            onChange={e => setDeliveryApprovalDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Customs Exemption Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={customsExemptionDate}
            onChange={e => setCustomsExemptionDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">CD to Clearing Agent Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={cdToAgentDate}
            onChange={e => setCdToAgentDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">ASN No.</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={asnNo}
            onChange={e => setAsnNo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">ASN Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={asnDate}
            onChange={e => setAsnDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Delivery Email Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={deliveryEmailDate}
            onChange={e => setDeliveryEmailDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Delivery Note No.</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={deliveryNoteNo}
            onChange={e => setDeliveryNoteNo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">DN Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={dnDate}
            onChange={e => setDnDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Gate Pass Creation Date</label>
          <input
            type="date"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={gatePassDate}
            onChange={e => setGatePassDate(e.target.value)}
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
