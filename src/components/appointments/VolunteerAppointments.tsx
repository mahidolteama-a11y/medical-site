import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfiles, getUsers, createTask, getTasks, sendMessageToDatabase } from '../../lib/dummyDatabase'
import type { Task, User } from '../../types'
import { CalendarDays, Plus, Calendar, User as UserIcon } from 'lucide-react'

const VolunteerAppointments: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [assignedPatients, setAssignedPatients] = useState<any[]>([])
  const [appointments, setAppointments] = useState<Task[]>([])
  const [showRequest, setShowRequest] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [form, setForm] = useState({ doctorId: '', date: '', time: '09:00', title: '', message: '', patientId: '' })
  const volunteerName = (user?.full_name || '').toLowerCase()

  const load = async () => {
    setLoading(true)
    const [{ data: pats }, { data: users }, { data: allTasks }] = await Promise.all([
      getPatientProfiles(),
      getUsers(),
      getTasks(),
    ])
    const myPatients = (pats || []).filter((p: any) => typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(volunteerName))
    setAssignedPatients(myPatients)
    setDoctors((users || []).filter(u => u.role === 'doctor'))
    const ids = new Set(myPatients.map((p:any)=>p.id))
    const appts = (allTasks || []).filter(t => t.patient_id && ids.has(t.patient_id))
    setAppointments(appts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Auto-refresh to reflect doctor approvals
  useEffect(() => {
    const id = setInterval(() => { load() }, 8000)
    return () => clearInterval(id)
  }, [])

  const grouped = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const todayMs = today.getTime()
    const upcoming: Task[] = []
    const overdue: Task[] = []
    for (const t of appointments) {
      if (!t.due_date) continue
      const ms = new Date(t.due_date).getTime()
      if (ms < todayMs && t.status !== 'completed' && t.status !== 'cancelled') overdue.push(t)
      else upcoming.push(t)
    }
    const byDate = (a:Task,b:Task)=> new Date(a.due_date||'').getTime() - new Date(b.due_date||'').getTime()
    return { overdue: overdue.sort(byDate), upcoming: upcoming.sort(byDate) }
  }, [appointments])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !form.patientId || !form.doctorId || !form.date) return
    await createTask({
      title: form.title || 'Appointment Request',
      description: form.message || 'Volunteer requested an appointment',
      priority: 'medium',
      status: 'pending',
      assigned_to: form.doctorId,
      assigned_by: user.id,
      patient_id: form.patientId,
      due_date: form.date,
      due_time: form.time,
    } as any)
    await sendMessageToDatabase({
      sender_id: user.id,
      recipient_id: form.doctorId,
      subject: 'Appointment Request',
      content: `Volunteer requested appointment on ${form.date} for patient.\n\nMessage: ${form.message || '(none)'}`,
    } as any)
    setShowRequest(false); setForm({ doctorId:'', date:'', time: '09:00', title:'', message:'', patientId:'' })
    load()
    alert('Appointment request sent')
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CalendarDays className="w-6 h-6 text-blue-600"/> Appointments</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2" onClick={()=>setShowRequest(true)}>
          <Plus className="w-4 h-4"/> Request Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">Upcoming</div>
        {grouped.upcoming.length===0 ? (
          <div className="text-gray-500 text-sm">No upcoming appointments.</div>
        ) : (
          <div className="space-y-2">
            {grouped.upcoming.map(a => (
              <div key={a.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{a.title || 'Appointment'}</div>
                  <div className="text-gray-700 flex items-center gap-2 mt-1"><Calendar className="w-4 h-4"/> {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'} {a.due_time ? ` ${a.due_time}` : ''} {a.patient && <><span>•</span><UserIcon className="w-4 h-4"/> {a.patient.name}</>}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full border bg-blue-50 text-blue-800">{a.status.replace('_',' ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRequest && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
              <select className="w-full px-3 py-2 border rounded" required value={form.patientId} onChange={e=>setForm({...form, patientId:e.target.value})}>
                <option value="">Select patient…</option>
                {assignedPatients.map((p:any)=>(<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
              <select className="w-full px-3 py-2 border rounded" required value={form.doctorId} onChange={e=>setForm({...form, doctorId:e.target.value})}>
                <option value="">Select doctor…</option>
                {doctors.map(d=> (<option key={d.id} value={d.id}>{d.full_name}</option>))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input className="w-full px-3 py-2 border rounded" required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="e.g., Home visit follow-up" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
              <div className="flex gap-2">
                <input type="date" className="w-full px-3 py-2 border rounded" required value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
                <input type="time" className="w-full px-3 py-2 border rounded" required value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label>
              <textarea rows={3} className="w-full px-3 py-2 border rounded" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 border rounded" onClick={()=>setShowRequest(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send Request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default VolunteerAppointments
