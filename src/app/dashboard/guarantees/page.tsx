// src/app/dashboard/guarantees/page.tsx
'use client'

import { useState, useEffect, Fragment } from 'react'
import { format } from 'date-fns'

type Record = {
  id: number
  ref: string
  number: string
  dated: string
  expiry: string
}

export default function GuaranteesPage() {
  const [toBeReleased, setToBeReleased] = useState<Record[]>([])
  const [inEffect, setInEffect]      = useState<Record[]>([])
  const [released, setReleased]      = useState<Record[]>([])

  // Replace with real API fetch
  useEffect(() => {
    const now = new Date()
    const fmt = (d: Date) => format(d, 'yyyy‑MM‑dd')
    setToBeReleased([
      { id: 1, ref: 'Rfx 205', number: 'TBG001', dated: fmt(now), expiry: fmt(now) },
      { id: 2, ref: 'Rfx 206', number: 'TBG002', dated: fmt(now), expiry: fmt(now) },
    ])
    setInEffect([
      { id: 1, ref: 'Rfx 205', number: 'TBG101', dated: fmt(now), expiry: fmt(now) },
    ])
    setReleased([
      { id: 1, ref: 'Rfx 204', number: 'TBG201', dated: fmt(now), expiry: fmt(now) },
    ])
  }, [])

  const sections = [
    { title: 'To Be Released', rows: toBeReleased },
    { title: 'In Effect',      rows: inEffect },
    { title: 'Released',       rows: released },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">TBG Status</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">#</th>
            <th className="border p-2 text-left">Ref</th>
            <th className="border p-2 text-left">TBG No.</th>
            <th className="border p-2 text-left">Dated</th>
            <th className="border p-2 text-left">Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((sec, si) => (
            <Fragment key={si}>
              {/* Parent row: section header */}
              <tr className="bg-gray-200">
                <td colSpan={5} className="border px-2 py-1 font-semibold">
                  {sec.title}
                </td>
              </tr>

              {/* Child rows */}
              {sec.rows.length > 0 ? sec.rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2 pl-6">{r.ref}</td>
                  <td className="border p-2">{r.number}</td>
                  <td className="border p-2">{r.dated}</td>
                  <td className="border p-2">{r.expiry}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="border p-2 italic text-gray-500 pl-6">
                    No entries
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
import { useRouter } from 'next/router'