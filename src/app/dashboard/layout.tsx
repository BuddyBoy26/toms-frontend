// src/app/dashboard/layout.tsx
'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  'company_master',
  'counter_guarantee',
  'delivery_procedure',
  'discrepancy',
  'event',
  'health',
  'item_master',
  'liquidated_damages',
  'lot_monitoring',
  'material_performance_guarantee',
  'order_detail',
  'order_event',
  'order_item_detail',
  'performance_guarantee',
  'post_tender_clarification',
  'pre_tender_clarification',
  'product_master',
  'tender_company_item',
  'tendering_companies',
  'tender',
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const path = usePathname()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!localStorage.getItem('kkabbas_token')) {
      router.replace('/login')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('kkabbas_token')
    router.push('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Side Panel */}
      <aside className="w-60 bg-gray-100 p-4 overflow-y-auto flex flex-col">
        <h2 className="text-lg font-semibold mb-4">KK Abbas Admin</h2>
        <ul className="flex-1 space-y-2">
          {NAV_ITEMS.map(item => {
            const href = `/dashboard/${item}`
            const isActive = path === href
            return (
              <li key={item}>
                <Link
                  href={href}
                  className={
                    `block px-3 py-2 rounded-md text-sm capitalize ` +
                    (isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200')
                  }
                >
                  {item.replace(/_/g, ' ')}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
