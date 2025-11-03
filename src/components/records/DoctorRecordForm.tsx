import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfiles, getPatientProfileByUserId, createDoctorRecord, updateDoctorRecord } from '../../lib/dummyDatabase'
import type { DoctorRecord, PatientProfile } from '../../types'
import { ArrowLeft, Stethoscope } from 'lucide-react'

interface DoctorRecordFormProps {
  record?: DoctorRecord | null
  onClose: () => void
}

const DoctorRecordForm: React.FC<DoctorRecordFormProps> = ({ record, onClose }) => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    patient_id: '',
    visit_date: new Date().toISOString().slice(0,10),
    title: 'Visit Record',
    summary: '',
    diagnosis: '',
    prescriptions: '',
    instructions: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        // Doctors can see all patients; patients see only themselves
        if (user?.role === 'patient') {
          const { data } = await getPatientProfileByUserId(user.id)
          if (data) setPatients([data])
          setForm((f)=> ({ ...f, patient_id: data?.id || '' }))
        } else {
          const { data } = await getPatientProfiles()
          setPatients(data || [])
        }
        if (record) {
          setForm({
            patient_id: record.patient_id,
            visit_date: record.visit_date,
            title: record.title || 'Visit Record',
            summary: record.summary || '',
            diagnosis: record.diagnosis || '',
            prescriptions: record.prescriptions || '',
            instructions: record.instructions || '',
          })
        }
      } finally { setLoading(false) }
    })()
  }, [record, user?.id, user?.role])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient_id || !form.visit_date) return
    if (!user?.id) return
    if (record) {
      await updateDoctorRecord(record.id, { ...form })
    } else {
      await createDoctorRecord({ ...form, recorded_by: user.id } as any)
    }
    onClose()
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"/></div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg"><Stethoscope className="w-6 h-6 text-blue-700"/></div>
              <h1 className="text-2xl font-bold text-gray-900">{record ? 'Edit Visit Record' : 'New Visit Record'}</h1>
            </div>
          </div>
        </div>

        <form onSubmit={save} className="p-6 space-y-6">
          {(user?.role === 'doctor') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select className="w-full px-4 py-3 border rounded-lg" required value={form.patient_id} onChange={e=>setForm({...form, patient_id: e.target.value})}>
                <option value="">Select patient…</option>
                {patients.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
              <input type="date" className="w-full px-4 py-3 border rounded-lg" required value={form.visit_date} onChange={e=>setForm({...form, visit_date: e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="w-full px-4 py-3 border rounded-lg" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <textarea rows={3} className="w-full px-4 py-3 border rounded-lg" value={form.summary} onChange={e=>setForm({...form, summary:e.target.value})}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <textarea rows={3} className="w-full px-4 py-3 border rounded-lg" value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescriptions</label>
              <textarea rows={3} className="w-full px-4 py-3 border rounded-lg" value={form.prescriptions} onChange={e=>setForm({...form, prescriptions:e.target.value})}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea rows={3} className="w-full px-4 py-3 border rounded-lg" value={form.instructions} onChange={e=>setForm({...form, instructions:e.target.value})}/>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DoctorRecordForm
