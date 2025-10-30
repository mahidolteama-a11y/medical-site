import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { updateUserById } from '../../lib/dummyDatabase'
import { setUserPassword } from '../../lib/dummyAuth'

export const UserProfile: React.FC = () => {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || '')
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState(user?.email || '')
  const [gender, setGender] = useState<string>('')
  const [dob, setDob] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setFullName(user?.full_name || '')
    setPhotoUrl(user?.photo_url || '')
    setEmail(user?.email || '')
  }, [user])

  const onFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!user) return
    setSaving(true)
    await updateUserById(user.id, { full_name: fullName, photo_url: photoUrl, email, /* optional extras stored on user object via updateUserById */  phone: phone as any, /* @ts-ignore */ gender, /* @ts-ignore */ dob, /* @ts-ignore */ address })
    setSaving(false)
    alert('Profile updated')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
            {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>}
          </div>
          <div>
            <div className="text-sm text-gray-500">Role</div>
            <div className="font-medium text-gray-900 capitalize">{user?.role}</div>
            <div className="text-xs text-gray-500 mt-1">User ID: <span className="font-mono">{user?.id}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input className="w-full px-4 py-3 border rounded" value={fullName} onChange={e=>setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <div className="flex flex-wrap items-center gap-3">
              <input type="file" accept="image/*" onChange={e=>onFile(e.target.files?.[0])} />
              <span className="text-sm text-gray-500">or</span>
              <input className="w-full md:flex-1 px-3 py-2 border rounded" placeholder="Image URL" value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input className="w-full px-4 py-3 border rounded" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input className="w-full px-4 py-3 border rounded" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select className="w-full px-4 py-3 border rounded" value={gender} onChange={e=>setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input className="w-full px-4 py-3 border rounded" type="date" value={dob} onChange={e=>setDob(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input className="w-full px-4 py-3 border rounded" value={address} onChange={e=>setAddress(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Password</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input type="password" className="w-full px-4 py-3 border rounded" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input type="password" className="w-full px-4 py-3 border rounded" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-4 py-2 border rounded"
              onClick={async ()=>{
                if (!user) return; if (newPassword.length < 6) return alert('Password must be at least 6 characters'); if (newPassword!==confirmPassword) return alert('Passwords do not match');
                const { error } = await setUserPassword(user.id, newPassword); if (error) return alert(error.message); setNewPassword(''); setConfirmPassword(''); alert('Password updated')
              }}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
