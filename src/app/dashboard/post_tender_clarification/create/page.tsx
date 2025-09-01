'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
}

interface Payload {
  tc_id: number
  ptc_no: number
  ptc_ref_no: string
  ptc_date: string
  ptc_received_date: string
  ptc_reply_required_by: string
  ptc_reply_submission_date: string | null
}

interface Company {
  company_id: number
  company_name: string
}

interface TenderingCompany {
  tendering_companies_id: number
  tender_id: number
  company_id: number
}

export default function PtcCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [tenders, setTenders] = useState<Tender[]>([])
  const [tcs, setTcs] = useState<TenderingCompany[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // selected
  const [selectedTenderId, setSelectedTenderId] = useState<number | ''>('')
  const [selectedTcId, setSelectedTcId] = useState<number | ''>('') // resolved tc (tenderer) for the PTC

  // fields
  const [ptcNo, setPtcNo] = useState<string>('') // numeric text
  const [ptcRefNo, setPtcRefNo] = useState<string>('')
  const [ptcDate, setPtcDate] = useState<string>('')
  const [ptcReceivedDate, setPtcReceivedDate] = useState<string>('')
  const [ptcReplyRequiredBy, setPtcReplyRequiredBy] = useState<string>('')
  const [ptcReplySubmissionDate, setPtcReplySubmissionDate] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    async function loadAll() {
      try {
        const [tRes, tcRes, cRes] = await Promise.all([
          fetch(`${API}/tender`,                 { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/tendering_companies`,    { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/company_master`,         { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!tRes.ok) throw new Error('Failed to load tenders')
        if (!tcRes.ok) throw new Error('Failed to load tendering companies')
        if (!cRes.ok) throw new Error('Failed to load companies')

        setTenders(await tRes.json())
        setTcs(await tcRes.json())
        setCompanies(await cRes.json())
      } catch (e: unknown) {
        setError((e as Error).message || 'Load failed')
      }
    }
    loadAll()
  }, [API])

  const tenderById = useMemo(() => {
    const m = new Map<number, Tender>()
    for (const t of tenders) m.set(t.tender_id, t)
    return m
  }, [tenders])

  const companyById = useMemo(() => {
    const m = new Map<number, Company>()
    for (const c of companies) m.set(c.company_id, c)
    return m
  }, [companies])

  const tenderersForTender = useMemo(() => {
    if (selectedTenderId === '') return []
    return tcs.filter(x => x.tender_id === Number(selectedTenderId))
  }, [selectedTenderId, tcs])

  // Autofill tenderer & tc id
  useEffect(() => {
    if (tenderersForTender.length === 1) {
      setSelectedTcId(tenderersForTender[0].tendering_companies_id)
    } else {
      setSelectedTcId('') // let user pick if multiple
    }
  }, [tenderersForTender])

  const tendererCompanyName = useMemo(() => {
    if (selectedTcId === '') {
      if (tenderersForTender.length === 1) {
        const only = tenderersForTender[0]
        return companyById.get(only.company_id)?.company_name || ''
      }
      return ''
    }
    const tc = tcs.find(x => x.tendering_companies_id === Number(selectedTcId))
    return tc ? (companyById.get(tc.company_id)?.company_name || '') : ''
  }, [selectedTcId, tenderersForTender, tcs, companyById])

  const tenderDescription = useMemo(() => {
    if (selectedTenderId === '') return ''
    return tenderById.get(Number(selectedTenderId))?.tender_description || ''
  }, [selectedTenderId, tenderById])

  const canSubmit = useMemo(() => {
    return (
      selectedTenderId !== '' &&
      (selectedTcId !== '' || tenderersForTender.length === 1) &&
      ptcNo.trim() !== '' &&
      ptcRefNo.trim() !== '' &&
      ptcDate !== '' &&
      ptcReceivedDate !== '' &&
      ptcReplyRequiredBy !== ''
    )
  }, [
    selectedTenderId, selectedTcId, tenderersForTender.length,
    ptcNo, ptcRefNo, ptcDate, ptcReceivedDate, ptcReplyRequiredBy
  ])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const token = localStorage.getItem('kkabbas_token')
    setSaving(true)
    setError(null)

    // final tc id
    const tcId =
      selectedTcId !== ''
        ? Number(selectedTcId)
        : tenderersForTender.length === 1
        ? tenderersForTender[0].tendering_companies_id
        : null

    if (!tcId) {
      setSaving(false)
      setError('Please select Tenderer.')
      return
    }

    const payload: Payload = {
      tc_id: tcId,
      ptc_no: Number(ptcNo),
      ptc_ref_no: ptcRefNo,
      ptc_date: ptcDate,
      ptc_received_date: ptcReceivedDate,
      ptc_reply_required_by: ptcReplyRequiredBy,
      ptc_reply_submission_date: ptcReplySubmissionDate || null,
    }

    const res = await fetch(`${API}/post_tender_clarification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(typeof err?.detail === 'string' ? err.detail : 'Create failed')
      return
    }

    router.push('/dashboard/post_tender_clarification')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">Create Post Tender Clarification</h1>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      <form onSubmit={submit} className="space-y-4">
        {/* Tender No dropdown */}
        <div>
          <label className="block text-sm font-medium">Tender No</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={selectedTenderId}
            onChange={e => setSelectedTenderId(e.target.value === '' ? '' : Number(e.target.value))}
            required
          >
            <option value="">-- Select Tender --</option>
            {tenders.map(t => (
              <option key={t.tender_id} value={t.tender_id}>{t.tender_no}</option>
            ))}
          </select>
        </div>

        {/* Auto-filled fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Tender Description</label>
            <input
              className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2"
              value={tenderDescription}
              readOnly
            />
          </div>

          {/* Tenderer: if multiple tenderers exist for selected tender, allow choose; else readonly */}
          <div>
            <label className="block text-sm font-medium">Tenderer</label>
            {tenderersForTender.length <= 1 ? (
              <input
                className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2"
                value={tendererCompanyName}
                readOnly
              />
            ) : (
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={selectedTcId}
                onChange={e => setSelectedTcId(e.target.value === '' ? '' : Number(e.target.value))}
                required
              >
                <option value="">-- Select Tenderer --</option>
                {tenderersForTender.map(tc => (
                  <option key={tc.tendering_companies_id} value={tc.tendering_companies_id}>
                    {companyById.get(tc.company_id)?.company_name || `Company #${tc.company_id}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* PTC fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">PTC No</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcNo}
              onChange={e => setPtcNo(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">PTC Ref No</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcRefNo}
              onChange={e => setPtcRefNo(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">PTC Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcDate}
              onChange={e => setPtcDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">PTC Received Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcReceivedDate}
              onChange={e => setPtcReceivedDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reply Required By</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcReplyRequiredBy}
              onChange={e => setPtcReplyRequiredBy(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reply Submission Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcReplySubmissionDate}
              onChange={e => setPtcReplySubmissionDate(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
