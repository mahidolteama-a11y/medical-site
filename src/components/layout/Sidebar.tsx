import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  Heart,
  User,
  MessageSquare,
  FileText,
  CheckSquare,
  MapPin,
  Activity,
  CalendarDays,
  Menu,
  ChevronLeft,
  X,
  Pill
} from 'lucide-react'

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  mobileOpen?: boolean
  setMobileOpen?: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, mobileOpen, setMobileOpen }) => {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', next ? '1' : '0')
  }

  const getNavigationItems = () => {
    const baseItems: { key: string; label: string; icon: any }[] = [
      { key: 'dashboard', label: 'Dashboard', icon: User },
      { key: 'messages', label: 'Messages', icon: MessageSquare },
      { key: 'tasks', label: 'My Tasks', icon: CheckSquare },
      { key: 'records', label: 'Medical Records', icon: Activity },
      { key: 'map', label: 'Map', icon: MapPin }
    ]

  if (user?.role === 'doctor' || user?.role === 'volunteer') {
      baseItems.splice(1, 0, { key: 'patients', label: 'Patients', icon: FileText })
      if (user?.role === 'doctor') {
        baseItems.splice(2, 0, { key: 'volunteers', label: 'Volunteers', icon: CheckSquare })
        baseItems.splice(3, 0, { key: 'doctors', label: 'Doctors', icon: Heart })
        baseItems.splice(5, 0, { key: 'med-requests', label: 'Medication Requests', icon: Heart })
      }
      if (user?.role === 'volunteer') {
        const idx = baseItems.findIndex(i => i.key === 'tasks')
        baseItems.splice(idx+1, 0, { key: 'appointments', label: 'Appointments', icon: CalendarDays })
        // Doctors directory for volunteers
        baseItems.splice(2, 0, { key: 'doctors', label: 'Doctors', icon: Heart })
        baseItems.splice(6, 0, { key: 'med-requests', label: 'Medication Requests', icon: Heart })
      }
    } else if (user?.role === 'patient') {
      baseItems.splice(1, 0, { key: 'profile', label: 'My Profile', icon: FileText })
      baseItems.splice(2, 0, { key: 'doctors', label: 'Doctors', icon: Heart })
      baseItems.splice(3, 0, { key: 'medication', label: 'Medication Request', icon: Pill })
      baseItems.splice(4, 0, { key: 'medications', label: 'My Medications', icon: Heart })
      baseItems.splice(4, 0, { key: 'mental', label: 'Mental Assessment', icon: Activity })
      const idx = baseItems.findIndex(i => i.key === 'tasks')
      if (idx !== -1) baseItems[idx] = { key: 'appointments', label: 'Appointments', icon: CalendarDays }
    }

    if (user?.role === 'doctor') {
      baseItems.splice(3, 0, { key: 'volunteer-tasks', label: 'Volunteer Tasks', icon: CheckSquare })
      baseItems.splice(4, 0, { key: 'mental-assessments', label: 'Mental Assessments', icon: Activity })
    }

    return baseItems
  }

  const NavItems = () => (
    <ul className="mt-4 space-y-1">
      {getNavigationItems().map((item) => {
        const Icon = item.icon
        const active = currentView === item.key
        return (
          <li key={item.key}>
            <button
              onClick={() => {
                onViewChange(item.key)
                if (setMobileOpen) setMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )

  const content = (
    <div className={`h-full flex flex-col ${collapsed ? 'items-center' : ''}`}>
      {/* Brand */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} h-16 px-3 border-b border-gray-200`}>
        {collapsed ? (
          <img src="/logo.png" alt="logo" className="h-8 object-contain" />
        ) : (
          <img src="/logo.png" alt="logo" className="h-9 object-contain" />
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2">
        <NavItems />
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </div>
  )

  // Desktop sidebar
  return (
    <>
      <aside
        className={`hidden md:flex md:flex-col bg-white border-r border-gray-200 h-screen sticky top-0 z-30 transition-[width] duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile overlay sidebar */}
      <div className={`md:hidden ${mobileOpen ? 'fixed inset-0 z-40' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen && setMobileOpen(false)} />
        <aside className="absolute left-0 top-0 h-full w-72 bg-white border-r border-gray-200 shadow-xl">
          <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">HealthBridge</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen && setMobileOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(100%-4rem)] overflow-y-auto px-2">
            <NavItems />
          </div>
        </aside>
      </div>
    </>
  )
}

export default Sidebar
