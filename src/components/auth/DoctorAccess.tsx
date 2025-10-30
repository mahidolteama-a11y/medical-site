import React, { useState } from 'react'
import { LogIn, KeyRound, UserSearch, Stethoscope } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getDoctorByCode, getUsers } from '../../lib/dummyDatabase'
import { getUserById, setUserPassword } from '../../lib/dummyAuth'

type Step = 'identify' | 'password' | 'set-password'

export const DoctorAccess: React.FC = () => {
  const { signIn } = useAuth()
  const [step, setStep] = useState<Step>('identify')
  const [identifier, setIdentifier] = useState('') // DR-... or email
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      let uid: string | null = null
      let uEmail = ''
      const input = identifier.trim()
      if (!input) throw new Error('Enter Doctor ID or Email')
      if (input.includes('@')) {
        const { data } = await getUsers()
        const found = (data || []).find((u:any)=>u.role==='doctor' && (u.email || '').toLowerCase()===input.toLowerCase())
        if (!found) throw new Error('Doctor email not found')
        uid = found.id; uEmail = found.email
      } else {
        const { data } = await getDoctorByCode(input)
        if (!data) throw new Error('Doctor ID not found')
        uid = data.id
        uEmail = data.email
      }
      setUserId(uid)
      setEmail(uEmail)
      const u = uid ? getUserById(uid) : undefined
      const hasPwd = !!(u && u.password && u.password.length > 0)
      setStep(hasPwd ? 'password' : 'set-password')
    } catch (err:any) {
      setError(err.message || 'Unable to identify')
    } finally { setLoading(false) }
  }

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    if (!userId) return setError('Missing user account')
    setLoading(true)
    try {
      const { error } = await setUserPassword(userId, password)
      if (error) throw new Error(error.message)
      const res = await signIn(email, password)
      if (res?.error) setError(res.error.message)
    } catch (err:any) { setError(err.message || 'Unable to set password') }
    finally { setLoading(false) }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full">
      {step === 'identify' && (
        <form onSubmit={handleIdentify} className="space-y-6">
          <div className="text-center">
            <Stethoscope className="w-8 h-8 inline text-blue-600" />
            <h2 className="text-xl font-semibold mt-2">Doctor Access</h2>
            <p className="text-gray-600 text-sm">Enter your Doctor ID or Email</p>
          </div>
          <input type="text" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="DR-000123 or you@example.com" />
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LogIn className="w-5 h-5" />}
            Continue
          </button>
        </form>
      )}
      {step === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LogIn className="w-5 h-5" />}
            Sign In
          </button>
        </form>
      )}
      {step === 'set-password' && (
        <form onSubmit={handleCreatePassword} className="space-y-6">
          <div className="text-center">
            <KeyRound className="w-8 h-8 inline text-blue-600" />
            <h2 className="text-xl font-semibold mt-2">Create Your Password</h2>
            <p className="text-gray-600 text-sm">for {email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <KeyRound className="w-5 h-5" />}
            Save & Sign In
          </button>
        </form>
      )}
    </div>
  )
}

export default DoctorAccess

