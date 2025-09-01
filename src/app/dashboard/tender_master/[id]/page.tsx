'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type TenderType = 'public' | 'selected'

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
  tender_date: string | null
  closing_date: string | null
  tender_fees: number | null
  bond_guarantee_amt: number | null
  tender_type: TenderType
  extension_dates?: string[] | null
}

type ErrorDetail = { msg?: string; [key: string]: unknown }

export default function TenderDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tender, setTender] = useState<Tender | null>(null)

  // form state
  const [tenderNo, setTenderNo] = useState('')
  const [tenderDescription, setTenderDescription] = useState('')
  const [tenderType, setTenderType] = useState<TenderType>('public')
  const [tenderDate, setTenderDate] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [bondAmount, setBondAmount] = useState<string>('')
  const [fees, setFees] = useState<string>('')
  const [extensionDates, setExtensionDates] = useState<string[]>([''])

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    fetch(`${API}/tender/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((t: Tender) => {
        setTender(t)
        setTenderNo(t?.tender_no || '')
        setTenderDescription(t?.tender_description || '')
        setTenderType((t?.tender_type as TenderType) || 'public')
        setTenderDate(t?.tender_date || '')
        setClosingDate(t?.closing_date || '')
        setBondAmount(
          t?.bond_guarantee_amt !== null && t?.bond_guarantee_amt !== undefined
            ? String(t.bond_guarantee_amt)
            : ''
        )
        setFees(
          t?.tender_fees !== null && t?.tender_fees !== undefined ? String(t.tender_fees) : ''
        )
        const ext = Array.isArray(t?.extension_dates) ? t.extension_dates : []
        setExtensionDates(ext.length ? ext : [''])
      })
      .catch(e => setError(`Failed to load tender: ${e.message}`))
      .finally(() => setLoading(false))
  }, [API, id])

  // validation
  const validateExtensionDates = () => {
    if (!closingDate) return false
    let last = new Date(closingDate)
    for (const d of extensionDates) {
      if (!d) return false
      const extDate = new Date(d)
      if (!(extDate > last)) return false
      last = extDate
    }
    return true
  }

  const canSubmit = useMemo(() => {
    if (!tenderDescription.trim()) return false
    if (!tenderDate || !closingDate) return false
    if (!(new Date(closingDate) > new Date(tenderDate))) return false
    if (!validateExtensionDates()) return false
    return true
  }, [tenderDescription, tenderDate, closingDate, extensionDates])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      setError(
        'Closing date must be after invitation date, and all extension dates must be after closing and sequential.'
      )
      return
    }
    setSaving(true)
    const token = localStorage.getItem('kkabbas_token')
    try {
      const payload = {
        tender_description: tenderDescription,
        tender_type: tenderType,
        tender_date: tenderDate,
        closing_date: closingDate,
        bond_guarantee_amt: bondAmount === '' ? null : Number(bondAmount),
        tender_fees: fees === '' ? null : Number(fees),
        extension_dates: extensionDates.map(d => d || '').filter(Boolean),
      }
      const res = await fetch(`${API}/tender/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const msg =
          Array.isArray(err?.detail)
            ? err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
            : typeof err?.detail === 'string'
            ? err.detail
            : `Failed to save (status ${res.status})`
        throw new Error(msg)
      }
      const updated = await res.json()
      setTender(updated)
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this tender?')) return
    const token = localStorage.getItem('kkabbas_token')
    const res = await fetch(`${API}/tender/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      alert(
        (typeof err?.detail === 'string' && err.detail) ||
          `Delete failed (status ${res.status})`
      )
      return
    }
    router.push('/dashboard/tender_master')
  }

  const addExtensionDate = () => setExtensionDates(prev => [...prev, ''])
  const updateExtensionDate = (idx: number, v: string) =>
    setExtensionDates(prev => prev.map((d, i) => (i === idx ? v : d)))
  const removeExtensionDate = (idx: number) =>
    setExtensionDates(prev => prev.filter((_, i) => i !== idx))

  if (loading) return <p>Loading tender…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!tender) return <p>Tender not found.</p>

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Tender #{tender.tender_id}</h1>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Tender No (read-only) */}
          <div>
            <label className="block text-sm font-medium">Tender No</label>
            <input
              className="mt-1 w-full cursor-not-allowed rounded-md border bg-gray-100 px-3 py-2"
              value={tenderNo}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Tender Description</label>
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={3}
              value={tenderDescription}
              onChange={e => setTenderDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Tender Type</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={tenderType}
              onChange={e => setTenderType(e.target.value as TenderType)}
            >
              <option value="public">Public</option>
              <option value="selected">Selected</option>
            </select>
          </div>

          {/* Dates inline */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Tender Invitation Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={tenderDate}
                onChange={e => setTenderDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tender Closing Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={closingDate}
                onChange={e => setClosingDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Costs inline */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Tender Bond Amount (AED)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={bondAmount}
                onChange={e => setBondAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tender Fees (AED)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={fees}
                onChange={e => setFees(e.target.value)}
              />
            </div>
          </div>

          {/* Extension dates only in edit */}
          <div>
            <label className="block text-sm font-medium">Tender Extension Dates</label>
            <div className="space-y-2">
              {extensionDates.map((d, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="date"
                    className="w-full rounded-md border px-3 py-2"
                    value={d}
                    onChange={e => updateExtensionDate(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeExtensionDate(i)}
                    className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    disabled={extensionDates.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addExtensionDate}
                className="rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
              >
                + Add Extension Date
              </button>
            </div>
          </div>

          <div className="mt-6 flex space-x-2">
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>

          {!canSubmit && (
            <p className="text-sm text-red-600">
              Closing date must be after invitation date, and each extension must be after the
              closing date and the previous extension.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
