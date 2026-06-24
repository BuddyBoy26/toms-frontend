// src/hooks/usePageTitle.ts
import { useEffect } from 'react'

const SUFFIX = 'KKA Portal'

/**
 * Set the browser tab title from a client component.
 * Appends " | KKA Portal" automatically.
 *
 * Usage:
 *   usePageTitle('Create Order')              → "Create Order | KKA Portal"
 *   usePageTitle(`Edit PO ${po_number}`)      → "Edit PO PO-2024-001 | KKA Portal"
 *   usePageTitle(order ? `Edit PO ${order.po_number}` : 'Loading...')
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SUFFIX}` : SUFFIX
  }, [title])
}