import React from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAnnouncements, deleteAnnouncement, getPatientProfiles, getPatientProfileByUserId, sendMessageToDatabase, getUsers, getVolunteers, getTasks } from '../../lib/dummyDatabase'
import { Announcement, PatientProfile, Task } from '../../types'
import { Users, MessageSquare, FileText, Heart, CheckSquare, Megaphone, Plus, CreditCard as Edit, Trash2, AlertTriangle, Phone } from 'lucide-react'
import { MapPin, Activity } from 'lucide-react'
import { AnnouncementForm } from './AnnouncementForm'
import PatientStatsChart from './PatientStatsChart'
// Removed DataExport and Recent Activity sections per requirements

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [patientAppointments, setPatientAppointments] = useState<Task[]>([])
  const [myAppointments, setMyAppointments] = useState<Task[]>([])

  const fetchPatientProfile = async () => {
    if (user?.id) {
      try {
        const { data, error } = await getPatientProfileByUserId(user.id)
        if (error && (error as any).code !== 'PGRST116') {
          console.error('Error fetching patient profile:', error)
        } else {
          setPatientProfile(data)
          // Load appointments for this patient (today + upcoming)
          try {
            const { data: allTasks } = await getTasks()
            const mine = (allTasks || []).filter(t => t.patient_id === data?.id)
            setPatientAppointments(mine)
          } catch (e) {
            console.warn('Unable to load patient appointments', e)
          }
        }
      } catch (error) {
        console.error('Error fetching patient profile:', error)
      }
    }
  }

  const handleEmergency = async () => {
    if (!patientProfile) {
      alert('Patient profile not found. Please contact emergency services directly.')
      return
    }

    setEmergencyLoading(true)
    
    try {
      // Collect assigned doctor(s) by name match and volunteers in the same area
      const [{ data: users }, { data: volunteers }] = await Promise.all([getUsers(), getVolunteers()])
      const doctors = (users || []).filter(u => u.role === 'doctor')
      const assignedDoctorName = (patientProfile.assigned_doctor || '').toLowerCase()
      const assignedDoctors = doctors.filter(d => (d.full_name || '').toLowerCase().includes(assignedDoctorName))
      const area = (patientProfile.area_name || '').toLowerCase()
      const sameAreaVols = (volunteers || []).filter((v: any) => (v.area_name || '').toLowerCase() === area)

      if (assignedDoctors.length === 0 && sameAreaVols.length === 0) {
        throw new Error('No assigned doctor or nearby volunteers found')
      }

      const emergencyMessage = `🚨 EMERGENCY - Immediate Assistance Needed\n\nPatient: ${patientProfile.name}\nMRN: ${patientProfile.medical_record_number}\nPhone: ${patientProfile.phone_number || 'N/A'}\nAddress: ${patientProfile.address}\nAssigned Doctor: ${patientProfile.assigned_doctor || 'N/A'}\nAssigned VHV: ${patientProfile.assigned_vhv_name || 'N/A'}\nArea: ${patientProfile.area_name || 'N/A'}\n\nFlags:\n- Critical: ${patientProfile.patient_categories.critical ? 'Yes' : 'No'}\n- Elderly: ${patientProfile.patient_categories.elderly ? 'Yes' : 'No'}\n- Pregnant: ${patientProfile.patient_categories.pregnant ? 'Yes' : 'No'}\n\nCaregiver: ${patientProfile.caregivers_contact || 'N/A'}\n\nThis is an urgent request for immediate medical assistance. Please respond as soon as possible.`

      const doctorRecipients = assignedDoctors.map(d => d.id)
      const volunteerRecipients = sameAreaVols.map((v: any) => v.user_id).filter(Boolean)
      const recipients = Array.from(new Set([...doctorRecipients, ...volunteerRecipients]))
      await Promise.all(recipients.map(r => sendMessageToDatabase({
        sender_id: user!.id,
        recipient_id: r,
        content: emergencyMessage,
        subject: '🚨 EMERGENCY - Immediate Assistance Needed',
        is_read: false,
      } as any)))

      alert(`Emergency message sent to ${doctorRecipients.length} doctor(s) and ${volunteerRecipients.length} volunteer(s).`)
      
    } catch (error) {
      console.error('Error sending emergency message:', error)
      alert('Failed to send emergency message. Please call emergency services directly or try again.')
    } finally {
      setEmergencyLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    if (user?.role === 'doctor' || user?.role === 'volunteer') {
      fetchPatients()
      // Load doctor/volunteer own appointments
      ;(async () => {
        try {
          const { data } = await getTasks()
          const mine = (data || []).filter(t => t.assigned_to === user?.id && !!t.patient_id)
          setMyAppointments(mine as any)
        } catch (e) {
          console.warn('Unable to load my appointments', e)
        }
      })()
    } else if (user?.role === 'patient') {
      fetchPatientProfile()
    }
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await getAnnouncements()
      if (error) {
        console.error('Error fetching announcements:', error)
      } else {
        setAnnouncements(data || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
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
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setShowForm(true)
  }

  const handleDelete = async (announcementId: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const { error } = await deleteAnnouncement(announcementId)
        if (error) {
          console.error('Error deleting announcement:', error)
        } else {
          fetchAnnouncements()
        }
      } catch (error) {
        console.error('Error deleting announcement:', error)
      }
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingAnnouncement(null)
  }

  const handleFormSuccess = () => {
    fetchAnnouncements()
  }

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'doctor':
        return 'Welcome to your medical dashboard. Manage patient records and communications.'
      case 'volunteer':
        return 'Welcome to your volunteer dashboard. Help manage patient information and provide support.'
      case 'patient':
        return 'Welcome to your patient portal. View your medical information and communicate with your healthcare team.'
      default:
        return 'Welcome to MedConnect Portal.'
    }
  }

  const getPatientStatistics = () => {
    const critical = patients.filter(p => p.patient_categories.critical).length
    const elderly = patients.filter(p => p.patient_categories.elderly).length
    const pregnant = patients.filter(p => p.patient_categories.pregnant).length
    const total = patients.length
    
    return { critical, elderly, pregnant, total }
  }

  const getQuickActions = () => {
    switch (user?.role) {
      case 'doctor':
      case 'volunteer':
        return [
          { icon: Users, title: 'Patient Management', description: 'View and manage patient profiles', action: 'patients' },
          { icon: MessageSquare, title: 'Messages', description: 'Communicate with patients and colleagues', action: 'messages' },
          { icon: FileText, title: 'Create Profile', description: 'Add new patient information', action: 'create-patient' },
          { icon: CheckSquare, title: 'Task Management', description: 'Create and manage tasks', action: 'tasks' },
          { icon: Activity, title: 'Daily Records', description: 'View patient daily records and symptoms', action: 'records' },
          { icon: MapPin, title: 'Geographic Map', description: 'View location-based information', action: 'map' }
        ]
      case 'patient':
        return [
          { icon: FileText, title: 'My Profile', description: 'View your medical information', action: 'profile' },
          { icon: Activity, title: 'Daily Records', description: 'Track your daily symptoms and vital signs', action: 'records' },
          { icon: MessageSquare, title: 'Messages', description: 'Communicate with your healthcare team', action: 'messages' },
          { icon: Heart, title: 'Mental Assessment', description: 'Complete your PHQ-9 assessment', action: 'mental' },
          { icon: Heart, title: 'Health Resources', description: 'Access helpful health information', action: 'resources' },
          { icon: MessageSquare, title: 'Appointments', description: 'View and request appointments', action: 'appointments' }
        ]
      default:
        return []
    }
  }

  // Hide quick action cards for all user types per request
  const quickActions: any[] = []
  
  // Patient appointment summaries (today + upcoming)
  const todayYMD = (() => {
    const d = new Date();
    return d.toISOString().slice(0,10)
  })()
  const activeStatuses = new Set(['pending','in_progress'])
  const patientTodayAppointments = patientAppointments
    .filter(t => t.due_date === todayYMD && activeStatuses.has(t.status))
    .sort((a,b)=> (a.due_time||'').localeCompare(b.due_time||''))
  const patientUpcomingAppointments = patientAppointments
    .filter(t => (t.due_date || '') > todayYMD && activeStatuses.has(t.status))
    .sort((a,b)=> (a.due_date||'').localeCompare(b.due_date||'') || (a.due_time||'').localeCompare(b.due_time||''))

  // Doctor/Volunteer own appointments
  const myTodayAppointments = myAppointments
    .filter(t => t.due_date === todayYMD && activeStatuses.has(t.status))
    .sort((a,b)=> (a.due_time||'').localeCompare(b.due_time||''))
  const myUpcomingAppointments = myAppointments
    .filter(t => (t.due_date || '') > todayYMD && activeStatuses.has(t.status))
    .sort((a,b)=> (a.due_date||'').localeCompare(b.due_date||'') || (a.due_time||'').localeCompare(b.due_time||''))
  const patientStats = getPatientStatistics()

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />
      case 'high':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Megaphone className="w-4 h-4" />
    }
  }

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name}
        </h1>
        <p className="text-gray-600">{getWelcomeMessage()}</p>
      </div>

      {/* Doctor stats cards at top */}
      {user?.role === 'doctor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.total}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.critical}</p>
                <p className="text-sm text-gray-600">Critical Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.elderly}</p>
                <p className="text-sm text-gray-600">Elderly Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.pregnant}</p>
                <p className="text-sm text-gray-600">Pregnant Patients</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'doctor' && (
        <PatientStatsChart patients={patients} />
      )}

      {/* Patient Statistics for Volunteers (kept in original position) */}
      {user?.role === 'volunteer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.total}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.critical}</p>
                <p className="text-sm text-gray-600">Critical Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.elderly}</p>
                <p className="text-sm text-gray-600">Elderly Patients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patientStats.pregnant}</p>
                <p className="text-sm text-gray-600">Pregnant Patients</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Emergency Button for Patients */}
        {user?.role === 'patient' && (
          <div className="md:col-span-2 lg:col-span-3 mb-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Phone className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">Emergency Assistance</h3>
                    <p className="text-red-700 text-sm">
                      Need immediate medical help? Click to send an urgent message to your healthcare team.
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                      For life-threatening emergencies, call emergency services immediately.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEmergency}
                  disabled={emergencyLoading || !patientProfile}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center space-x-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
                >
                  {emergencyLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Phone className="w-6 h-6" />
                      <span>EMERGENCY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient: Today & Upcoming Appointments */}
        {user?.role === 'patient' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Today’s Appointments</h3>
                <button
                  onClick={() => { try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'appointments' })) } catch {}; if ((window as any).setAppView) (window as any).setAppView('appointments') }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
              {patientTodayAppointments.length === 0 ? (
                <p className="text-sm text-gray-600">No appointments today.</p>
              ) : (
                <ul className="space-y-3">
                  {patientTodayAppointments.slice(0,5).map((a)=> (
                    <li key={a.id} className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-medium">{a.title || 'Appointment'}</div>
                      <div className="text-sm text-gray-600">{a.due_time || ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                <button
                  onClick={() => { try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'appointments' })) } catch {}; if ((window as any).setAppView) (window as any).setAppView('appointments') }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
              {patientUpcomingAppointments.length === 0 ? (
                <p className="text-sm text-gray-600">No upcoming appointments.</p>
              ) : (
                <ul className="space-y-3">
                  {patientUpcomingAppointments.slice(0,5).map((a)=> (
                    <li key={a.id} className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-medium">{a.title || 'Appointment'}</div>
                      <div className="text-sm text-gray-600">{a.due_date}{a.due_time ? ` ${a.due_time}` : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Doctor/Volunteer: Today & Upcoming appointments */}
        {(user?.role === 'doctor' || user?.role === 'volunteer') && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Today’s Appointments</h3>
                <button
                  onClick={() => { try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'tasks' })) } catch {}; if ((window as any).setAppView) (window as any).setAppView('tasks') }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
              {myTodayAppointments.length === 0 ? (
                <p className="text-sm text-gray-600">No appointments today.</p>
              ) : (
                <ul className="space-y-3">
                  {myTodayAppointments.slice(0,5).map((a)=> (
                    <li key={a.id} className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-medium">{a.patient?.name || 'Patient'} — {a.title || 'Appointment'}</div>
                      <div className="text-sm text-gray-600">{a.due_time || ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                <button
                  onClick={() => { try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'tasks' })) } catch {}; if ((window as any).setAppView) (window as any).setAppView('tasks') }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>
              {myUpcomingAppointments.length === 0 ? (
                <p className="text-sm text-gray-600">No upcoming appointments.</p>
              ) : (
                <ul className="space-y-3">
                  {myUpcomingAppointments.slice(0,5).map((a)=> (
                    <li key={a.id} className="flex items-center justify-between">
                      <div className="text-sm text-gray-900 font-medium">{a.patient?.name || 'Patient'} — {a.title || 'Appointment'}</div>
                      <div className="text-sm text-gray-600">{a.due_date}{a.due_time ? ` ${a.due_time}` : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <div
              key={index}
              onClick={() => {
                const mapAction: Record<string,string> = {
                  'patients': 'patients',
                  'messages': 'messages',
                  'create-patient': 'patients',
                  'tasks': 'tasks',
                  'records': 'records',
                  'map': 'map',
                  'profile': 'profile',
                  'resources': 'dashboard',
                  'mental': 'mental',
                  'appointments': 'appointments',
                }
                const target = mapAction[action.action as keyof typeof mapAction] || 'dashboard'
                try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: target })) } catch {}
                if ((window as any).setAppView) { (window as any).setAppView(target) }
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Announcements Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            <span>Announcements</span>
          </h2>
          {user?.role === 'doctor' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Announcement</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityIcon(announcement.priority)}
                        <span>{announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{announcement.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>By: {announcement.created_by_user?.full_name}</span>
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {user?.role === 'doctor' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Announcement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No announcements to display.</p>
            {user?.role === 'doctor' && (
              <p className="text-sm mt-1">Create your first announcement to keep everyone informed.</p>
            )}
          </div>
        )}
      </div>

      {/* Data Export and Recent Activity removed */}
    </div>

    {showForm && (
      <AnnouncementForm
        announcement={editingAnnouncement}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    )}
    </>
  )
}
