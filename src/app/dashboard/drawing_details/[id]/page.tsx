'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DrawingEditPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`${API}/drawing_details/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` },
    })
      .then(res => res.json())
      .then(data => setForm(data))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`${API}/drawing_details/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(form),
    })
    setSaving(false)
    router.push('/dashboard/drawing_details')
  }

  if (loading) return <p>Loading drawing…</p>
  if (!form) return <p>Drawing not found.</p>

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Edit Drawing #{id}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: 'drawing_no', label: 'Drawing No', type: 'text' },
          { name: 'drawing_version', label: 'Version', type: 'text' },
          { name: 'submission_date', label: 'Submission Date', type: 'date' },
          { name: 'revision', label: 'Revision', type: 'text' },
          { name: 'approval_date', label: 'Approval Date', type: 'date' },
          { name: 'sent_date', label: 'Sent Date', type: 'date' },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium">{f.label}</label>
            <input
              name={f.name}
              type={f.type}
              value={form[f.name] || ''}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>
        ))}
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
