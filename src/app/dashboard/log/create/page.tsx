// src/app/dashboard/log/create/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type ApiLog = {
  title: string
  description: string
  evidence: unknown | null
}

type LogForm = {
  title: string
  description: string
  // keep evidence in the form as a JSON string the user can edit
  evidence: string
}

export default function LogEditPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [form, setForm] = useState<LogForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('kkabbas_token') || ''
    fetch(`${API}/logs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json() as Promise<ApiLog>)
      .then((data) => {
        const evidenceString =
          data && data.evidence != null ? safeStringify(data.evidence) : ''
        setForm({
          title: data?.title ?? '',
          description: data?.description ?? '',
          evidence: evidenceString,
        })
      })
      .catch(() => setError('Failed to load log'))
      .finally(() => setLoading(false))
  }, [API, id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!form) return
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setError(null)
    setSaving(true)

    // safely parse evidence JSON the user typed
    let evidenceParsed: unknown = null
    const trimmed = form.evidence.trim()
    if (trimmed) {
      try {
        evidenceParsed = JSON.parse(trimmed)
      } catch {
        setSaving(false)
        setError('Evidence must be valid JSON')
        return
      }
    }

    const token = localStorage.getItem('kkabbas_token') || ''
    await fetch(`${API}/logs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        evidence: evidenceParsed, // null or parsed object/array/value
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.detail || 'Failed to save log')
        }
      })
      .then(() => router.push('/dashboard/logs'))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to save log')
      })
      .finally(() => setSaving(false))
  }

  if (loading) return <p>Loading log…</p>
  if (error && !form) return <p className="text-red-600">{error}</p>
  if (!form) return <p>Log not found.</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Edit Log #{id}</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Evidence (JSON)</label>
          <textarea
            name="evidence"
            value={form.evidence}
            onChange={handleChange}
            className="mt-1 w-full px-3 py-2 border rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}

/** Safely stringify unknown for display */
function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '' // fallback if circular, etc.
  }
}
