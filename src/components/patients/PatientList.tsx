import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfiles } from '../../lib/dummyDatabase'
import { PatientProfile } from '../../types'
import { Plus, Search, User, Calendar, Phone } from 'lucide-react'
import { PatientForm } from './PatientForm'

export const PatientList: React.FC = () => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const { data, error } = await getPatientProfiles()

      if (error) {
        console.error('Error fetching patients:', error)
      } else {
        setPatients((data || []).map(profile => ({
          ...profile,
          created_by_user: profile.created_by_user
        })))
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.doctor_diagnosed.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (patient: PatientProfile) => {
    setEditingPatient(patient)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPatient(null)
    fetchPatients()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <PatientForm
        patient={editingPatient}
        onClose={handleFormClose}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
        {(user?.role === 'doctor' || user?.role === 'volunteer') && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Patient</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name, MRN, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleEdit(patient)}
          >
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {patient.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  MRN: {patient.medical_record_number}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {patient.doctor_diagnosed}
                </p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Gender: {patient.gender}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{patient.caregivers_contact}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Dr: {patient.assigned_doctor}</span>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Created by: {patient.created_by_user?.full_name} ({patient.created_by_user?.role})
              </div>
              {(patient.patient_categories.critical || patient.patient_categories.elderly || patient.patient_categories.pregnant) && (
                <div className="flex space-x-1 mt-2">
                  {patient.patient_categories.critical && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical</span>
                  )}
                  {patient.patient_categories.elderly && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Elderly</span>
                  )}
                  {patient.patient_categories.pregnant && (
                    <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Pregnant</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
          </p>
        </div>
      )}
    </div>
  )
}