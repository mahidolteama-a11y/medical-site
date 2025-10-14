import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Menu, User as UserIcon } from 'lucide-react'
import { getPatientProfileByUserId } from '../../lib/dummyDatabase'

interface NavbarProps {
  currentView: string
  onViewChange: (view: string) => void
  onMenuClick?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, onViewChange }) => {
  const { user, signOut } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user) return
      // Prefer user.photo_url; for patients, try their profile photo
      if (user.photo_url) { setAvatarUrl(user.photo_url); return }
      if (user.role === 'patient') {
        const { data } = await getPatientProfileByUserId(user.id)
        if (mounted) setAvatarUrl((data as any)?.photo_url)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
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
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={onMenuClick} aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => onViewChange('user-profile')}
              className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center hover:ring-2 hover:ring-blue-500"
              title="My Profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-500" />
              )}
            </button>
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
