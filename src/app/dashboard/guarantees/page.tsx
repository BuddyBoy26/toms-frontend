'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '@/components/Loader'

type ViewMode = 'guarantees' | 'po_tender'

// --- Utility Functions ---
const formatNumber = (value: string | number | null): string => {
  if (value === '' || value === null || value === undefined) return ''
  const numStr = String(value).replace(/[^\d.]/g, '')
  if (!numStr) return ''
  const parts = numStr.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 4)}`
  }
  return formattedInteger
}

const parseFormattedNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

const formatDateString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const formatDateArray = (dates: string[] | null | undefined): string => {
  if (!dates || !Array.isArray(dates)) return ''
  return dates.map(d => formatDateString(d)).join(', ')
}

const parseDateArray = (dateStr: string): string[] | null => {
  if (!dateStr.trim()) return null
  return dateStr.split(',').map(s => s.trim()).filter(s => s)
}

// --- Interfaces ---
interface GridRow {
  id: number; type: 'TBG' | 'MPG' | 'PBG'; ref_doc_no: string; guarantee_no: string;
  tendered_value?: string; // NEW FIELD: Calculated from tender_company_items
  guarantee_value: string; expiry_date: string; status: string;
  cg_id: number | null; cg_bank: string; cg_status: string;
  rawGuarantee: any; rawCG: any;
  isNewCG?: boolean; 
  [key: string]: any; 
}

export default function GuaranteesDashboard() {
  const router = useRouter()
  const API = process.env.NEXT_PUBLIC_BACKEND_API_URL

  const [viewMode, setViewMode] = useState<ViewMode>('guarantees')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [rawTenders, setRawTenders] = useState<any[]>([])
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [rawTcs, setRawTcs] = useState<any[]>([])
  const [rawMpgs, setRawMpgs] = useState<any[]>([])
  const [rawPbgs, setRawPbgs] = useState<any[]>([])
  const [rawCgs, setRawCgs] = useState<any[]>([])
  const [rawTcItems, setRawTcItems] = useState<any[]>([]) // Store items for calculation

  const [tbgRows, setTbgRows] = useState<GridRow[]>([])
  const [mpgRows, setMpgRows] = useState<GridRow[]>([])
  const [pbgRows, setPbgRows] = useState<GridRow[]>([])

  const [selectedTenderId, setSelectedTenderId] = useState<number | ''>('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('')
  const [formTbg, setFormTbg] = useState<GridRow | null>(null)
  const [formMpg, setFormMpg] = useState<GridRow | null>(null)
  const [formPbg, setFormPbg] = useState<GridRow | null>(null)
  
  const [extDates, setExtDates] = useState({ TBG: '', MPG: '', PBG: '' })
  
  const [collapsedSections, setCollapsedSections] = useState({ tbg: false, mpg: false, pbg: false })
  const toggleSection = (key: keyof typeof collapsedSections) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const [formCollapsed, setFormCollapsed] = useState({ tbg: false, mpg: false, pbg: false })
  const toggleFormSection = (key: keyof typeof formCollapsed) => setFormCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  // --- Core Data Fetch ---
  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('kkabbas_token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }

    try {
      const [cgRes, tcRes, mpgRes, pbgRes, ordersRes, tendersRes, tcItemsRes] = await Promise.all([
        fetch(`${API}/counter_guarantee`, { headers }),
        fetch(`${API}/tendering_companies`, { headers }),
        fetch(`${API}/material_performance_guarantee`, { headers }),
        fetch(`${API}/performance_guarantee`, { headers }),
        fetch(`${API}/order_detail`, { headers }),
        fetch(`${API}/tender`, { headers }),
        fetch(`${API}/tender_company_items`, { headers }) // Fetch Items for Tendered Value calculation
      ])

      const cgs = await cgRes.json().catch(() => [])
      const tcs = await tcRes.json().catch(() => [])
      const mpgs = await mpgRes.json().catch(() => [])
      const pbgs = await pbgRes.json().catch(() => [])
      const orders = await ordersRes.json().catch(() => [])
      const tenders = await tendersRes.json().catch(() => [])
      const tcItems = await tcItemsRes.json().catch(() => [])

      setRawCgs(cgs)
      setRawTcs(tcs)
      setRawMpgs(mpgs)
      setRawPbgs(pbgs)
      setRawOrders(orders)
      setRawTenders(tenders)
      setRawTcItems(tcItems)

      mapGridData(cgs, tcs, mpgs, pbgs, orders, tenders, tcItems)
      
      if (selectedOrderId || selectedTenderId) {
        mapFormData(selectedTenderId || null, selectedOrderId || null, cgs, tcs, mpgs, pbgs, tcItems)
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllData() }, [API])

  // --- Mapping Functions ---
  const getCG = (type: string, refNo: string, cgsList: any[]) => 
    cgsList.find((cg: any) => cg.guarantee_type === type && cg.guarantee_ref_number === refNo)

  // Calculates the net "Tendered Value" (Total Item Value - Total Discounts)
  const calculateTenderedValue = (tcId: number, itemsList: any[]): string => {
    const itemsForTc = itemsList.filter((i: any) => i.tendering_companies_id === tcId)
    let finalValue = 0
    itemsForTc.forEach((item: any) => {
      const totalVal = parseFloat(item.item_total_value) || 0
      const discVal = parseFloat(item.discount_value) || 0
      finalValue += (totalVal - discVal)
    })
    return String(finalValue)
  }

  const buildRowData = (type: 'TBG'|'MPG'|'PBG', item: any, matchedCG: any, refDoc: string, tcItemsList: any[]): GridRow => {
    const isTbg = type === 'TBG'
    const prefix = type === 'MPG' ? 'mpg' : 'pg'
    const refNo = isTbg ? (item.tbg_credit_card_option === 0 ? item.tbg_no : item.credit_card_payment_ref) : item[`${prefix}_no`]
    const extArray = item[isTbg ? 'tender_extension_dates' : `${prefix}_extension_dates`]

    const rowData: GridRow = {
      id: isTbg ? item.tendering_companies_id : item[`${prefix}_id`],
      type,
      ref_doc_no: refDoc,
      guarantee_no: refNo || '',
      guarantee_value: String(item[isTbg ? 'tbg_value' : `${prefix}_value`] || ''),
      expiry_date: formatDateString(item[isTbg ? 'tbg_expiry_date' : `${prefix}_expiry_date`]),
      status: isTbg ? 'N/A' : (item.pending_status || 'NOT Issued'),
      
      cg_id: matchedCG?.cg_id || null,
      cg_type: type,
      cg_ref_number: matchedCG?.guarantee_ref_number || '',
      cg_date: formatDateString(matchedCG?.cg_date),
      cg_bank: matchedCG?.issuing_bank || '',
      cg_expiry_date: formatDateString(matchedCG?.expiry_date),
      cg_remarks: matchedCG?.remarks || '',
      cg_status: matchedCG?.pending_status || 'NOT Issued',
      isNewCG: false,
      
      rawGuarantee: item,
      rawCG: matchedCG || null,
      ...item,
      extension_dates_array: Array.isArray(extArray) ? extArray.map(formatDateString) : []
    }

    if (isTbg) {
      rowData.tendered_value = calculateTenderedValue(item.tendering_companies_id, tcItemsList)
    }

    return rowData
  }

  const mapGridData = (cgs: any[], tcs: any[], mpgs: any[], pbgs: any[], orders: any[], tenders: any[], tcItemsList: any[]) => {
    const mappedTBGs = tcs.filter(tc => tc.tbg_no || tc.credit_card_payment_ref).map(tc => {
      const tender = tenders.find(t => t.tender_id === tc.tender_id)
      return buildRowData('TBG', tc, getCG('TBG', tc.tbg_credit_card_option === 0 ? tc.tbg_no : tc.credit_card_payment_ref, cgs), tender?.tender_no || `Tender ID: ${tc.tender_id}`, tcItemsList)
    })

    const mappedMPGs = mpgs.map(mpg => {
      const order = orders.find(o => o.order_id === mpg.order_id)
      return buildRowData('MPG', mpg, getCG('MPG', mpg.mpg_no, cgs), order?.po_number || `PO ID: ${mpg.order_id}`, tcItemsList)
    })

    const mappedPBGs = pbgs.map(pbg => {
      const order = orders.find(o => o.order_id === pbg.order_id)
      return buildRowData('PBG', pbg, getCG('PBG', pbg.pg_no, cgs), order?.po_number || `PO ID: ${pbg.order_id}`, tcItemsList)
    })

    setTbgRows(mappedTBGs)
    setMpgRows(mappedMPGs)
    setPbgRows(mappedPBGs)
  }

  const mapFormData = (tId: number | null, oId: number | null, cgs = rawCgs, tcs = rawTcs, mpgs = rawMpgs, pbgs = rawPbgs, tcItemsList = rawTcItems) => {
    if (tId) {
      const tc = tcs.find(t => t.tender_id === tId)
      if (tc) setFormTbg(buildRowData('TBG', tc, getCG('TBG', tc.tbg_credit_card_option === 0 ? tc.tbg_no : tc.credit_card_payment_ref, cgs), '', tcItemsList))
      else setFormTbg(null)
    } else setFormTbg(null)

    if (oId) {
      const mpg = mpgs.find(m => m.order_id === oId)
      const pbg = pbgs.find(p => p.order_id === oId)
      if (mpg) setFormMpg(buildRowData('MPG', mpg, getCG('MPG', mpg.mpg_no, cgs), '', tcItemsList))
      else setFormMpg(null)
      if (pbg) setFormPbg(buildRowData('PBG', pbg, getCG('PBG', pbg.pg_no, cgs), '', tcItemsList))
      else setFormPbg(null)
    } else {
      setFormMpg(null)
      setFormPbg(null)
    }
  }

  // --- Form & Grid Handlers ---
  const handleTenderSelect = (tIdStr: string) => {
    const tId = tIdStr === '' ? '' : Number(tIdStr)
    setSelectedTenderId(tId)
    if (tId !== '' && selectedOrderId !== '') {
      const currentOrder = rawOrders.find(o => o.order_id === selectedOrderId)
      if (currentOrder && currentOrder.tender_id !== tId) setSelectedOrderId('')
    }
    mapFormData(tId === '' ? null : tId, selectedOrderId === '' ? null : selectedOrderId)
  }

  const handleOrderSelect = (oIdStr: string) => {
    const oId = oIdStr === '' ? '' : Number(oIdStr)
    setSelectedOrderId(oId)
    if (oId !== '') {
      const currentOrder = rawOrders.find(o => o.order_id === oId)
      if (currentOrder && currentOrder.tender_id) {
        setSelectedTenderId(currentOrder.tender_id)
        mapFormData(currentOrder.tender_id, oId)
        return
      }
    }
    mapFormData(selectedTenderId === '' ? null : selectedTenderId, oId === '' ? null : oId)
  }

  const availableOrders = selectedTenderId === '' ? rawOrders : rawOrders.filter(o => o.tender_id === selectedTenderId)

  const handleGridRowChange = (type: 'TBG' | 'MPG' | 'PBG', index: number, field: string, value: any) => {
    const targetSet = type === 'TBG' ? setTbgRows : type === 'MPG' ? setMpgRows : setPbgRows
    const targetData = type === 'TBG' ? tbgRows : type === 'MPG' ? mpgRows : pbgRows
    const updated = [...targetData]
    updated[index] = { ...updated[index], [field]: value }
    targetSet(updated)
  }

  // Fixed React State Batching implementation
  const handleFormChange = (type: 'TBG' | 'MPG' | 'PBG', field: string, value: any) => {
    if (type === 'TBG') {
      setFormTbg(prev => prev ? { ...prev, [field]: value } : null)
    } else if (type === 'MPG') {
      setFormMpg(prev => prev ? { ...prev, [field]: value } : null)
    } else if (type === 'PBG') {
      setFormPbg(prev => prev ? { ...prev, [field]: value } : null)
    }
  }

  // --- Inline CG Creation ---
  const activateInlineCG = (type: 'TBG' | 'MPG' | 'PBG') => {
    const form = type === 'TBG' ? formTbg : type === 'MPG' ? formMpg : formPbg
    if (!form) return
    
    const activeRefNo = type === 'TBG' 
      ? (form.tbg_credit_card_option === 0 ? form.tbg_no : form.credit_card_payment_ref) 
      : (form.guarantee_no || form[`${type.toLowerCase()}_no`])

    const updatedForm = {
      ...form,
      cg_id: Date.now(),
      isNewCG: true,
      cg_ref_number: activeRefNo || '',
      cg_date: '',
      cg_bank: '',
      cg_expiry_date: '',
      cg_remarks: '',
      cg_status: 'NOT Issued'
    }

    if (type === 'TBG') setFormTbg(updatedForm)
    if (type === 'MPG') setFormMpg(updatedForm)
    if (type === 'PBG') setFormPbg(updatedForm)
  }

  const addFormExtensionDate = (type: 'TBG' | 'MPG' | 'PBG') => {
    const dateStr = extDates[type]
    if (!dateStr) return
    const form = type === 'TBG' ? formTbg : type === 'MPG' ? formMpg : formPbg
    if (!form) return
    const newDates = [...(form.extension_dates_array || []), dateStr]
    handleFormChange(type, 'status', 'Issued / Extended')
    handleFormChange(type, 'extension_dates_array', newDates)
    setExtDates(prev => ({ ...prev, [type]: '' }))
  }

  const removeFormExtensionDate = (type: 'TBG' | 'MPG' | 'PBG', indexToRemove: number) => {
    const form = type === 'TBG' ? formTbg : type === 'MPG' ? formMpg : formPbg
    if (!form) return
    const newDates = form.extension_dates_array.filter((_: any, i: number) => i !== indexToRemove)
    handleFormChange(type, 'extension_dates_array', newDates)
  }

  // --- Save Logic ---
  const executeSave = async (payloadSource: GridRow, type: 'TBG' | 'MPG' | 'PBG') => {
    const token = localStorage.getItem('kkabbas_token')
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

    const gPayload = { ...payloadSource.rawGuarantee }
    let gUrl = ''
    
    const prefix = type === 'MPG' ? 'mpg' : 'pg'
    const calculatedRefNo = type === 'TBG' 
      ? (payloadSource.tbg_credit_card_option === 0 ? payloadSource.tbg_no : payloadSource.credit_card_payment_ref)
      : (payloadSource.guarantee_no || payloadSource[`${prefix}_no`])

    if (type === 'TBG') {
      gPayload.tbg_credit_card_option = payloadSource.tbg_credit_card_option ?? gPayload.tbg_credit_card_option
      gPayload.tbg_no = payloadSource.tbg_no || null
      gPayload.credit_card_payment_ref = payloadSource.credit_card_payment_ref || null
      gPayload.tbg_issuing_bank = payloadSource.tbg_issuing_bank || null
      gPayload.tender_deposit_receipt_no = payloadSource.tender_deposit_receipt_no || null
      gPayload.tbg_value = parseFormattedNumber(payloadSource.guarantee_value || payloadSource.tbg_value)
      gPayload.tendering_currency = payloadSource.tendering_currency || gPayload.tendering_currency
      gPayload.tendering_currency_nq = payloadSource.tendering_currency_nq || gPayload.tendering_currency_nq
      gPayload.tbg_date = payloadSource.tbg_date || null
      gPayload.tbg_expiry_date = payloadSource.expiry_date || payloadSource.tbg_expiry_date || null
      gPayload.tbg_submitted_date = payloadSource.tbg_submitted_date || null
      gPayload.tbg_release_date_dewa = payloadSource.tbg_release_date_dewa || null
      gPayload.tbg_release_date_bank = payloadSource.tbg_release_date_bank || null
      gPayload.dewa_enbd_ref = payloadSource.dewa_enbd_ref || null
      gPayload.tender_extension_dates = payloadSource.extension_dates_array || parseDateArray(payloadSource.tender_extension_dates || '')
      gPayload.remarks = payloadSource.remarks || payloadSource.rawGuarantee.remarks || null
      gUrl = `${API}/tendering_companies/${payloadSource.id}`

    } else if (type === 'MPG') {
      gPayload.participated = payloadSource.participated ?? gPayload.participated
      gPayload.mpg_bank_or_deposit = payloadSource.bank_or_deposit ?? payloadSource.mpg_bank_or_deposit
      gPayload.mpg_no = calculatedRefNo || null
      gPayload.mpg_issuing_bank = payloadSource.issuing_bank || payloadSource.mpg_issuing_bank || null
      gPayload.mpg_deposit_receipt_no = payloadSource.deposit_receipt_no || payloadSource.mpg_deposit_receipt_no || null
      gPayload.mpg_value = parseFormattedNumber(payloadSource.guarantee_value || payloadSource.mpg_value)
      gPayload.mpg_expiry_date = payloadSource.expiry_date || payloadSource.mpg_expiry_date || null
      gPayload.mpg_submitted_date = payloadSource.submitted_date || payloadSource.mpg_submitted_date || null
      gPayload.mpg_release_date_dewa = payloadSource.release_date_dewa || payloadSource.mpg_release_date_dewa || null
      gPayload.mpg_release_date_bank = payloadSource.release_date_bank || payloadSource.mpg_release_date_bank || null
      gPayload.mpg_extension_dates = payloadSource.extension_dates_array || parseDateArray(payloadSource.extension_dates || '')
      gPayload.remarks = payloadSource.remarks || payloadSource.rawGuarantee.remarks || null
      gPayload.pending_status = payloadSource.status || gPayload.pending_status
      gUrl = `${API}/material_performance_guarantee/${payloadSource.id}`

    } else if (type === 'PBG') {
      gPayload.pg_bank_or_deposit = payloadSource.bank_or_deposit ?? payloadSource.pg_bank_or_deposit
      gPayload.pg_no = calculatedRefNo || null
      gPayload.pg_issuing_bank = payloadSource.issuing_bank || payloadSource.pg_issuing_bank || null
      gPayload.pg_deposit_receipt_no = payloadSource.deposit_receipt_no || payloadSource.pg_deposit_receipt_no || null
      gPayload.pg_value = parseFormattedNumber(payloadSource.guarantee_value || payloadSource.pg_value)
      gPayload.pg_expiry_date = payloadSource.expiry_date || payloadSource.pg_expiry_date || null
      gPayload.pg_submitted_date = payloadSource.submitted_date || payloadSource.pg_submitted_date || null
      gPayload.pg_release_date_dewa = payloadSource.release_date_dewa || payloadSource.pg_release_date_dewa || null
      gPayload.pg_release_date_bank = payloadSource.release_date_bank || payloadSource.pg_release_date_bank || null
      gPayload.pg_extension_dates = payloadSource.extension_dates_array || parseDateArray(payloadSource.extension_dates || '')
      gPayload.remarks = payloadSource.remarks || payloadSource.rawGuarantee.remarks || null
      gPayload.pending_status = payloadSource.status || gPayload.pending_status
      gUrl = `${API}/performance_guarantee/${payloadSource.id}`
    }

    const gRes = await fetch(gUrl, { method: 'PUT', headers, body: JSON.stringify(gPayload) })
    if (!gRes.ok) throw new Error(`Failed to update ${type} record`)

    if (payloadSource.cg_id) {
      const cgMethod = payloadSource.isNewCG ? 'POST' : 'PUT'
      const cgUrl = payloadSource.isNewCG ? `${API}/counter_guarantee` : `${API}/counter_guarantee/${payloadSource.cg_id}`
      
      const cgPayload = payloadSource.isNewCG ? {
        guarantee_type: type,
        guarantee_ref_number: calculatedRefNo || '',
        cg_date: payloadSource.cg_date || null,
        issuing_bank: payloadSource.cg_bank || null,
        expiry_date: payloadSource.cg_expiry_date || null,
        remarks: payloadSource.cg_remarks || null,
        pending_status: payloadSource.cg_status || 'NOT Issued',
      } : {
        ...payloadSource.rawCG,
        guarantee_ref_number: calculatedRefNo,
        cg_date: payloadSource.cg_date || payloadSource.rawCG.cg_date || null,
        issuing_bank: payloadSource.cg_bank || payloadSource.rawCG.issuing_bank || null,
        expiry_date: payloadSource.cg_expiry_date || payloadSource.rawCG.expiry_date || null,
        remarks: payloadSource.cg_remarks || payloadSource.rawCG.remarks || null,
        pending_status: payloadSource.cg_status || payloadSource.rawCG.pending_status,
      }
      
      const cgRes = await fetch(cgUrl, { method: cgMethod, headers, body: JSON.stringify(cgPayload) })
      if (!cgRes.ok) throw new Error(`Failed to save Counter Guarantee for ${type}`)
    }
  }

  const saveGridGuarantees = async (type: 'TBG' | 'MPG' | 'PBG') => {
    let rowsToSave = type === 'TBG' ? tbgRows : type === 'MPG' ? mpgRows : pbgRows
    if (statusFilter !== 'All') {
      rowsToSave = rowsToSave.filter(r => r.status === statusFilter || (type === 'TBG' && statusFilter === 'NOT Issued' && r.status === 'N/A'))
    }

    if (rowsToSave.length === 0) return
    setSaving(true); setError(null);
    try {
      for (const row of rowsToSave) await executeSave(row, type)
      await fetchAllData()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const saveSingleForm = async (type: 'TBG' | 'MPG' | 'PBG') => {
    const form = type === 'TBG' ? formTbg : type === 'MPG' ? formMpg : formPbg
    if (!form) return
    setSaving(true); setError(null);
    try {
      await executeSave(form, type)
      await fetchAllData()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const saveAllForms = async () => {
    setSaving(true); setError(null);
    try {
      if (formTbg) await executeSave(formTbg, 'TBG')
      if (formMpg) await executeSave(formMpg, 'MPG')
      if (formPbg) await executeSave(formPbg, 'PBG')
      await fetchAllData()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  const openEditTabs = (type: 'TBG'|'MPG'|'PBG', id: number, cgId: number | null, isNewCG: boolean | undefined) => {
    const mainUrl = type === 'TBG' ? `/dashboard/tendering_company_details/${id}` : `/dashboard/${type === 'MPG' ? 'material_performance_guarantee' : 'performance_guarantee'}/${id}`
    window.open(mainUrl, '_blank')
    if (cgId && !isNewCG) {
      window.open(`/dashboard/counter_guarantee/${cgId}`, '_blank')
    } else {
      window.open(`/dashboard/counter_guarantee/create`, '_blank')
    }
  }

  // --- Render Helpers ---
  const renderStatusDropdown = (value: string, onChange: (val: string) => void, disabled = false) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}>
      <option value="NOT Issued">NOT Issued</option>
      <option value="Issued / Extended">Issued / Extended</option>
      <option value="Extension Required">Extension Required</option>
      <option value="NOT Released">NOT Released</option>
      <option value="Released">Released</option>
    </select>
  )

  const renderGridStatusDropdown = (value: string, onChange: (val: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-36 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500">
      <option value="NOT Issued">NOT Issued</option>
      <option value="Issued / Extended">Issued / Extended</option>
      <option value="Extension Required">Extension Required</option>
      <option value="NOT Released">NOT Released</option>
      <option value="Released">Released</option>
    </select>
  )

  const renderCurrencyDropdown = (value: string, onChange: (val: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500">
      <option value="AED">AED</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
    </select>
  )

  const renderGridCurrencyDropdown = (value: string, onChange: (val: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500">
      <option value="AED">AED</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
    </select>
  )

  // --- Filtered Grid Data ---
  const filteredTbgRows = statusFilter === 'All' ? tbgRows : tbgRows.filter(r => r.status === statusFilter || (statusFilter === 'NOT Issued' && r.status === 'N/A'))
  const filteredMpgRows = statusFilter === 'All' ? mpgRows : mpgRows.filter(r => r.status === statusFilter)
  const filteredPbgRows = statusFilter === 'All' ? pbgRows : pbgRows.filter(r => r.status === statusFilter)

  if (loading && rawTenders.length === 0) return <Loader />

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guarantees Dashboard</h1>
        <div className="relative group">
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2 font-medium">
            + Create
          </button>
          <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg hidden group-hover:block z-50">
            <a href="/dashboard/material_performance_guarantee/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100">Create MPG</a>
            <a href="/dashboard/performance_guarantee/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100">Create PBG</a>
            <a href="/dashboard/counter_guarantee/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Create Counter Guarantee</a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col md:flex-row gap-6">
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">View By:</label>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="guarantees">List by Guarantees (Grid View)</option>
            <option value="po_tender">List by PO / Tender Number (Form View)</option>
          </select>
        </div>
        
        {viewMode === 'guarantees' && (
          <div className="flex-1 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="All">All Statuses</option>
              <option value="NOT Issued">NOT Issued</option>
              <option value="Issued / Extended">Issued / Extended</option>
              <option value="Extension Required">Extension Required</option>
              <option value="NOT Released">NOT Released</option>
              <option value="Released">Released</option>
            </select>
          </div>
        )}

        {viewMode === 'po_tender' && (
          <>
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Tender</label>
              <select value={selectedTenderId} onChange={(e) => handleTenderSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">-- All Tenders --</option>
                {rawTenders.map(t => <option key={t.tender_id} value={t.tender_id}>{t.tender_no}</option>)}
              </select>
            </div>
            <div className="flex-1 max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select PO</label>
              <select value={selectedOrderId} onChange={(e) => handleOrderSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">-- Select PO --</option>
                {availableOrders.map(o => <option key={o.order_id} value={o.order_id}>{o.po_number}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

      {/* =====================================================================
          VIEW MODE 1: GUARANTEES GRID
          ===================================================================== */}
      {viewMode === 'guarantees' ? (
        <div className="space-y-6">
          {/* TBG Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-blue-700">Tender Bond Guarantees (TBG)</h3>
                <button onClick={() => toggleSection("tbg")} className="text-xs px-2 py-1 border rounded hover:bg-gray-100">
                  {collapsedSections.tbg ? "Expand" : "Minimise"}
                </button>
              </div>
              {!collapsedSections.tbg && (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Tender No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Option ( TBG / CC or Cash )</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">TBG / CC Payment Ref No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">TBG Bank / Cash Deposit Receipt No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Tendered Value</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Currency</th>
                          {/* <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Curr (NQ)</th> */}
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Expiry Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Submitted</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">DEWA Release</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Bank Release</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">ENBD Ref</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Extension Dates</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Remarks</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-blue-700 uppercase border-r border-blue-200">Edit Page</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Ref</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Bank</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Expiry</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Status</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Remarks</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-blue-700 uppercase border-l border-blue-200">CG Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTbgRows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-gray-700 font-medium whitespace-nowrap">{row.ref_doc_no}</td>
                            <td className="px-2 py-2"><select value={row.tbg_credit_card_option} onChange={(e) => handleGridRowChange('TBG', index, 'tbg_credit_card_option', Number(e.target.value))} className="w-23 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"><option value="0">TBG</option><option value="1">CC / CASH</option></select></td>
                            <td className="px-2 py-2"><input type="text" value={row.tbg_credit_card_option === 0 ? row.tbg_no : row.credit_card_payment_ref} onChange={(e) => handleGridRowChange('TBG', index, row.tbg_credit_card_option === 0 ? 'tbg_no' : 'credit_card_payment_ref', e.target.value)} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.tbg_credit_card_option === 0 ? row.tbg_issuing_bank : row.tender_deposit_receipt_no} onChange={(e) => handleGridRowChange('TBG', index, row.tbg_credit_card_option === 0 ? 'tbg_issuing_bank' : 'tender_deposit_receipt_no', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={formatNumber(row.tendered_value || '')} readOnly className="w-24 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 font-medium text-gray-700" title="Calculated from Tender Items" /></td>
                            <td className="px-2 py-2"><input type="text" value={formatNumber(row.guarantee_value || '')} onChange={(e) => handleGridRowChange('TBG', index, 'tbg_value', formatNumber(e.target.value))} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2">{renderGridCurrencyDropdown(row.tendering_currency || 'AED', (val) => handleGridRowChange('TBG', index, 'tendering_currency', val))}</td>
                            {/* <td className="px-2 py-2">{renderGridCurrencyDropdown(row.tendering_currency_nq || 'AED', (val) => handleGridRowChange('TBG', index, 'tendering_currency_nq', val))}</td> */}
                            <td className="px-2 py-2"><input type="date" value={row.tbg_date || ''} onChange={(e) => handleGridRowChange('TBG', index, 'tbg_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.expiry_date || ''} onChange={(e) => handleGridRowChange('TBG', index, 'expiry_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.tbg_submitted_date || ''} onChange={(e) => handleGridRowChange('TBG', index, 'tbg_submitted_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.tbg_release_date_dewa || ''} onChange={(e) => handleGridRowChange('TBG', index, 'tbg_release_date_dewa', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.tbg_release_date_bank || ''} onChange={(e) => handleGridRowChange('TBG', index, 'tbg_release_date_bank', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.dewa_enbd_ref || ''} onChange={(e) => handleGridRowChange('TBG', index, 'dewa_enbd_ref', e.target.value)} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.tender_extension_dates || ''} onChange={(e) => handleGridRowChange('TBG', index, 'tender_extension_dates', e.target.value)} placeholder="YYYY-MM-DD, ..." className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.remarks || ''} onChange={(e) => handleGridRowChange('TBG', index, 'remarks', e.target.value)} className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2 text-center border-r border-gray-200">
                              <button onClick={() => window.open(`/dashboard/tendering_company_details/${row.id}`, '_blank')} className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">Edit Page</button>
                            </td>
                            <td className="px-2 py-2 border-l-2 border-gray-100"><input type="text" value={row.cg_ref_number || ''} disabled className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.cg_date || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('TBG', index, 'cg_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.cg_bank || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('TBG', index, 'cg_bank', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.cg_expiry_date || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('TBG', index, 'cg_expiry_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2">{row.cg_id ? renderGridStatusDropdown(row.cg_status, (v) => handleGridRowChange('TBG', index, 'cg_status', v)) : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                            <td className="px-2 py-2"><input type="text" value={row.cg_remarks || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('TBG', index, 'cg_remarks', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2 text-center border-l border-gray-200">
                              {row.cg_id ? (
                                <button onClick={() => window.open(`/dashboard/counter_guarantee/${row.cg_id}`, '_blank')} className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">Edit CG</button>
                              ) : (
                                <button onClick={() => window.open(`/dashboard/counter_guarantee/create`, '_blank')} className="text-green-600 hover:text-green-800 font-medium text-xs hover:underline">Create CG</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={() => saveGridGuarantees('TBG')} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                      {saving ? 'Saving...' : 'Save All TBG Guarantees'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* MPG Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-green-700">Material Performance Guarantees (MPG)</h3>
                <button onClick={() => toggleSection("mpg")} className="text-xs px-2 py-1 border rounded hover:bg-gray-100">
                  {collapsedSections.mpg ? "Expand" : "Minimise"}
                </button>
              </div>
              {!collapsedSections.mpg && (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">PO No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Guarantee No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Participated</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Bank / Receipt No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Expiry Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Submitted</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">DEWA Release</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Bank Release</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Extension Dates</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Pending Status</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Remarks</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-blue-700 uppercase border-r border-green-200">Edit Page</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase border-l-2 border-gray-300">CG Ref</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Bank</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Expiry</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Status</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Remarks</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-blue-700 uppercase border-l border-green-200">CG Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMpgRows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-gray-700 font-medium whitespace-nowrap">{row.ref_doc_no}</td>
                            <td className="px-2 py-2"><input type="text" value={row.guarantee_no || ''} onChange={(e) => handleGridRowChange('MPG', index, 'guarantee_no', e.target.value)} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><select value={row.participated} onChange={(e) => handleGridRowChange('MPG', index, 'participated', Number(e.target.value))} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"><option value="0">No</option><option value="1">Yes</option></select></td>
                            <td className="px-2 py-2"><select value={row.bank_or_deposit} onChange={(e) => handleGridRowChange('MPG', index, 'bank_or_deposit', Number(e.target.value))} className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"><option value="0">Bank</option><option value="1">Deposit</option></select></td>
                            <td className="px-2 py-2"><input type="text" value={row.bank_or_deposit === 0 ? row.issuing_bank : row.deposit_receipt_no} onChange={(e) => handleGridRowChange('MPG', index, row.bank_or_deposit === 0 ? 'issuing_bank' : 'deposit_receipt_no', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={formatNumber(row.guarantee_value || '')} onChange={(e) => handleGridRowChange('MPG', index, 'guarantee_value', formatNumber(e.target.value))} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.expiry_date || ''} onChange={(e) => handleGridRowChange('MPG', index, 'expiry_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.submitted_date || ''} onChange={(e) => handleGridRowChange('MPG', index, 'submitted_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.release_date_dewa || ''} onChange={(e) => handleGridRowChange('MPG', index, 'release_date_dewa', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.release_date_bank || ''} onChange={(e) => handleGridRowChange('MPG', index, 'release_date_bank', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.extension_dates || ''} onChange={(e) => handleGridRowChange('MPG', index, 'extension_dates', e.target.value)} placeholder="YYYY-MM-DD, ..." className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2">{renderGridStatusDropdown(row.status || 'NOT Issued', (val) => handleGridRowChange('MPG', index, 'status', val))}</td>
                            <td className="px-2 py-2"><input type="text" value={row.remarks || ''} onChange={(e) => handleGridRowChange('MPG', index, 'remarks', e.target.value)} className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2 text-center border-r border-gray-200">
                              <button onClick={() => window.open(`/dashboard/material_performance_guarantee/${row.id}`, '_blank')} className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">Edit Page</button>
                            </td>
                            <td className="px-2 py-2 border-l-2 border-gray-100"><input type="text" value={row.cg_ref_number || ''} disabled className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.cg_date || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('MPG', index, 'cg_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.cg_bank || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('MPG', index, 'cg_bank', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.cg_expiry_date || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('MPG', index, 'cg_expiry_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2">{row.cg_id ? renderGridStatusDropdown(row.cg_status, (v) => handleGridRowChange('MPG', index, 'cg_status', v)) : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                            <td className="px-2 py-2"><input type="text" value={row.cg_remarks || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('MPG', index, 'cg_remarks', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2 text-center border-l border-gray-200">
                              {row.cg_id ? (
                                <button onClick={() => window.open(`/dashboard/counter_guarantee/${row.cg_id}`, '_blank')} className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">Edit CG</button>
                              ) : (
                                <button onClick={() => window.open(`/dashboard/counter_guarantee/create`, '_blank')} className="text-green-600 hover:text-green-800 font-medium text-xs hover:underline">Create CG</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={() => saveGridGuarantees('MPG')} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                      {saving ? 'Saving...' : 'Save All MPG Guarantees'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* PBG Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-purple-700">Performance Bond Guarantees (PBG)</h3>
                <button onClick={() => toggleSection("pbg")} className="text-xs px-2 py-1 border rounded hover:bg-gray-100">
                  {collapsedSections.pbg ? "Expand" : "Minimise"}
                </button>
              </div>
              {!collapsedSections.pbg && (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">PO No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Guarantee No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Bank / Receipt No</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Value</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">PBG Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Expiry Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">DEWA Release</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Bank Release</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Extension Dates</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Pending Status</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Remarks</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-blue-700 uppercase border-r border-purple-200">Edit Page</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase border-l-2 border-gray-300">CG Ref</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Date</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Bank</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Expiry</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Status</th>
                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">CG Remarks</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-blue-700 uppercase border-l border-purple-200">CG Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPbgRows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-2 py-2 text-gray-700 font-medium whitespace-nowrap">{row.ref_doc_no}</td>
                            <td className="px-2 py-2"><input type="text" value={row.guarantee_no || ''} onChange={(e) => handleGridRowChange('PBG', index, 'guarantee_no', e.target.value)} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><select value={row.bank_or_deposit} onChange={(e) => handleGridRowChange('PBG', index, 'bank_or_deposit', Number(e.target.value))} className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"><option value="0">Bank</option><option value="1">Deposit</option></select></td>
                            <td className="px-2 py-2"><input type="text" value={row.bank_or_deposit === 0 ? row.issuing_bank : row.deposit_receipt_no} onChange={(e) => handleGridRowChange('PBG', index, row.bank_or_deposit === 0 ? 'issuing_bank' : 'deposit_receipt_no', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={formatNumber(row.guarantee_value || '')} onChange={(e) => handleGridRowChange('PBG', index, 'guarantee_value', formatNumber(e.target.value))} className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.submitted_date || ''} onChange={(e) => handleGridRowChange('PBG', index, 'submitted_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.expiry_date || ''} onChange={(e) => handleGridRowChange('PBG', index, 'expiry_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.release_date_dewa || ''} onChange={(e) => handleGridRowChange('PBG', index, 'release_date_dewa', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.release_date_bank || ''} onChange={(e) => handleGridRowChange('PBG', index, 'release_date_bank', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.extension_dates || ''} onChange={(e) => handleGridRowChange('PBG', index, 'extension_dates', e.target.value)} placeholder="YYYY-MM-DD, ..." className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2">{renderGridStatusDropdown(row.status || 'NOT Issued', (val) => handleGridRowChange('PBG', index, 'status', val))}</td>
                            <td className="px-2 py-2"><input type="text" value={row.remarks || ''} onChange={(e) => handleGridRowChange('PBG', index, 'remarks', e.target.value)} className="w-32 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2 text-center border-r border-gray-200">
                              <button onClick={() => window.open(`/dashboard/performance_guarantee/${row.id}`, '_blank')} className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">Edit Page</button>
                            </td>
                            <td className="px-2 py-2 border-l-2 border-gray-100"><input type="text" value={row.cg_ref_number || ''} disabled className="w-20 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.cg_date || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('PBG', index, 'cg_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="text" value={row.cg_bank || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('PBG', index, 'cg_bank', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2"><input type="date" value={row.cg_expiry_date || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('PBG', index, 'cg_expiry_date', e.target.value)} className="w-26 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2">{row.cg_id ? renderGridStatusDropdown(row.cg_status, (v) => handleGridRowChange('PBG', index, 'cg_status', v)) : <span className="text-gray-400 text-xs italic">N/A</span>}</td>
                            <td className="px-2 py-2"><input type="text" value={row.cg_remarks || ''} disabled={!row.cg_id} onChange={(e) => handleGridRowChange('PBG', index, 'cg_remarks', e.target.value)} className="w-28 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500" /></td>
                            <td className="px-2 py-2 text-center border-l border-gray-200">
                              {row.cg_id ? (
                                <button onClick={() => window.open(`/dashboard/counter_guarantee/${row.cg_id}`, '_blank')} className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline">Edit CG</button>
                              ) : (
                                <button onClick={() => window.open(`/dashboard/counter_guarantee/create`, '_blank')} className="text-green-600 hover:text-green-800 font-medium text-xs hover:underline">Create CG</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button onClick={() => saveGridGuarantees('PBG')} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                      {saving ? 'Saving...' : 'Save All PBG Guarantees'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      ) : (

      /* =====================================================================
         VIEW MODE 2: PO / TENDER FORMS
         ===================================================================== */
        <div className="space-y-6 mt-6">
          {!selectedTenderId && !selectedOrderId ? (
            <div className="bg-yellow-50 border border-yellow-200 p-6 text-center rounded-lg shadow-sm">
              <p className="text-yellow-800 font-medium">Please select a Tender or PO from the dropdowns above to view the guarantee forms.</p>
            </div>
          ) : (
            <>
              {/* TBG Form */}
              {formTbg ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-blue-800">Tender Bond Guarantee (TBG) Form</h2>
                      <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded">{formTbg.ref_doc_no}</span>
                    </div>
                    <button onClick={() => toggleFormSection('tbg')} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 font-medium transition">
                      {formCollapsed.tbg ? "Expand" : "Minimise"}
                    </button>
                  </div>

                  {!formCollapsed.tbg && (
                    <>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">TBG Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">TBG Option</label>
                          <select value={formTbg.tbg_credit_card_option} onChange={(e) => handleFormChange('TBG', 'tbg_credit_card_option', Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500">
                            <option value="0">Bank Guarantee</option>
                            <option value="1">Credit Card</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{formTbg.tbg_credit_card_option === 0 ? 'TBG No' : 'Payment Ref'}</label>
                          <input type="text" value={formTbg.tbg_credit_card_option === 0 ? formTbg.tbg_no : formTbg.credit_card_payment_ref} onChange={(e) => handleFormChange('TBG', formTbg.tbg_credit_card_option === 0 ? 'tbg_no' : 'credit_card_payment_ref', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{formTbg.tbg_credit_card_option === 0 ? 'Issuing Bank' : 'Deposit Receipt No'}</label>
                          <input type="text" value={formTbg.tbg_credit_card_option === 0 ? formTbg.tbg_issuing_bank : formTbg.tender_deposit_receipt_no} onChange={(e) => handleFormChange('TBG', formTbg.tbg_credit_card_option === 0 ? 'tbg_issuing_bank' : 'tender_deposit_receipt_no', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tendered Value (Items)</label>
                          <input type="text" value={formatNumber(formTbg.tendered_value || '')} readOnly className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 font-medium text-gray-700" title="Calculated from Tender Items" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">TBG Value</label>
                          <input type="text" value={formatNumber(formTbg.tbg_value || '')} onChange={(e) => handleFormChange('TBG', 'tbg_value', formatNumber(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Currency (Main)</label>
                          {renderCurrencyDropdown(formTbg.tendering_currency || 'AED', (val) => handleFormChange('TBG', 'tendering_currency', val))}
                        </div>
                        {/* <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Currency (NQ)</label>
                          {renderCurrencyDropdown(formTbg.tendering_currency_nq || 'AED', (val) => handleFormChange('TBG', 'tendering_currency_nq', val))}
                        </div> */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input type="date" value={formTbg.tbg_date || ''} onChange={(e) => handleFormChange('TBG', 'tbg_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input type="date" value={formTbg.expiry_date || ''} onChange={(e) => handleFormChange('TBG', 'expiry_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Submitted Date</label>
                          <input type="date" value={formTbg.tbg_submitted_date || ''} onChange={(e) => handleFormChange('TBG', 'tbg_submitted_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">DEWA Release Date</label>
                          <input type="date" value={formTbg.tbg_release_date_dewa || ''} onChange={(e) => handleFormChange('TBG', 'tbg_release_date_dewa', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Bank Release Date</label>
                          <input type="date" value={formTbg.tbg_release_date_bank || ''} onChange={(e) => handleFormChange('TBG', 'tbg_release_date_bank', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">ENBD Ref</label>
                          <input type="text" value={formTbg.dewa_enbd_ref || ''} onChange={(e) => handleFormChange('TBG', 'dewa_enbd_ref', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                          <input type="text" value={formTbg.remarks || ''} onChange={(e) => handleFormChange('TBG', 'remarks', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Extension Dates</h3>
                      <div className="flex gap-2 mb-3 max-w-sm">
                        <input type="date" value={extDates.TBG} onChange={(e) => setExtDates({...extDates, TBG: e.target.value})} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        <button type="button" onClick={() => addFormExtensionDate('TBG')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">+ Add</button>
                      </div>
                      {formTbg.extension_dates_array && formTbg.extension_dates_array.length > 0 && (
                        <div className="border border-gray-200 rounded-md overflow-hidden max-w-md mb-6">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr><th className="px-3 py-2 text-left font-medium text-gray-500">Date</th><th className="px-3 py-2 text-right font-medium text-gray-500">Action</th></tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formTbg.extension_dates_array.map((date: string, idx: number) => (
                                <tr key={idx}><td className="px-3 py-2">{date}</td><td className="px-3 py-2 text-right"><button onClick={() => removeFormExtensionDate('TBG', idx)} className="text-red-600 hover:text-red-800 text-xs">Remove</button></td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Section 3: CG */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Counter Guarantee Details</h3>
                          {!formTbg.cg_id && (
                            <button onClick={() => activateInlineCG('TBG')} className="text-xs px-3 py-1 bg-green-100 text-green-700 font-semibold rounded hover:bg-green-200 transition">
                              + Add Counter Guarantee
                            </button>
                          )}
                        </div>
                        
                        {formTbg.cg_id ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Ref Number</label>
                              <input type="text" value={formTbg.cg_ref_number || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Date</label>
                              <input type="date" value={formTbg.cg_date || ''} onChange={(e) => handleFormChange('TBG', 'cg_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Bank</label>
                              <input type="text" value={formTbg.cg_bank || ''} onChange={(e) => handleFormChange('TBG', 'cg_bank', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Expiry Date</label>
                              <input type="date" value={formTbg.cg_expiry_date || ''} onChange={(e) => handleFormChange('TBG', 'cg_expiry_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Status</label>
                              {renderStatusDropdown(formTbg.cg_status, (val) => handleFormChange('TBG', 'cg_status', val))}
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Remarks</label>
                              <input type="text" value={formTbg.cg_remarks || ''} onChange={(e) => handleFormChange('TBG', 'cg_remarks', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No Counter Guarantee attached.</p>
                        )}
                      </div>

                      <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
                        <button onClick={() => openEditTabs('TBG', formTbg.id, formTbg.cg_id, formTbg.isNewCG)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline">
                          Open Edit Pages (Tabs)
                        </button>
                        <button onClick={() => saveSingleForm('TBG')} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50">
                          Save This Guarantee
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : selectedTenderId !== '' && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Tender Bond Guarantee</h3>
                  <p className="text-sm text-gray-500 mb-4">There is no TBG associated with this Tender.</p>
                  <button onClick={() => window.open('/dashboard/tendering_company_details/create', '_blank')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm">
                    + Create TBG
                  </button>
                </div>
              )}

              {/* MPG Form */}
              {formMpg ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-green-800">Material Performance Guarantee (MPG) Form</h2>
                      <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded">{formMpg.ref_doc_no}</span>
                    </div>
                    <button onClick={() => toggleFormSection('mpg')} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 font-medium transition">
                      {formCollapsed.mpg ? "Expand" : "Minimise"}
                    </button>
                  </div>

                  {!formCollapsed.mpg && (
                    <>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">MPG Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Participated</label>
                          <select value={formMpg.participated} onChange={(e) => handleFormChange('MPG', 'participated', Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"><option value="0">No</option><option value="1">Yes</option></select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                          <select value={formMpg.bank_or_deposit} onChange={(e) => handleFormChange('MPG', 'bank_or_deposit', Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"><option value="0">Bank</option><option value="1">Deposit</option></select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Guarantee No</label>
                          <input type="text" value={formMpg.guarantee_no || ''} onChange={(e) => handleFormChange('MPG', 'guarantee_no', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{formMpg.bank_or_deposit === 0 ? 'Issuing Bank' : 'Receipt No'}</label>
                          <input type="text" value={formMpg.bank_or_deposit === 0 ? formMpg.issuing_bank : formMpg.deposit_receipt_no} onChange={(e) => handleFormChange('MPG', formMpg.bank_or_deposit === 0 ? 'issuing_bank' : 'deposit_receipt_no', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                          <input type="text" value={formatNumber(formMpg.guarantee_value || '')} onChange={(e) => handleFormChange('MPG', 'guarantee_value', formatNumber(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input type="date" value={formMpg.expiry_date || ''} onChange={(e) => handleFormChange('MPG', 'expiry_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Submitted Date</label>
                          <input type="date" value={formMpg.submitted_date || ''} onChange={(e) => handleFormChange('MPG', 'submitted_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">DEWA Release</label>
                          <input type="date" value={formMpg.release_date_dewa || ''} onChange={(e) => handleFormChange('MPG', 'release_date_dewa', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Bank Release</label>
                          <input type="date" value={formMpg.release_date_bank || ''} onChange={(e) => handleFormChange('MPG', 'release_date_bank', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          {renderStatusDropdown(formMpg.status, (val) => handleFormChange('MPG', 'status', val))}
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                          <input type="text" value={formMpg.remarks || ''} onChange={(e) => handleFormChange('MPG', 'remarks', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Extension Dates</h3>
                      <div className="flex gap-2 mb-3 max-w-sm">
                        <input type="date" value={extDates.MPG} onChange={(e) => setExtDates({...extDates, MPG: e.target.value})} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        <button type="button" onClick={() => addFormExtensionDate('MPG')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">+ Add</button>
                      </div>
                      {formMpg.extension_dates_array && formMpg.extension_dates_array.length > 0 && (
                        <div className="border border-gray-200 rounded-md overflow-hidden max-w-md mb-6">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr><th className="px-3 py-2 text-left font-medium text-gray-500">Date</th><th className="px-3 py-2 text-right font-medium text-gray-500">Action</th></tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formMpg.extension_dates_array.map((date: string, idx: number) => (
                                <tr key={idx}><td className="px-3 py-2">{date}</td><td className="px-3 py-2 text-right"><button onClick={() => removeFormExtensionDate('MPG', idx)} className="text-red-600 hover:text-red-800 text-xs">Remove</button></td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Section 3: CG */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Counter Guarantee Details</h3>
                          {!formMpg.cg_id && (
                            <button onClick={() => activateInlineCG('MPG')} className="text-xs px-3 py-1 bg-green-100 text-green-700 font-semibold rounded hover:bg-green-200 transition">
                              + Add Counter Guarantee
                            </button>
                          )}
                        </div>
                        
                        {formMpg.cg_id ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Ref Number</label>
                              <input type="text" value={formMpg.cg_ref_number || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Date</label>
                              <input type="date" value={formMpg.cg_date || ''} onChange={(e) => handleFormChange('MPG', 'cg_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Bank</label>
                              <input type="text" value={formMpg.cg_bank || ''} onChange={(e) => handleFormChange('MPG', 'cg_bank', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Expiry Date</label>
                              <input type="date" value={formMpg.cg_expiry_date || ''} onChange={(e) => handleFormChange('MPG', 'cg_expiry_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Status</label>
                              {renderStatusDropdown(formMpg.cg_status, (val) => handleFormChange('MPG', 'cg_status', val))}
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Remarks</label>
                              <input type="text" value={formMpg.cg_remarks || ''} onChange={(e) => handleFormChange('MPG', 'cg_remarks', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No Counter Guarantee attached.</p>
                        )}
                      </div>

                      <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
                        <button onClick={() => openEditTabs('MPG', formMpg.id, formMpg.cg_id, formMpg.isNewCG)} className="text-green-600 hover:text-green-800 font-semibold text-sm hover:underline">
                          Open Edit Pages (Tabs)
                        </button>
                        <button onClick={() => saveSingleForm('MPG')} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50">
                          Save This Guarantee
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : selectedOrderId !== '' && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Material Performance Guarantee</h3>
                  <p className="text-sm text-gray-500 mb-4">There is no MPG associated with this PO.</p>
                  <button onClick={() => window.open('/dashboard/material_performance_guarantee/create', '_blank')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium text-sm">
                    + Create MPG
                  </button>
                </div>
              )}

              {/* PBG Form */}
              {formPbg ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-purple-800">Performance Bond Guarantee (PBG) Form</h2>
                      <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-100 rounded">{formPbg.ref_doc_no}</span>
                    </div>
                    <button onClick={() => toggleFormSection('pbg')} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 font-medium transition">
                      {formCollapsed.pbg ? "Expand" : "Minimise"}
                    </button>
                  </div>

                  {!formCollapsed.pbg && (
                    <>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">PBG Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                          <select value={formPbg.bank_or_deposit} onChange={(e) => handleFormChange('PBG', 'bank_or_deposit', Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"><option value="0">Bank</option><option value="1">Deposit</option></select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Guarantee No</label>
                          <input type="text" value={formPbg.guarantee_no || ''} onChange={(e) => handleFormChange('PBG', 'guarantee_no', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{formPbg.bank_or_deposit === 0 ? 'Issuing Bank' : 'Receipt No'}</label>
                          <input type="text" value={formPbg.bank_or_deposit === 0 ? formPbg.issuing_bank : formPbg.deposit_receipt_no} onChange={(e) => handleFormChange('PBG', formPbg.bank_or_deposit === 0 ? 'issuing_bank' : 'deposit_receipt_no', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                          <input type="text" value={formatNumber(formPbg.guarantee_value || '')} onChange={(e) => handleFormChange('PBG', 'guarantee_value', formatNumber(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input type="date" value={formPbg.expiry_date || ''} onChange={(e) => handleFormChange('PBG', 'expiry_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Submitted Date</label>
                          <input type="date" value={formPbg.submitted_date || ''} onChange={(e) => handleFormChange('PBG', 'submitted_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">DEWA Release</label>
                          <input type="date" value={formPbg.release_date_dewa || ''} onChange={(e) => handleFormChange('PBG', 'release_date_dewa', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Bank Release</label>
                          <input type="date" value={formPbg.release_date_bank || ''} onChange={(e) => handleFormChange('PBG', 'release_date_bank', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          {renderStatusDropdown(formPbg.status, (val) => handleFormChange('PBG', 'status', val))}
                        </div>
                        <div className="lg:col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                          <input type="text" value={formPbg.remarks || ''} onChange={(e) => handleFormChange('PBG', 'remarks', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Extension Dates</h3>
                      <div className="flex gap-2 mb-3 max-w-sm">
                        <input type="date" value={extDates.PBG} onChange={(e) => setExtDates({...extDates, PBG: e.target.value})} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                        <button type="button" onClick={() => addFormExtensionDate('PBG')} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium">+ Add</button>
                      </div>
                      {formPbg.extension_dates_array && formPbg.extension_dates_array.length > 0 && (
                        <div className="border border-gray-200 rounded-md overflow-hidden max-w-md mb-6">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr><th className="px-3 py-2 text-left font-medium text-gray-500">Date</th><th className="px-3 py-2 text-right font-medium text-gray-500">Action</th></tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formPbg.extension_dates_array.map((date: string, idx: number) => (
                                <tr key={idx}><td className="px-3 py-2">{date}</td><td className="px-3 py-2 text-right"><button onClick={() => removeFormExtensionDate('PBG', idx)} className="text-red-600 hover:text-red-800 text-xs">Remove</button></td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Section 3: CG */}
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Counter Guarantee Details</h3>
                          {!formPbg.cg_id && (
                            <button onClick={() => activateInlineCG('PBG')} className="text-xs px-3 py-1 bg-green-100 text-green-700 font-semibold rounded hover:bg-green-200 transition">
                              + Add Counter Guarantee
                            </button>
                          )}
                        </div>
                        
                        {formPbg.cg_id ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Ref Number</label>
                              <input type="text" value={formPbg.cg_ref_number || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Date</label>
                              <input type="date" value={formPbg.cg_date || ''} onChange={(e) => handleFormChange('PBG', 'cg_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Bank</label>
                              <input type="text" value={formPbg.cg_bank || ''} onChange={(e) => handleFormChange('PBG', 'cg_bank', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Expiry Date</label>
                              <input type="date" value={formPbg.cg_expiry_date || ''} onChange={(e) => handleFormChange('PBG', 'cg_expiry_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Status</label>
                              {renderStatusDropdown(formPbg.cg_status, (val) => handleFormChange('PBG', 'cg_status', val))}
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">CG Remarks</label>
                              <input type="text" value={formPbg.cg_remarks || ''} onChange={(e) => handleFormChange('PBG', 'cg_remarks', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No Counter Guarantee attached.</p>
                        )}
                      </div>

                      <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-200">
                        <button onClick={() => openEditTabs('PBG', formPbg.id, formPbg.cg_id, formPbg.isNewCG)} className="text-purple-600 hover:text-purple-800 font-semibold text-sm hover:underline">
                          Open Edit Pages (Tabs)
                        </button>
                        <button onClick={() => saveSingleForm('PBG')} disabled={saving} className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50">
                          Save This Guarantee
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : selectedOrderId !== '' && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Performance Bond Guarantee</h3>
                  <p className="text-sm text-gray-500 mb-4">There is no PBG associated with this PO.</p>
                  <button onClick={() => window.open('/dashboard/performance_guarantee/create', '_blank')} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium text-sm">
                    + Create PBG
                  </button>
                </div>
              )}

              {/* Master Save Button */}
              {(formTbg || formMpg || formPbg) && (
                <div className="flex justify-end pt-4 border-t border-gray-300">
                  <button onClick={saveAllForms} disabled={saving} className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50 flex items-center gap-2 font-bold shadow-sm">
                    {saving && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {saving ? 'Saving Everything...' : 'Save All Guarantees on Page'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}