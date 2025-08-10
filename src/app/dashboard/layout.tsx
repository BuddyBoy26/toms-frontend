// src/app/dashboard/layout.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Toaster } from 'react-hot-toast'

interface NavGroup {
  title: string
  items: { label: string; href: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Order Management',
    items: [
      { label: 'Purchase Orders',    href: '/dashboard/order_detail' },
      { label: 'Ordered Items',       href: '/dashboard/order_item_detail' },
      { label: 'Lot‑wise Monitoring', href: '/dashboard/lot_monitoring' },
      { label: 'Drawing Details',     href: '/dashboard/event' }, // adjust if needed
    ],
  },
  {
    title: 'Tasks',
    items: [
      { label: 'Important Dates & Time', href: '/dashboard/event' },
      { label: 'Things to Do',           href: '/dashboard/things_to_do' },
      { label: 'Delivery Monitoring',    href: '/dashboard/delivery_procedure' },
    ],
  },
  {
    title: 'Guarantees',
    items: [
      { label: 'Tender Bonds',          href: '/dashboard/counter_guarantee' },
      { label: 'Performance Bonds',     href: '/dashboard/performance_guarantee' },
      { label: 'Material Performance',  href: '/dashboard/material_performance_guarantee' },
    ],
  },
  {
    title: 'Tendering',
    items: [
      { label: 'Tendering Companies',       href: '/dashboard/tendering_companies' },
      { label: 'Tendered Items',            href: '/dashboard/tender_company_item' },
      { label: 'Pre‑Tender Clarifications',  href: '/dashboard/pre_tender_clarification' },
      { label: 'Post‑Tender Clarifications', href: '/dashboard/post_tender_clarification' },
      { label: 'Discounts Applied',         href: '/dashboard/liquidated_damages' },
      { label: 'Tender Results',            href: '/dashboard/order_event' },
    ],
  },
  {
    title: 'Masters',
    items: [
      { label: 'Company Master',  href: '/dashboard/company_master' },
      { label: 'Company Products', href: '/dashboard/product_master' },
      { label: 'Item Master',     href: '/dashboard/item_master' },
      { label: 'Tender Master',   href: '/dashboard/tender' },
    ],
  },
  {
    title: 'Miscellaneous',
    items: [
      { label: 'Discrepancies', href: '/dashboard/discrepancy' },
      { label: 'Logs',          href: '/dashboard/order_event' },
    ],
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!localStorage.getItem('kkabbas_token')) {
      router.replace('/login')
    }
  }, [router])

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-100 p-4 overflow-y-auto flex flex-col">
        <h2 className="text-lg font-semibold mb-4">KK Abbas Admin</h2>
        <nav className="flex-1 space-y-2">
          {NAV_GROUPS.map(group => (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full text-left flex justify-between items-center px-3 py-2 rounded-md hover:bg-gray-200 transition"
              >
                <span className="font-medium">{group.title}</span>
                <span>{openGroups[group.title] ? '▾' : '▸'}</span>
              </button>

              {openGroups[group.title] && (
                <ul className="mt-1 ml-4 space-y-1">
                  {group.items.map(item => {
                    const isActive = path === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={
                            `block px-3 py-1 rounded-md text-sm capitalize ` +
                            (isActive
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-200')
                          }
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <button
          onClick={() => {
            localStorage.removeItem('kkabbas_token')
            router.push('/login')
          }}
          className="mt-4 w-full px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 bg-white overflow-auto p-6">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              fontSize: '16px',           // bigger text
              fontWeight: 500,            // semi-bold
              padding: '14px 20px',       // extra padding
              borderRadius: '8px',        // rounded corners
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // subtle shadow
            },
            success: { iconTheme: { primary: '#16a34a', secondary: 'white' } },
            error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
          }}
        />
        {children}
      </main>
    </div>
  )
}
