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

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data } = await getTasks(user?.id)
    const mine = (data || []).filter(t => t.assigned_to === user?.id)
    setTasks(mine)
    setLoading(false)
  }

  const appointments = useMemo(() => tasks.filter(t => isToday(t.due_date) && !!t.patient), [tasks])
  const todos = useMemo(() => tasks.filter(t => isToday(t.due_date) && !t.patient), [tasks])

  const handleStart = async (task: Task) => {
    await updateTask(task.id, { status: 'in_progress' })
    fetchTasks()
  }

  const openReport = (task: Task) => {
    setReportTask(task)
    setReportText(task.report || '')
  }

  const submitReport = async () => {
    if (!reportTask) return
    await updateTask(reportTask.id, { status: 'completed', report: reportText })
    setReportTask(null)
    setReportText('')
    fetchTasks()
  }

  const list = tab === 'appointments' ? appointments : todos

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
                  {task.status === 'pending' && (
                    <button onClick={() => handleStart(task)} className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">Start</button>
                  )}
                  {(task.status === 'in_progress' || task.status === 'pending') && (
                    <button onClick={() => openReport(task)} className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleModal open={!!reportTask} title={reportTask ? `Complete Task: ${reportTask.title}` : ''} onClose={() => setReportTask(null)}>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Report / Result</label>
          <textarea value={reportText} onChange={e => setReportText(e.target.value)} rows={5} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" placeholder="Write your visit notes, actions taken, observations, etc." />
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

