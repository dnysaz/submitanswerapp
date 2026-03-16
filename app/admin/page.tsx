'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  created_at: string
  submissions: [{ count: number }]
}

const CARD_COLORS = [
  'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-600', 'bg-red-500', 'bg-indigo-600',
]

export default function AdminPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [authPassword, setAuthPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  // New class modal
  const [showNewClass, setShowNewClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [classError, setClassError] = useState('')
  const [creatingClass, setCreatingClass] = useState(false)

  // Delete class confirm
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<ClassItem | null>(null)
  const [deletingClass, setDeletingClass] = useState(false)

  async function fetchClasses(pwd: string) {
    setLoadingClasses(true)
    const res = await fetch(`/api/admin?password=${encodeURIComponent(pwd)}`)
    if (res.ok) {
      setClasses(await res.json())
    }
    setLoadingClasses(false)
  }

  async function handleLogin(e: { preventDefault: () => void }) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const res = await fetch(`/api/admin?password=${encodeURIComponent(password)}`)
    if (res.ok) {
      sessionStorage.setItem('admin_password', password)
      setAuthPassword(password)
      setClasses(await res.json())
      setAuthed(true)
    } else {
      setLoginError('Incorrect password.')
    }
    setLoginLoading(false)
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password')
    if (!saved) { setAuthChecking(false); return }
    fetch(`/api/admin?password=${encodeURIComponent(saved)}`).then(async res => {
      if (res.ok) {
        setClasses(await res.json())
        setAuthPassword(saved)
        setAuthed(true)
      } else {
        sessionStorage.removeItem('admin_password')
      }
      setAuthChecking(false)
    })
  }, [])

  async function handleCreateClass(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!newClassName.trim()) { setClassError('Class name is required.'); return }
    setCreatingClass(true)
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName.trim(), password: authPassword }),
    })
    if (res.ok) {
      setNewClassName('')
      setShowNewClass(false)
      setClassError('')
      fetchClasses(authPassword)
    } else {
      const d = await res.json()
      setClassError(d.error || 'Failed to create class.')
    }
    setCreatingClass(false)
  }

  async function handleDeleteClass() {
    if (!confirmDeleteClass) return
    setDeletingClass(true)
    await fetch('/api/classes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: confirmDeleteClass.id, password: authPassword }),
    })
    setClasses(prev => prev.filter(c => c.id !== confirmDeleteClass.id))
    setConfirmDeleteClass(null)
    setDeletingClass(false)
  }

  const Header = () => (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-gray-700">SubmitAnswerApp</span>
        {authed && <span className="text-xs text-gray-400">/ Dashboard</span>}
      </div>
      {authed && (
        <button onClick={() => { sessionStorage.removeItem('admin_password'); router.push('/') }} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
          Sign out
        </button>
      )}
    </header>
  )

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm p-7">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-800 text-center mb-1">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Enter your password to continue.</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
              <button type="submit" disabled={loginLoading}
                className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {loginLoading ? 'Checking...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Classes</h1>
            <p className="text-sm text-gray-400">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
          </div>
          <button
            onClick={() => { setShowNewClass(true); setNewClassName(''); setClassError('') }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Class
          </button>
        </div>

        {loadingClasses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse h-40" />)}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No classes yet</p>
            <p className="text-sm text-gray-400 mt-1">Click <strong>New Class</strong> to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {classes.map((cls, i) => {
              const color = CARD_COLORS[i % CARD_COLORS.length]
              const count = cls.submissions?.[0]?.count ?? 0
              const initials = cls.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <div key={cls.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
                  <button className={`${color} h-24 w-full flex items-end px-4 pb-3 relative text-left`}
                    onClick={() => router.push(`/admin/class/${cls.id}?name=${encodeURIComponent(cls.name)}`)}>
                    <div className="absolute top-3 right-3 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{initials}</span>
                    </div>
                    <span className="text-white font-bold text-lg leading-tight">{cls.name}</span>
                  </button>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{count} submission{count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmDeleteClass(cls)}
                        className="text-xs text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete class"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => router.push(`/admin/class/${cls.id}?name=${encodeURIComponent(cls.name)}`)}
                        className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                      >
                        Open
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* New class modal */}
      {showNewClass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowNewClass(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Create New Class</h2>
            <p className="text-sm text-gray-500 mb-5">Students will be able to select this class.</p>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="e.g. Math Grade 10A" autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {classError && <p className="text-red-500 text-xs">{classError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewClass(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={creatingClass}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                  {creatingClass ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete class modal */}
      {confirmDeleteClass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Delete &ldquo;{confirmDeleteClass.name}&rdquo;?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">All submissions in this class will also be deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteClass(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={handleDeleteClass} disabled={deletingClass}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                {deletingClass ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
