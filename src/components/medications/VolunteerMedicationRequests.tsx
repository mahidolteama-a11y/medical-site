import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getMedicationRequests, getPatientProfiles } from '../../lib/dummyDatabase'
import { Pill, Search } from 'lucide-react'

export const VolunteerMedicationRequests: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: reqs }, { data: pats }] = await Promise.all([getMedicationRequests(), getPatientProfiles()])
    const myName = (user?.full_name || '').toLowerCase()
    const minePatients = (pats || []).filter((p:any) => (p.assigned_vhv_name || '').toLowerCase().includes(myName))
    const ids = new Set(minePatients.map((p:any)=>p.id))
    const filtered = (reqs || []).filter((r:any)=> ids.has(r.patient_id))
    setItems(filtered)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const rows = useMemo(() => {
    const t = search.toLowerCase()
    return (items || []).filter(r =>
      (r.patient?.name || '').toLowerCase().includes(t) || (r.medication || '').toLowerCase().includes(t) || (r.notes || '').toLowerCase().includes(t)
    )
  }, [items, search])

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-lg"><Pill className="w-6 h-6 text-purple-700"/></div><h1 className="text-2xl font-bold text-gray-900">Medication Requests</h1></div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border rounded" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Medication</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.patient?.name || '-'}</td>
                  <td className="px-4 py-3">{r.medication || '-'}</td>
                  <td className="px-4 py-3">{r.quantity || '-'}</td>
                  <td className="px-4 py-3 capitalize">{r.status.replace('_',' ')}</td>
                </tr>
              ))}
              {rows.length === 0 && (<tr><td className="px-4 py-6 text-center text-gray-500" colSpan={5}>No requests</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default VolunteerMedicationRequests

