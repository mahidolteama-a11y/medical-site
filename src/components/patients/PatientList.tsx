import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfiles, getVolunteers } from '../../lib/dummyDatabase'
import { PatientProfile } from '../../types'
import { Plus, Search, User, Calendar, Phone, Eye, Activity } from 'lucide-react'
import { PatientForm } from './PatientForm'

export const PatientList: React.FC = () => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientProfile | null>(null)
  const [onlyAssigned, setOnlyAssigned] = useState(false)
  const [myVolunteerName, setMyVolunteerName] = useState<string>('')
  const [myAreaName, setMyAreaName] = useState<string>('')

  useEffect(() => {
    fetchPatients()
    // For volunteers, load their profile to filter by same area
    ;(async () => {
      if (user?.role !== 'volunteer') return
      const { data } = await getVolunteers()
      const mine = (data || []).find((v: any) => v.user_id === user.id)
      if (mine) {
        setMyVolunteerName(mine.user?.full_name || mine.name)
        setMyAreaName(mine.area_name || '')
      }
    })()
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

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase()
    let list = patients

    // For volunteers: filter by same area (doctor-defined map area)
    if (user?.role === 'volunteer' && myAreaName) {
      const area = myAreaName.toLowerCase()
      list = list.filter(p => (p.area_name || '').toLowerCase() === area)
    }

    if (user?.role === 'volunteer' && onlyAssigned && myVolunteerName) {
      list = list.filter(p => (p.assigned_vhv_name || '').toLowerCase().includes(myVolunteerName.toLowerCase()))
    }

    return list.filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      patient.medical_record_number.toLowerCase().includes(term) ||
      patient.assigned_vhv_name?.toLowerCase().includes(term) ||
      patient.assigned_doctor?.toLowerCase().includes(term) ||
      patient.doctor_diagnosed.toLowerCase().includes(term)
    )
  }, [patients, searchTerm, user?.role, onlyAssigned, myVolunteerName, myAreaName])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize))
  const pagePatients = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredPatients.slice(start, start + pageSize)
  }, [filteredPatients, page])

  useEffect(() => {
    // Reset to first page on new search
    setPage(1)
  }, [searchTerm])

  const formatCategories = (p: PatientProfile) => {
    const labels: string[] = []
    if (p.patient_categories.critical) labels.push('Critical')
    if (p.patient_categories.elderly) labels.push('Elderly')
    if (p.patient_categories.pregnant) labels.push('Pregnant')
    return labels.length ? labels.join(', ') : 'Normal'
  }

  const subArea = (p: PatientProfile) => {
    // Best-effort: take the third-from-last part as Sub-District/Sub-Area (addressLine, subdistrict, district, province)
    const parts = (p.address || '').split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length >= 3) return parts[parts.length - 3]
    if (parts.length >= 2) return parts[parts.length - 2]
    if (parts.length >= 1) return parts[parts.length - 1]
    return ''
  }

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

  const isDoctor = user?.role === 'doctor'
  const isVolunteer = user?.role === 'volunteer'

  if (isDoctor || isVolunteer) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-xl">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="ml-3 flex items-center gap-3">
            {isVolunteer && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={onlyAssigned} onChange={e=>setOnlyAssigned(e.target.checked)} />
                Assigned to me
              </label>
            )}
            {(user?.role === 'doctor' || user?.role === 'volunteer') && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200"
              >
                <Plus className="w-4 h-4" />
                <span>create new patient</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sky-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned VHV</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagePatients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{p.medical_record_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCategories(p)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.assigned_vhv_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-sky-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Detail
                        </button>
                        <button
                          onClick={() => { 
                            localStorage.setItem('records_selected_patient', p.id); 
                            // Try both custom event and helper for navigation
                            try { window.dispatchEvent(new CustomEvent('codex:setView', { detail: 'records' })); } catch {}
                            if ((window as any).setAppView) { (window as any).setAppView('records') }
                          }}
                          className="text-green-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Activity className="w-4 h-4" />
                          Records
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagePatients.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with counts and pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {Math.min(page * pageSize, filteredPatients.length)} of {filteredPatients.length} patients
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-300"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                &lt;
              </button>
              {/* Simple page indicators: current, next, last */}
              <button className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200' : 'hover:bg-gray-100'}`} onClick={() => setPage(1)}>1</button>
              {totalPages > 2 && (
                <>
                  {page > 2 && <span className="px-1">…</span>}
                  {page > 1 && page < totalPages && (
                    <button className="px-3 py-1 rounded bg-gray-200">{page}</button>
                  )}
                  {page < totalPages - 1 && <span className="px-1">…</span>}
                </>
              )}
              {totalPages > 1 && (
                <button className={`px-3 py-1 rounded ${page === totalPages ? 'bg-gray-200' : 'hover:bg-gray-100'}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button
                className="px-2 py-1 rounded hover:bg-gray-100 disabled:text-gray-300"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback (volunteer/patient) — keep the original card view
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
