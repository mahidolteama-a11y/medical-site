import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getUsers, updateUserById, createDoctorUser, deleteUserById } from '../../lib/dummyDatabase'
import { User } from '../../types'
import { Stethoscope, Mail, MessageSquare, Search, Plus, Edit3, Eye } from 'lucide-react'
import SimpleModal from '../common/SimpleModal'

export const DoctorsList: React.FC = () => {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data } = await getUsers()
      setAllUsers(data || [])
      setLoading(false)
    })()
  }, [user?.id])

  // Prefill search when navigated from PatientProfile
  useEffect(() => {
    try {
      const q = localStorage.getItem('doctor:search')
      if (q) {
        setSearch(q)
        localStorage.removeItem('doctor:search')
      }
    } catch {}
  }, [])

  const doctors = useMemo(() =>
    (allUsers || [])
      .filter(u => u.role === 'doctor')
      .filter(u => {
        const t = search.toLowerCase()
        const code = ((u as any).doctor_code || '').toLowerCase()
        return (u.full_name || '').toLowerCase().includes(t) ||
               (u.email || '').toLowerCase().includes(t) ||
               code.includes(t)
      })
  , [allUsers, search])

  // Pagination similar to PatientList
  const [page, setPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(doctors.length / pageSize))
  const pageDoctors = useMemo(() => {
    const start = (page - 1) * pageSize
    return doctors.slice(start, start + pageSize)
  }, [doctors, page])

  const startMessage = (id: string) => {
    try { localStorage.setItem('message:recipient', id) } catch {}
    try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'messages' })) } catch {}
    if ((window as any).setAppView) { (window as any).setAppView('messages') }
  }

  const isDoctor = user?.role === 'doctor'

  const openCreate = () => {
    setEditing(null)
    setFormName('')
    setFormEmail('')
    setShowForm(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setFormName(u.full_name)
    setFormEmail(u.email)
    setShowForm(true)
  }

  const saveForm = async () => {
    if (!formEmail.trim() || !formName.trim()) return alert('Name and Email are required')
    if (editing) {
      await updateUserById(editing.id, { full_name: formName, email: formEmail })
    } else {
      await createDoctorUser(formEmail, formName)
    }
    const { data } = await getUsers()
    setAllUsers(data || [])
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg"><Stethoscope className="w-6 h-6 text-blue-600"/></div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search doctors..." className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          {isDoctor && (
            <button onClick={openCreate} className="ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200"><Plus className="w-4 h-4"/>New Doctor</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sky-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Doctor ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageDoctors.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{(d as any).doctor_code || d.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg"><Stethoscope className="w-4 h-4 text-blue-600"/></div>
                      <span className="text-gray-900">{d.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{d.email}</td>
                  <td className="px-4 py-3 text-sm">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={()=>startMessage(d.id)} className="text-sky-700 hover:underline inline-flex items-center gap-1"><MessageSquare className="w-4 h-4"/>Message</button>
                      {d.email && (
                        <a href={`mailto:${d.email}`} className="text-gray-700 hover:underline inline-flex items-center gap-1"><Mail className="w-4 h-4"/>Email</a>
                      )}
                      {isDoctor && (
                        <button onClick={()=>openEdit(d)} className="text-gray-700 hover:underline inline-flex items-center gap-1"><Edit3 className="w-4 h-4"/>Edit</button>
                      )}
                      {isDoctor && (
                        <button onClick={async ()=>{ if (!window.confirm('Delete this doctor account? This cannot be undone.')) return; await deleteUserById(d.id); const { data } = await getUsers(); setAllUsers(data || []) }} className="text-red-700 hover:underline inline-flex items-center gap-1">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pageDoctors.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>No doctors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-600">Showing {Math.min(page * pageSize, doctors.length)} of {doctors.length} doctors</div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-300" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>&lt;</button>
            <button className={`px-3 py-1 rounded ${page===1?'bg-gray-200':'hover:bg-gray-100'}`} onClick={()=>setPage(1)}>1</button>
            {totalPages>2 && (<>
              {page>2 && <span className="px-1">…</span>}
              {page>1 && page<totalPages && (<button className="px-3 py-1 rounded bg-gray-200">{page}</button>)}
              {page<totalPages-1 && <span className="px-1">…</span>}
            </>)}
            {totalPages>1 && (<button className={`px-3 py-1 rounded ${page===totalPages?'bg-gray-200':'hover:bg-gray-100'}`} onClick={()=>setPage(totalPages)}>{totalPages}</button>)}
            <button className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-300" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>&gt;</button>
          </div>
        </div>
      </div>

      <SimpleModal open={showForm} title={editing ? 'Edit Doctor' : 'New Doctor'} onClose={()=>setShowForm(false)}>
        <div className="space-y-4">
          {editing && (
            <div className="text-xs text-gray-600 flex flex-wrap gap-2">
              {(editing as any).doctor_code && <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">Doctor ID: <span className="font-mono">{(editing as any).doctor_code}</span></span>}
              <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">User ID: <span className="font-mono">{editing.id}</span></span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={formName} onChange={e=>setFormName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formEmail} onChange={e=>setFormEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input id="doctor-phone" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input id="doctor-dob" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
              <input id="doctor-photo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setShowForm(false)} className="px-3 py-2 border border-gray-300 rounded-lg">Cancel</button>
            <button onClick={async ()=>{
              // capture extra fields from DOM to avoid large local state changes
              const phone = (document.getElementById('doctor-phone') as HTMLInputElement)?.value || ''
              const dob = (document.getElementById('doctor-dob') as HTMLInputElement)?.value || ''
              const photo_url = (document.getElementById('doctor-photo') as HTMLInputElement)?.value || ''
              if (!formEmail.trim() || !formName.trim()) { alert('Name and Email are required'); return }
              if (editing) {
                await updateUserById(editing.id, { full_name: formName, email: formEmail, phone: phone as any, dob: dob as any, photo_url })
              } else {
                const r = await createDoctorUser(formEmail, formName)
                const created = r.data as any
                if (created) {
                  await updateUserById(created.id, { phone: phone as any, dob: dob as any, photo_url })
                }
              }
              const { data } = await getUsers()
              setAllUsers(data || [])
              setShowForm(false)
            }} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
        </div>
      </SimpleModal>
    </div>
  )
}

export default DoctorsList
