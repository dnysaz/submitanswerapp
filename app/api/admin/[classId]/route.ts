import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: submissions for a class
export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const password = req.nextUrl.searchParams.get('password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('id, nama, pdf_url, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: delete submissions by IDs
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  await params
  const password = req.nextUrl.searchParams.get('password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const { ids } = await req.json() as { ids: string[] }

  // Get pdf paths to remove from storage
  const { data: rows } = await supabase
    .from('submissions')
    .select('pdf_url')
    .in('id', ids)

  if (rows && rows.length > 0) {
    const paths = rows
      .map((s: { pdf_url: string }) => s.pdf_url.split('/submissions/')[1])
      .filter(Boolean)
    if (paths.length > 0) {
      await supabase.storage.from('submissions').remove(paths)
    }
  }

  const { error } = await supabase.from('submissions').delete().in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
