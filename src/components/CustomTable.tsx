// src/components/CustomTable.tsx
'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  key: keyof T
  header: string
}

interface CustomTableProps<T extends object> {
  data: T[]
  columns: Column<T>[]
  idField: keyof T
  linkPrefix: string
}

export default function CustomTable<T extends object>({
  data,
  columns,
  idField,
  linkPrefix,
}: CustomTableProps<T>) {
  const router = useRouter()

  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const processedData = useMemo(() => {
    let filtered = data
    if (search.trim()) {
      const lower = search.toLowerCase()
      filtered = data.filter(item =>
        Object.values(item).some(val =>
          String(val ?? '').toLowerCase().includes(lower)
        )
      )
    }
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortKey]
        const bVal = b[sortKey]

        if (aVal == null) return 1
        if (bVal == null) return -1

        // detect if both values are numeric
        const aNum = Number(aVal)
        const bNum = Number(bVal)
        const bothNumeric = !isNaN(aNum) && !isNaN(bNum)

        if (bothNumeric) {
          return sortDir === 'asc' ? aNum - bNum : bNum - aNum
        } else {
          return sortDir === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal))
        }
      })
    }
    return filtered
  }, [data, sortKey, sortDir, search])

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div>
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 border rounded-md w-1/3"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={String(col.key)}
                onClick={() => handleSort(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sortKey === col.key ? (
                    sortDir === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )
                  ) : (
                    <ArrowUpDown size={14} className="opacity-40" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {processedData.map(item => {
            const id = item[idField]
            return (
              <tr
                key={String(id)}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push(`${linkPrefix}/${id}`)}
              >
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
