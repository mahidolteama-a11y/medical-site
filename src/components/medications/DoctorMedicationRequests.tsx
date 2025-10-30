import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getMedicationRequests, getPatientProfiles, updateMedicationRequest, createMedication, sendMessageToDatabase, getVolunteers, getUsers } from '../../lib/dummyDatabase'
import { Pill, CheckCircle2, XCircle, Plus, Search } from 'lucide-react'

export const DoctorMedicationRequests: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', dosage: '', instructions: '', times: '09:00, 21:00' })

  const load = async () => {
    setLoading(true)
    const { data } = await getMedicationRequests()
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const t = search.toLowerCase()
    return (items || []).filter(r =>
      (r.status === 'pending' || r.status === 'approved' || r.status === 'declined') &&
      ((r.patient?.name || '').toLowerCase().includes(t) || (r.medication || '').toLowerCase().includes(t) || (r.notes || '').toLowerCase().includes(t))
    )
  }, [items, search])

  const openPrescribe = (r:any) => { setEditing(r); setForm({ name: r.medication || '', dosage: '', instructions: '', times: '09:00, 21:00' }); setShowForm(true) }

  const timesArray = (s:string) => s.split(',').map(x=>x.trim()).filter(Boolean)

  const prescribe = async () => {
    if (!editing || !form.name.trim()) return
    await createMedication({ patient_id: editing.patient_id, name: form.name, dosage: form.dosage, instructions: form.instructions, times: timesArray(form.times), reminders_enabled: true, assigned_by: user!.id } as any)
    await updateMedicationRequest(editing.id, { status: 'approved', resolved_by: user!.id })
    // notify patient + VHV
    const [{ data: volunteers }, { data: users }] = await Promise.all([getVolunteers(), getUsers()])
    const vhvName = (editing.patient?.assigned_vhv_name || '').toLowerCase()
    const vhv = (volunteers || []).find((v:any)=> (v.name || '').toLowerCase().includes(vhvName))
    const subject = 'Prescription Created'
    const content = `Prescription created for ${editing.patient?.name}.\nMedication: ${form.name}\nDosage: ${form.dosage || 'N/A'}\nTimes: ${timesArray(form.times).join(', ')}\nInstructions: ${form.instructions || '—'}`
    await sendMessageToDatabase({ sender_id: user!.id, recipient_id: editing.patient?.user_id, subject, content } as any)
    if (vhv?.user_id) await sendMessageToDatabase({ sender_id: user!.id, recipient_id: vhv.user_id, subject, content } as any)
    setShowForm(false); setEditing(null); load()
  }

  const decline = async (r:any) => { await updateMedicationRequest(r.id, { status: 'declined', resolved_by: user!.id }); load() }

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
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.patient?.name || '-'}</td>
                  <td className="px-4 py-3">{r.medication || '-'}</td>
                  <td className="px-4 py-3">{r.quantity || '-'}</td>
                  <td className="px-4 py-3 truncate max-w-[280px]">{r.notes || '-'}</td>
                  <td className="px-4 py-3 capitalize">{r.status.replace('_',' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 border rounded inline-flex items-center gap-1" onClick={()=>openPrescribe(r)}><CheckCircle2 className="w-4 h-4"/> Prescribe</button>
                      <button className="px-3 py-1 border rounded text-red-700 border-red-300 inline-flex items-center gap-1" onClick={()=>decline(r)}><XCircle className="w-4 h-4"/> Decline</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
              <input className="w-full px-3 py-2 border rounded" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
              <input className="w-full px-3 py-2 border rounded" value={form.dosage} onChange={e=>setForm({...form, dosage:e.target.value})}/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <input className="w-full px-3 py-2 border rounded" value={form.instructions} onChange={e=>setForm({...form, instructions:e.target.value})}/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Times (comma separated HH:MM)</label>
              <input className="w-full px-3 py-2 border rounded" value={form.times} onChange={e=>setForm({...form, times:e.target.value})} placeholder="09:00, 21:00"/>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{ setShowForm(false); setEditing(null) }} className="px-3 py-2 border rounded">Cancel</button>
            <button onClick={prescribe} className="px-3 py-2 bg-purple-600 text-white rounded inline-flex items-center gap-2"><Plus className="w-4 h-4"/> Prescribe</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorMedicationRequests

