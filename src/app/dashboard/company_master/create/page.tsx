// src/app/dashboard/company_master/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { allCountries } from 'country-telephone-data'

type ErrorDetail = { msg?: string; [key: string]: unknown }

export type Country = {
  iso2: string
  name: string
  dialCode: string
}

export default function CompanyCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [country, setCountry] = useState('in') // default: India (iso2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      company_name: name,
      business_description: desc,
      country: country, // send iso2 code
    }

    const res = await fetch(`${API}/company_master`, {
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
      if (Array.isArray(err?.detail)) {
        const msg = err.detail.map((d: ErrorDetail) => d.msg || JSON.stringify(d)).join(', ')
        setError(msg)
      } else if (typeof err?.detail === 'string') {
        setError(err.detail)
      } else {
        setError('Failed to create company')
      }
    } else {
      router.push('/dashboard/company_master')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Create Company</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full px-3 py-2 border rounded-md"
            rows={4}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            required
          />
        </div>

        {/* Country Dropdown */}
        <div>
          <label className="block text-sm font-medium">Country</label>
          <select
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={country}
            onChange={e => setCountry(e.target.value)}
            required
          >
            {allCountries.map((c: Country) => (
              <option key={c.iso2} value={c.iso2}>
                {c.name.split(' ')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </form>
    </div>
  )
}
