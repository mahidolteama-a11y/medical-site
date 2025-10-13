import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getVolunteers, createVolunteer, updateVolunteer, getUsers, createVolunteerUser, getNextVolunteerCode } from '../../lib/dummyDatabase'
import { VolunteerProfile } from '../../types'
import { Plus, Search, Eye } from 'lucide-react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const VolunteerListPage: React.FC = () => {
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const [items, setItems] = useState<VolunteerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VolunteerProfile | null>(null)

  const fetchAll = async () => {
    const { data } = await getVolunteers()
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const t = search.toLowerCase()
    return items.filter(v =>
      v.name.toLowerCase().includes(t) ||
      (v.volunteer_code || '').toLowerCase().includes(t) ||
      (v.email || '').toLowerCase().includes(t) ||
      (v.phone || '').toLowerCase().includes(t)
    )
  }, [items, search])

  if (loading) return <div className="py-10 text-center">Loading…</div>
  if (showForm) return <VolunteerForm record={editing} onClose={() => { setShowForm(false); setEditing(null); fetchAll() }} />

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search" className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        {isDoctor && (
          <button onClick={()=>setShowForm(true)} className="ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200"><Plus className="w-4 h-4"/>create volunteer</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sky-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Volunteer ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Address</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{v.volunteer_code}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      {v.photo_url ? (
                        <img src={v.photo_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100" />
                      )}
                      <span>{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{v.email}</td>
                  <td className="px-4 py-3 text-sm">{v.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">{v.address || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => { setEditing(v); setShowForm(true) }} className="text-sky-700 hover:underline inline-flex items-center gap-1"><Eye className="w-4 h-4"/>View Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const VolunteerForm: React.FC<{ record: VolunteerProfile | null, onClose: () => void }> = ({ record, onClose }) => {
  const editing = !!record
  const [form, setForm] = useState<VolunteerProfile | null>(record)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  // Structured address pieces like Patient form
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [subdistrict, setSubdistrict] = useState('')
  const [addressLine, setAddressLine] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await getUsers()
      setUsers((data || []).filter((u:any)=>u.role==='volunteer'))
    })()
    if (record?.address) {
      const parts = (record.address || '').split(',').map(s=>s.trim()).filter(Boolean)
      setProvince(parts.slice(-1)[0] || '')
      setDistrict(parts.slice(-2, -1)[0] || '')
      setSubdistrict(parts.slice(-3, -2)[0] || '')
      const line = parts.slice(0, -3).join(', ')
      setAddressLine(line)
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Compose address from structured parts
      const composedAddress = [addressLine, subdistrict, district, province].filter(Boolean).join(', ')
      if (editing && form) {
        await updateVolunteer(form.id, { ...form, address: composedAddress })
      } else {
        // create linked user if needed
        const name = (form as any)?.name || ''
        const email = (form as any)?.email || ''
        let u = (users || []).find((x:any)=>x.email===email)
        if (!u) {
          const { data: created } = await createVolunteerUser(email, name)
          u = created
        }
        const code = await getNextVolunteerCode()
        await createVolunteer({
          user_id: u.id,
          name,
          email,
          phone: (form as any)?.phone,
          address: composedAddress,
          lat: (form as any)?.lat,
          lng: (form as any)?.lng,
          dob: (form as any)?.dob,
          photo_url: (form as any)?.photo_url,
          volunteer_code: code,
        } as any)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const icon = useMemo(()=> L.divIcon({
    className:'vol-pin',
    html:`<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 0 0 3px rgba(34,197,94,0.25);color:#fff;font-size:14px;line-height:1">🤝</div>`,
    iconSize:[26,26],iconAnchor:[13,13]
  }),[])

  const lat = (form as any)?.lat
  const lng = (form as any)?.lng
  const center:[number,number] = typeof lat==='number'&&typeof lng==='number' ? [lat,lng] : [13.793,100.321]

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">{editing? 'Edit Volunteer' : 'Create Volunteer'}</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input className="w-full px-4 py-3 border rounded" value={(form as any)?.name||''} onChange={e=>setForm(prev=>({...(prev||{} as any), name:e.target.value} as any))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" className="w-full px-4 py-3 border rounded" value={(form as any)?.email||''} onChange={e=>setForm(prev=>({...(prev||{} as any), email:e.target.value} as any))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input type="date" className="w-full px-4 py-3 border rounded" value={(form as any)?.dob||''} onChange={e=>setForm(prev=>({...(prev||{} as any), dob:e.target.value} as any))}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e)=>{
                const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = ()=> setForm(prev=>({...(prev||{} as any), photo_url: String(reader.result)} as any)); reader.readAsDataURL(f);
              }}/>
              <span className="text-sm text-gray-500">or</span>
              <input placeholder="Image URL" className="flex-1 px-3 py-2 border rounded" value={(form as any)?.photo_url||''} onChange={e=>setForm(prev=>({...(prev||{} as any), photo_url:e.target.value} as any))}/>
            </div>
            {(form as any)?.photo_url && (
              <img src={(form as any)?.photo_url} alt="preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input className="w-full px-4 py-3 border rounded" value={(form as any)?.phone||''} onChange={e=>setForm(prev=>({...(prev||{} as any), phone:e.target.value} as any))}/>
          </div>
          {/* Structured Address like Patient form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <select className="w-full px-4 py-3 border rounded" value={province} onChange={(e)=>setProvince(e.target.value)}>
              <option value="">Select</option>
              <option value="Nakhon Pathom">Nakhon Pathom</option>
              <option value="Bangkok">Bangkok</option>
              <option value="Nonthaburi">Nonthaburi</option>
              <option value="Pathum Thani">Pathum Thani</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District/ Area</label>
            <select className="w-full px-4 py-3 border rounded" value={district} onChange={(e)=>setDistrict(e.target.value)}>
              <option value="">Select</option>
              <option value="Phutthamonthon">Phutthamonthon</option>
              <option value="Salaya">Salaya</option>
              <option value="Bang Khae">Bang Khae</option>
              <option value="Mueang">Mueang</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sub-District/ Sub-Area</label>
            <select className="w-full px-4 py-3 border rounded" value={subdistrict} onChange={(e)=>setSubdistrict(e.target.value)}>
              <option value="">Select</option>
              <option value="Phra Khanong Tai">Phra Khanong Tai</option>
              <option value="Maha Sawat">Maha Sawat</option>
              <option value="Salaya">Salaya</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input className="w-full px-4 py-3 border rounded" placeholder="House number, street, village" value={addressLine} onChange={(e)=>setAddressLine(e.target.value)} />
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Volunteer ID</label>
              <input className="w-full px-4 py-3 border rounded bg-gray-50" value={(form as any)?.volunteer_code||''} readOnly/>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location (click map to set)</label>
          <div className="h-64 w-full border rounded overflow-hidden">
            <MapContainer center={center} zoom={14} style={{height:'100%',width:'100%'}} scrollWheelZoom>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors'/>
              <ClickSet onSet={(lat,lng)=>setForm(prev=>({...(prev||{} as any), lat, lng} as any))}/>
              {typeof lat==='number' && typeof lng==='number' && (<Marker position={[lat,lng]} icon={icon} />)}
            </MapContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">Latitude</label>
              <input type="number" step="any" className="w-full px-3 py-2 border rounded" value={(form as any)?.lat ?? ''} onChange={e=>setForm(prev=>({...(prev||{} as any), lat: parseFloat(e.target.value)} as any))}/>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Longitude</label>
              <input type="number" step="any" className="w-full px-3 py-2 border rounded" value={(form as any)?.lng ?? ''} onChange={e=>setForm(prev=>({...(prev||{} as any), lng: parseFloat(e.target.value)} as any))}/>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading? 'Saving…':'Save'}</button>
        </div>
      </form>
    </div>
  )
}

const ClickSet: React.FC<{ onSet: (lat:number,lng:number)=>void }> = ({ onSet }) => {
  useMapEvents({
    click(e) {
      onSet(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}
