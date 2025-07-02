// src/components/CustomTable.tsx
'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

export interface Column<T> {
  key: keyof T
  header: string
}

interface CustomTableProps<T extends Record<string, any>> {
  data: T[]
  columns: Column<T>[]
  idField: keyof T
  linkPrefix: string
}

export default function CustomTable<T extends Record<string, any>>({
  data,
  columns,
  idField,
  linkPrefix,
}: CustomTableProps<T>) {
  const router = useRouter()

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map(col => (
            <th
              key={String(col.key)}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map(item => {
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
                  {String(item[col.key])}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
