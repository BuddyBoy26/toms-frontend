// src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/utils/auth'

export default function DashboardHome() {
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(u => {setUserName(u.full_name)
        console.log('Current user:', u)
        if (!u) {
          router.replace('/login')
        }
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Welcome back, {userName}!
      </h1>
      <p>Select an item from the sidebar to view or manage data.</p>
    </div>
  )
}
