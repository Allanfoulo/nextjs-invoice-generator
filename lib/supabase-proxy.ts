// Utility functions to call Supabase through our proxy API to avoid CORS issues

const API_BASE_URL = '/api/supabase-proxy'

interface SupabaseProxyRequest {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | 'count'
  data?: any
  filters?: {
    select?: string
    eq?: Record<string, any>
    neq?: Record<string, any>
    gt?: Record<string, any>
    lt?: Record<string, any>
    gte?: Record<string, any>
    lte?: Record<string, any>
    like?: Record<string, string>
    ilike?: Record<string, string>
    in?: Record<string, readonly any[]>
    order?: { column: string; ascending?: boolean }
    limit?: number
    range?: { from: number; to: number }
  }
  options?: any
}

interface SupabaseProxyResponse {
  data?: any
  error?: any
  count?: number
}

export async function supabaseProxy(request: SupabaseProxyRequest): Promise<SupabaseProxyResponse> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Supabase proxy request failed:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Convenience functions for common operations
export async function proxySelect(
  table: string,
  filters?: SupabaseProxyRequest['filters']
): Promise<SupabaseProxyResponse> {
  return supabaseProxy({ table, operation: 'select', filters })
}

export async function proxyInsert(
  table: string,
  data: any
): Promise<SupabaseProxyResponse> {
  return supabaseProxy({ table, operation: 'insert', data })
}

export async function proxyUpdate(
  table: string,
  data: any,
  filters?: SupabaseProxyRequest['filters']
): Promise<SupabaseProxyResponse> {
  return supabaseProxy({ table, operation: 'update', data, filters })
}

export async function proxyDelete(
  table: string,
  filters?: SupabaseProxyRequest['filters']
): Promise<SupabaseProxyResponse> {
  return supabaseProxy({ table, operation: 'delete', filters })
}

export async function proxyUpsert(
  table: string,
  data: any,
  options?: any
): Promise<SupabaseProxyResponse> {
  return supabaseProxy({ table, operation: 'upsert', data, options })
}

export async function proxyCount(
  table: string,
  filters?: SupabaseProxyRequest['filters']
): Promise<SupabaseProxyResponse> {
  return supabaseProxy({ table, operation: 'count', filters })
}