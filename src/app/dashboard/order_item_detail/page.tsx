// src/app/dashboard/order_item_detail/page.tsx
'use client'

import { useEffect, useState } from 'react'
import CustomTable, { Column } from '@/components/CustomTable'
import Loader from '@/components/Loader'

interface OrderItem {
  order_item_detail_id: number
  order_id: number
  item_id: number
  item_no_dewa: string
  item_quantity: number
  item_unit_price: number
  currency: 'AED' | 'EUR' | 'USD'
  number_of_lots: number
  item_description?: string | null

  po_number?: string | null
  item_master_description?: string | null
  product_name?: string | null
}

// Display type for the table
interface OrderItemDisplay extends Omit<OrderItem, 'item_quantity' | 'item_unit_price'> {
  item_quantity: string
  item_unit_price: string
}

interface OrderDetail {
  order_id: number
  po_number: string
}

interface ItemMaster {
  item_id: number
  item_description: string
  product_id: number
}

interface ProductMaster {
  product_id: number
  product_name: string
}

// Utility functions for number formatting
const formatNumber = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return ''
  
  const numStr = String(value).replace(/[^\d.]/g, '')
  if (!numStr) return ''
  
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`
  }
  
  return formattedInteger
}

const parseFormattedNumber = (value: string): number | null => {
  if (!value) return null
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

const renderAmount = (value: number | null): string => {
  if (value === null || value === undefined) return ''
  return formatNumber(value)
}

export default function OrderItemListPage() {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL
  const [items, setItems] = useState<OrderItem[]>([])
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    order_id: '' as number | '',
    item_id: '' as number | '',
    item_description: '',
    item_no_dewa: '',
    item_quantity: '',
    item_unit_price: '',
    currency: 'AED' as 'AED' | 'EUR' | 'USD',
    number_of_lots: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    const token = localStorage.getItem('kkabbas_token') || ''
    setLoading(true)

    Promise.all([
      fetch(`${API}/order_item_detail`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/order_detail`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/item_master`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/product_master`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([itemRows, orderRows, itemRowsMaster, productRows]) => {
        const ordersData: OrderDetail[] = Array.isArray(orderRows) ? orderRows : []
        const itemsMasterData: ItemMaster[] = Array.isArray(itemRowsMaster) ? itemRowsMaster : []
        const products: ProductMaster[] = Array.isArray(productRows) ? productRows : []

        setOrders(ordersData)
        setItemsMaster(itemsMasterData)

        const orderMap = new Map<number, string>()
        ordersData.forEach(o => orderMap.set(o.order_id, o.po_number))

        const itemMap = new Map<number, ItemMaster>()
        itemsMasterData.forEach(i => itemMap.set(i.item_id, i))

        const productMap = new Map<number, string>()
        products.forEach(p => productMap.set(p.product_id, p.product_name))

        const finalList: OrderItem[] = Array.isArray(itemRows)
          ? itemRows.map((it: any) => {
              const itemMeta = itemMap.get(it.item_id)
              const productName =
                itemMeta && productMap.has(itemMeta.product_id)
                  ? productMap.get(itemMeta.product_id)
                  : null

              return {
                ...it,
                po_number: orderMap.get(it.order_id) ?? null,
                item_master_description: itemMeta?.item_description ?? null,
                product_name: productName,
              }
            })
          : []

        setItems(finalList)
      })
      .catch(() => setError('Failed to load order items'))
      .finally(() => setLoading(false))
  }

  const handleRowClick = (orderItem: OrderItem) => {
    setSelectedOrderItem(orderItem)
    setFormData({
      order_id: orderItem.order_id,
      item_id: orderItem.item_id,
      item_description: orderItem.item_description || '',
      item_no_dewa: orderItem.item_no_dewa,
      item_quantity: orderItem.item_quantity.toString(),
      item_unit_price: formatNumber(orderItem.item_unit_price),
      currency: orderItem.currency,
      number_of_lots: orderItem.number_of_lots.toString(),
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleCreate = () => {
    setSelectedOrderItem(null)
    setFormData({
      order_id: '',
      item_id: '',
      item_description: '',
      item_no_dewa: '',
      item_quantity: '',
      item_unit_price: '',
      currency: 'AED',
      number_of_lots: '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedOrderItem(null)
    setFormData({
      order_id: '',
      item_id: '',
      item_description: '',
      item_no_dewa: '',
      item_quantity: '',
      item_unit_price: '',
      currency: 'AED',
      number_of_lots: '',
    })
    setError(null)
  }

  const handleAmountChange = (value: string) => {
    const formatted = formatNumber(value)
    setFormData({ ...formData, item_unit_price: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.order_id || !formData.item_id) {
      setError('Please select valid order and item')
      return
    }

    setIsSaving(true)

    const payload = {
      order_id: Number(formData.order_id),
      item_id: Number(formData.item_id),
      item_description: formData.item_description.trim() || null,
      item_no_dewa: formData.item_no_dewa.trim(),
      item_quantity: Number(formData.item_quantity),
      item_unit_price: parseFormattedNumber(formData.item_unit_price),
      currency: formData.currency,
      number_of_lots: Number(formData.number_of_lots),
    }

    try {
      const url = selectedOrderItem
        ? `${API}/order_item_detail/${selectedOrderItem.order_item_detail_id}`
        : `${API}/order_item_detail`
      
      const method = selectedOrderItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kkabbas_token')}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Refetch data to get updated relationships
        fetchData()
        handleClose()
      } else {
        const err = await response.json().catch(() => null)
        setError(err?.detail || 'Failed to save order item')
      }
    } catch (error) {
      console.error('Error saving order item:', error)
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const columns: Column<OrderItemDisplay>[] = [
    { key: 'po_number', header: 'PO Number' },
    { key: 'item_master_description', header: 'Item Description' },
    { key: 'product_name', header: 'Product Name' },
    { key: 'item_no_dewa', header: 'DEWA Item No.' },
    { key: 'item_quantity', header: 'Qty' },
    { key: 'item_unit_price', header: 'Unit Price' },
    { key: 'currency', header: 'Currency' },
    { key: 'number_of_lots', header: 'Lots' },
  ]

  // Format display data
  const formattedItems: OrderItemDisplay[] = items.map(item => ({
    ...item,
    item_quantity: item.item_quantity.toString(),
    item_unit_price: renderAmount(item.item_unit_price),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Item Details</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Create
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : error && !isModalOpen ? (
        <p className="text-red-600">{error}</p>
      ) : items.length > 0 ? (
        <CustomTable
          data={formattedItems}
          columns={columns}
          idField="order_item_detail_id"
          onRowClick={(formattedItem) => {
            const originalItem = items.find(i => i.order_item_detail_id === formattedItem.order_item_detail_id)
            if (originalItem) handleRowClick(originalItem)
          }}
        />
      ) : (
        <p className="text-gray-600">No order items found.</p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedOrderItem ? 'Edit Order Item' : 'Create Order Item'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order (PO Number)
                    </label>
                    <select
                      value={formData.order_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order_id: e.target.value === '' ? '' : Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">-- Select Order --</option>
                      {orders.map(o => (
                        <option key={o.order_id} value={o.order_id}>
                          {o.po_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item
                    </label>
                    <select
                      value={formData.item_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          item_id: e.target.value === '' ? '' : Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {itemsMaster.map(i => (
                        <option key={i.item_id} value={i.item_id}>
                          {i.item_description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.item_description}
                    onChange={(e) =>
                      setFormData({ ...formData, item_description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item No (DEWA)
                    </label>
                    <input
                      type="text"
                      value={formData.item_no_dewa}
                      onChange={(e) =>
                        setFormData({ ...formData, item_no_dewa: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.item_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, item_quantity: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="text"
                      value={formData.item_unit_price}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value as 'AED' | 'EUR' | 'USD' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="AED">AED</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Lots
                    </label>
                    <input
                      type="number"
                      value={formData.number_of_lots}
                      onChange={(e) =>
                        setFormData({ ...formData, number_of_lots: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}