import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createPatientProfile, updatePatientProfile } from '../../lib/dummyDatabase'
import { PatientProfile } from '../../types'
import { ArrowLeft, Save, User } from 'lucide-react'

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
    caregivers_contact: '',
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
    doctors_note: ''
  })

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        doe: patient.doe,
        gender: patient.gender,
        address: patient.address,
        caregivers_contact: patient.caregivers_contact,
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
      })
    }
  }, [patient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (patient) {
        // Update existing patient
        const { error } = await updatePatientProfile(patient.id, formData)

        if (error) {
          console.error('Error updating patient:', error)
          return
        }
      } else {
        // Create new patient
        const { error } = await createPatientProfile({
          ...formData,
          created_by: user?.id || '',
          user_id: user?.id || '' // For now, using the creator as the linked user
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
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const isReadOnly = user?.role === 'patient' && patient

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Record Number *
                </label>
                <input
                  type="text"
                  name="medical_record_number"
                  required
                  value={formData.medical_record_number}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caregiver's Contact *
                </label>
                <input
                  type="text"
                  name="caregivers_contact"
                  required
                  value={formData.caregivers_contact}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Doctor *
                </label>
                <input
                  type="text"
                  name="assigned_doctor"
                  required
                  value={formData.assigned_doctor}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Record Date
                </label>
                <input
                  type="date"
                  name="last_record_date"
                  value={formData.last_record_date}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned VHV Name
                </label>
                <input
                  type="text"
                  name="assigned_vhv_name"
                  value={formData.assigned_vhv_name}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BMI
                </label>
                <input
                  type="text"
                  name="bmi"
                  value={formData.bmi}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  placeholder="e.g., 22.9"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mental Health Status
                </label>
                <textarea
                  name="mental_health_status"
                  rows={2}
                  value={formData.mental_health_status}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                />
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
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="smoker"
                    checked={formData.smoker}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Smoker</span>
                </label>
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