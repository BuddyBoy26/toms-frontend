// src/app/dashboard/discrepancy/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CustomTable, { Column } from '@/components/CustomTable'

interface DiscrepancyRaw {
  discrepancy_id: number
  lot_id: number
  dewa_letter_ref: string
  letter_date: string
  total_discrepant_units: number | null
}

// Extended interface to include mapped relational data
interface DiscrepancyMapped extends DiscrepancyRaw {
  po_number: string
  item_no_dewa: string
  item_lot_no: string
}

export default function DiscrepancyListPage() {
  const router = useRouter()
  const [items, setItems] = useState<DiscrepancyMapped[]>([])
  const [loading, setLoading] = useState(true)
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    const headers = { Authorization: `Bearer ${token}` }

    // Fetch discrepancies along with orders, items, and lots to map the names
    Promise.all([
      fetch(`${API}/discrepancy`, { headers }), // Or /discrepancy depending on your exact FastAPI route
      fetch(`${API}/lot_monitoring`, { headers }),
      fetch(`${API}/order_item_detail`, { headers }),
      fetch(`${API}/order_detail`, { headers })
    ])
      .then(async ([discRes, lotsRes, itemsRes, ordersRes]) => {
        console.log(discRes)
        if (!discRes.ok) throw new Error('Failed to fetch discrepancies')
        
        const discrepancies = await discRes.json()
        const lots = await lotsRes.json()
        const orderItems = await itemsRes.json()
        const orders = await ordersRes.json()

        // Map the IDs to their actual readable values
        const mappedData: DiscrepancyMapped[] = discrepancies.map((d: DiscrepancyRaw) => {
          const lot = lots.find((l: any) => l.lot_id === d.lot_id)
          const orderItem = orderItems.find((i: any) => i.order_item_detail_id === lot?.order_item_detail_id)
          const order = orders.find((o: any) => o.order_id === lot?.order_id)

          return {
            ...d,
            po_number: order?.po_number || 'N/A',
            item_no_dewa: orderItem?.item_no_dewa || 'N/A',
            item_lot_no: lot?.item_lot_no || 'N/A',
          }
        })

        setItems(mappedData)
      })
      .catch((err) => console.error("Error loading data:", err))
      .finally(() => setLoading(false))
  }, [API])

  const columns: Column<DiscrepancyMapped>[] = [
    { key: 'po_number', header: 'PO Number' },
    { key: 'item_no_dewa', header: 'Item No' },
    { key: 'item_lot_no', header: 'Lot No' },
    { key: 'dewa_letter_ref', header: 'DEWA Letter Ref' },
    { key: 'letter_date', header: 'Letter Date' },
    { key: 'total_discrepant_units', header: 'Total Units' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Discrepancies</h1>
        <button
          onClick={() => router.push('/dashboard/discrepancy/create')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-lg  shadow-sm">
          <CustomTable
            data={items}
            columns={columns}
            idField="discrepancy_id"
            linkPrefix="/dashboard/discrepancy" // Ensure this matches your folder structure (discrepancy vs discrepancies)
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
          <p className="text-gray-600">No discrepancies found.</p>
        </div>
      )}
    </div>
  )
}