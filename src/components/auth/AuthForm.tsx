import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Heart, UserPlus, LogIn } from 'lucide-react'
import { PatientAccess } from './PatientAccess'
import { VolunteerAccess } from './VolunteerAccess'
import { DoctorAccess } from './DoctorAccess'

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<'staff' | 'patient' | 'volunteer'>('patient')
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'doctor' | 'patient' | 'volunteer'>('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
      } else {
        const { error } = await signUp(email, password, fullName, role)
        if (error) {
          setError(error.message)
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'patient') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img src="/logo.png" alt="Health Bride" className="h-12" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Health Bride Patient Portal</h1>
            <p className="text-gray-600 mt-1">Access with your MRN or email</p>
          </div>
          <PatientAccess />
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setMode('staff')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Staff login</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setMode('volunteer')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Volunteer login</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'volunteer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img src="/logo.png" alt="Health Bride" className="h-12" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Health Bride Volunteer Portal</h1>
            <p className="text-gray-600 mt-1">Access with Volunteer ID or email</p>
          </div>
          <VolunteerAccess />
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setMode('staff')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Staff login</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setMode('patient')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Patient login</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Health Bride" className="h-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Health Bride Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Doctor portal with Doctor ID/email access */}
        <div className="mb-6">
          <DoctorAccess />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 hidden">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'doctor' | 'patient' | 'volunteer')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setMode('patient')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Patient login</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setMode('volunteer')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Volunteer login</button>
          </div>
        </div>
      </div>
    </div>
  )
}
