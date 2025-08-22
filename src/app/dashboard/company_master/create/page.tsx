// src/app/dashboard/company_master/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CompanyCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await fetch(`${API}/company_master`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify({
        company_name: name,
        business_description: desc,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create company')
    } else {
      // on success, go back to list
      router.push('/dashboard/company_master')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Create Company</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
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
