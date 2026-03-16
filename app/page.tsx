'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem { id: string; name: string }

const CARD_COLORS = [
  { bg: 'bg-blue-600' }, { bg: 'bg-green-600' }, { bg: 'bg-purple-600' },
  { bg: 'bg-orange-500' }, { bg: 'bg-pink-500' }, { bg: 'bg-teal-600' },
  { bg: 'bg-red-500' }, { bg: 'bg-indigo-600' },
]

export default function LandingPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [nama, setNama] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentError, setStudentError] = useState('')

  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [teacherPassword, setTeacherPassword] = useState('')
  const [teacherError, setTeacherError] = useState('')
  const [teacherLoading, setTeacherLoading] = useState(false)

  useEffect(() => {
    fetch('/api/classes')
      .then(r => r.json())
      .then(data => { setClasses(Array.isArray(data) ? data : []); setLoadingClasses(false) })
      .catch(() => setLoadingClasses(false))
  }, [])

  function handleSelectClass(cls: ClassItem) {
    setSelectedClass(cls)
    setNama('')
    setStudentId('')
    setStudentError('')
  }

  function handleStart(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!nama.trim()) { setStudentError('Please enter your full name.'); return }
    if (!studentId.trim()) { setStudentError('Please enter your Student ID.'); return }
    sessionStorage.setItem('siswa_nama', nama.trim())
    sessionStorage.setItem('siswa_student_id', studentId.trim())
    sessionStorage.setItem('siswa_class_id', selectedClass!.id)
    sessionStorage.setItem('siswa_class_name', selectedClass!.name)
    router.push('/editor')
  }

  async function handleTeacherLogin(e: { preventDefault: () => void }) {
    e.preventDefault()
    setTeacherLoading(true)
    setTeacherError('')
    const res = await fetch(`/api/admin?password=${encodeURIComponent(teacherPassword)}`)
    if (res.ok) {
      sessionStorage.setItem('admin_password', teacherPassword)
      router.push('/admin')
    } else {
      setTeacherError('Incorrect password.')
    }
    setTeacherLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-base font-semibold text-gray-800 tracking-tight">SubmitAnswerApp</span>
        </div>
        <button onClick={() => setShowTeacherModal(true)}
          className="text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Teacher
        </button>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100 px-4 py-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5">Select Your Class</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">Tap your class, enter your name and ID, and start writing.</p>
      </div>

      {/* Classes grid */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
        {loadingClasses ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-20 bg-gray-200" /><div className="p-3"><div className="h-3 bg-gray-100 rounded w-2/3" /></div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">No classes available</p>
            <p className="text-xs text-gray-400 mt-1">Ask your teacher to create a class first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {classes.map((cls, i) => {
              const color = CARD_COLORS[i % CARD_COLORS.length].bg
              const initials = cls.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button key={cls.id} onClick={() => handleSelectClass(cls)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md active:scale-95 transition-all text-left">
                  <div className={`${color} h-20 flex items-end px-3 pb-2.5 relative`}>
                    <div className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{initials}</span>
                    </div>
                    <span className="text-white font-bold text-sm leading-tight line-clamp-2">{cls.name}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Tap to join</span>
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">SubmitAnswerApp &copy; {new Date().getFullYear()}</footer>

      {/* Student join modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setSelectedClass(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`${CARD_COLORS[classes.findIndex(c => c.id === selectedClass.id) % CARD_COLORS.length].bg} px-5 pt-5 pb-4`}>
              <p className="text-white/70 text-xs font-medium mb-0.5">Joining class</p>
              <h2 className="text-white text-xl font-bold leading-tight">{selectedClass.name}</h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleStart} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Full Name</label>
                  <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="e.g. John Smith" autoFocus
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Student ID</label>
                  <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="e.g. 2024001"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                </div>
                {studentError && <p className="text-red-500 text-xs">{studentError}</p>}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setSelectedClass(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl text-sm transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">Start Writing</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teacher modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowTeacherModal(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Teacher Access</h2>
              <button onClick={() => setShowTeacherModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleTeacherLogin} className="space-y-3">
              <input type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} placeholder="Password" autoFocus
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
              {teacherError && <p className="text-red-500 text-xs">{teacherError}</p>}
              <button type="submit" disabled={teacherLoading}
                className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                {teacherLoading ? 'Checking...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
