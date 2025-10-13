import React, { useState } from 'react'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { AuthForm } from './components/auth/AuthForm'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './components/dashboard/Dashboard'
import { PatientList } from './components/patients/PatientList'
import { PatientProfile } from './components/patients/PatientProfile'
import { MessageCenter } from './components/messages/MessageCenter'
import { TaskList } from './components/tasks/TaskList'
import VolunteerTaskManager from './components/tasks/VolunteerTaskManager'
import VolunteerMyTasks from './components/tasks/VolunteerMyTasks'
import { MapPage } from './components/map/MapPage'
import { DailyRecordList } from './components/records/DailyRecordList'
import PatientAppointments from './components/appointments/PatientAppointments'
import { VolunteerListPage } from './components/volunteers/VolunteerList'
import { UserProfile } from './components/profile/UserProfile'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
        return user.role === 'volunteer' ? (
          <VolunteerMyTasks />
        ) : (
          <TaskList personalOnly title="My Tasks" />
        )
      case 'volunteer-tasks':
        return user.role === 'doctor' ? <VolunteerTaskManager /> : <TaskList />
      case 'volunteers':
        return user.role === 'doctor' ? <VolunteerListPage /> : <Dashboard />
      case 'map':
        return <MapPage onBack={() => setCurrentView('dashboard')} />
      case 'records':
        return <DailyRecordList />
      case 'appointments':
        return user.role === 'patient' ? <PatientAppointments /> : <Dashboard />
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
