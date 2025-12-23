// src/components/OrderItemsTable.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'

type CurrencyEnum = 'AED' | 'EUR' | 'USD'
type DiscountType = 'amount' | 'percent'

interface Item {
  item_id: number
  item_description: string
  product_id: number
}

interface TenderCompanyItem {
  item_id: number
  item_no_dewa: string
  item_description: string
  item_quantity: number
  item_unit_price: number
  item_total_value: number
  discount_percent: number
  discount_amount: number
  discount_value: number
  unit_after_discount: number  // Unit price after applying discount
}

interface OrderItem {
  order_item_detail_id?: number
  item_id: number | ''
  item_description?: string
  item_master_description?: string
  item_no_dewa: string
  item_quantity: string
  item_unit_price: string
  item_total_value: string
  currency: CurrencyEnum
  number_of_lots: string
  discount_type: DiscountType
  discount_percent: string
  discount_amount: string
  discount_value: string
  discount_per_unit: string
  value_after_discount: string
}

interface Props {
  orderId: number | null
  productId: number | null
  orderCurrency: CurrencyEnum
  tenderingCompanyId: number | null
  onItemsChange?: (items: OrderItem[]) => void
}

// Utility functions for number formatting with 4 decimal places precision

// For display only - formats with commas
const formatNumberForDisplay = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return ''
  
  const fixed = value.toFixed(4)
  const parts = fixed.split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return `${integerPart}.${parts[1]}`
}

// For input - allows natural typing with commas and validates/cleans
const sanitizeNumberInput = (value: string): string => {
  if (value === '' || value === null || value === undefined) return ''
  
  // Remove everything except digits and decimal point
  let cleaned = value.replace(/[^\d.]/g, '')
  
  // Handle multiple decimal points - keep only the first one
  const firstDotIndex = cleaned.indexOf('.')
  if (firstDotIndex !== -1) {
    cleaned = cleaned.slice(0, firstDotIndex + 1) + cleaned.slice(firstDotIndex + 1).replace(/\./g, '')
  }
  
  // Limit decimal places to 4
  const parts = cleaned.split('.')
  if (parts.length > 1 && parts[1].length > 4) {
    cleaned = parts[0] + '.' + parts[1].slice(0, 4)
  }
  
  // Add commas to integer part
  const [integerPart, decimalPart] = cleaned.split('.')
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // Return with decimal part if it exists
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`
  }
  
  return formattedInteger
}

const parseFormattedNumber = (value: string): number => {
  if (!value) return 0
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// Round to 4 decimal places
const roundTo4Decimals = (num: number): number => {
  return Math.round(num * 10000) / 10000
}

export default function OrderItemsTable({ 
  orderId, 
  productId, 
  orderCurrency,
  tenderingCompanyId,
  onItemsChange 
}: Props) {
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [items, setItems] = useState<OrderItem[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [tenderCompanyItems, setTenderCompanyItems] = useState<TenderCompanyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter items - now using tender company items with fallback to item master for descriptions
  const availableItems = useMemo(() => {
    // Return tender company items with descriptions from item_master as fallback
    return tenderCompanyItems.map(tc => {
      // Try to find matching item in item_master for description
      const itemMaster = allItems.find(i => i.item_id === tc.item_id)
      
      return {
        item_id: tc.item_id,
        item_description: tc.item_description || itemMaster?.item_description || `Item ${tc.item_id}`,
        item_no_dewa: tc.item_no_dewa,
        item_quantity: tc.item_quantity,
        item_unit_price: tc.item_unit_price,
        unit_after_discount: tc.unit_after_discount,
      }
    })
  }, [tenderCompanyItems, allItems])

  // Fetch all items (for reference, but we'll use tender company items for the dropdown)
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

  // Fetch tender company items for discount information and available items
  useEffect(() => {
    if (!tenderingCompanyId) {
      setTenderCompanyItems([])
      return
    }

    const token = localStorage.getItem('kkabbas_token')
    fetch(`${API}/tender_company_items?tendering_companies_id=${tenderingCompanyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: any[]) => {
        console.log('Tender Company Items Raw Data:', data) // Debug log
        const items: TenderCompanyItem[] = Array.isArray(data) ? data.map(item => {
          const unitPrice = item.item_price || 0
          const quantity = item.item_quantity || 1
          const discountValue = item.discount_value || 0
          
          // Calculate discount per unit
          const discountPerUnit = quantity > 0 ? discountValue / quantity : 0
          
          // Calculate unit price after discount
          const unitAfterDiscount = unitPrice - discountPerUnit
          
          // Get item description - check multiple possible fields
          const description = item.item_description || item.item_master_description || item.description || ''
          
          console.log(`Item ${item.item_id} description:`, description) // Debug log
          
          return {
            item_id: item.item_id,
            item_no_dewa: item.item_no_dewa || '',
            item_description: description,
            item_quantity: quantity,
            item_unit_price: unitPrice,
            item_total_value: item.item_total_value || 0,
            discount_percent: item.discount_percent || 0,
            discount_amount: item.discount_amount || 0,
            discount_value: discountValue,
            unit_after_discount: unitAfterDiscount,
          }
        }) : []
        console.log('Processed Tender Company Items:', items) // Debug log
        setTenderCompanyItems(items)
      })
      .catch(err => console.error('Failed to load tender company items:', err))
  }, [API, tenderingCompanyId])

  // Fetch existing order items
  const fetchOrderItems = () => {
    if (!orderId) return

    setLoading(true)
    const token = localStorage.getItem('kkabbas_token')
    fetch(`${API}/order_item_detail?order_id=${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((data: any[]) => {
        const formattedItems = data
          .map(item => {
            const quantity = parseFormattedNumber(String(item.item_quantity))
            const unitPrice = parseFormattedNumber(String(item.item_unit_price))
            const totalValue = roundTo4Decimals(quantity * unitPrice)
            
            // Determine discount type
            const discountType: DiscountType = item.discount_amount ? 'amount' : 'percent'
            
            // Calculate discount per unit
            const totalDiscountValue = item.discount_value || 0
            const discountPerUnit = quantity > 0 ? roundTo4Decimals(totalDiscountValue / quantity) : 0
            
            return {
              order_item_detail_id: item.order_item_detail_id,
              item_id: item.item_id,
              item_description: item.item_description || '',
              item_master_description: item.item_master_description || '',
              item_no_dewa: item.item_no_dewa,
              item_quantity: String(item.item_quantity || ''),
              item_unit_price: String(item.item_unit_price || ''),
              item_total_value: formatNumberForDisplay(totalValue),
              currency: item.currency,
              number_of_lots: String(item.number_of_lots || ''),
              discount_type: discountType,
              discount_percent: item.discount_percent ? String(item.discount_percent) : '',
              discount_amount: item.discount_amount ? String(item.discount_amount) : '',
              discount_value: item.discount_value ? formatNumberForDisplay(item.discount_value) : '',
              discount_per_unit: formatNumberForDisplay(discountPerUnit),
              value_after_discount: formatNumberForDisplay(roundTo4Decimals(totalValue - (item.discount_value || 0))),
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
        console.error('Failed to load order items:', err)
        setError('Failed to load items')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (orderId) {
      fetchOrderItems()
    }
  }, [orderId, API])

  // Calculate all discount-related values with 4 decimal precision
  const calculateDiscounts = (item: OrderItem) => {
    const quantity = parseFormattedNumber(item.item_quantity) || 1
    const price = parseFormattedNumber(item.item_unit_price)
    const totalValue = roundTo4Decimals(price * quantity)

    let discountPerUnit = 0
    let discountValue = 0
    let discountPercent = parseFormattedNumber(item.discount_percent)
    let discountAmount = parseFormattedNumber(item.discount_amount)

    if (item.discount_type === 'percent') {
      // User enters percentage
      // Calculate discount per unit = (price * percent) / 100
      discountPerUnit = roundTo4Decimals((price * discountPercent) / 100)
      // Calculate total discount = discountPerUnit * quantity
      discountValue = roundTo4Decimals(discountPerUnit * quantity)
      // Calculate discount amount per unit (same as discountPerUnit in this case)
      discountAmount = discountPerUnit
    } else {
      // User enters amount per unit
      // Discount per unit is the entered amount
      discountPerUnit = discountAmount
      // Calculate total discount = discountPerUnit * quantity
      discountValue = roundTo4Decimals(discountPerUnit * quantity)
      // Calculate percentage = (discountPerUnit / price) * 100
      discountPercent = price > 0 ? roundTo4Decimals((discountPerUnit / price) * 100) : 0
    }

    const valueAfterDiscount = roundTo4Decimals(totalValue - discountValue)

    return {
      discountPerUnit: formatNumberForDisplay(discountPerUnit),
      discountValue: formatNumberForDisplay(discountValue),
      discountPercent: String(discountPercent),
      discountAmount: String(discountAmount),
      valueAfterDiscount: formatNumberForDisplay(valueAfterDiscount),
      itemTotalValue: formatNumberForDisplay(totalValue),
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

    const finalValue = roundTo4Decimals(totalItemValue - totalDiscounted)

    return {
      totalItemValue: formatNumberForDisplay(roundTo4Decimals(totalItemValue)),
      totalDiscounted: formatNumberForDisplay(roundTo4Decimals(totalDiscounted)),
      finalValue: formatNumberForDisplay(finalValue),
    }
  }, [items])

  const addNewRow = () => {
    const newItem: OrderItem = {
      item_id: '',
      item_no_dewa: '',
      item_quantity: '',
      item_unit_price: '',
      item_total_value: '',
      currency: orderCurrency,
      number_of_lots: '',
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
    
    if (item.order_item_detail_id) {
      try {
        const token = localStorage.getItem('kkabbas_token')
        const response = await fetch(`${API}/order_item_detail/${item.order_item_detail_id}`, {
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

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate all values including discounts
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
    const selectedItem = availableItems.find(i => i.item_id === Number(itemId))
    if (selectedItem) {
      const updatedItems = [...items]
      
      // Use the tender company item data directly
      updatedItems[index] = {
        ...updatedItems[index],
        item_id: Number(itemId),
        item_description: selectedItem.item_description, // Auto-populate description
        item_master_description: selectedItem.item_description,
        item_no_dewa: selectedItem.item_no_dewa || '',
        item_quantity: String(selectedItem.item_quantity),
        item_unit_price: String(selectedItem.unit_after_discount), // Use discounted price from tender table
        discount_type: 'percent',
        discount_percent: '0', // Reset discount to zero
        discount_amount: '0',  // Reset discount to zero
      }
      
      // Recalculate totals with the new unit price (after discount from tender)
      const calculated = calculateDiscounts(updatedItems[index])
      updatedItems[index] = {
        ...updatedItems[index],
        item_total_value: calculated.itemTotalValue,
        discount_per_unit: calculated.discountPerUnit,
        discount_value: calculated.discountValue,
        value_after_discount: calculated.valueAfterDiscount,
      }
      
      setItems(updatedItems)
    }
  }

  const saveItems = async () => {
    if (saving || !orderId || !tenderingCompanyId) return
    
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

        // Calculate values properly with 4 decimal precision
        const quantity = roundTo4Decimals(parseFormattedNumber(item.item_quantity))
        const unitPrice = roundTo4Decimals(parseFormattedNumber(item.item_unit_price))

        // Discount calculations
        let discountPercent = 0
        let discountAmount = 0
        let discountValue = 0

        if (item.discount_type === 'percent') {
          // User entered percentage
          discountPercent = roundTo4Decimals(parseFormattedNumber(item.discount_percent))
          // Calculate discount amount per unit from percentage
          discountAmount = roundTo4Decimals((unitPrice * discountPercent) / 100)
          // Calculate total discount value
          discountValue = roundTo4Decimals(discountAmount * quantity)
        } else {
          // User entered amount per unit
          discountAmount = roundTo4Decimals(parseFormattedNumber(item.discount_amount))
          // Calculate total discount value
          discountValue = roundTo4Decimals(discountAmount * quantity)
          // Calculate percentage from amount
          discountPercent = unitPrice > 0 ? roundTo4Decimals((discountAmount / unitPrice) * 100) : 0
        }

        // ONLY include fields that exist in OrderItemDetail model
        const payload: {
          order_id: number
          item_id: number
          item_description: string | null
          item_no_dewa: string
          item_quantity: number
          item_unit_price: number
          currency: CurrencyEnum
          number_of_lots: number | null
          discount_percent: number
          discount_amount: number
          discount_value: number
        } = {
          order_id: orderId,
          item_id: Number(item.item_id),
          item_description: item.item_description || null,
          item_no_dewa: item.item_no_dewa,
          item_quantity: quantity,
          item_unit_price: unitPrice,
          currency: item.currency,
          number_of_lots: item.number_of_lots ? Number(item.number_of_lots) : null,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          discount_value: discountValue,
        }

        console.log('Saving item with payload:', payload) // Debug log

        let response
        if (item.order_item_detail_id) {
          // Update existing item
          response = await fetch(`${API}/order_item_detail/${item.order_item_detail_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })
        } else {
          // Create new item
          response = await fetch(`${API}/order_item_detail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Error response:', errorData) // Debug log
          throw new Error(errorData.detail || 'Failed to save item')
        }
      }

      await fetchOrderItems()
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

  if (!orderId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        Please save the order first before adding items.
      </div>
    )
  }

  if (!tenderingCompanyId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        Please select a tendering company first to add items.
      </div>
    )
  }

  if (availableItems.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
        No items available for this tendering company. Please add items to the tender in Tendering Company Items first.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order Items</h3>
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
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Description</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item No (DEWA)</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc/Unit</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disc/Unit Calc</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Disc</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">After Disc</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lots</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {/* Item Dropdown - NOW FILTERED BY TENDERING COMPANY */}
                  <td className="px-3 py-2">
                    <select
                      value={item.item_id}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">-- Select Item --</option>
                      {availableItems.map(i => (
                        <option key={i.item_id} value={i.item_id}>
                          {i.item_description}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Item Description (Auto-populated, can be edited) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_description}
                      onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                      className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="Auto-populated from tender"
                    />
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

                  {/* Quantity */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_quantity}
                      onChange={(e) => updateItem(index, 'item_quantity', sanitizeNumberInput(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_unit_price}
                      onChange={(e) => updateItem(index, 'item_unit_price', sanitizeNumberInput(e.target.value))}
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </td>

                  {/* Total Value (Read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.item_total_value}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 font-medium"
                    />
                  </td>

                  {/* Currency (Read-only - from order) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.currency}
                      readOnly
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-center font-medium"
                    />
                  </td>

                  {/* Discount Type Toggle */}
                  <td className="px-3 py-2">
                    <select
                      value={item.discount_type}
                      onChange={(e) => updateItem(index, 'discount_type', e.target.value as DiscountType)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      <option value="percent">%</option>
                      <option value="amount">Amount</option>
                    </select>
                  </td>

                  {/* Discount Percent */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_percent}
                      onChange={(e) => updateItem(index, 'discount_percent', sanitizeNumberInput(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="0.00"
                      disabled={item.discount_type === 'amount'}
                    />
                  </td>

                  {/* Discount Amount (Per Unit) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_amount}
                      onChange={(e) => updateItem(index, 'discount_amount', sanitizeNumberInput(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="0.00"
                      disabled={item.discount_type === 'percent'}
                    />
                  </td>

                  {/* Discount Per Unit (Calculated - Read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_per_unit}
                      readOnly
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-blue-50 text-blue-700 font-medium"
                    />
                  </td>

                  {/* Total Discount Value (Read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.discount_value}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-orange-50 text-orange-700 font-medium"
                    />
                  </td>

                  {/* Value After Discount (Read-only) */}
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.value_after_discount}
                      readOnly
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded bg-green-50 font-bold text-green-700"
                    />
                  </td>

                  {/* Number of Lots */}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={item.number_of_lots}
                      onChange={(e) => updateItem(index, 'number_of_lots', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      placeholder="0"
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
              <p className="text-sm text-gray-600">Total Item Value (Before Discount)</p>
              <p className="text-xl font-bold text-gray-800">{totals.totalItemValue} {orderCurrency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Discount</p>
              <p className="text-xl font-bold text-orange-600">-{totals.totalDiscounted} {orderCurrency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Final Order Value (After Discount)</p>
              <p className="text-2xl font-extrabold text-green-600">{totals.finalValue} {orderCurrency}</p>
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