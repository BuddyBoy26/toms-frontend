'use client'

// import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// dynamically import actual component without SSR
const CompanyDetailPageInner = dynamic(() => import('./CompanyDetailPageInner'), {
  ssr: false,
})

export default function CompanyDetailPage() {
  return <CompanyDetailPageInner />
}
