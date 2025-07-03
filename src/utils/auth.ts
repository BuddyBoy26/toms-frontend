// /utils/auth.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://toms-backend-a7ot.onrender.com/api'

interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Registration failed')
  }
}

export async function login(email: string, password: string) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)

  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Login failed')
  }
  const data = (await res.json()) as TokenResponse
  // save token however you like—here we use localStorage
  localStorage.setItem('kkabbas_token', data.access_token)
}

export async function getCurrentUser() {
  const token = localStorage.getItem('kkabbas_token')
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${API_BASE}/user/me`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Not authenticated')
  return await res.json() as { id: number; email: string; full_name: string }
}

