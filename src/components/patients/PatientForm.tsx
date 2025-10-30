import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createPatientProfile, updatePatientProfile, getUsers, createPatientUser, getNextMRN, getVolunteers, getPatientProfiles } from '../../lib/dummyDatabase'
import { getUserById, setUserEmail } from '../../lib/dummyAuth'
import { PatientProfile } from '../../types'
import { ArrowLeft, Save, User } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getAllMapAreas } from '../../lib/mapAreasService'
import { assignAreaDualMethod, AreaAssignmentResult } from '../../lib/areaAssignment'
import THAI_PROVINCES from '../../data/thaiProvinces'
import THAI_ADMIN_MAP from '../../data/thaiAdministrative'

interface PatientFormProps {
  patient?: PatientProfile | null
  onClose: () => void
}

export const PatientForm: React.FC<PatientFormProps> = ({ patient, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    doe: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: '',
    // Structured address helpers
    province: '',
    district: '',
    subdistrict: '',
    addressLine: '',
    // Contacts
    phone_number: '',
    caregivers_contact: '',
    caregiver_name: '',
    caregiver_phone: '',
    assigned_doctor: '',
    last_record_date: '',
    today_date: new Date().toISOString().split('T')[0],
    assigned_vhv_name: '',
    medical_record_number: '',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    personal_health_history: '',
    doctor_diagnosed: '',
    medications_history: '',
    food_allergies: '',
    medication_allergies: '',
    height: '',
    weight: '',
    bmi: '',
    temperature: '',
    pulse: '',
    blood_pressure: '',
    diabetes: '',
    mental_health_status: '',
    other_symptoms: '',
    pregnancy_details: '',
    smoker: false,
    doctors_note: '',
    photo_url: '' as any,
    // geo
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    // patient account
    patient_email: ''
  })

  // Options for doctor and volunteers
  const [doctors, setDoctors] = useState<{ id: string; full_name: string }[]>([])
  const [volunteerProfiles, setVolunteerProfiles] = useState<any[]>([])
  const [vhvCounts, setVhvCounts] = useState<Record<string, number>>({})
  const [areas, setAreas] = useState<any[]>([])
  const [assignmentResult, setAssignmentResult] = useState<AreaAssignmentResult | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    // load users for selects
    (async () => {
      const { data } = await getUsers()
      const docs = (data || []).filter((u: any) => u.role === 'doctor').map((u: any) => ({ id: u.id, full_name: u.full_name }))
      setDoctors(docs)

      const vols = await getVolunteers()
      setVolunteerProfiles(vols.data || [])

      // Build counts of assigned patients per VHV (by volunteer display name)
      try {
        const pats = await getPatientProfiles()
        const counts: Record<string, number> = {}
        for (const p of (pats.data || []) as any[]) {
          const name = (p.assigned_vhv_name || '').toLowerCase().trim()
          if (!name) continue
          counts[name] = (counts[name] || 0) + 1
        }
        setVhvCounts(counts)
      } catch {}

      const ma = await getAllMapAreas()
      setAreas(ma.data || [])
    })()

    if (patient) {
      setFormData({
        name: patient.name,
        doe: patient.doe,
        gender: patient.gender,
        address: patient.address,
        // parse address best-effort by comma segments
        province: (patient.address.split(',').map(s => s.trim()).slice(-1)[0] || ''),
        district: (patient.address.split(',').map(s => s.trim()).slice(-2, -1)[0] || ''),
        subdistrict: (patient.address.split(',').map(s => s.trim()).slice(-3, -2)[0] || ''),
        addressLine: patient.address.split(',').slice(0, -3).join(', ').trim(),
        phone_number: patient.phone_number || '',
        caregivers_contact: patient.caregivers_contact,
        caregiver_name: patient.caregivers_contact.split('-')[0]?.trim() || '',
        caregiver_phone: patient.caregivers_contact.split('-')[1]?.trim() || '',
        assigned_doctor: patient.assigned_doctor,
        last_record_date: patient.last_record_date,
        today_date: patient.today_date,
        assigned_vhv_name: patient.assigned_vhv_name,
        medical_record_number: patient.medical_record_number,
        patient_categories: patient.patient_categories,
        personal_health_history: patient.personal_health_history,
        doctor_diagnosed: patient.doctor_diagnosed,
        medications_history: patient.medications_history,
        food_allergies: patient.food_allergies,
        medication_allergies: patient.medication_allergies,
        height: patient.height,
        weight: patient.weight,
        bmi: patient.bmi,
        temperature: patient.temperature,
        pulse: patient.pulse,
        blood_pressure: patient.blood_pressure,
        diabetes: patient.diabetes,
        mental_health_status: patient.mental_health_status,
        other_symptoms: patient.other_symptoms,
        pregnancy_details: patient.pregnancy_details,
        smoker: patient.smoker,
        doctors_note: patient.doctors_note
        ,
        lat: patient.lat,
        lng: patient.lng,
        patient_email: (patient.user_id ? (getUserById(patient.user_id)?.email || '') : '')
      })
    }
  }, [patient])

  // Determine area assignment from location or address
  useEffect(() => {
    const fullAddress = [formData.addressLine, formData.subdistrict, formData.district, formData.province]
      .filter(Boolean)
      .join(', ')
    if ((formData.lat && formData.lng) || fullAddress.length > 5) {
      const t = setTimeout(async () => {
        setIsAssigning(true)
        const result = await assignAreaDualMethod(formData.lat, formData.lng, fullAddress, areas)
        setAssignmentResult(result)
        if (result.geocodedLat && result.geocodedLng && !formData.lat && !formData.lng) {
          setFormData(prev => ({ ...prev, lat: result.geocodedLat, lng: result.geocodedLng }))
        }
        setIsAssigning(false)
      }, 600)
      return () => clearTimeout(t)
    } else {
      setAssignmentResult(null)
    }
  }, [formData.lat, formData.lng, formData.addressLine, formData.subdistrict, formData.district, formData.province, areas])

  // On create mode, prefill MRN with the next auto-generated value
  useEffect(() => {
    if (!patient) {
      (async () => {
        const mrn = await getNextMRN()
        setFormData(prev => ({ ...prev, medical_record_number: mrn }))
      })()
    }
  }, [patient])

  // Auto-calc BMI when height/weight provided
  useEffect(() => {
    const h = parseFloat(formData.height)
    const w = parseFloat(formData.weight)
    if (h > 0 && w > 0 && !Number.isNaN(h) && !Number.isNaN(w)) {
      const bmi = w / Math.pow(h / 100, 2)
      setFormData(prev => ({ ...prev, bmi: bmi.toFixed(1) }))
    }
  }, [formData.height, formData.weight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Compose combined address and caregiver strings
      const composedAddress = [formData.addressLine, formData.subdistrict, formData.district, formData.province]
        .filter(Boolean)
        .join(', ')
      const caregiver = [formData.caregiver_name, formData.caregiver_phone].filter(Boolean).join(' - ')

      // Build payload limited to known profile fields
      const basePayload: any = {
        name: formData.name,
        doe: formData.doe,
        gender: formData.gender,
        address: composedAddress || formData.address,
        phone_number: formData.phone_number,
        caregivers_contact: caregiver || formData.caregivers_contact,
        assigned_doctor: formData.assigned_doctor,
        last_record_date: formData.last_record_date,
        today_date: formData.today_date,
        assigned_vhv_name: formData.assigned_vhv_name,
        medical_record_number: formData.medical_record_number,
        patient_categories: formData.patient_categories,
        personal_health_history: formData.personal_health_history,
        doctor_diagnosed: formData.doctor_diagnosed,
        medications_history: formData.medications_history,
        food_allergies: formData.food_allergies,
        medication_allergies: formData.medication_allergies,
        height: formData.height,
        weight: formData.weight,
        bmi: formData.bmi,
        temperature: formData.temperature,
        pulse: formData.pulse,
        blood_pressure: formData.blood_pressure,
        diabetes: formData.diabetes,
        mental_health_status: formData.mental_health_status,
        other_symptoms: formData.other_symptoms,
        pregnancy_details: formData.pregnancy_details,
        smoker: formData.smoker,
        doctors_note: formData.doctors_note,
        lat: formData.lat,
        lng: formData.lng,
        photo_url: (formData as any).photo_url,
        area_id: assignmentResult?.area?.id,
        area_name: assignmentResult?.area?.name,
      }

      if (patient) {
        // Update existing patient. If patient has no linked account yet and an email is provided, create it.
        let updates: any = { ...basePayload }
        if ((!patient.user_id || !getUserById(patient.user_id)) && formData.patient_email) {
          const { data: pUser } = await createPatientUser(formData.patient_email, formData.name)
          if (pUser?.id) updates.user_id = pUser.id
        } else if (patient.user_id && formData.patient_email) {
          // If email changed, update the existing user email
          const existing = patient.user_id ? getUserById(patient.user_id) : undefined
          if (existing && existing.email.toLowerCase() !== formData.patient_email.toLowerCase()) {
            const { error } = await setUserEmail(patient.user_id, formData.patient_email)
            if (error) {
              console.error('Error updating user email:', error)
            }
          }
        }
        const { error } = await updatePatientProfile(patient.id, updates)

        if (error) {
          console.error('Error updating patient:', error)
          return
        }
      } else {
        // Create new patient
        // Ensure a patient user exists; require email
        const { data: newUser } = await createPatientUser(formData.patient_email, formData.name)
        const { error } = await createPatientProfile({
          ...basePayload,
          created_by: user?.id || '',
          user_id: newUser?.id || '',
        })

        if (error) {
          console.error('Error creating patient:', error)
          return
        }
      }

      onClose()
    } catch (error) {
      console.error('Error saving patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      if (name.startsWith('patient_categories.')) {
        const category = name.split('.')[1]
        setFormData({
          ...formData,
          patient_categories: {
            ...formData.patient_categories,
            [category]: checkbox.checked
          }
        })
      } else {
        setFormData({
          ...formData,
          [name]: checkbox.checked
        })
      }
    } else {
      // Cascading resets for province/district/subdistrict
      if (name === 'province') {
        setFormData({ ...formData, province: value, district: '', subdistrict: '' })
      } else if (name === 'district') {
        setFormData({ ...formData, district: value, subdistrict: '' })
      } else {
        setFormData({ ...formData, [name]: value })
      }
    }
  }

  const isReadOnly = false

  // Map helpers
  const defaultCenter: [number, number] = useMemo(() => {
    if (formData.lat && formData.lng) return [formData.lat, formData.lng]
    return [13.793, 100.321]
  }, [formData.lat, formData.lng])

  const patientIcon = useMemo(() => L.divIcon({
    className: 'patient-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#a21caf;border:2px solid #fff;box-shadow:0 0 0 3px rgba(162,28,175,0.25);color:#fff;font-size:14px;line-height:1">👤</div>`,
    iconSize: [26,26], iconAnchor: [13,13], popupAnchor: [0,-13]
  }), [])

  const ClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        setFormData(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }))
      }
    })
    return null
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
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient ? (isReadOnly ? 'My Profile' : 'Edit Patient') : 'New Patient'}
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Entry (DOE) *
                </label>
                <input
                  type="date"
                  name="doe"
                  required
                  value={formData.doe}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Record Number (auto)</label>
                <input type="text" name="medical_record_number" required value={formData.medical_record_number} onChange={handleChange} readOnly className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50" />
              </div>

              {/* Structured Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                <select name="province" value={formData.province} onChange={handleChange} disabled={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50">
                  <option value="">Select Province</option>
                  {THAI_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District / Amphoe</label>
                <select name="district" value={formData.district} onChange={handleChange} disabled={isReadOnly || !formData.province} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50">
                  <option value="">Select District</option>
                  {Object.keys(THAI_ADMIN_MAP[formData.province] || {}).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub-District / Tambon</label>
                <select name="subdistrict" value={formData.subdistrict} onChange={handleChange} disabled={isReadOnly || !formData.district} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50">
                  <option value="">Select Sub-District</option>
                  {(THAI_ADMIN_MAP[formData.province]?.[formData.district] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input type="text" name="addressLine" placeholder="House number, street, village" value={formData.addressLine} onChange={handleChange} readOnly={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50" />
              </div>

              {/* Profile photo for patient */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={(e)=>{
                    const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = ()=> setFormData(prev=>({ ...prev, photo_url: String(reader.result) })); reader.readAsDataURL(f)
                  }} disabled={isReadOnly} />
                  <span className="text-sm text-gray-500">or</span>
                  <input type="text" name="photo_url" placeholder="Image URL" value={(formData as any).photo_url || ''} onChange={handleChange} readOnly={isReadOnly} className="flex-1 px-3 py-2 border rounded" />
                </div>
                {(formData as any).photo_url && (
                  <img src={(formData as any).photo_url} alt="preview" className="mt-2 w-20 h-20 rounded-full object-cover" />
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Email (for login)</label>
                <input type="email" name="patient_email" value={formData.patient_email} onChange={handleChange} readOnly={isReadOnly} required={!patient} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caregiver's Name</label>
                <input type="text" name="caregiver_name" value={formData.caregiver_name} onChange={handleChange} readOnly={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caregiver's Contact Number</label>
                <input type="text" name="caregiver_phone" value={formData.caregiver_phone} onChange={handleChange} readOnly={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} readOnly={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Doctor *</label>
                <select name="assigned_doctor" required value={formData.assigned_doctor} onChange={handleChange} disabled={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50">
                  <option value="">Select</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.full_name}>{d.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned VHV</label>
                <select
                  name="assigned_vhv_name"
                  value={formData.assigned_vhv_name}
                  onChange={handleChange}
                  disabled={isReadOnly || !formData.lat || !formData.lng || !assignmentResult?.area}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">{(formData.lat && formData.lng && assignmentResult?.area) ? 'Select' : 'Pin location on map first'}</option>
                  {(() => {
                    const areaName = assignmentResult?.area?.name
                    const list = (volunteerProfiles || []).filter((v: any) => (v.area_name || '').toLowerCase() === (areaName || '').toLowerCase())
                    const opts = list.map((v: any) => ({ id: v.user_id || v.id, name: (v.user?.full_name || v.name) }))
                    const names = new Set(opts.map(o => o.name))
                    if (formData.assigned_vhv_name && !names.has(formData.assigned_vhv_name)) {
                      opts.unshift({ id: 'current', name: formData.assigned_vhv_name })
                    }
                    return opts.map(o => {
                      const key = o.name.toLowerCase()
                      const count = vhvCounts[key] || 0
                      return (
                        <option key={o.id + o.name} value={o.name}>{o.name} ({count})</option>
                      )
                    })
                  })()}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Today's Date
                </label>
                <input
                  type="date"
                  name="today_date"
                  value={formData.today_date}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Record Date</label>
                <input type="date" name="last_record_date" value={formData.last_record_date} onChange={handleChange} readOnly={isReadOnly} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Map Picker */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Location</h3>
            <p className="text-sm text-gray-600 mb-3">Click on the map to set the patient's exact location.</p>
            <div className="h-72 w-full border border-gray-200 rounded-lg overflow-hidden">
              <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <ClickHandler />
                {areas.map((area: any) => {
                  if (!area.geometry?.coordinates?.[0]) return null
                  const coords = area.geometry.coordinates[0].map((c: number[]) => [c[0], c[1]] as [number, number])
                  const isAssigned = assignmentResult?.area?.id === area.id
                  return (
                    <Polygon key={area.id} positions={coords} pathOptions={{
                      color: area.color,
                      fillColor: area.color,
                      fillOpacity: isAssigned ? 0.3 : 0.1,
                      weight: isAssigned ? 3 : 2
                    }} />
                  )
                })}
                {typeof formData.lat === 'number' && typeof formData.lng === 'number' && (
                  <Marker position={[formData.lat, formData.lng]} icon={patientIcon} />
                )}
              </MapContainer>
            </div>
            {assignmentResult && (
              <div className={`mt-3 p-3 rounded border ${assignmentResult.area ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                {assignmentResult.area ? (
                  <>
                    Assigned Area: <strong>{assignmentResult.area.name}</strong>
                    <span className="ml-2 text-xs opacity-70">{assignmentResult.confidence} ({assignmentResult.method})</span>
                  </>
                ) : (
                  <>No matching area for this location</>
                )}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Latitude</label>
                <input type="number" step="any" name="lat" value={formData.lat ?? ''} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Longitude</label>
                <input type="number" step="any" name="lng" value={formData.lng ?? ''} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Medical Information
            </h3>
            
            {/* Patient Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Categories
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="patient_categories.critical"
                    checked={formData.patient_categories.critical}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Critical</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="patient_categories.elderly"
                    checked={formData.patient_categories.elderly}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Elderly</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="patient_categories.pregnant"
                    checked={formData.patient_categories.pregnant}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Pregnant</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Health History
                </label>
                <textarea
                  name="personal_health_history"
                  rows={3}
                  value={formData.personal_health_history}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Diagnosed
                </label>
                <textarea
                  name="doctor_diagnosed"
                  rows={3}
                  value={formData.doctor_diagnosed}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medications History
                </label>
                <textarea
                  name="medications_history"
                  rows={3}
                  value={formData.medications_history}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Allergies
                </label>
                <input
                  type="text"
                  name="food_allergies"
                  value={formData.food_allergies}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Allergies
                </label>
                <input
                  type="text"
                  name="medication_allergies"
                  value={formData.medication_allergies}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  placeholder="e.g., 175 cm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
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
                  readOnly={isReadOnly}
                  placeholder="e.g., 70 kg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BMI</label>
                <input type="text" name="bmi" value={formData.bmi} onChange={handleChange} readOnly placeholder="Auto-calculated" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature
                </label>
                <input
                  type="text"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  placeholder="e.g., 98.6°F"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
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
                  readOnly={isReadOnly}
                  placeholder="e.g., 72 bpm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
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
                  readOnly={isReadOnly}
                  placeholder="e.g., 120/80 mmHg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diabetes
                </label>
                <input
                  type="text"
                  name="diabetes"
                  value={formData.diabetes}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  placeholder="e.g., Type 2, HbA1c: 7.2%"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mental Health Status</label>
                <div className="flex flex-wrap gap-4">
                  {['Normal','Anxiety','Depression','Stress','Other'].map(opt => {
                    const selected = (formData.mental_health_status || '').split(',').map(s => s.trim()).includes(opt)
                    return (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const set = new Set((formData.mental_health_status || '').split(',').map(s => s.trim()).filter(Boolean))
                            if (e.target.checked) set.add(opt); else set.delete(opt)
                            setFormData(prev => ({ ...prev, mental_health_status: Array.from(set).join(', ') }))
                          }}
                          disabled={isReadOnly}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        {opt}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any Other Symptoms
                </label>
                <textarea
                  name="other_symptoms"
                  rows={2}
                  value={formData.other_symptoms}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pregnancy Details
                </label>
                <textarea
                  name="pregnancy_details"
                  rows={3}
                  value={formData.pregnancy_details}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                  placeholder="Include gestational age, due date, complications, etc."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Smoker</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="smoker" checked={formData.smoker === true} onChange={() => setFormData(prev => ({ ...prev, smoker: true }))} disabled={isReadOnly} />
                    Yes
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="smoker" checked={formData.smoker === false} onChange={() => setFormData(prev => ({ ...prev, smoker: false }))} disabled={isReadOnly} />
                    No
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor's Notes
                </label>
                <textarea
                  name="doctors_note"
                  rows={4}
                  value={formData.doctors_note}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                  placeholder="Doctor's observations, recommendations, and notes..."
                />
              </div>
            </div>
          </div>

          {!isReadOnly && (
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{patient ? 'Update Patient' : 'Create Patient'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
