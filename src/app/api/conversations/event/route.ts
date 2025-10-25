import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint. Client now queries Supabase directly.' }, { status: 410 })
}
