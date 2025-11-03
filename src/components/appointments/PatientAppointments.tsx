import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfileByUserId, getTasks, getUsers, createTask, sendMessageToDatabase, updateTask } from '../../lib/dummyDatabase'
import type { Task, User } from '../../types'
import { CalendarDays, MessageSquare, Plus, Calendar, User as UserIcon } from 'lucide-react'

export const PatientAppointments: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Task[]>([])
  const [showRequest, setShowRequest] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [form, setForm] = useState({ doctorId: '', date: '', time: '09:00', title: 'Appointment Request', message: '' })
  const [saving, setSaving] = useState(false)
  const [defaultDoctorId, setDefaultDoctorId] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        if (!user?.id) return
        const [{ data: profile }, { data: usersData }] = await Promise.all([
          getPatientProfileByUserId(user.id),
          getUsers(),
        ])
        const pid = profile?.id || null
        setPatientId(pid)
        const doctorsOnly = (usersData || []).filter(u => u.role === 'doctor')
        setDoctors(doctorsOnly)
        if (profile?.assigned_doctor) {
          const match = doctorsOnly.find(d => (d.full_name || '').toLowerCase().includes((profile.assigned_doctor || '').toLowerCase()))
          if (match) {
            setDefaultDoctorId(match.id)
            setForm(prev => ({ ...prev, doctorId: prev.doctorId || match.id }))
          }
        }
        const { data: allTasks } = await getTasks()
        const mine = (allTasks || []).filter(t => t.patient_id === pid)
        setAppointments(mine)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Auto-refresh appointments to reflect doctor approvals
  useEffect(() => {
    if (!patientId) return
    const id = setInterval(async () => {
      const { data: allTasks } = await getTasks()
      const mine = (allTasks || []).filter(t => t.patient_id === patientId)
      setAppointments(mine)
    }, 8000)
    return () => clearInterval(id)
  }, [patientId])

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const grouped = useMemo(() => {
    const overdue: Task[] = []
    const upcoming: Task[] = []
    const completed: Task[] = []
    const cancelled: Task[] = []
    const undated: Task[] = []
    for (const t of appointments) {
      if (!t.due_date) {
        // Keep undated items separate
        undated.push(t)
        continue
      }
      const ts = new Date(t.due_date).getTime()
      if (t.status === 'completed') {
        completed.push(t)
      } else if (t.status === 'cancelled') {
        cancelled.push(t)
      } else if (ts < todayStart) {
        // past date and not completed/cancelled
        overdue.push(t)
      } else {
        // upcoming for active statuses (pending/in_progress)
        upcoming.push(t)
      }
    }
    const byDateAsc = (a: Task, b: Task) => {
      const ad = a.due_date ? new Date(a.due_date).getTime() : 0
      const bd = b.due_date ? new Date(b.due_date).getTime() : 0
      return ad - bd
    }
    return {
      overdue: overdue.sort(byDateAsc),
      upcoming: upcoming.sort(byDateAsc),
      completed: completed.sort(byDateAsc),
      cancelled: cancelled.sort(byDateAsc),
      undated
    }
  }, [appointments, todayStart])

  const cancelAppt = async (id: string) => {
    if (!id) return
    if (!window.confirm('Cancel this appointment?')) return
    await updateTask(id, { status: 'cancelled' } as any)
    const { data: allTasks } = await getTasks()
    const mine = (allTasks || []).filter(t => t.patient_id === patientId)
    setAppointments(mine)
  }

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !user?.id) { alert('Missing patient profile.'); return }
    if (!form.doctorId) { alert('Please select a doctor'); return }
    if (!form.date) { alert('Please choose a date'); return }
    setSaving(true)
    try {
      await createTask({
        title: form.title || 'Appointment Request',
        description: form.message || 'Patient requested an appointment',
        priority: 'medium',
        status: 'pending',
        assigned_to: form.doctorId,
        assigned_by: user.id,
        patient_id: patientId,
        due_date: form.date,
        due_time: form.time,
      } as any)
      await sendMessageToDatabase({
        sender_id: user.id,
        recipient_id: form.doctorId,
        subject: 'Appointment Request',
        content: `Patient requests an appointment on ${form.date}.\n\nMessage: ${form.message || '(no additional message)'}\n`,
        is_read: false
      } as any)
      setShowRequest(false)
      setForm({ doctorId: '', date: '', time: '09:00', title: '', message: '' })
      const { data: allTasks } = await getTasks()
      const mine = (allTasks || []).filter(t => t.patient_id === patientId)
      setAppointments(mine)
      alert('Appointment request sent')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CalendarDays className="w-6 h-6 text-blue-600" /> Appointments</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto justify-center" onClick={() => { setForm(prev => ({ ...prev, doctorId: prev.doctorId || defaultDoctorId || '' })); setShowRequest(true) }}>
          <Plus className="w-4 h-4" /> Request Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          No appointments found.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-red-700 mb-2">Overdue</div>
              <div className="space-y-3">
                {grouped.overdue.map(appt => (
                  <div key={appt.id} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{appt.title || 'Appointment'}</div>
                        <div className="text-sm text-gray-600 mt-1">{appt.description}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                          <Calendar className="w-4 h-4" /> {appt.due_date ? new Date(appt.due_date).toLocaleDateString() : '—'} {appt.due_time ? ` ${appt.due_time}` : ''}
                          {appt.assigned_to_user && <><span>•</span><UserIcon className="w-4 h-4" /> {appt.assigned_to_user.full_name}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:self-start">
                        <div className="px-2 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-800 border-red-200 h-fit">Overdue</div>
                        <button onClick={() => cancelAppt(appt.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.upcoming.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Upcoming</div>
              <div className="space-y-3">
                {grouped.upcoming.map(appt => (
                  <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{appt.title || 'Appointment'}</div>
                        <div className="text-sm text-gray-600 mt-1">{appt.description}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                          <Calendar className="w-4 h-4" /> {appt.due_date ? new Date(appt.due_date).toLocaleDateString() : '—'} {appt.due_time ? ` ${appt.due_time}` : ''}
                          {appt.assigned_to_user && <><span>•</span><UserIcon className="w-4 h-4" /> {appt.assigned_to_user.full_name}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:self-start">
                        <div className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-800 border-blue-200 h-fit">{appt.status.replace('_',' ')}</div>
                        <button onClick={() => cancelAppt(appt.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.completed.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Completed</div>
              <div className="space-y-3">
                {grouped.completed.map(appt => (
                  <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{appt.title || 'Appointment'}</div>
                        <div className="text-sm text-gray-600 mt-1">{appt.description}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                          <Calendar className="w-4 h-4" /> {appt.due_date ? new Date(appt.due_date).toLocaleDateString() : '—'} {appt.due_time ? ` ${appt.due_time}` : ''}
                          {appt.assigned_to_user && <><span>•</span><UserIcon className="w-4 h-4" /> {appt.assigned_to_user.full_name}</>}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-800 border-green-200 h-fit">Completed</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.cancelled.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Cancelled</div>
              <div className="space-y-3">
                {grouped.cancelled.map(appt => (
                  <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{appt.title || 'Appointment'}</div>
                        <div className="text-sm text-gray-600 mt-1">{appt.description}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                          <Calendar className="w-4 h-4" /> {appt.due_date ? new Date(appt.due_date).toLocaleDateString() : '—'} {appt.due_time ? ` ${appt.due_time}` : ''}
                          {appt.assigned_to_user && <><span>•</span><UserIcon className="w-4 h-4" /> {appt.assigned_to_user.full_name}</>}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-800 border-gray-200 h-fit">Cancelled</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grouped.undated.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Other</div>
              <div className="space-y-3">
                {grouped.undated.map(appt => (
                  <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{appt.title || 'Appointment'}</div>
                        <div className="text-sm text-gray-600 mt-1">{appt.description}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 mt-2">
                          <Calendar className="w-4 h-4" /> —
                          {appt.assigned_to_user && <><span>•</span><UserIcon className="w-4 h-4" /> {appt.assigned_to_user.full_name}</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-800 border-blue-200 h-fit">{appt.status.replace('_',' ')}</div>
                        <button onClick={() => cancelAppt(appt.id)} className="px-3 py-1 bg-red-600 text-white text-xs rounded">Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showRequest && (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold"><MessageSquare className="w-5 h-5 text-blue-600" /> New Appointment Request</div>
          <form onSubmit={submitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} required>
                <option value="">Select doctor…</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
              <div className="flex gap-2">
                <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                <input type="time" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Follow-up consultation" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label>
              <textarea rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Additional details…" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg" onClick={() => setShowRequest(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Sending…' : 'Send Request'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default PatientAppointments
