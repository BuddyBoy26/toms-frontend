// src/app/dashboard/company_master/[id]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Company {
  company_id: number
  company_name: string
  business_description: string
}

export default function CompanyDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api/api'

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  // Fetch on mount
  useEffect(() => {
    fetch(`${API}/company_master/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then((data: Company) => {
        setCompany(data)
        setName(data.company_name)
        setDesc(data.business_description)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`${API}/company_master/${id}`, {
      method: 'PUT',
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
    // you could refetch or show a toast here
  }

  const handleDelete = async () => {
    if (!confirm('Delete this company?')) return
    await fetch(`${API}/company_master/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
    })
    router.push('/dashboard/company_master')
  }

  if (loading) return <p>Loading company…</p>
  if (!company) return <p>Company not found.</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Company #{company.company_id}</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full px-3 py-2 border rounded-md"
            rows={4}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
