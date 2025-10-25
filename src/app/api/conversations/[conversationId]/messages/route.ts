import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Deprecated endpoint. Client now queries Supabase directly.' }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint. Client now inserts directly to Supabase.' }, { status: 410 })
}
