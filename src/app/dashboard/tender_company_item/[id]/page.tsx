// src/app/dashboard/tendering_discounts/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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
  products?: { product_id: number; product_name: string }[]
}

interface Product {
  product_id: number
  product_name: string
}

interface ItemMasterRow {
  item_id: number
  item_no: string
  item_description: string
  product_id: number
}

interface LineItem {
  id: number
  tendering_companies_id: number
  item_id: number
  item_no_dewa: string
  item_price: number
  discount_percent: number
}

interface CatalogItem {
  item_id: number
  item_no: string
  description: string
  product_id: number
  product_name: string
}

type DisplayLine = LineItem & {
  item_description: string
  discount_amount: number
  net_amount: number
}

export default function DiscountInterfacePage() {
  const { id } = useParams() as { id: string }
  const tcId = Number(id)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const ITEMS_BASE = `${API}/tender_company_item`
  const ITEM_MASTER = `${API}/item_master`
  const PRODUCT_MASTER = `${API}/product_master`

  const [tc, setTc] = useState<TenderingCompany | null>(null)
  const [tender, setTender] = useState<Tender | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [productList, setProductList] = useState<Product[]>([])
  const [itemMaster, setItemMaster] = useState<ItemMasterRow[]>([])
  const [lines, setLines] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('') // dropdown = item_id
  const [itemNoDewa, setItemNoDewa] = useState<string>('')
  const [itemPrice, setItemPrice] = useState<string>('') // numeric string
  const [discountPercent, setDiscountPercent] = useState<string>('') // numeric string

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')

    async function loadHeader() {
      const resTc = await fetch(`${API}/tendering_companies/${tcId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!resTc.ok) throw new Error(`Failed to load tendering company (${resTc.status})`)
      const tcData: TenderingCompany = await resTc.json()
      setTc(tcData)

      const [resTender, resCompany] = await Promise.all([
        fetch(`${API}/tender/${tcData.tender_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/company_master/${tcData.company_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (!resTender.ok) throw new Error(`Failed to load tender (${resTender.status})`)
      if (!resCompany.ok) throw new Error(`Failed to load company (${resCompany.status})`)

      setTender((await resTender.json()) as Tender)
      setCompany((await resCompany.json()) as Company)
    }

    async function loadLines() {
      const res = await fetch(`${ITEMS_BASE}?tc_id=${tcId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Failed to load items (${res.status})`)
      const data: unknown = await res.json()
      setLines(Array.isArray(data) ? (data as LineItem[]) : [])
    }

    async function loadCatalogSources() {
      const [prodRes, itemRes] = await Promise.all([
        fetch(PRODUCT_MASTER, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(ITEM_MASTER, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (prodRes.ok) setProductList((await prodRes.json()) as Product[])
      if (itemRes.ok) setItemMaster((await itemRes.json()) as ItemMasterRow[])
    }

    async function run() {
      try {
        await Promise.all([loadHeader(), loadLines(), loadCatalogSources()])
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to load'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [API, ITEMS_BASE, ITEM_MASTER, PRODUCT_MASTER, tcId])

  const productNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const p of productList) m.set(p.product_id, p.product_name)
    return m
  }, [productList])

  const companyProductIds = useMemo(() => {
    if (!company || !Array.isArray(company.products)) return null
    return new Set<number>(company.products.map(p => p.product_id))
  }, [company])

  const catalog: CatalogItem[] = useMemo(() => {
    let list = itemMaster
    if (companyProductIds && companyProductIds.size > 0) {
      list = list.filter(im => companyProductIds.has(im.product_id))
    }
    return list.map(im => ({
      item_id: im.item_id,
      item_no: im.item_no,
      description: im.item_description,
      product_id: im.product_id,
      product_name: productNameById.get(im.product_id) ?? '',
    }))
  }, [itemMaster, companyProductIds, productNameById])

  const displayedLines: DisplayLine[] = useMemo(() => {
    return lines.map(line => {
      const found = catalog.find(c => c.item_id === line.item_id)
      const price = Number(line.item_price) || 0
      const pct = Number(line.discount_percent) || 0
      const discountAmt = price * pct * 0.01
      const net = price - discountAmt
      return {
        ...line,
        item_description: found?.description ?? '',
        discount_amount: Number.isFinite(discountAmt) ? discountAmt : 0,
        net_amount: Number.isFinite(net) ? net : 0,
      }
    })
  }, [lines, catalog])

  const format2 = (n: number) => n.toFixed(2)

  const {
    overallDiscountPercent,
    totalDiscountAmount,
    totalAfterDiscount,
    totalValue,
  } = useMemo(() => {
    const tv = displayedLines.reduce((sum, l) => sum + (Number(l.item_price) || 0), 0)
    const td = displayedLines.reduce((sum, l) => sum + (Number(l.discount_amount) || 0), 0)
    const ta = tv - td
    const pct = tv > 0 ? (td / tv) * 100 : 0
    return {
      totalValue: format2(tv),
      totalDiscountAmount: format2(td),
      totalAfterDiscount: format2(ta),
      overallDiscountPercent: format2(pct),
    }
  }, [displayedLines])

  const resetForm = () => {
    setEditingId(null)
    setSelectedItemId('')
    setItemNoDewa('')
    setItemPrice('')
    setDiscountPercent('')
  }

  const selectRow = (row: LineItem) => {
    setEditingId(row.id)
    setSelectedItemId(row.item_id)
    setItemNoDewa(row.item_no_dewa ?? '')
    setItemPrice(row.item_price != null ? String(row.item_price) : '')
    setDiscountPercent(row.discount_percent != null ? String(row.discount_percent) : '')
  }

  const refreshLines = async () => {
    const token = localStorage.getItem('kkabbas_token')
    const res = await fetch(`${ITEMS_BASE}?tc_id=${tcId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data: unknown = await res.json()
      setLines(Array.isArray(data) ? (data as LineItem[]) : [])
    }
  }

  const onSelectItem = (val: string) => {
    const idVal: number | '' = val === '' ? '' : Number(val)
    setSelectedItemId(idVal)
    if (val !== '') {
      const chosen = catalog.find(c => c.item_id === Number(val))
      if (chosen) {
        setItemNoDewa(prev => (prev.trim() === '' ? chosen.description : prev))
      }
    } else {
      setItemNoDewa('')
    }
  }

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('kkabbas_token')

    const chosen = catalog.find(c => c.item_id === Number(selectedItemId))
    if (!chosen) {
      alert('Please select an item description.')
      return
    }

    if (itemNoDewa.trim() === '') {
      alert('Please enter Item Description (DEWA).')
      return
    }

    const payload = {
      tendering_companies_id: tcId,
      item_id: chosen.item_id,
      item_no_dewa: itemNoDewa,
      item_price: itemPrice === '' ? null : Number(itemPrice),
      discount_percent: discountPercent === '' ? null : Number(discountPercent),
    }

    const url = editingId ? `${ITEMS_BASE}/${editingId}` : `${ITEMS_BASE}`
    const method: 'PATCH' | 'POST' = editingId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err: unknown = await res.json().catch(() => null)
      const msg =
        typeof err === 'object' && err !== null && 'detail' in err && typeof (err as { detail?: unknown }).detail === 'string'
          ? (err as { detail: string }).detail
          : `Save failed (${res.status})`
      alert(msg)
      return
    }

    await refreshLines()
    resetForm()
  }

  const deleteRow = async (row: LineItem) => {
    if (!confirm('Delete this line?')) return
    const token = localStorage.getItem('kkabbas_token')
    const res = await fetch(`${ITEMS_BASE}/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const err: unknown = await res.json().catch(() => null)
      const msg =
        typeof err === 'object' && err !== null && 'detail' in err && typeof (err as { detail?: unknown }).detail === 'string'
          ? (err as { detail: string }).detail
          : `Delete failed (${res.status})`
      alert(msg)
      return
    }
    await refreshLines()
    if (editingId === row.id) resetForm()
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!tc || !tender || !company) return <p>Record not found.</p>

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-bold">Tendered Items and Discounts</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Tender No</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{tender.tender_no}</div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Tender Description : SUPPLY OF</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{tender.tender_description}</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Tenderer</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{company.company_name}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium">Total Amount (Before Discount)</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{totalValue}</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Total Discount Amount</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{totalDiscountAmount}</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Total Amount After Discount</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{totalAfterDiscount}</div>
        </div>
        <div>
          <label className="block text-sm font-medium">Overall Discount %</label>
          <div className="mt-1 rounded-md border px-3 py-2 bg-gray-50">{overallDiscountPercent}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <form className="space-y-3 rounded-md border p-4" onSubmit={submitForm}>
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Line' : 'Add Line'}</h2>

            <div>
              <label className="block text-sm font-medium">Item Description</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={selectedItemId}
                onChange={e => onSelectItem(e.target.value)}
                required
              >
                <option value="">-- Select Description --</option>
                {catalog.map(ci => (
                  <option key={ci.item_id} value={ci.item_id}>
                    {ci.description} {ci.product_name ? `· (${ci.product_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Item Description (DEWA)</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={itemNoDewa}
                onChange={e => setItemNoDewa(e.target.value)}
                placeholder="Enter DEWA line text / description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Item Price</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={itemPrice}
                onChange={e => setItemPrice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Discount %</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                {editingId ? 'Save' : 'Add'}
              </button>
              {editingId && (
                <button type="button" className="rounded-md border px-4 py-2" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Item Description</th>
                  <th className="px-3 py-2 text-left">Item Description (DEWA)</th>
                  <th className="px-3 py-2 text-left">Item Price</th>
                  <th className="px-3 py-2 text-left">Discount %</th>
                  <th className="px-3 py-2 text-left">Discount Amount</th>
                  <th className="px-3 py-2 text-left">Net Amount</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {displayedLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-3 text-gray-500">No items yet.</td>
                  </tr>
                ) : (
                  displayedLines.map(row => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">{row.item_description}</td>
                      <td className="px-3 py-2">{row.item_no_dewa}</td>
                      <td className="px-3 py-2">{row.item_price}</td>
                      <td className="px-3 py-2">{row.discount_percent}</td>
                      <td className="px-3 py-2">{format2(row.discount_amount)}</td>
                      <td className="px-3 py-2">{format2(row.net_amount)}</td>
                      <td className="px-3 py-2 space-x-2 text-right">
                        <button className="rounded-md border px-2 py-1" onClick={() => selectRow(row)}>Edit</button>
                        <button className="rounded-md bg-red-600 px-2 py-1 text-white" onClick={() => deleteRow(row)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
