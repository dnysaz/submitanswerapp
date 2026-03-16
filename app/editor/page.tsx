'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const MAX_WORDS = 1000
const MAX_IMAGE_BYTES = 1 * 1024 * 1024 // 1 MB

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function EditorPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [studentId, setStudentId] = useState('')
  const [className, setClassName] = useState('')
  const [classId, setClassId] = useState('')
  const [jawaban, setJawaban] = useState('')
  const [gambar, setGambar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageSizeError, setImageSizeError] = useState('')

  // Steps: 'edit' | 'preview'
  const [step, setStep] = useState<'edit' | 'preview'>('edit')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPasteToast, setShowPasteToast] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wordCount = countWords(jawaban)
  const isOverLimit = wordCount > MAX_WORDS

  useEffect(() => {
    const n = sessionStorage.getItem('siswa_nama')
    const sid = sessionStorage.getItem('siswa_student_id')
    const cid = sessionStorage.getItem('siswa_class_id')
    const cname = sessionStorage.getItem('siswa_class_name')
    if (!n || !sid || !cid) { router.replace('/'); return }
    setNama(n); setStudentId(sid); setClassId(cid); setClassName(cname ?? '')

    // Restore draft from localStorage
    const draftKey = `draft_${cid}_${sid}`
    const saved = localStorage.getItem(draftKey)
    if (saved) setJawaban(saved)
  }, [router])

  // Auto-save draft to localStorage on every keystroke (debounced 500ms)
  useEffect(() => {
    if (!classId || !studentId) return
    const draftKey = `draft_${classId}_${studentId}`
    const timer = setTimeout(() => {
      if (jawaban) localStorage.setItem(draftKey, jawaban)
      else localStorage.removeItem(draftKey)
    }, 500)
    return () => clearTimeout(timer)
  }, [jawaban, classId, studentId])

  const triggerPasteToast = useCallback(() => {
    setShowPasteToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowPasteToast(false), 2500)
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const blockAndToast = (e: Event) => { e.preventDefault(); triggerPasteToast() }
    const blockOnly = (e: Event) => e.preventDefault()
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault(); triggerPasteToast()
      }
    }
    el.addEventListener('paste', blockAndToast)
    el.addEventListener('contextmenu', blockAndToast)
    el.addEventListener('copy', blockOnly)
    el.addEventListener('cut', blockOnly)
    el.addEventListener('keydown', handleKey)
    return () => {
      el.removeEventListener('paste', blockAndToast)
      el.removeEventListener('contextmenu', blockAndToast)
      el.removeEventListener('copy', blockOnly)
      el.removeEventListener('cut', blockOnly)
      el.removeEventListener('keydown', handleKey)
    }
  }, [triggerPasteToast])

  function handleGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setImageSizeError('Image exceeds 1 MB. Please choose a smaller image.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setImageSizeError('')
    setGambar(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleGoToPreview() {
    if (!jawaban.trim()) { setError('Answer cannot be empty.'); return }
    if (isOverLimit) { setError(`Answer exceeds ${MAX_WORDS} words.`); return }
    setError('')
    setStep('preview')
    window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('nama', nama)
      formData.append('student_id', studentId)
      formData.append('class_id', classId)
      formData.append('class_name', className)
      formData.append('jawaban', jawaban)
      if (gambar) formData.append('gambar', gambar)

      const res = await fetch('/api/submit', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'duplicate') {
          setStep('edit')
          setError(data.message)
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      localStorage.removeItem(`draft_${classId}_${studentId}`)
      sessionStorage.clear()
      router.push('/success')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const wordPercent = Math.min((wordCount / MAX_WORDS) * 100, 100)
  const barColor = isOverLimit ? 'bg-red-500' : wordCount > 800 ? 'bg-orange-400' : 'bg-blue-500'

  // ─── PREVIEW SCREEN ───────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setStep('edit')} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-800">Preview Answer</p>
            <p className="text-xs text-gray-400">Check before submitting</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">
          {/* Info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5 mb-5 space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-blue-400 font-medium">Name</span>
              <span className="text-blue-900 font-semibold">{nama}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-400 font-medium">Student ID</span>
              <span className="text-blue-900 font-semibold">{studentId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-400 font-medium">Class</span>
              <span className="text-blue-900 font-semibold">{className}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-400 font-medium">Words</span>
              <span className="text-blue-900 font-semibold">{wordCount} / {MAX_WORDS}</span>
            </div>
          </div>

          {/* Image preview */}
          {preview && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Attached Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="attached" className="w-full max-h-48 object-contain rounded-xl border border-gray-100" />
            </div>
          )}

          {/* Answer text */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Answer</p>
            <div className="bg-gray-50 rounded-2xl px-4 py-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {jawaban}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Confirm question */}
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 mb-4 text-center">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">Is everything correct?</p>
            <p className="text-xs text-gray-400">You cannot edit after submitting.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('edit')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl text-sm transition-colors">
              Edit Again
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors">
              {loading ? 'Submitting...' : 'Submit Now'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ─── EDITOR SCREEN ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => jawaban.trim() ? setShowBackConfirm(true) : router.replace('/')}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-gray-800">{nama} <span className="font-normal text-gray-400">· {studentId}</span></p>
            <p className="text-[10px] text-gray-400">{className}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOverLimit ? 'bg-red-100 text-red-600' : wordCount > 800 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
            {wordCount}/{MAX_WORDS}
          </span>
          <button
            onClick={handleGoToPreview}
            disabled={isOverLimit || !jawaban.trim()}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Next
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Word count bar */}
      <div className="w-full h-0.5 bg-gray-100">
        <div className={`h-full transition-all ${barColor}`} style={{ width: `${wordPercent}%` }} />
      </div>

      <main className="flex-1 flex flex-col px-4 pt-4 pb-4 max-w-5xl mx-auto w-full">

        {/* Image row — compact, left-aligned thumbnail */}
        <div className="mb-3">
          <div className="flex items-center gap-3">
            {preview ? (
              <>
                <button onClick={() => setShowImageModal(true)} className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="preview" className="w-14 h-14 object-cover rounded-xl border border-gray-200" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{gambar?.name}</p>
                  <p className="text-[10px] text-gray-400">{gambar ? formatBytes(gambar.size) : ''}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setShowImageModal(true)} className="text-[11px] text-blue-500 font-medium">View</button>
                    <span className="text-gray-200">·</span>
                    <label className="text-[11px] text-gray-500 cursor-pointer hover:text-gray-700">
                      Change<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGambar} />
                    </label>
                    <span className="text-gray-200">·</span>
                    <button onClick={() => { setGambar(null); setPreview(null); setImageSizeError(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="text-[11px] text-red-400 hover:text-red-600">Remove</button>
                  </div>
                </div>
              </>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Upload Image</p>
                  <p className="text-[10px] text-gray-400">Max 1 MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGambar} />
              </label>
            )}
          </div>
          {imageSizeError && <p className="text-red-500 text-xs mt-1.5">{imageSizeError}</p>}
        </div>

        {/* Thin divider */}
        <div className="border-t border-gray-100 mb-3" />

        {/* Frameless textarea — fills remaining space */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={jawaban}
            onChange={e => setJawaban(e.target.value)}
            placeholder="Write your answer here…"
            className="flex-1 w-full min-h-64 sm:min-h-96 text-[16px] text-gray-800 leading-relaxed resize-none focus:outline-none bg-white placeholder-gray-300"
            spellCheck={false}
            style={{ WebkitUserSelect: 'text' }}
          />
        </div>

        {(isOverLimit || error) && (
          <div className="border-t border-gray-100 pt-2 mt-2">
            {isOverLimit && (
              <p className="text-red-500 text-xs">Answer exceeds {MAX_WORDS} words. Please shorten it.</p>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5 mt-1">
                {error}
              </div>
            )}
          </div>
        )}
        <p className="text-center text-[10px] text-gray-300 mt-3 mb-1">Copy &amp; paste is disabled</p>
      </main>

      {/* Paste toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 z-50 pointer-events-none ${showPasteToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Paste function is disabled.
        </div>
      </div>

      {/* Full image modal */}
      {showImageModal && preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="full view" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setShowImageModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Back confirm modal */}
      {showBackConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1">Leave this page?</h3>
            <p className="text-sm text-gray-500 mb-5">Your answer will be lost if you go back.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowBackConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm transition-colors">Stay</button>
              <button onClick={() => router.replace('/')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
