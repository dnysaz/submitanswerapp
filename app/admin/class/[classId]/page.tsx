'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

interface Submission {
  id: string
  nama: string
  pdf_url: string
  created_at: string
}

export default function ClassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const classId = params.classId as string
  const className = searchParams.get('name') ?? 'Class'

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [authPassword, setAuthPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)

  useEffect(() => {
    const pwd = sessionStorage.getItem('admin_password')
    if (!pwd) { router.replace('/admin'); return }
    setAuthPassword(pwd)
    fetch(`/api/admin/${classId}?password=${encodeURIComponent(pwd)}`).then(async res => {
      if (res.ok) { setSubmissions(await res.json()); setAuthed(true) }
      else router.replace('/admin')
      setLoading(false)
    })
  }, [classId, router])

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleAll() {
    setSelected(selected.size === submissions.length ? new Set() : new Set(submissions.map(s => s.id)))
  }

  async function handleDelete() {
    setDeleting(true)
    const ids = Array.from(selected)
    const res = await fetch(`/api/admin/${classId}?password=${encodeURIComponent(authPassword)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) { setSubmissions(prev => prev.filter(s => !ids.includes(s.id))); setSelected(new Set()) }
    setDeleting(false)
    setConfirmDelete(false)
  }

  async function handleDownloadSelected() {
    if (downloading) return

    const toDownload = submissions.filter(s => selected.has(s.id))
    if (toDownload.length === 0) return

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    setDownloading(true)
    setDownloadProgress({ current: 0, total: toDownload.length })

    try {
      for (let i = 0; i < toDownload.length; i++) {
        const s = toDownload[i]
        setDownloadProgress({ current: i + 1, total: toDownload.length })

        // Fetch the PDF as blob
        const response = await fetch(s.pdf_url)
        const blob = await response.blob()

        // Sanitize filename: replace characters not allowed in filenames
        const safeName = s.nama.replace(/[\/\\:*?"<>|]/g, '_')
        const filename = `${safeName}.pdf`

        zip.file(filename, blob)
      }

      // Generate the zip and trigger download
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${className.replace(/\s+/g, '_')}_submissions.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Gagal mengunduh file. Coba lagi.')
    } finally {
      setDownloading(false)
      setDownloadProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const allSelected = selected.size === submissions.length && submissions.length > 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin')} className="text-gray-400 hover:text-gray-600 mr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <span className="text-xs text-gray-400">Dashboard /&nbsp;</span>
            <span className="text-sm font-semibold text-gray-700">{className}</span>
          </div>
        </div>
        <button onClick={() => { sessionStorage.removeItem('admin_password'); router.push('/') }}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium">Sign out</button>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-6xl mx-auto w-full">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{className}</h1>
            <p className="text-sm text-gray-400">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
          </div>

          {submissions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${allSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                  {allSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                Select All
              </button>
              {selected.size > 0 && (
                <>
                  <button
                    onClick={handleDownloadSelected}
                    disabled={downloading}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        {downloadProgress
                          ? `${downloadProgress.current}/${downloadProgress.total}`
                          : 'Preparing...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download ({selected.size}) .zip
                      </>
                    )}
                  </button>
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete ({selected.size})
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Student answers for this class will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {submissions.map(s => {
              const isSelected = selected.has(s.id)
              const date = new Date(s.created_at)
              const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              const initials = s.nama.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

              return (
                <div key={s.id} onClick={() => toggleSelect(s.id)}
                  className={`group relative bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                  {/* Checkbox */}
                  <div className={`absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  {/* PDF icon */}
                  <div className="flex justify-center mb-3 mt-2">
                    <div className="w-12 h-14 bg-red-50 rounded-lg flex flex-col items-center justify-center border border-red-100">
                      <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                        <path d="M8 14h8v1H8zm0 2h5v1H8z"/>
                      </svg>
                      <span className="text-[9px] font-bold text-red-400 mt-0.5">PDF</span>
                    </div>
                  </div>
                  {/* Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">{initials}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 truncate">{s.nama}</p>
                  </div>
                  <p className="text-[10px] text-gray-400">{dateStr}</p>
                  <p className="text-[10px] text-gray-300">{timeStr}</p>
                  {/* Preview + Download buttons */}
                  <div className="mt-3 flex gap-1.5">
                    <button
                      onClick={e => { e.stopPropagation(); setPreviewSubmission(s) }}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-medium py-1.5 rounded-lg transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview
                    </button>
                    <a href={s.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-medium py-1.5 rounded-lg transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Download progress overlay */}
      {downloading && downloadProgress && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl px-5 py-4 flex items-center gap-4 min-w-60">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Menyiapkan ZIP...</p>
            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{downloadProgress.current} / {downloadProgress.total} file</p>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">
              {`Delete ${selected.size} Submission${selected.size > 1 ? 's' : ''}?`}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={() => handleDelete()} disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview modal */}
      {previewSubmission && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{previewSubmission.nama}</p>
                <p className="text-white/50 text-xs">{new Date(previewSubmission.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewSubmission.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
              <button
                onClick={() => setPreviewSubmission(null)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`${previewSubmission.pdf_url}#toolbar=0`}
              className="w-full h-full border-0"
              title={`Preview — ${previewSubmission.nama}`}
            />
          </div>
        </div>
      )}
    </div>
  )
}