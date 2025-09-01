'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PTC {
  ptc_id: number
  tc_id: number // tendering_companies_id
  ptc_no: number
  ptc_ref_no: string
  ptc_date: string
  ptc_received_date: string
  ptc_reply_required_by: string
  ptc_reply_submission_date: string | null
}

interface TenderingCompany {
  tendering_companies_id: number
  tender_id: number
  company_id: number
}

interface Tender {
  tender_id: number
  tender_no: string
  tender_description: string
}

interface Company {
  company_id: number
  company_name: string
}

export default function PtcEditPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string } // ptc_id from route
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // header data
  const [ptc, setPtc] = useState<PTC | null>(null)
  // const [tc, setTc] = useState<TenderingCompany | null>(null)
  const [tender, setTender] = useState<Tender | null>(null)
  const [company, setCompany] = useState<Company | null>(null)

  // form state
  const [ptcNo, setPtcNo] = useState<number | ''>('')
  const [ptcRefNo, setPtcRefNo] = useState('')
  const [ptcDate, setPtcDate] = useState('')
  const [ptcReceivedDate, setPtcReceivedDate] = useState('')
  const [ptcReplyRequiredBy, setPtcReplyRequiredBy] = useState('')
  const [ptcReplySubmissionDate, setPtcReplySubmissionDate] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        // Pre-flight guards
        if (!API) {
          throw new Error('ENV NEXT_PUBLIC_BACKEND_API_URL is undefined')
        }
        if (!id) {
          throw new Error('Route param id (ptc_id) is missing')
        }
        if (!token) {
          throw new Error('Auth token missing in localStorage (kkabbas_token)')
        }

        // 1) Load PTC
        const ptcUrl = `${API}/post_tender_clarification/${id}`
        console.log('[PTC] GET', ptcUrl)
        const resPtc = await fetch(ptcUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log('[PTC] status', resPtc.status)
        if (!resPtc.ok) {
          const txt = await resPtc.text().catch(() => '')
          console.error('[PTC] body', txt)
          throw new Error(`Failed to load PTC (${resPtc.status})`)
        }
        const ptcData: PTC = await resPtc.json()
        console.log('[PTC] data', ptcData)
        setPtc(ptcData)

        // init form
        setPtcNo(ptcData.ptc_no ?? '')
        setPtcRefNo(ptcData.ptc_ref_no ?? '')
        setPtcDate(ptcData.ptc_date ?? '')
        setPtcReceivedDate(ptcData.ptc_received_date ?? '')
        setPtcReplyRequiredBy(ptcData.ptc_reply_required_by ?? '')
        setPtcReplySubmissionDate(ptcData.ptc_reply_submission_date ?? '')

        // 2) Only continue if we have a valid tc_id
        if (!ptcData.tc_id) {
          console.warn('[TC] Skipping loads because tc_id is missing/0 on PTC')
          return
        }

        // 3) Load Tendering Company
        const tcUrl = `${API}/tendering_companies/${ptcData.tc_id}`
        console.log('[TC] GET', tcUrl)
        const resTc = await fetch(tcUrl, {
          headers: { Authorization: `Bearer ${token}` },
        })
        console.log('[TC] status', resTc.status)
        if (!resTc.ok) {
          const txt = await resTc.text().catch(() => '')
          console.error('[TC] body', txt)
          throw new Error(`Failed to load Tendering Company (${resTc.status})`)
        }
        const tcData: TenderingCompany = await resTc.json()
        console.log('[TC] data', tcData)
        // setTc(tcData)

        // 4) Load Tender & Company in parallel
        const tenderUrl = `${API}/tender/${tcData.tender_id}`
        const companyUrl = `${API}/company_master/${tcData.company_id}`
        console.log('[Tender] GET', tenderUrl)
        console.log('[Company] GET', companyUrl)

        const [resTender, resCompany] = await Promise.all([
          fetch(tenderUrl, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(companyUrl, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        console.log('[Tender] status', resTender.status)
        console.log('[Company] status', resCompany.status)

        if (!resTender.ok) {
          const txt = await resTender.text().catch(() => '')
          console.error('[Tender] body', txt)
          throw new Error(`Failed to load Tender (${resTender.status})`)
        }
        if (!resCompany.ok) {
          const txt = await resCompany.text().catch(() => '')
          console.error('[Company] body', txt)
          throw new Error(`Failed to load Company (${resCompany.status})`)
        }

        const tenderData: Tender = await resTender.json()
        const companyData: Company = await resCompany.json()
        console.log('[Tender] data', tenderData)
        console.log('[Company] data', companyData)

        setTender(tenderData)
        setCompany(companyData)
      } catch (e: unknown) {
        console.error('[PTC EDIT] error', e)
        setError((e as Error)?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [API, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ptc) return
    const token = localStorage.getItem('kkabbas_token')
    try {
      if (!API) throw new Error('ENV NEXT_PUBLIC_BACKEND_API_URL is undefined')
      if (!token) throw new Error('Auth token missing')

      const payload = {
        ptc_no: ptcNo === '' ? null : Number(ptcNo),
        ptc_ref_no: ptcRefNo || '',
        ptc_date: ptcDate || null,
        ptc_received_date: ptcReceivedDate || null,
        ptc_reply_required_by: ptcReplyRequiredBy || null,
        ptc_reply_submission_date: ptcReplySubmissionDate || null,
      }

      const url = `${API}/post_tender_clarification/${ptc.ptc_id}`
      console.log('[PTC SAVE] PATCH', url, payload)

      setSaving(true)
      setError(null)

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      console.log('[PTC SAVE] status', res.status)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('[PTC SAVE] body', txt)
        throw new Error(typeof txt === 'string' && txt ? txt : `Save failed (${res.status})`)
      }

      const updated = await res.json()
      console.log('[PTC SAVE] data', updated)
      setPtc(updated)
    } catch (e: unknown) {
      console.error('[PTC SAVE] error', e)
      setError((e as Error)?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!ptc) return <p>Clarification not found.</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Post Tender Clarification #{ptc.ptc_id}</h1>

      {/* Header (read-only) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Tender No</label>
          <div className="mt-1 rounded-md border bg-gray-50 px-3 py-2">{tender?.tender_no || '-'}</div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Tender Description</label>
          <div className="mt-1 rounded-md border bg-gray-50 px-3 py-2">{tender?.tender_description || '-'}</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Tenderer</label>
          <div className="mt-1 rounded-md border bg-gray-50 px-3 py-2">{company?.company_name || '-'}</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4 rounded-md border p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">PTC No</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcNo}
              onChange={e => setPtcNo(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">PTC Ref No</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcRefNo}
              onChange={e => setPtcRefNo(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium">PTC Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcDate || ''}
              onChange={e => setPtcDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">PTC Received Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcReceivedDate || ''}
              onChange={e => setPtcReceivedDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reply Required By</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcReplyRequiredBy || ''}
              onChange={e => setPtcReplyRequiredBy(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Reply Submission Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={ptcReplySubmissionDate || ''}
              onChange={e => setPtcReplySubmissionDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/post_tender_clarification')}
            className="rounded-md border px-4 py-2"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  )
}
