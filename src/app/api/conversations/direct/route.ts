import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Deprecated endpoint. Client now calls RPC directly.' }, { status: 410 })
}
