import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfileByUserId, getMedications, createMedication, updateMedication, deleteMedication, logMedicationIntake } from '../../lib/dummyDatabase'
import { Pill, Plus, Clock, Save, Trash2 } from 'lucide-react'

export const PatientMedications: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [meds, setMeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', dosage: '', instructions: '', times: '09:00, 21:00', start_date: '', end_date: '', reminders_enabled: true })

  const load = async () => {
    setLoading(true)
    const { data: p } = await getPatientProfileByUserId(user?.id || '')
    setProfile(p)
    const { data: list } = await getMedications(p?.id)
    setMeds(list || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [user?.id])

  const openCreate = () => { setEditing(null); setForm({ name: '', dosage: '', instructions: '', times: '09:00, 21:00', start_date: '', end_date: '', reminders_enabled: true }); setShowForm(true) }
  const openEdit = (m:any) => { setEditing(m); setForm({ name: m.name||'', dosage: m.dosage||'', instructions: m.instructions||'', times: (m.times||[]).join(', '), start_date: m.start_date||'', end_date: m.end_date||'', reminders_enabled: m.reminders_enabled!==false }); setShowForm(true) }

  const timesArray = (s:string) => s.split(',').map(x=>x.trim()).filter(Boolean)

  const save = async () => {
    if (!profile?.id || !form.name.trim()) return alert('Name is required')
    const payload = { patient_id: profile.id, name: form.name, dosage: form.dosage, instructions: form.instructions, times: timesArray(form.times), start_date: form.start_date||undefined, end_date: form.end_date||undefined, reminders_enabled: !!form.reminders_enabled }
    if (editing) await updateMedication(editing.id, payload as any)
    else await createMedication(payload as any)
    setShowForm(false); setEditing(null); load()
  }

  const markTaken = async (m:any, hhmm: string) => {
    const d = new Date(); const [h,mi] = hhmm.split(':').map(n=>parseInt(n,10)||0); d.setHours(h,mi,0,0)
    await logMedicationIntake(m.id, m.patient_id, d.toISOString())
    alert('Marked as taken')
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-lg"><Pill className="w-6 h-6 text-purple-700"/></div><h1 className="text-2xl font-bold text-gray-900">My Medications</h1></div>
        <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2 w-full sm:w-auto justify-center"><Plus className="w-4 h-4"/> Add</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {meds.length === 0 && <div className="p-6 text-gray-600">No medications added.</div>}
          {meds.map(m => (
            <div key={m.id} className="p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{m.name} {m.dosage && <span className="text-gray-600 font-normal">• {m.dosage}</span>}</div>
                  {m.instructions && <div className="text-sm text-gray-700">{m.instructions}</div>}
                  <div className="text-sm text-gray-700 flex items-center gap-2 mt-1"><Clock className="w-4 h-4"/> {(m.times||[]).join(', ')}</div>
                  <div className="text-xs text-gray-500 mt-1">Reminders: {m.reminders_enabled!==false ? 'On' : 'Off'} {m.start_date && ` • from ${m.start_date}`} {m.end_date && ` • until ${m.end_date}`}</div>
                </div>
                <div className="flex items-center gap-2 sm:self-start">
                  <button onClick={()=>openEdit(m)} className="px-3 py-2 border rounded">Edit</button>
                  <button onClick={async()=>{ if(!confirm('Delete medication?')) return; await deleteMedication(m.id); load() }} className="px-3 py-2 border rounded text-red-700 border-red-300">Delete</button>
                </div>
              </div>
              {m.times && m.times.length>0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.times.map((t:string)=> (
                    <button key={t} onClick={()=>markTaken(m,t)} className="text-sm px-3 py-1 rounded border bg-purple-50 hover:bg-purple-100">Mark {t} taken</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="w-full px-3 py-2 border rounded" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
              <input className="w-full px-3 py-2 border rounded" value={form.dosage} onChange={e=>setForm({...form, dosage:e.target.value})} placeholder="e.g., 500mg"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <input className="w-full px-3 py-2 border rounded" value={form.instructions} onChange={e=>setForm({...form, instructions:e.target.value})} placeholder="e.g., after meal"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Times (comma-separated HH:MM)</label>
              <input className="w-full px-3 py-2 border rounded" value={form.times} onChange={e=>setForm({...form, times:e.target.value})} placeholder="09:00, 21:00"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-2 border rounded" value={form.start_date} onChange={e=>setForm({...form, start_date:e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-2 border rounded" value={form.end_date} onChange={e=>setForm({...form, end_date:e.target.value})}/>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="rem-on" type="checkbox" checked={form.reminders_enabled} onChange={e=>setForm({...form, reminders_enabled:e.target.checked})}/>
              <label htmlFor="rem-on" className="text-sm text-gray-700">Enable reminders</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{ setShowForm(false); setEditing(null) }} className="px-3 py-2 border rounded">Cancel</button>
            <button onClick={save} className="px-3 py-2 bg-purple-600 text-white rounded inline-flex items-center gap-2"><Save className="w-4 h-4"/> Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientMedications
