import React, { useState, useEffect } from 'react'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { AuthForm } from './components/auth/AuthForm'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './components/dashboard/Dashboard'
import { PatientList } from './components/patients/PatientList'
import { PatientProfile } from './components/patients/PatientProfile'
import { MessageCenter } from './components/messages/MessageCenter'
import { TaskList } from './components/tasks/TaskList'
import DoctorTasks from './components/tasks/DoctorTasks'
import VolunteerTaskManager from './components/tasks/VolunteerTaskManager'
import VolunteerMyTasks from './components/tasks/VolunteerMyTasks'
import { MapPage } from './components/map/MapPage'
import { DailyRecordList } from './components/records/DailyRecordList'
import PatientAppointments from './components/appointments/PatientAppointments'
import VolunteerAppointments from './components/appointments/VolunteerAppointments'
import { VolunteerListPage } from './components/volunteers/VolunteerList'
import DoctorsList from './components/doctors/DoctorsList'
import { UserProfile } from './components/profile/UserProfile'
import MedicationRequest from './components/patients/MedicationRequest'
import { clearInvalidSession } from './lib/sessionValidator'
import MentalHealthAssessment from './components/assessments/MentalHealthAssessment'
import MentalAssessmentsList from './components/assessments/MentalAssessmentsList'
import { initMedicationReminders, stopMedicationReminders } from './lib/reminderService'
import PatientMedications from './components/medications/PatientMedications'
import DoctorMedicationRequests from './components/medications/DoctorMedicationRequests'
import VolunteerMedicationRequests from './components/medications/VolunteerMedicationRequests'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    clearInvalidSession();
    // expose simple navigation hook for internal actions (e.g., Records button)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).setAppView = (v: string) => setCurrentView(v)
    const onSetView = (e: any) => {
      const v = e?.detail
      if (typeof v === 'string') setCurrentView(v)
    }
    window.addEventListener('codex:setView', onSetView)
    return () => window.removeEventListener('codex:setView', onSetView)
  }, []);

  // Initialize medication reminders for patients only
  useEffect(() => {
    if (user?.role === 'patient') initMedicationReminders(user.id)
    else stopMedicationReminders()
    return () => stopMedicationReminders()
  }, [user?.id, user?.role])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'patients':
        return user.role === 'doctor' || user.role === 'volunteer' ? <PatientList /> : <Dashboard />
      case 'profile':
        return user.role === 'patient' ? <PatientProfile /> : <Dashboard />
      case 'messages':
        return <MessageCenter />
      case 'tasks':
        return user.role === 'volunteer' ? <VolunteerMyTasks /> : user.role === 'doctor' ? <DoctorTasks /> : <TaskList personalOnly title="My Tasks" />
      case 'volunteer-tasks':
        return user.role === 'doctor' ? <VolunteerTaskManager /> : <TaskList />
      case 'volunteers':
        return user.role === 'doctor' ? <VolunteerListPage /> : <Dashboard />
      case 'doctors':
        return user.role === 'volunteer' || user.role === 'patient' || user.role === 'doctor' ? <DoctorsList /> : <Dashboard />
      case 'map':
        return <MapPage onBack={() => setCurrentView('dashboard')} />
      case 'records':
        return <DailyRecordList />
      case 'appointments':
        return user.role === 'patient' ? <PatientAppointments /> : user.role === 'volunteer' ? <VolunteerAppointments /> : <Dashboard />
      case 'medication':
        return user.role === 'patient' ? <MedicationRequest /> : <Dashboard />
      case 'mental':
        return user.role === 'patient' ? <MentalHealthAssessment /> : <Dashboard />
      case 'mental-assessments':
        return user.role === 'doctor' ? <MentalAssessmentsList /> : <Dashboard />
      case 'medications':
        return user.role === 'patient' ? <PatientMedications /> : <Dashboard />
      case 'med-requests':
        return user.role === 'doctor' ? <DoctorMedicationRequests /> : user.role === 'volunteer' ? <VolunteerMedicationRequests /> : <Dashboard />
      case 'user-profile':
        return <UserProfile />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar currentView={currentView} onViewChange={setCurrentView} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="p-4 md:p-6 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
