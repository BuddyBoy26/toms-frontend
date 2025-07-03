// src/app/dashboard/order_detail/create/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Company { company_id: number; company_name: string }
interface Tender  { tender_id: number; tender_no: string }

export default function CreateOrderPage() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

  const [poNumber, setPoNumber] = useState('')
  const [description, setDescription] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState('AED')
  const [companyName, setCompanyName] = useState('')
  const [tenderNo, setTenderNo] = useState('')

  const [companies, setCompanies] = useState<Company[]>([])
  const [tenders, setTenders] = useState<Tender[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/company_master`, { headers:{ Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` }}).then(r=>r.json()),
      fetch(`${API}/tender`,         { headers:{ Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}` }}).then(r=>r.json()),
    ]).then(([comps, tnds]: [Company[],Tender[]])=>{
      setCompanies(comps)
      setTenders(tnds)
    }).catch(()=>setError('Failed to load dropdowns'))
  },[API])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const comp = companies.find(c=>c.company_name===companyName)
    const tnd  = tenders .find(t=>t.tender_no     ===tenderNo)
    if(!comp||!tnd){
      setError('Select valid company and tender')
      setSaving(false)
      return
    }
    const payload = {
      company_id: comp.company_id,
      tender_id:  tnd.tender_id,
      po_number:   poNumber,
      order_description: description,
      order_date:  orderDate,
      order_value: parseFloat(value),
      currency,
      order_value_aed: parseFloat(value) * (currency==='AED'?1:1), // adjust rate logic as needed
    }
    const res = await fetch(`${API}/order_detail`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${localStorage.getItem('kkabbas_token')}`
      },
      body:JSON.stringify(payload)
    })
    setSaving(false)
    if(!res.ok){
      const err=await res.json().catch(()=>null)
      setError(err?.detail||'Failed to create order')
    } else {
      router.push('/dashboard/order_detail')
    }
  }

  return (
    <div className="max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Create Order</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div>
          <label htmlFor="poNumber" className="block text-sm font-medium">PO Number</label>
          <input id="poNumber" type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={poNumber} onChange={e=>setPoNumber(e.target.value)} required/>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <input id="description" type="text"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={description} onChange={e=>setDescription(e.target.value)} required/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="orderDate" className="block text-sm font-medium">Order Date</label>
            <input id="orderDate" type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={orderDate} onChange={e=>setOrderDate(e.target.value)} required/>
          </div>
          <div>
            <label htmlFor="value" className="block text-sm font-medium">Order Value</label>
            <input id="value" type="number" step="0.01"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={value} onChange={e=>setValue(e.target.value)} required/>
          </div>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium">Currency</label>
          <select id="currency"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={currency} onChange={e=>setCurrency(e.target.value)}>
            <option>AED</option><option>EUR</option><option>USD</option>
          </select>
        </div>

        <div>
          <label htmlFor="companySelect" className="block text-sm font-medium">Company</label>
          <input id="companySelect" list="companies"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={companyName} onChange={e=>setCompanyName(e.target.value)} required/>
          <datalist id="companies">
            {companies.map(c=><option key={c.company_id} value={c.company_name}/>)}
          </datalist>
        </div>

        <div>
          <label htmlFor="tenderSelect" className="block text-sm font-medium">Tender</label>
          <input id="tenderSelect" list="tenders"
            className="mt-1 w-full px-3 py-2 border rounded-md"
            value={tenderNo} onChange={e=>setTenderNo(e.target.value)} required/>
          <datalist id="tenders">
            {tenders.map(t=><option key={t.tender_id} value={t.tender_no}/>)}
          </datalist>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {saving?'Creating…':'Create'}
        </button>
      </form>
    </div>
  )
}
