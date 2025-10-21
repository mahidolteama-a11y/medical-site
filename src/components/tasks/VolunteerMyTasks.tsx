import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getTasks, updateTask } from '../../lib/dummyDatabase'
import { Task } from '../../types'
import { CalendarDays, ListTodo, CheckCircle, Calendar, AlertTriangle } from 'lucide-react'
import SimpleModal from '../common/SimpleModal'

const isToday = (dateStr?: string) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

const VolunteerMyTasks: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'appointments' | 'todos'>('appointments')
  const [reportTask, setReportTask] = useState<Task | null>(null)
  const [reportText, setReportText] = useState('')
  const [responses, setResponses] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data } = await getTasks(user?.id)
    const mine = (data || []).filter(t => t.assigned_to === user?.id)
    setTasks(mine)
    setLoading(false)
  }

  const effectiveStatus = (t: Task): Task['status'] => {
    // Guard: tasks should not appear completed until a report is submitted
    if (t.status === 'completed' && !(t.report && String(t.report).trim().length > 0)) {
      return 'in_progress'
    }
    return t.status
  }

  const todayAppointments = useMemo(
    () => tasks.filter(t => isToday(t.due_date) && !!t.patient),
    [tasks]
  )
  const todayTodos = useMemo(
    () => tasks.filter(t => isToday(t.due_date) && !t.patient),
    [tasks]
  )

  const isFuture = (dateStr?: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    // Compare ignoring time
    return d.setHours(0,0,0,0) > now.setHours(0,0,0,0)
  }
  const isPast = (dateStr?: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    return d.setHours(0,0,0,0) < now.setHours(0,0,0,0)
  }

  // Additional groups per tab
  const upcomingAppointments = useMemo(
    () => tasks.filter(t => !!t.patient && isFuture(t.due_date) && effectiveStatus(t) !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  )
  const overdueAppointments = useMemo(
    () => tasks.filter(t => !!t.patient && isPast(t.due_date) && effectiveStatus(t) !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  )
  const finishedAppointments = useMemo(
    () => tasks.filter(t => !!t.patient && t.status === 'completed' && !!(t.report && String(t.report).trim().length > 0)),
    [tasks]
  )

  const upcomingTodos = useMemo(
    () => tasks.filter(t => !t.patient && isFuture(t.due_date) && effectiveStatus(t) !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  )
  const overdueTodos = useMemo(
    () => tasks.filter(t => !t.patient && isPast(t.due_date) && effectiveStatus(t) !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  )
  const finishedTodos = useMemo(
    () => tasks.filter(t => !t.patient && t.status === 'completed' && !!(t.report && String(t.report).trim().length > 0)),
    [tasks]
  )

  const handleStart = async (task: Task) => {
    await updateTask(task.id, { status: 'in_progress' })
    fetchTasks()
  }

  const openReport = (task: Task) => {
    setReportTask(task)
    setReportText(task.report || '')
    setResponses(task.form_responses || {})
  }

  const submitReport = async () => {
    if (!reportTask) return
    await updateTask(reportTask.id, { status: 'completed', report: reportText, form_responses: responses })
    setReportTask(null)
    setReportText('')
    setResponses({})
    fetchTasks()
  }

  const list = tab === 'appointments' ? todayAppointments : todayTodos

  const Section: React.FC<{ title: string; items: Task[] }> = ({ title, items }) => (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="text-gray-500 text-sm">No items.</div>
      ) : (
        <div className="space-y-3">
          {items.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <div className="text-gray-600 mt-1">{task.description}</div>
                  <div className="text-gray-700 mt-2">Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'} {task.patient && <span>• Patient: {task.patient.name}</span>}</div>
                </div>
                <div className="flex gap-2">
                  {effectiveStatus(task) !== 'completed' && task.status !== 'cancelled' && (
                    <button onClick={() => openReport(task)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Open</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
          <button className={`px-4 py-2 text-sm flex items-center gap-2 ${tab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`} onClick={() => setTab('appointments')}>
            <CalendarDays className="w-4 h-4" /> Today’s Appointments
          </button>
          <button className={`px-4 py-2 text-sm border-l border-gray-200 flex items-center gap-2 ${tab === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`} onClick={() => setTab('todos')}>
            <ListTodo className="w-4 h-4" /> Today’s To‑Do
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          No tasks for today in this tab.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 mt-3">
                    <Calendar className="w-4 h-4" /> Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    {task.patient && <span>• Patient: {task.patient.name}</span>}
                  </div>
                  {task.report && (
                    <div className="text-gray-700 bg-gray-50 border border-gray-200 rounded p-3 mt-3">
                      <div className="text-xs text-gray-500 mb-1">Submitted report</div>
                      <div>{task.report}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {effectiveStatus(task) === 'pending' && (
                    <button onClick={() => handleStart(task)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Start</button>
                  )}
                  {effectiveStatus(task) !== 'completed' && task.status !== 'cancelled' && (
                    <button onClick={() => openReport(task)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                      Open
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extra sections: Upcoming, Overdue, Finished */}
      {tab === 'appointments' ? (
        <>
          <Section title="Upcoming Appointments" items={upcomingAppointments} />
          <Section title="Overdue Appointments" items={overdueAppointments} />
          <Section title="Finished Appointments" items={finishedAppointments} />
        </>
      ) : (
        <>
          <Section title="Upcoming To‑Do" items={upcomingTodos} />
          <Section title="Overdue To‑Do" items={overdueTodos} />
          <Section title="Finished To‑Do" items={finishedTodos} />
        </>
      )}

      <SimpleModal open={!!reportTask} title={reportTask ? `Complete Task: ${reportTask.title}` : ''} onClose={() => setReportTask(null)}>
        <div className="space-y-4">
          {/* Dynamic form */}
          {reportTask?.form_fields && reportTask.form_fields.length > 0 && (
            <div className="space-y-3">
              {reportTask.form_fields.map(field => {
                const value = responses[field.id] ?? ''
                const setVal = (v: any) => setResponses(prev => ({ ...prev, [field.id]: v }))
                switch (field.type) {
                  case 'textarea':
                    return (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required && ' *'}</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-2" value={value} onChange={e=>setVal(e.target.value)} />
                      </div>
                    )
                  case 'number':
                  case 'date':
                  case 'text':
                    return (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required && ' *'}</label>
                        <input type={field.type} className="w-full border border-gray-300 rounded-lg p-2" value={value} onChange={e=>setVal(e.target.value)} />
                      </div>
                    )
                  case 'select':
                    return (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required && ' *'}</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2" value={value} onChange={e=>setVal(e.target.value)}>
                          <option value="">Select…</option>
                          {(field.options || []).map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                        </select>
                      </div>
                    )
                  case 'checkbox':
                    return (
                      <div key={field.id}>
                        <div className="text-sm font-medium text-gray-700 mb-1">{field.label}{field.required && ' *'}</div>
                        <div className="flex flex-wrap gap-3">
                          {(field.options || []).map(opt => {
                            const arr = Array.isArray(value) ? value : []
                            const checked = arr.includes(opt)
                            return (
                              <label key={opt} className="text-sm text-gray-700 flex items-center gap-2">
                                <input type="checkbox" checked={checked} onChange={(e)=>{
                                  const set = new Set(arr)
                                  if (e.target.checked) set.add(opt); else set.delete(opt)
                                  setVal(Array.from(set))
                                }} /> {opt}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  case 'radio':
                    return (
                      <div key={field.id}>
                        <div className="text-sm font-medium text-gray-700 mb-1">{field.label}{field.required && ' *'}</div>
                        <div className="flex flex-wrap gap-3">
                          {(field.options || []).map(opt => (
                            <label key={opt} className="text-sm text-gray-700 flex items-center gap-2">
                              <input type="radio" name={field.id} checked={value === opt} onChange={()=>setVal(opt)} /> {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  default:
                    return null
                }
              })}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Report / Notes</label>
            <textarea value={reportText} onChange={e => setReportText(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="Write your visit notes, actions taken, observations, etc." />
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg" onClick={() => setReportTask(null)}>Cancel</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={submitReport}>Submit & Complete</button>
          </div>
        </div>
      </SimpleModal>
    </div>
  )
}

export default VolunteerMyTasks
