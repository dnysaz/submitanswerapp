import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: list all classes with submission counts
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('classes')
    .select('id, name, created_at, submissions(count)')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
