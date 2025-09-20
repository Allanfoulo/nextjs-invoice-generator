import { NextResponse } from "next/server"

type LoginBody = {
  email?: string
  password?: string
  remember?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody
    const { email, password } = body ?? {}

    // Mocked auth check: success only for these sample credentials
    const isValid = email === "demo@example.com" && password === "password123"

    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // In a real app, set a cookie or session here.
    return NextResponse.json({ success: true, user: { email } }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }
}