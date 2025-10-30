import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createDailyRecord, updateDailyRecord, getPatientProfileByUserId, getPatientProfiles, getVolunteers, getUsers, sendMessageToDatabase, createTask } from '../../lib/dummyDatabase'
import { DailyRecord, PatientProfile } from '../../types'
import { ArrowLeft, Save, Activity } from 'lucide-react'

interface DailyRecordFormProps {
  record?: DailyRecord | null
  patientId?: string
  onClose: () => void
}

export const DailyRecordForm: React.FC<DailyRecordFormProps> = ({ record, patientId, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    record_date: new Date().toISOString().split('T')[0],
    temperature: '',
    pulse: '',
    blood_pressure: '',
    weight: '',
    blood_sugar: '',
    oxygen_saturation: '',
    pain_level: 0,
    fatigue_level: 0,
    mood: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor',
    appetite: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor',
    sleep_quality: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor',
    symptoms_description: '',
    medications_taken: '',
    activities: '',
    notes: '',
    dr_instructions: '',
    custom_fields: [] as any[],
    custom_values: {} as Record<string, any>
  })
  const [customFields, setCustomFields] = useState<Array<{id:string;label:string;type:any;options?:string;required?:boolean}>>([])

  useEffect(() => {
    if (user?.role === 'patient') {
      fetchPatientProfile()
    } else if (user?.role === 'doctor' || user?.role === 'volunteer') {
      fetchPatients()
    }
    
    if (record) {
      setFormData({
        patient_id: record.patient_id,
        record_date: record.record_date,
        temperature: record.temperature || '',
        pulse: record.pulse || '',
        blood_pressure: record.blood_pressure || '',
        weight: record.weight || '',
        blood_sugar: record.blood_sugar || '',
        oxygen_saturation: record.oxygen_saturation || '',
        pain_level: record.pain_level || 0,
        fatigue_level: record.fatigue_level || 0,
        mood: record.mood || 'good',
        appetite: record.appetite || 'good',
        sleep_quality: record.sleep_quality || 'good',
        symptoms_description: record.symptoms_description || '',
        medications_taken: record.medications_taken || '',
        activities: record.activities || '',
        notes: record.notes || '',
        dr_instructions: record.dr_instructions || '',
        custom_fields: (record.custom_fields as any) || [],
        custom_values: record.custom_values || {}
      })
      setCustomFields(((record.custom_fields as any) || []).map((f:any)=>({ ...f, options: (f.options||[]).join(', ') })))
    }
  }, [record, user])

  const fetchPatientProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await getPatientProfileByUserId(user.id)
      if (!error && data) {
        setPatientProfile(data)
        setFormData(prev => ({ ...prev, patient_id: data.id }))
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await getPatientProfiles()
      if (!error && data) {
        // Restrict volunteers to their assigned patients only
        if (user?.role === 'volunteer') {
          const myName = (user.full_name || '').toLowerCase()
          const assigned = (data || []).filter((p:any)=> typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(myName))
          setPatients(assigned as any)
        } else {
          setPatients(data)
        }
        if (patientId) {
          setFormData(prev => ({ ...prev, patient_id: patientId }))
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const recordPatientId = formData.patient_id || patientId || patientProfile?.id
      if (!recordPatientId) {
        alert('Please select a patient before saving the record.')
        setLoading(false)
        return
      }

      if (record) {
        // Update existing record
        const { error } = await updateDailyRecord(record.id, { ...formData, custom_fields: customFields.map(f=>({ id: f.id, label: f.label, type: f.type, options: (f.options||'').split(',').map(s=>s.trim()).filter(Boolean) })) } as any)
        if (error) {
          console.error('Error updating daily record:', error)
          return
        }
      } else {
        // Create new record
        const { error } = await createDailyRecord({
          ...formData,
          custom_fields: customFields.map(f=>({ id: f.id, label: f.label, type: f.type, options: (f.options||'').split(',').map(s=>s.trim()).filter(Boolean) })),
          patient_id: recordPatientId,
          recorded_by: user?.id || ''
        })
        if (error) {
          console.error('Error creating daily record:', error)
          return
        }

        // After patient's submission, evaluate thresholds and alert assigned VHV if abnormal
        if (user?.role === 'patient') {
          try {
            const flags: string[] = []
            const num = (s?: string) => {
              const m = (s || '').match(/-?\d+\.?\d*/)
              return m ? parseFloat(m[0]) : NaN
            }
            // Temperature
            const t = num(formData.temperature)
            if (!Number.isNaN(t)) {
              const isC = /c/i.test(formData.temperature)
              const f = isC ? (t * 9/5 + 32) : t
              if (f >= 100.4) flags.push(`High temperature: ${formData.temperature}`)
            }
            // Pulse
            const p = num(formData.pulse)
            if (!Number.isNaN(p) && (p >= 110 || p <= 50)) flags.push(`Abnormal pulse: ${formData.pulse}`)
            // Blood pressure
            const bp = (formData.blood_pressure || '').match(/(\d+)\D+(\d+)/)
            if (bp) {
              const sys = parseInt(bp[1], 10); const dia = parseInt(bp[2], 10)
              if (sys >= 140 || dia >= 90) flags.push(`High blood pressure: ${formData.blood_pressure}`)
              if (sys <= 90 || dia <= 60) flags.push(`Low blood pressure: ${formData.blood_pressure}`)
            }
            // Blood sugar
            const bs = num(formData.blood_sugar)
            if (!Number.isNaN(bs) && bs >= 200) flags.push(`High blood sugar: ${formData.blood_sugar}`)
            // Oxygen saturation (low)
            const ox = num(formData.oxygen_saturation)
            if (!Number.isNaN(ox) && ox > 0 && ox < 92) flags.push(`Low SpO₂: ${formData.oxygen_saturation}`)
            // Severe pain or fatigue
            if (formData.pain_level >= 8) flags.push(`Severe pain level: ${formData.pain_level}/10`)
            if (formData.fatigue_level >= 8) flags.push(`Severe fatigue: ${formData.fatigue_level}/10`)

            if (flags.length > 0) {
              const { data: users } = await getUsers()
              const { data: volunteers } = await getVolunteers()
              const me = patientProfile
              const vhvName = (me?.assigned_vhv_name || '').toLowerCase()
              const assignedVhv = (volunteers || []).find((v:any)=> (v.name || '').toLowerCase().includes(vhvName))
              const doctorName = (me?.assigned_doctor || '').toLowerCase()
              const doctors = (users || []).filter((u:any)=> u.role==='doctor' && (u.full_name || '').toLowerCase().includes(doctorName))

              // Notify VHV via message
              if (assignedVhv?.user_id) {
                const subject = 'Alert: Abnormal Daily Health Measurement'
                const content = `Patient: ${me?.name}\nMRN: ${me?.medical_record_number}\nDate: ${formData.record_date}\n\nIssues:\n- ${flags.join('\n- ')}\n\nAction: Please review and schedule an appointment with ${me?.assigned_doctor || 'doctor'} as needed.`
                await sendMessageToDatabase({ sender_id: user.id, recipient_id: assignedVhv.user_id, subject, content } as any)

                // Create a task for the VHV to make appointment
                const priority = (ox && ox < 90) || (t && !Number.isNaN(t) && (/c/i.test(formData.temperature) ? t >= 40 : t >= 104)) ? 'urgent' : 'high'
                await createTask({
                  title: 'Schedule appointment for patient',
                  description: `Auto-generated from daily record.\n\n${flags.join('\n')}`,
                  priority,
                  status: 'pending',
                  assigned_to: assignedVhv.user_id,
                  assigned_by: user.id,
                  patient_id: recordPatientId,
                  due_date: new Date().toISOString().slice(0,10),
                } as any)

                // Optional: FYI message to assigned doctor
                if (doctors.length > 0) {
                  const d = doctors[0]
                  await sendMessageToDatabase({ sender_id: user.id, recipient_id: d.id, subject: 'FYI: Abnormal Daily Record', content: `Patient ${me?.name} submitted daily record with issues:\n- ${flags.join('\n- ')}\nVHV has been asked to schedule an appointment.` } as any)
                }
              }
            }
          } catch (err) {
            console.warn('Alerting VHV failed:', err)
          }
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving daily record:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'range' || type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'None'
    if (level <= 3) return 'Mild'
    if (level <= 6) return 'Moderate'
    if (level <= 8) return 'Severe'
    return 'Extreme'
  }

  const getLevelColor = (level: number) => {
    if (level === 0) return 'text-green-600'
    if (level <= 3) return 'text-yellow-600'
    if (level <= 6) return 'text-orange-600'
    if (level <= 8) return 'text-red-600'
    return 'text-red-800'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {record ? 'Edit Daily Record' : 'New Daily Record'}
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                Basic Information
              </h3>

              {(user?.role === 'doctor' || user?.role === 'volunteer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select
                    name="patient_id"
                    required
                    value={formData.patient_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map((p:any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Date *
                </label>
                <input
                  type="date"
                  name="record_date"
                  required
                  value={formData.record_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Vital Signs */}
              <h4 className="text-md font-semibold text-gray-800 mt-6">Vital Signs</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    type="text"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="e.g., 98.6°F"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pulse
                  </label>
                  <input
                    type="text"
                    name="pulse"
                    value={formData.pulse}
                    onChange={handleChange}
                    placeholder="e.g., 72 bpm"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    name="blood_pressure"
                    value={formData.blood_pressure}
                    onChange={handleChange}
                    placeholder="e.g., 120/80 mmHg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 70 kg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Sugar
                  </label>
                  <input
                    type="text"
                    name="blood_sugar"
                    value={formData.blood_sugar}
                    onChange={handleChange}
                    placeholder="e.g., 110 mg/dL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oxygen Saturation
                  </label>
                  <input
                    type="text"
                    name="oxygen_saturation"
                    value={formData.oxygen_saturation}
                    onChange={handleChange}
                    placeholder="e.g., 98%"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
            </div>
          </div>

          {/* Symptoms & Well-being */}
          <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
                Symptoms & Well-being
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pain Level: <span className={`font-semibold ${getLevelColor(formData.pain_level)}`}>
                    {formData.pain_level} - {getLevelLabel(formData.pain_level)}
                  </span>
                </label>
                <input
                  type="range"
                  name="pain_level"
                  min="0"
                  max="10"
                  value={formData.pain_level}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 - No Pain</span>
                  <span>10 - Extreme Pain</span>
                </div>
            </div>

            {/* Doctor Instructions (read-only to non-doctors) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Instructions</label>
              <textarea
                name="dr_instructions"
                rows={3}
                value={formData.dr_instructions}
                onChange={handleChange}
                readOnly={user?.role !== 'doctor'}
                placeholder="Guidance for patient/volunteer (visible to them, not editable)"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${user?.role !== 'doctor' ? 'bg-gray-50' : ''}`}
              />
            </div>

            {/* Custom Fields (doctor only) */}
            {user?.role === 'doctor' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Fields</label>
                <div className="space-y-3">
                  {customFields.map((f, idx) => (
                    <div key={f.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                      <input className="px-3 py-2 border rounded md:col-span-2" placeholder="Label" value={f.label} onChange={e=>{
                        const v=e.target.value; setCustomFields(prev=>prev.map((x,i)=> i===idx?{...x,label:v}:x))
                      }} />
                      <select className="px-3 py-2 border rounded" value={f.type} onChange={e=>{
                        const v=e.target.value; setCustomFields(prev=>prev.map((x,i)=> i===idx?{...x,type:v}:x))
                      }}>
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                      </select>
                      <input className="px-3 py-2 border rounded md:col-span-2" placeholder="Options (comma separated)" value={f.options||''} onChange={e=>{
                        const v=e.target.value; setCustomFields(prev=>prev.map((x,i)=> i===idx?{...x,options:v}:x))
                      }} />
                      <button type="button" className="text-red-600 text-sm" onClick={()=> setCustomFields(prev=>prev.filter((_,i)=>i!==idx))}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="px-3 py-2 border rounded text-sm" onClick={()=> setCustomFields(prev=> ([...prev, { id: 'cf-' + Math.random().toString(36).slice(2,9), label: '', type: 'text', options: '' }]))}>+ Add Field</button>
                </div>
              </div>
            )}

            {/* Custom Field Values (filled by doctor when creating/editing) */}
            {((customFields.length>0) || ((formData.custom_fields||[] as any).length>0)) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Values</label>
                <div className="space-y-3">
                  {((user?.role==='doctor'?customFields:(formData.custom_fields as any))||[]).map((f:any)=>{
                    const key=f.id; const val=(formData.custom_values as any)[key] ?? ''
                    const setVal=(v:any)=> setFormData(prev=> ({...prev, custom_values: { ...(prev.custom_values||{}), [key]: v }}))
                    if (f.type==='textarea') return <textarea key={key} rows={2} className="w-full px-3 py-2 border rounded" value={val} onChange={e=>setVal(e.target.value)} readOnly={user?.role!=='doctor'} placeholder={f.label} />
                    if (f.type==='number') return <input key={key} type="number" className="w-full px-3 py-2 border rounded" value={val} onChange={e=>setVal(e.target.value)} readOnly={user?.role!=='doctor'} placeholder={f.label} />
                    if (f.type==='date') return <input key={key} type="date" className="w-full px-3 py-2 border rounded" value={val} onChange={e=>setVal(e.target.value)} readOnly={user?.role!=='doctor'} />
                    if (f.type==='select') return (
                      <select key={key} className="w-full px-3 py-2 border rounded" value={val} onChange={e=>setVal(e.target.value)} disabled={user?.role!=='doctor'}>
                        <option value="">Select…</option>
                        {(f.options||'').split(',').map((o:string)=>o.trim()).filter(Boolean).map((o:string)=>(<option key={o} value={o}>{o}</option>))}
                      </select>
                    )
                    if (f.type==='checkbox') return (
                      <div key={key} className="flex flex-wrap gap-3">
                        {(f.options||'').split(',').map((o:string)=>o.trim()).filter(Boolean).map((o:string)=>{
                          const arr=Array.isArray(val)?val:[]; const checked=arr.includes(o)
                          return (
                            <label key={o} className="text-sm text-gray-700 flex items-center gap-2">
                              <input type="checkbox" checked={checked} disabled={user?.role!=='doctor'} onChange={(e)=>{
                                const set=new Set(arr); if (e.target.checked) set.add(o); else set.delete(o); setVal(Array.from(set))
                              }} /> {o}
                            </label>
                          )
                        })}
                      </div>
                    )
                    if (f.type==='radio') return (
                      <div key={key} className="flex flex-wrap gap-3">
                        {(f.options||'').split(',').map((o:string)=>o.trim()).filter(Boolean).map((o:string)=> (
                          <label key={o} className="text-sm text-gray-700 flex items-center gap-2">
                            <input type="radio" name={key} value={o} checked={val===o} disabled={user?.role!=='doctor'} onChange={()=>setVal(o)} /> {o}
                          </label>
                        ))}
                      </div>
                    )
                    return <input key={key} className="w-full px-3 py-2 border rounded" value={val} onChange={e=>setVal(e.target.value)} readOnly={user?.role!=='doctor'} placeholder={f.label} />
                  })}
                </div>
              </div>
            )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fatigue Level: <span className={`font-semibold ${getLevelColor(formData.fatigue_level)}`}>
                    {formData.fatigue_level} - {getLevelLabel(formData.fatigue_level)}
                  </span>
                </label>
                <input
                  type="range"
                  name="fatigue_level"
                  min="0"
                  max="10"
                  value={formData.fatigue_level}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 - No Fatigue</span>
                  <span>10 - Extreme Fatigue</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood
                  </label>
                  <select
                    name="mood"
                    value={formData.mood}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="very_poor">Very Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appetite
                  </label>
                  <select
                    name="appetite"
                    value={formData.appetite}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="very_poor">Very Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sleep Quality
                  </label>
                  <select
                    name="sleep_quality"
                    value={formData.sleep_quality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="very_poor">Very Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms Description
                </label>
                <textarea
                  name="symptoms_description"
                  rows={3}
                  value={formData.symptoms_description}
                  onChange={handleChange}
                  placeholder="Describe any symptoms you're experiencing..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medications Taken
                </label>
                <textarea
                  name="medications_taken"
                  rows={2}
                  value={formData.medications_taken}
                  onChange={handleChange}
                  placeholder="List medications taken today..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activities
                </label>
                <textarea
                  name="activities"
                  rows={2}
                  value={formData.activities}
                  onChange={handleChange}
                  placeholder="Describe your activities today..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes or observations..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{record ? 'Update Record' : 'Save Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
