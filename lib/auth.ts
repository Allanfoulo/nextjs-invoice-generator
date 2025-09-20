"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

export const TOKEN_COOKIE = "demo_token"

function parseCookies(): Record<string, string> {
  if (typeof document === "undefined") return {}
  return document.cookie
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf("=")
      if (idx === -1) return acc
      const key = decodeURIComponent(pair.slice(0, idx))
      const val = decodeURIComponent(pair.slice(idx + 1))
      acc[key] = val
      return acc
    }, {} as Record<string, string>)
}

export function getToken(): string | null {
  const cookies = parseCookies()
  return cookies[TOKEN_COOKIE] ?? null
}

export function setToken(token: string, remember = false): void {
  if (typeof document === "undefined") return
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8 // 30d or 8h in seconds
  document.cookie =
    `${encodeURIComponent(TOKEN_COOKIE)}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

export function clearToken(): void {
  if (typeof document === "undefined") return
  document.cookie = `${encodeURIComponent(TOKEN_COOKIE)}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null)

  // Initialize from cookie on mount
  useEffect(() => {
    setTokenState(getToken())
    const id = setInterval(() => {
      // Poll infrequently to catch changes from other tabs
      const current = getToken()
      setTokenState((prev) => (prev !== current ? current : prev))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const isAuthenticated = useMemo(() => Boolean(token), [token])

  const login = useCallback((newToken: string, remember = false) => {
    setToken(newToken, remember)
    setTokenState(newToken)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
  }, [])

  return { token, isAuthenticated, login, logout }
}