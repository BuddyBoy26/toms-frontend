'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DrawingCreatePage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [form, setForm] = useState({
    tender_no: '',
    order_id: '',
    drawing_no: '',
    drawing_version: '',
    submission_date: '',
    revision: '',
    approval_date: '',
    sent_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await fetch(`${API}/drawing_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
      },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      setError(err?.detail || 'Failed to create drawing detail')
    } else {
      router.push('/dashboard/drawing_details')
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-4">Create Drawing Detail</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600">{error}</p>}

        {[
          { name: 'tender_no', label: 'Tender No', type: 'text', required: true },
          { name: 'order_id', label: 'Order ID', type: 'text', required: true },
          { name: 'drawing_no', label: 'Drawing No', type: 'text' },
          { name: 'drawing_version', label: 'Version', type: 'text' },
          { name: 'submission_date', label: 'Submission Date', type: 'date' },
          { name: 'revision', label: 'Revision', type: 'text' },
          { name: 'approval_date', label: 'Approval Date', type: 'date' },
          { name: 'sent_date', label: 'Sent Date', type: 'date' },
        ].map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              name={field.name}
              type={field.type}
              value={(form as any)[field.name]}
              onChange={handleChange}
              required={!!field.required}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>
        ))}

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
