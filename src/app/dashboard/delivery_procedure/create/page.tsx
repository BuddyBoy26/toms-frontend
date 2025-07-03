// src/app/dashboard/delivery_procedure/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lot { lot_id: string }
interface OrderItem { order_item_detail_id: number; item_description: string }
interface Status { value: string }

const DOC_STATUS: Status[] = [
  { value: 'All documents received' },
  { value: 'Partial documents received' },
]

export default function CreateDeliveryProcedurePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [lotId, setLotId] = useState('')
  const [orderItemDesc, setOrderItemDesc] = useState('')
  const [shipmentEtd, setShipmentEtd] = useState('')
  const [shipmentEta, setShipmentEta] = useState('')
  const [docsStatus, setDocsStatus] = useState(DOC_STATUS[0].value)
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

  const [lots, setLots] = useState<Lot[]>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/lot_monitoring`, { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
      fetch(`${API}/order_item_detail`, { headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` } }).then(r => r.json()),
    ])
      .then(([ls, oi]: [Lot[], OrderItem[]]) => {
        setLots(ls)
        setItems(oi)
      })
      .catch(() => setError('Failed to load dropdowns'))
  }, [API])

  const handleSubmit = async (e: React.FormEvent) => {
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

    const res = await fetch(`${API}/delivery_procedure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create')
    } else {
      router.push('/dashboard/delivery_procedure')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Delivery Procedure</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        {/* Lot dropdown */}
        <div>
          <label className="block text-sm font-medium">Lot ID</label>
          <input
            list="lots"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search…"
            value={lotId}
            onChange={e => setLotId(e.target.value)}
            required
          />
          <datalist id="lots">
            {lots.map(l => <option key={l.lot_id} value={l.lot_id} />)}
          </datalist>
        </div>

        {/* Order Item dropdown */}
        <div>
          <label className="block text-sm font-medium">Order Item</label>
          <input
            list="orderItems"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            placeholder="Type to search…"
            value={orderItemDesc}
            onChange={e => setOrderItemDesc(e.target.value)}
            required
          />
          <datalist id="orderItems">
            {items.map(i => <option key={i.order_item_detail_id} value={i.item_description} />)}
          </datalist>
        </div>

        {/* Date fields */}
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

        {/* Status & receive date */}
        <div>
          <label className="block text-sm font-medium">Docs Received Status</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={docsStatus}
            onChange={e => setDocsStatus(e.target.value)}
          >
            {DOC_STATUS.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
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

        {/* Remaining date/text fields */}
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

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
