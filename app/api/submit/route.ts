import { NextRequest, NextResponse } from 'next/server'
import { generatePdf } from '@/lib/generatePdf'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const nama = formData.get('nama') as string
    const studentId = formData.get('student_id') as string
    const classId = formData.get('class_id') as string
    const className = formData.get('class_name') as string
    const jawaban = formData.get('jawaban') as string
    const imageFile = formData.get('gambar') as File | null

    if (!nama || !studentId || !classId || !jawaban) {
      return NextResponse.json({ error: 'Incomplete data.' }, { status: 400 })
    }

    // Check duplicate: student_id already submitted for this class
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: 'duplicate',
        message: 'You have already submitted an answer for this class. Please contact your teacher if you need to resubmit.',
      }, { status: 409 })
    }

    let imageBase64: string | undefined
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      imageBase64 = `data:${imageFile.type};base64,${base64}`
    }

    const tanggal = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    const pdfBuffer = await generatePdf({ nama, studentId, className, jawaban, imageBase64, tanggal })

    const safeName = nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
    const fileName = `${safeName}_${studentId}_${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf' })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('submissions').getPublicUrl(fileName)

    const { error: dbError } = await supabase
      .from('submissions')
      .insert({ nama, student_id: studentId, class_id: classId, jawaban, pdf_url: publicUrl })
    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
