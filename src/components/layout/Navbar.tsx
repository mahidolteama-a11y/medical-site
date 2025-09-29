import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Heart, LogOut, User, MessageSquare, FileText, CheckSquare, MapPin, Activity, CalendarDays } from 'lucide-react'

interface NavbarProps {
  currentView: string
  onViewChange: (view: string) => void
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const getNavigationItems = () => {
    const baseItems = [
      { key: 'dashboard', label: 'Dashboard', icon: User },
      { key: 'messages', label: 'Messages', icon: MessageSquare },
      { key: 'tasks', label: 'My Tasks', icon: CheckSquare },
      { key: 'records', label: 'Daily Records', icon: Activity },
      { key: 'map', label: 'Map', icon: MapPin }
    ]

    if (user?.role === 'doctor' || user?.role === 'volunteer') {
      baseItems.splice(1, 0, { key: 'patients', label: 'Patients', icon: FileText })
    } else if (user?.role === 'patient') {
      baseItems.splice(1, 0, { key: 'profile', label: 'My Profile', icon: FileText })
      // Replace My Tasks with Appointments for patients
      const idx = baseItems.findIndex(i => i.key === 'tasks')
      if (idx !== -1) {
        baseItems[idx] = { key: 'appointments', label: 'Appointments', icon: CalendarDays }
      }
    }

    if (user?.role === 'doctor') {
      baseItems.splice(3, 0, { key: 'volunteer-tasks', label: 'Volunteer Tasks', icon: CheckSquare })
    }

    return baseItems
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-green-100 text-green-800'
      case 'volunteer':
        return 'bg-purple-100 text-purple-800'
      case 'patient':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MedConnect</span>
            </div>
            
            <div className="hidden md:flex space-x-1">
              {getNavigationItems().map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => onViewChange(item.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                      currentView === item.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || '')}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
