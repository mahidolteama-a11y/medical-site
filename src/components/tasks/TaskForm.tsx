import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createTask, updateTask, getUsers, getPatientProfiles, getVolunteers } from '../../lib/dummyDatabase'
import { Task, User, PatientProfile } from '../../types'
import { ArrowLeft, Save, CheckSquare } from 'lucide-react'

interface TaskFormProps {
  task?: Task | null
  onClose: () => void
  rolesFilter?: Array<User['role']>
  forceAssignedToUserId?: string
  hideAssignedTo?: boolean
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, rolesFilter, forceAssignedToUserId, hideAssignedTo }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [taskType, setTaskType] = useState<'general' | 'appointment'>('general')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // priority left blank until user selects
    priority: '' as '' | 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    assigned_to: forceAssignedToUserId || '',
    patient_id: '',
    due_date: ''
  })
  const [customFields, setCustomFields] = useState<Array<{ id: string; label: string; type: any; required?: boolean; options?: string }>>([])

  useEffect(() => {
    fetchUsers()
    fetchPatients()
    fetchVolunteers()
    
    if (task) {
      // Determine task type based on existing task
      const isAppointment = !!(task.patient_id && task.due_date)
      setTaskType(isAppointment ? 'appointment' : 'general')
      
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assigned_to: forceAssignedToUserId || task.assigned_to,
        patient_id: task.patient_id || '',
        due_date: task.due_date || ''
      })
      if (task.form_fields && Array.isArray(task.form_fields)) {
        setCustomFields(task.form_fields.map(f => ({ ...f, options: f.options?.join(', ') || '' })) as any)
      }
    }
  }, [task])

  const fetchUsers = async () => {
    try {
      const { data, error } = await getUsers()
      if (error) {
        console.error('Error fetching users:', error)
      } else {
        // Filter to only show doctors and volunteers, optionally restricted
        let filteredUsers = (data || []).filter(u => u.role === 'doctor' || u.role === 'volunteer')
        if (rolesFilter && rolesFilter.length) {
          filteredUsers = filteredUsers.filter(u => rolesFilter.includes(u.role))
        }
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await getVolunteers()
      if (!error) setVolunteers(data || [])
    } catch (error) {
      console.error('Error fetching volunteers:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await getPatientProfiles()
      if (error) {
        console.error('Error fetching patients:', error)
      } else {
        setPatients(data || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation for appointments
    if (taskType === 'appointment') {
      if (!formData.patient_id) {
        alert('Please select a patient for the appointment.')
        setLoading(false)
        return
      }
      // Appointment requires date (also enforced globally below)
    }

    // Due date is required for all tasks
    if (!formData.due_date) {
      alert('Please select a due date.')
      setLoading(false)
      return
    }
    // Prevent past dates for all tasks
    const today = new Date().toISOString().slice(0,10)
    if (formData.due_date < today) {
      alert('Due date cannot be in the past.')
      setLoading(false)
      return
    }

    // Require priority selection
    if (!formData.priority) {
      alert('Please select a priority for this task.')
      setLoading(false)
      return
    }

    try {
      const fieldsForSave = customFields.map(f => ({ id: f.id, label: f.label, type: f.type, required: !!f.required, options: f.options ? f.options.split(',').map(s => s.trim()).filter(Boolean) : undefined }))

      if (task) {
        // Update existing task
        const { error } = await updateTask(task.id, { ...formData, form_fields: fieldsForSave })

        if (error) {
          console.error('Error updating task:', error)
          return
        }
      } else {
        // Create new task
        const taskData = {
          ...formData,
          assigned_to: forceAssignedToUserId || formData.assigned_to,
          assigned_by: user?.id || '',
          patient_id: taskType === 'appointment' ? formData.patient_id : undefined,
          form_fields: fieldsForSave,
          form_responses: {}
        }
        
        const { error } = await createTask(taskData)

        if (error) {
          console.error('Error creating task:', error)
          return
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'assigned_to' && forceAssignedToUserId) {
      // Prevent changing assignment when forced
      return
    }
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleTaskTypeChange = (type: 'general' | 'appointment') => {
    setTaskType(type)
    if (type === 'general') {
      // Clear patient selection for general tasks
      setFormData({
        ...formData,
        patient_id: ''
      })
    }
  }

  // Only show task type selection for volunteer tasks (when rolesFilter includes 'volunteer')
  const showTaskTypeSelection = rolesFilter?.includes('volunteer') && !task

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {task ? 'Edit Task' : 'Create New Task'}
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showTaskTypeSelection && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taskType"
                      value="general"
                      checked={taskType === 'general'}
                      onChange={() => handleTaskTypeChange('general')}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">General Task</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taskType"
                      value="appointment"
                      checked={taskType === 'appointment'}
                      onChange={() => handleTaskTypeChange('appointment')}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Appointment</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {taskType === 'appointment' 
                    ? 'Appointments require a patient and date, and will appear in the volunteer\'s "Today\'s Appointments" tab.'
                    : 'General tasks will appear in the volunteer\'s "Today\'s To-Do" tab when due today.'
                  }
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter task title..."
              />
              <div className="mt-1 text-right text-xs text-gray-400">
                {formData.title.length}/100
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                maxLength={5000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Describe the task in detail..."
              />
              <div className="mt-1 text-right text-xs text-gray-400">
                {formData.description.length}/5000
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                required
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select priority...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Hide Status when creating volunteer tasks (defaults to pending) */}
            {(!(rolesFilter?.includes('volunteer')) || !!task) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Patient first */}
            <div className={taskType === 'general' ? 'opacity-50' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {taskType === 'appointment' ? 'Patient *' : 'Related Patient (Optional)'}
              </label>
              <select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required={taskType === 'appointment'}
                disabled={taskType === 'general'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select patient...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.medical_record_number}
                  </option>
                ))}
              </select>
              {taskType === 'general' && (
                <p className="text-xs text-gray-500 mt-1">
                  General tasks don't require a patient assignment
                </p>
              )}
            </div>

            {hideAssignedTo ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <div className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  You
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  name="assigned_to"
                  required
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select user...</option>
                  {(() => {
                    // Show only volunteers from the same area_name as the selected patient (if any)
                    let options = users
                    if (rolesFilter?.includes('volunteer')) {
                      let targetArea = ''
                      if (formData.patient_id) {
                        const patient = patients.find(p => p.id === formData.patient_id)
                        targetArea = (patient?.area_name || '').toLowerCase()
                      }
                      if (targetArea) {
                        const allowedUserIds = volunteers
                          .filter((v: any) => (v.area_name || '').toLowerCase() === targetArea)
                          .map((v: any) => v.user_id)
                        options = users.filter(u => u.role === 'volunteer' && allowedUserIds.includes(u.id))
                      } else {
                        options = users.filter(u => u.role === 'volunteer')
                      }
                    }
                    return options.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))
                  })()}
                </select>
              </div>
            )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {taskType === 'appointment' ? 'Appointment Date *' : 'Due Date *'}
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0,10)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              Due date is required and cannot be in the past.
            </p>
          </div>

          {/* Custom form fields for volunteers */}
          {rolesFilter?.includes('volunteer') && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Form Fields (for volunteer to fill)</label>
              <div className="space-y-3">
                {customFields.map((f, idx) => (
                  <div key={f.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                    <input className="px-3 py-2 border rounded md:col-span-2" placeholder="Field label" value={f.label} onChange={e=>{
                      const v = e.target.value; setCustomFields(prev => prev.map((x,i)=> i===idx? { ...x, label: v }: x))
                    }} />
                    <select className="px-3 py-2 border rounded" value={f.type} onChange={e=>{
                      const v = e.target.value as any; setCustomFields(prev => prev.map((x,i)=> i===idx? { ...x, type: v }: x))
                    }}>
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="radio">Radio</option>
                    </select>
                    <input className="px-3 py-2 border rounded md:col-span-2" placeholder="Options (comma separated)" value={f.options || ''} onChange={e=>{
                      const v = e.target.value; setCustomFields(prev => prev.map((x,i)=> i===idx? { ...x, options: v }: x))
                    }} />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" checked={!!f.required} onChange={e=>{
                        const v = e.target.checked; setCustomFields(prev => prev.map((x,i)=> i===idx? { ...x, required: v }: x))
                      }} /> Required</label>
                      <button type="button" className="text-red-600 text-sm" onClick={()=> setCustomFields(prev => prev.filter((_,i)=>i!==idx))}>Remove</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="px-3 py-2 border rounded text-sm" onClick={()=> setCustomFields(prev => ([...prev, { id: 'f-' + Math.random().toString(36).slice(2,9), label: '', type: 'text', options: '' }]))}>+ Add Field</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">These fields will appear on the volunteer side when they open the task to complete it.</p>
            </div>
          )}
        </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{task ? 'Update Task' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
