import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public: list all classes (for student landing page)
export async function GET() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Teacher: create a new class (password required)
export async function POST(req: NextRequest) {
  const { name, password } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Class name is required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Teacher: delete a class (password required)
export async function DELETE(req: NextRequest) {
  const { classId, password } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const { error } = await supabase.from('classes').delete().eq('id', classId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
