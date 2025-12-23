// src/components/TenderCompanyItemsTable.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'

type DiscountType = 'amount' | 'percent'
type CurrencyEnum = 'AED' | 'EUR' | 'USD'

interface Item {
  item_id: number
  item_description: string
  product_id: number
}

interface TenderCompanyItem {
  id?: number
  item_id: number | ''
  item_description?: string
  item_no_dewa: string
  item_price: string
  item_quantity: string
  item_total_value: string
  currency: CurrencyEnum
  discount_type: DiscountType
  discount_percent: string
  discount_amount: string
  discount_value: string
  discount_per_unit: string
  value_after_discount: string
  unit_after_discount?: string
}

interface Props {
  tenderingCompanyId: number
  productId: number | null
  tenderCurrency: CurrencyEnum
  onItemsChange?: (items: TenderCompanyItem[]) => void
}

// Utility functions for number formatting - FIXED to handle decimals properly during typing
const formatNumber = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return ''
  
  const strValue = String(value)
  
  // If the user just typed a decimal point, keep it
  if (strValue.endsWith('.')) {
    const numPart = strValue.slice(0, -1).replace(/[^\d]/g, '')
    if (!numPart) return '0.'
    const formatted = numPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return formatted + '.'
  }
  
  // Remove everything except digits and decimal point
  const numStr = strValue.replace(/[^\d.]/g, '')
  if (!numStr) return ''
  
  // Split by decimal point
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  
  // Format integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // If there's a decimal part, include it (limit to 4 decimal places for precision)
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 4)}`
  }
  
  return formattedInteger
}

const parseFormattedNumber = (value: string): number => {
  if (!value) return 0
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export default function TenderCompanyItemsTable({ 
  tenderingCompanyId, 
  productId, 
  tenderCurrency,
  onItemsChange 
}: Props) {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [items, setItems] = useState<TenderCompanyItem[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter items by product
  const filteredItems = useMemo(() => {
    if (!productId) return []
    return allItems.filter(item => item.product_id === productId)
  }, [allItems, productId])

  // Fetch all items
  useEffect(() => {
    const token = localStorage.getItem('kkabbas_token')
    fetch(`${API}/item_master`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: Item[]) => {
        setAllItems(Array.isArray(data) ? data : [])
      })
      .catch(err => console.error('Failed to load items:', err))
  }, [API])

  // Fetch existing tender company items
  const fetchTenderCompanyItems = () => {
    if (!tenderingCompanyId) return

    setLoading(true)
    const token = localStorage.getItem('kkabbas_token')
    fetch(`${API}/tender_company_items?tendering_companies_id=${tenderingCompanyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: any[]) => {
        const formattedItems = data
          .map(item => {
            const quantity = item.item_quantity || 1
            const discountType: DiscountType = item.discount_amount ? 'amount' : 'percent'
            
            // Calculate discount per unit
            const totalDiscountValue = item.discount_value || 0
            const discountPerUnit = quantity > 0 ? totalDiscountValue / quantity : 0
            
            return {
              id: item.id,
              item_id: item.item_id,
              item_description: item.item?.item_description || '',
              item_no_dewa: item.item_no_dewa,
              item_price: formatNumber(item.item_price),
              item_quantity: formatNumber(item.item_quantity),
              item_total_value: formatNumber(item.item_total_value),
              currency: item.currency,
              discount_type: discountType,
              discount_percent: item.discount_percent ? formatNumber(item.discount_percent) : '',
              discount_amount: item.discount_amount ? formatNumber(item.discount_amount) : '',
              discount_value: item.discount_value ? formatNumber(item.discount_value) : '',
              discount_per_unit: formatNumber(discountPerUnit),
              value_after_discount: formatNumber(
                parseFormattedNumber(String(item.item_total_value)) - (item.discount_value || 0)
              ),
            }
          })
          // Sort by DEWA item number
          .sort((a, b) => {
            const numA = parseInt(a.item_no_dewa) || 0
            const numB = parseInt(b.item_no_dewa) || 0
            return numA - numB
          })
        
        setItems(formattedItems)
      })
      .catch(err => {
        console.error('Failed to load tender company items:', err)
        setError('Failed to load items')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTenderCompanyItems()
  }, [tenderingCompanyId, API])

  // Calculate all discount-related values
  const calculateDiscounts = (item: TenderCompanyItem) => {
    const quantity = parseFormattedNumber(item.item_quantity) || 1
    const price = parseFormattedNumber(item.item_price)
    const totalValue = price * quantity

    let discountPerUnit = 0
    let discountValue = 0
    let discountPercent = parseFormattedNumber(item.discount_percent)
    let discountAmount = parseFormattedNumber(item.discount_amount)

    if (item.discount_type === 'percent') {
      // User enters percentage
      // Calculate discount per unit = (price * percent) / 100
      discountPerUnit = (price * discountPercent) / 100
      // Calculate total discount = discountPerUnit * quantity
      discountValue = discountPerUnit * quantity
      // Calculate discount amount per unit (same as discountPerUnit in this case)
      discountAmount = discountPerUnit
    } else {
      // User enters amount per unit
      // Discount per unit is the entered amount
      discountPerUnit = discountAmount
      // Calculate total discount = discountPerUnit * quantity
      discountValue = discountPerUnit * quantity
      // Calculate percentage = (discountPerUnit / price) * 100
      discountPercent = price > 0 ? (discountPerUnit / price) * 100 : 0
    }

    const valueAfterDiscount = totalValue - discountValue

    return {
      discountPerUnit: formatNumber(discountPerUnit.toFixed(2)),
      discountValue: formatNumber(discountValue.toFixed(2)),
      discountPercent: formatNumber(discountPercent.toFixed(2)),
      discountAmount: formatNumber(discountAmount.toFixed(2)),
      valueAfterDiscount: formatNumber(valueAfterDiscount.toFixed(2)),
      itemTotalValue: formatNumber(totalValue.toFixed(2)),
    }
  }

  // Calculate totals
  const totals = useMemo(() => {
    const totalItemValue = items.reduce((sum, item) => 
      sum + parseFormattedNumber(item.item_total_value), 0
    )

    const totalDiscounted = items.reduce((sum, item) => {
      return sum + parseFormattedNumber(item.discount_value)
    }, 0)

    const finalValue = totalItemValue - totalDiscounted

    return {
      totalItemValue: formatNumber(totalItemValue.toFixed(2)),
      totalDiscounted: formatNumber(totalDiscounted.toFixed(2)),
      finalValue: formatNumber(finalValue.toFixed(2)),
    }
  }, [items])

  const addNewRow = () => {
    const newItem: TenderCompanyItem = {
      item_id: '',
      item_no_dewa: '',
      item_price: '',
      item_quantity: '',
      item_total_value: '',
      currency: tenderCurrency, // Use currency from tender
      discount_type: 'percent',
      discount_percent: '',
      discount_amount: '',
      discount_value: '',
      discount_per_unit: '',
      value_after_discount: '0',
    }
    setItems([...items, newItem])
  }

  const removeRow = async (index: number) => {
    const item = items[index]
    
    if (item.id) {
      try {
        const token = localStorage.getItem('kkabbas_token')
        const response = await fetch(`${API}/tender_company_items/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete item')
        }
      } catch (err) {
        setError('Failed to delete item')
        return
      }
    }
    
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof TenderCompanyItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate all values
    const calculated = calculateDiscounts(updatedItems[index])
    updatedItems[index] = {
      ...updatedItems[index],
      item_total_value: calculated.itemTotalValue,
      discount_per_unit: calculated.discountPerUnit,
      discount_value: calculated.discountValue,
      discount_percent: calculated.discountPercent,
      discount_amount: calculated.discountAmount,
      value_after_discount: calculated.valueAfterDiscount,
    }

    setItems(updatedItems)
    if (onItemsChange) onItemsChange(updatedItems)
  }

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = filteredItems.find(i => i.item_id === Number(itemId))
    if (selectedItem) {
      const updatedItems = [...items]
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: Number(itemId),
        item_description: selectedItem.item_description
      }
      setItems(updatedItems)
    }
  }

  const saveItems = async () => {
    if (saving) return
    
    setError(null)
    setSaving(true)
    const token = localStorage.getItem('kkabbas_token')

    try {
      for (const item of items) {
        if (!item.item_id || !item.item_no_dewa) {
          setError('Please fill all required fields')
          setSaving(false)
          return
        }

        const payload = {
          tendering_companies_id: tenderingCompanyId,
          item_id: Number(item.item_id),
          item_no_dewa: item.item_no_dewa,
          item_price: parseFormattedNumber(item.item_price),
          item_quantity: parseFormattedNumber(item.item_quantity),
          item_total_value: parseFormattedNumber(item.item_total_value),
          currency: item.currency,
          discount_percent: parseFormattedNumber(item.discount_percent),
          discount_amount: parseFormattedNumber(item.discount_amount),
          discount_value: parseFormattedNumber(item.discount_value),
        }

        const url = `${API}/tender_company_items`
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || 'Failed to save item')
        }
      }

      await fetchTenderCompanyItems()
      setError(null)
      alert('Items saved successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save items')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading items...</div>
  }

  if (!productId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        Please select a tender first to add items.
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        No items available for this product. Please add items to the product in Item Master first.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tender Items</h3>
        <button
          type="button"
          onClick={addNewRow}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Add Item
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-600">No items added yet. Click "Add Item" to get started.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No (DEWA)</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Unit</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curr</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc/Unit</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc/Unit Calc</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Disc</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">After Disc</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {/* Item Dropdown */}
                  <td className="px-3 py-2">
                    <select
                      value={item.item_id}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {filteredItems.map(i => (
                        <option key={i.item_id} value={i.item_id}>
                          {i.item_description}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Item No DEWA */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_no_dewa}
                      onChange={(e) => updateItem(index, 'item_no_dewa', e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_price}
                      onChange={(e) => updateItem(index, 'item_price', formatNumber(e.target.value))}
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_quantity}
                      onChange={(e) => updateItem(index, 'item_quantity', formatNumber(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </td>

                  {/* Total Value (Read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_total_value}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                    />
                  </td>

                  {/* Currency (Read-only - from tender) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.currency}
                      readOnly
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-center font-medium"
                    />
                  </td>

                  {/* Discount Type */}
                  <td className="px-3 py-2">
                    <select
                      value={item.discount_type}
                      onChange={(e) => updateItem(index, 'discount_type', e.target.value)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="percent">Percent</option>
                      <option value="amount">Amount</option>
                    </select>
                  </td>

                  {/* Discount % (editable when type = percent) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_percent}
                      onChange={(e) => updateItem(index, 'discount_percent', formatNumber(e.target.value))}
                      className={`w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 ${
                        item.discount_type === 'amount' 
                          ? 'bg-yellow-50 border-yellow-300 text-gray-600' 
                          : 'border-gray-300 bg-white'
                      }`}
                      placeholder={item.discount_type === 'percent' ? '0' : 'Auto'}
                      disabled={item.discount_type === 'amount'}
                    />
                  </td>

                  {/* Discount Amount per Unit (editable when type = amount) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_amount}
                      onChange={(e) => updateItem(index, 'discount_amount', formatNumber(e.target.value))}
                      className={`w-28 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 ${
                        item.discount_type === 'percent' 
                          ? 'bg-yellow-50 border-yellow-300 text-gray-600' 
                          : 'border-gray-300 bg-white'
                      }`}
                      placeholder={item.discount_type === 'amount' ? '0.00' : 'Auto'}
                      disabled={item.discount_type === 'percent'}
                    />
                  </td>

                  {/* Discount Per Unit (always calculated - read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_per_unit}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-blue-50 font-medium"
                      title="Calculated discount per unit"
                    />
                  </td>

                  {/* Total Discount Value (read-only, calculated) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_value}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 font-medium"
                    />
                  </td>

                  {/* After Discount (Read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.value_after_discount}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-green-50 font-bold text-green-700"
                    />
                  </td>

                  {/* Delete Button */}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals Section */}
      {items.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Item Value</p>
              <p className="text-xl font-bold text-gray-900">{totals.totalItemValue} {tenderCurrency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Discount</p>
              <p className="text-xl font-bold text-red-600">-{totals.totalDiscounted} {tenderCurrency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Final Value</p>
              <p className="text-xl font-bold text-green-600">{totals.finalValue} {tenderCurrency}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveItems}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {saving ? 'Saving...' : 'Save All Items'}
        </button>
      </div>
    </div>
  )
}