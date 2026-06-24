// src/utils/reminderTrigger.ts
//
// Fire-and-forget reminder regeneration.
// Call after a successful save on any page that maps to a reminder rule.
// The call is non-blocking — it won't slow down navigation or show errors.

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL

type ReminderSource =
  | 'tendering_companies'        // rule 1
  | 'order_details'              // rules 2, 4, 11
  | 'performance_guarantee'      // rule 3
  | 'material_performance_guarantee' // rules 5, 12
  | 'lot_monitoring'             // rules 6, 10, 13, 14
  | 'delivery_procedure'         // rules 7, 8, 9

/**
 * Trigger reminder regeneration for a specific source table.
 * Fire-and-forget: runs in the background, never throws, never blocks the UI.
 */
export function triggerReminders(source: ReminderSource): void {
  const token = localStorage.getItem('kkabbas_token')
  console.log(`hit for source ${source}`)
  if (!token || !API_BASE) return

  fetch(`${API_BASE}/reminders/regenerate/${source}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    // Silently ignore — reminders are non-critical
    console.warn(`[reminders] Failed to regenerate for ${source}`)
  })
}