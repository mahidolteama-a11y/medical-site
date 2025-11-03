import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getTasks, getUsers, updateTask, getPatientProfiles, createTask } from '../../lib/dummyDatabase'
import type { Task, User, PatientProfile } from '../../types'
import { CalendarDays, Edit, CheckCircle, XCircle, Search, Plus } from 'lucide-react'
import SimpleModal from '../common/SimpleModal'

type Tab = 'appointments'

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—')
const formatDateTime = (d?: string, t?: string) => {
  if (!d) return '—'
  const day = new Date(d).toLocaleDateString()
  return t ? `${day} ${t}` : day
}

const DoctorTasks: React.FC = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('appointments')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState<User[]>([])
  const [dateFilter, setDateFilter] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ patientId: '', doctorId: '', date: new Date().toISOString().slice(0,10), time: '09:00', title: 'Appointment', description: '' })
  const [showEdit, setShowEdit] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState({ patientId: '', doctorId: '', date: '', time: '09:00', title: '', description: '' })

  const load = async () => {
    setLoading(true)
    const [{ data: all }, { data: users }, { data: pats }] = await Promise.all([getTasks(), getUsers(), getPatientProfiles()])
    const myTasks = (all || []).filter(t => t.assigned_to === user?.id)
    setTasks(myTasks)
    setDoctors((users || []).filter(u => u.role === 'doctor'))
    setPatients((pats || []) as any)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const appts = useMemo(() => tasks.filter(t => !!t.patient_id), [tasks])

  const filteredPendingAppts = useMemo(() => {
    const t = search.toLowerCase()
    // Pending (needs approval) — NOT affected by dateFilter
    return appts.filter(a => a.status === 'pending' && (
      (a.title||'').toLowerCase().includes(t) || (a.patient?.name||'').toLowerCase().includes(t)
    ))
  }, [appts, search])

  const filteredApprovedAppts = useMemo(() => {
    const t = search.toLowerCase()
    // Approved only (in_progress or completed) — affected by dateFilter
    return appts.filter(a => (a.status === 'in_progress' || a.status === 'completed') && (!!dateFilter ? a.due_date === dateFilter : true) && (
      (a.title||'').toLowerCase().includes(t) || (a.patient?.name||'').toLowerCase().includes(t)
    ))
  }, [appts, dateFilter, search])

  const filteredCancelledAppts = useMemo(() => {
    const t = search.toLowerCase()
    return appts.filter(a => a.status === 'cancelled' && (
      (a.title||'').toLowerCase().includes(t) || (a.patient?.name||'').toLowerCase().includes(t)
    ))
  }, [appts, search])

  // General tasks removed for doctor view

  const approve = async (task: Task) => {
    await updateTask(task.id, { status: 'in_progress' })
    load()
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    setEditForm({
      patientId: task.patient_id || '',
      doctorId: task.assigned_to,
      date: task.due_date || new Date().toISOString().slice(0,10),
      time: task.due_time || '09:00',
      title: task.title || 'Appointment',
      description: task.description || ''
    })
    setShowEdit(true)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
          <button className={`px-4 py-2 text-sm inline-flex items-center gap-2 whitespace-nowrap ${tab==='appointments'?'bg-blue-600 text-white':'bg-white text-gray-700'}`} onClick={()=>setTab('appointments')}>
            <CalendarDays className="w-4 h-4"/> Appointments
          </button>
        </div>
        <div className="flex items-center gap-2">
          {tab==='appointments' && (
            <input type="date" className="px-3 py-2 border rounded" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} />
          )}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input className="pl-7 pr-3 py-2 border rounded" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {tab==='appointments' && (
            <button className="px-3 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-1" onClick={()=>{ setCreateForm({ patientId:'', doctorId: user?.id || '', date: new Date().toISOString().slice(0,10), title: 'Appointment', description: '' }); setShowCreate(true) }}>
              <Plus className="w-4 h-4"/> Create
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center">Loading…</div>
      ) : (
        <>
          {/* Needs Approval (not date-filtered) */}
          <div className="bg-white border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-sm text-red-800">Needs Approval</div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Patient</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Requested Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPendingAppts.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{t.patient?.name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{t.title || 'Appointment'}</td>
                    <td className="px-4 py-2 text-sm">{formatDateTime(t.due_date, t.due_time)}</td>
                    <td className="px-4 py-2 text-sm flex gap-2">
                      <button onClick={()=>approve(t)} className="px-3 py-1 bg-green-600 text-white rounded inline-flex items-center gap-1"><CheckCircle className="w-4 h-4"/>Approve</button>
                      <button onClick={()=>openEdit(t)} className="px-3 py-1 bg-blue-600 text-white rounded inline-flex items-center gap-1"><Edit className="w-4 h-4"/>Edit</button>
                      <button onClick={()=>updateTask(t.id,{status:'cancelled' as any}).then(load)} className="px-3 py-1 bg-red-600 text-white rounded inline-flex items-center gap-1"><XCircle className="w-4 h-4"/>Cancel</button>
                    </td>
                  </tr>
                ))}
                {filteredPendingAppts.length===0 && (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">No pending requests.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Approved (date-filtered) */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">Approved — {dateFilter || 'All Dates'}</div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Patient</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApprovedAppts.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{t.patient?.name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{t.title || 'Appointment'}</td>
                    <td className="px-4 py-2 text-sm">{formatDateTime(t.due_date, t.due_time)}</td>
                    <td className="px-4 py-2 text-sm capitalize">{t.status.replace('_',' ')}</td>
                    <td className="px-4 py-2 text-sm flex gap-2">
                      <button onClick={()=>openEdit(t)} className="px-3 py-1 bg-blue-600 text-white rounded inline-flex items-center gap-1"><Edit className="w-4 h-4"/>Edit</button>
                      <button onClick={()=>updateTask(t.id,{status:'cancelled' as any}).then(load)} className="px-3 py-1 bg-red-600 text-white rounded inline-flex items-center gap-1"><XCircle className="w-4 h-4"/>Cancel</button>
                    </td>
                  </tr>
                ))}
                {filteredApprovedAppts.length===0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No approved appointments for this date.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cancelled (not date-filtered) */}
          <div className="bg-white border rounded-xl overflow-hidden mt-6">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-800">Cancelled</div>
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Patient</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCancelledAppts.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{t.patient?.name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{t.title || 'Appointment'}</td>
                    <td className="px-4 py-2 text-sm">{formatDateTime(t.due_date, t.due_time)}</td>
                  </tr>
                ))}
                {filteredCancelledAppts.length===0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No cancelled appointments.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SimpleModal open={showCreate} title="Create Appointment" onClose={()=>setShowCreate(false)}>
        <form onSubmit={async (e)=>{
          e.preventDefault()
          if (!createForm.patientId || !createForm.doctorId || !createForm.date) return
          await createTask({
            title: createForm.title || 'Appointment',
            description: createForm.description || 'Doctor scheduled appointment',
            priority: 'medium',
            status: 'in_progress',
            assigned_to: createForm.doctorId,
            assigned_by: user?.id || '',
            patient_id: createForm.patientId,
            due_date: createForm.date,
            due_time: createForm.time,
          } as any)
          setShowCreate(false)
          load()
        }} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select className="w-full px-3 py-2 border rounded" value={createForm.patientId} onChange={e=>setCreateForm({...createForm, patientId:e.target.value})} required>
              <option value="">Select patient…</option>
              {patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select className="w-full px-3 py-2 border rounded" value={createForm.doctorId} onChange={e=>setCreateForm({...createForm, doctorId:e.target.value})} required>
                <option value="">Select doctor…</option>
                {doctors.map(d => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <div className="flex gap-2">
                <input type="date" className="w-full px-3 py-2 border rounded" value={createForm.date} onChange={e=>setCreateForm({...createForm, date:e.target.value})} required />
                <input type="time" className="w-full px-3 py-2 border rounded" value={createForm.time} onChange={e=>setCreateForm({...createForm, time:e.target.value})} required />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="w-full px-3 py-2 border rounded" value={createForm.title} onChange={e=>setCreateForm({...createForm, title:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="w-full px-3 py-2 border rounded" value={createForm.description} onChange={e=>setCreateForm({...createForm, description:e.target.value})} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 border rounded" onClick={()=>setShowCreate(false)}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
          </div>
        </form>
      </SimpleModal>

      {/* Edit appointment modal */}
      <SimpleModal open={showEdit} title="Edit Appointment" onClose={()=>setShowEdit(false)}>
        <form onSubmit={async (e)=>{
          e.preventDefault()
          if (!editTask) return
          await updateTask(editTask.id, {
            title: editForm.title,
            description: editForm.description,
            assigned_to: editForm.doctorId,
            due_date: editForm.date,
            due_time: editForm.time,
            status: editTask.status === 'pending' ? 'in_progress' : editTask.status,
          } as any)
          setShowEdit(false)
          load()
        }} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select className="w-full px-3 py-2 border rounded" required value={editForm.doctorId} onChange={e=>setEditForm({...editForm, doctorId: e.target.value})}>
                <option value="">Select doctor…</option>
                {doctors.map(d => (<option key={d.id} value={d.id}>{d.full_name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <div className="flex gap-2">
                <input type="date" className="w-full px-3 py-2 border rounded" required value={editForm.date} onChange={e=>setEditForm({...editForm, date:e.target.value})} />
                <input type="time" className="w-full px-3 py-2 border rounded" required value={editForm.time} onChange={e=>setEditForm({...editForm, time:e.target.value})} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="w-full px-3 py-2 border rounded" value={editForm.title} onChange={e=>setEditForm({...editForm, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="w-full px-3 py-2 border rounded" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 border rounded" onClick={()=>setShowEdit(false)}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </form>
      </SimpleModal>
    </div>
  )
}

export default DoctorTasks
