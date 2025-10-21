import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getTasks, updateTask, deleteTask } from '../../lib/dummyDatabase'
import { Task } from '../../types'
import { Plus, Search, CheckCircle, Clock, AlertTriangle, User, Calendar, Trash2, Edit } from 'lucide-react'
import { TaskForm } from './TaskForm'
import SimpleModal from '../common/SimpleModal'

const VolunteerTaskManager: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [reviewTask, setReviewTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const { data } = await getTasks()
      // Only tasks assigned to volunteers
      const volunteerTasks = (data || []).filter(t => t.assigned_to_user?.role === 'volunteer')
      setTasks(volunteerTasks)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    const { error } = await updateTask(taskId, { status: newStatus as any })
    if (!error) fetchTasks()
  }

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return
    const { error } = await deleteTask(taskId)
    if (!error) fetchTasks()
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTask(null)
    fetchTasks()
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to_user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (showForm) {
    return <TaskForm task={editingTask} onClose={handleFormClose} rolesFilter={['volunteer']} />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Volunteer Tasks</h1>
        {(user?.role === 'doctor') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Assign Task</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{task.description}</p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button onClick={() => handleEdit(task)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Task">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(task.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Task">
                  <Trash2 className="w-4 h-4" />
                </button>
                {(task.report || (task.form_responses && Object.keys(task.form_responses).length > 0)) && (
                  <button onClick={() => setReviewTask(task)} className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all" title="Review Submission">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                <span>{task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}</span>
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Volunteer: {task.assigned_to_user?.full_name}</span>
              </div>
              {task.patient && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Patient: {task.patient.name}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
              {task.report && (
                <div className="text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Volunteer Report</div>
                  <div>{task.report}</div>
                </div>
              )}
            </div>

            {task.status !== 'completed' && task.status !== 'cancelled' && (
              <div className="flex space-x-2">
                {task.status === 'pending' && (
                  <button onClick={() => handleStatusUpdate(task.id, 'in_progress')} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Start</button>
                )}
                {task.status === 'in_progress' && (
                  <button onClick={() => handleStatusUpdate(task.id, 'completed')} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">Mark Complete</button>
                )}
                <button onClick={() => handleStatusUpdate(task.id, 'cancelled')} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No volunteer tasks found.</p>
        </div>
      )}
      {/* Review Modal */}
      <SimpleModal open={!!reviewTask} title={reviewTask ? `Review Submission: ${reviewTask.title}` : ''} onClose={() => setReviewTask(null)}>
        {reviewTask ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-gray-700">Volunteer: <span className="font-medium">{reviewTask.assigned_to_user?.full_name}</span></div>
              {reviewTask.patient && (
                <div className="text-gray-700">Patient: <span className="font-medium">{reviewTask.patient.name}</span></div>
              )}
              {reviewTask.due_date && (
                <div className="text-gray-700">Due: <span className="font-medium">{new Date(reviewTask.due_date).toLocaleDateString()}</span></div>
              )}
              <div className="text-gray-700">Status: <span className="font-medium capitalize">{reviewTask.status.replace('_',' ')}</span></div>
            </div>

            {reviewTask.report ? (
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Volunteer Report</div>
                <div className="whitespace-pre-wrap text-gray-800">{reviewTask.report}</div>
              </div>
            ) : (
              <div className="text-gray-500">No written report provided.</div>
            )}

            {reviewTask.form_fields && reviewTask.form_fields.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Form Responses</div>
                <div className="space-y-2">
                  {reviewTask.form_fields.map((f) => {
                    const val = (reviewTask.form_responses || {})[f.id]
                    const display = Array.isArray(val) ? val.join(', ') : (val ?? '')
                    return (
                      <div key={f.id} className="flex justify-between gap-4 border-b border-gray-100 pb-1">
                        <div className="text-gray-600">{f.label}</div>
                        <div className="text-gray-900 text-right break-words">{String(display) || '—'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SimpleModal>
    </div>
  )
}

export default VolunteerTaskManager
