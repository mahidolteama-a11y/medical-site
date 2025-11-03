import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfileByUserId, getVolunteers } from '../../lib/dummyDatabase'
import { PatientProfile as PatientProfileType } from '../../types'
import { User, Calendar, Phone, AlertTriangle, Pill, FileText, Heart, MapPin, MessageSquare } from 'lucide-react'

export const PatientProfile: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<PatientProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignedVhv, setAssignedVhv] = useState<any | null>(null)

  useEffect(() => {
    fetchPatientProfile()
  }, [user])

  const fetchPatientProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await getPatientProfileByUserId(user.id)

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching patient profile:', error)
      } else {
        setProfile(data)
        // Resolve assigned VHV details by name match
        if (data?.assigned_vhv_name) {
          try {
            const { data: volunteers } = await getVolunteers()
            const match = (volunteers || []).find((v: any) =>
              typeof data.assigned_vhv_name === 'string' &&
              (v.name || '').toLowerCase().includes((data.assigned_vhv_name || '').toLowerCase())
            )
            if (match) setAssignedVhv(match)
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Found</h2>
          <p className="text-gray-600">
            Your medical profile hasn't been created yet. Please contact your healthcare provider
            to set up your profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-600">Medical Record: {profile.medical_record_number}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* IDs */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded"><span className="text-gray-600">Patient ID:</span> <span className="font-mono text-gray-900">{profile.id}</span></div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded"><span className="text-gray-600">User ID:</span> <span className="font-mono text-gray-900">{profile.user_id}</span></div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded"><span className="text-gray-600">MRN:</span> <span className="font-mono text-gray-900">{profile.medical_record_number}</span></div>
          </div>
          {/* Patient Categories */}
          {(profile.patient_categories.critical || profile.patient_categories.elderly || profile.patient_categories.pregnant) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Categories</h3>
              <div className="flex space-x-2">
                {profile.patient_categories.critical && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Critical</span>
                )}
                {profile.patient_categories.elderly && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">Elderly</span>
                )}
                {profile.patient_categories.pregnant && (
                  <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">Pregnant</span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assigned VHV Details */}
            {assignedVhv && (
              <div className="lg:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg"><User className="w-5 h-5 text-blue-600"/></div>
                    <div>
                      <div className="text-sm text-blue-800">Assigned VHV</div>
                      <div className="font-semibold text-blue-900">{assignedVhv.name} {assignedVhv.volunteer_code ? `(${assignedVhv.volunteer_code})` : ''}</div>
                      <div className="text-sm text-blue-800">{assignedVhv.email || ''} {assignedVhv.phone ? ` • ${assignedVhv.phone}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-start">
                    <button
                      onClick={() => {
                        try { localStorage.setItem('message:recipient', assignedVhv.user_id) } catch {}
                        try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'messages' })) } catch {}
                        if ((window as any).setAppView) { (window as any).setAppView('messages') }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                    <button
                      onClick={() => {
                        try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'map' })) } catch {}
                        if ((window as any).setAppView) { (window as any).setAppView('map') }
                      }}
                      className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 inline-flex items-center gap-2 text-sm"
                    >
                      <MapPin className="w-4 h-4" /> Open Map
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Gender</p>
                    <p className="text-gray-900 capitalize">{profile.gender}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-gray-900">{profile.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Caregiver's Contact</p>
                    <p className="text-gray-900">{profile.caregivers_contact}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Assigned Doctor</p>
                    {profile.assigned_doctor ? (
                      <button
                        onClick={() => {
                          try { localStorage.setItem('doctor:search', profile.assigned_doctor) } catch {}
                          try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'doctors' })) } catch {}
                          if ((window as any).setAppView) { (window as any).setAppView('doctors') }
                        }}
                        className="text-blue-700 hover:underline"
                      >
                        {profile.assigned_doctor}
                      </button>
                    ) : (
                      <p className="text-gray-900">Not assigned</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Assigned VHV</p>
                    <p className="text-gray-900">{profile.assigned_vhv_name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Vital Signs</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Height / Weight / BMI</p>
                  <p className="text-gray-900">{profile.height} / {profile.weight} / {profile.bmi}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Temperature</p>
                  <p className="text-gray-900">{profile.temperature}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Pulse</p>
                  <p className="text-gray-900">{profile.pulse}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Blood Pressure</p>
                  <p className="text-gray-900">{profile.blood_pressure}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Diabetes Status</p>
                  <p className="text-gray-900">{profile.diabetes || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Smoker</p>
                  <p className="text-gray-900">{profile.smoker ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History */}
          {profile.personal_health_history && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5" />
                <span>Personal Health History</span>
              </h4>
              <p className="text-blue-700">{profile.personal_health_history}</p>
            </div>
          )}

          {/* Doctor Diagnosed */}
          {profile.doctor_diagnosed && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-lg font-semibold text-green-800 flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5" />
                <span>Doctor Diagnosed</span>
              </h4>
              <p className="text-green-700">{profile.doctor_diagnosed}</p>
            </div>
          )}

          {/* Allergies */}
          {(profile.food_allergies || profile.medication_allergies) && (
            <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="text-lg font-semibold text-red-800 flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span>Allergies</span>
              </h4>
              {profile.food_allergies && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-red-800">Food Allergies:</p>
                  <p className="text-red-700">{profile.food_allergies}</p>
                </div>
              )}
              {profile.medication_allergies && (
                <div>
                  <p className="text-sm font-medium text-red-800">Medication Allergies:</p>
                  <p className="text-red-700">{profile.medication_allergies}</p>
                </div>
              )}
            </div>
          )}

          {/* Medications History */}
          {profile.medications_history && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-800 flex items-center space-x-2 mb-3">
                <Pill className="w-5 h-5" />
                <span>Medications History</span>
              </h4>
              <p className="text-purple-700">{profile.medications_history}</p>
            </div>
          )}

          {/* Mental Health Status */}
          {profile.mental_health_status && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="text-lg font-semibold text-indigo-800 flex items-center space-x-2 mb-3">
                <Heart className="w-5 h-5" />
                <span>Mental Health Status</span>
              </h4>
              <p className="text-indigo-700">{profile.mental_health_status}</p>
            </div>
          )}

          {/* Other Symptoms */}
          {profile.other_symptoms && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-lg font-semibold text-yellow-800 flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span>Other Symptoms</span>
              </h4>
              <p className="text-yellow-700">{profile.other_symptoms}</p>
            </div>
          )}

          {/* Pregnancy Details */}
          {profile.pregnancy_details && (
            <div className="mt-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <h4 className="text-lg font-semibold text-pink-800 flex items-center space-x-2 mb-3">
                <Heart className="w-5 h-5" />
                <span>Pregnancy Details</span>
              </h4>
              <p className="text-pink-700">{profile.pregnancy_details}</p>
            </div>
          )}

          {/* Doctor's Notes */}
          {profile.doctors_note && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5" />
                <span>Doctor's Notes</span>
              </h4>
              <p className="text-gray-700">{profile.doctors_note}</p>
            </div>
          )}

          {/* Profile Information */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Date of Entry: {new Date(profile.doe).toLocaleDateString()}</p>
            <p>Last Record Date: {profile.last_record_date ? new Date(profile.last_record_date).toLocaleDateString() : 'N/A'}</p>
            <p>Profile created by: {profile.created_by_user?.full_name} ({profile.created_by_user?.role})</p>
            <p>Created: {new Date(profile.created_at).toLocaleDateString()}</p>
            {profile.updated_at && (
              <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
