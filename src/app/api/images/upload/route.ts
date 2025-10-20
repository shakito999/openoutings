import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServiceClient } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const input = Buffer.from(arrayBuffer)

    const width = Number(process.env.IMAGE_MAX_WIDTH ?? 1600)
    const height = Number(process.env.IMAGE_MAX_HEIGHT ?? 1600)
    const quality = Number(process.env.IMAGE_QUALITY ?? 80)

    const output = await sharp(input)
      .rotate()
      .resize({ width, height, fit: 'inside' })
      .jpeg({ quality })
      .toBuffer()

    const supabase = createServiceClient()
    const bucket = 'images'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const path = `uploads/${fileName}`

    const { error } = await supabase.storage.from(bucket).upload(path, output, {
      contentType: 'image/jpeg',
      upsert: false,
    })
    if (error) throw error

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ path, url: publicUrl.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Upload failed' }, { status: 500 })
  }
}
