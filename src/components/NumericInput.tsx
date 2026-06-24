// src/components/NumericInput.tsx
'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Format a number string with commas (e.g. "1234567.89" → "1,234,567.89").
 * Preserves trailing dot and trailing zeros so the user can type freely.
 */
const formatDisplay = (raw: string, maxDecimals: number): string => {
  if (!raw) return ''

  // Strip everything except digits and one dot
  let cleaned = raw.replace(/[^\d.]/g, '')

  // Only keep the first dot
  const dotIndex = cleaned.indexOf('.')
  if (dotIndex !== -1) {
    cleaned =
      cleaned.slice(0, dotIndex + 1) +
      cleaned.slice(dotIndex + 1).replace(/\./g, '')
  }

  // Split into integer + decimal
  const parts = cleaned.split('.')
  const integerPart = parts[0].replace(/^0+(?=\d)/, '') || '0' // strip leading zeros
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  if (parts.length === 2) {
    // Preserve whatever the user typed after the dot (up to maxDecimals chars)
    return `${formattedInteger}.${parts[1].slice(0, maxDecimals)}`
  }

  return formattedInteger
}

/**
 * Parse a display string back to a number.
 */
const toNumber = (display: string): number | null => {
  if (!display) return null
  const cleaned = display.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

interface NumericInputProps {
  value: string | number | null
  onChange: (numericValue: number | null) => void
  className?: string
  placeholder?: string
  maxDecimals?: number
  disabled?: boolean
}

export default function NumericInput({
  value,
  onChange,
  className = '',
  placeholder = '',
  maxDecimals = 4,
  disabled = false,
}: NumericInputProps) {
  const [display, setDisplay] = useState('')
  const isFocused = useRef(false)

  // Sync from parent when NOT focused (e.g. on initial load or external update)
  useEffect(() => {
    if (!isFocused.current) {
      if (value === null || value === undefined || value === '') {
        setDisplay('')
      } else {
        setDisplay(formatDisplay(String(value), maxDecimals))
      }
    }
  }, [value, maxDecimals])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const formatted = formatDisplay(raw, maxDecimals)
    setDisplay(formatted)

    // Send parsed number to parent on every keystroke
    // (so the data stays in sync), but we keep the display string locally
    onChange(toNumber(formatted))
  }

  const handleFocus = () => {
    isFocused.current = true
  }

  const handleBlur = () => {
    isFocused.current = false
    // Re-format cleanly on blur (strips trailing dot, trailing zeros if desired)
    const num = toNumber(display)
    if (num !== null) {
      setDisplay(formatDisplay(String(num), maxDecimals))
    }
    // Don't clear a trailing dot that results in "0" — just let it format
  }

  return (
    <input
      type="text"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}