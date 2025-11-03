import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getDailyRecords, deleteDailyRecord, getPatientProfiles, getDoctorRecords, deleteDoctorRecord } from '../../lib/dummyDatabase'
import { DailyRecord, DoctorRecord, PatientProfile } from '../../types'
import { Plus, Search, Activity, Calendar, TrendingUp, CreditCard as Edit, Trash2, User, Stethoscope } from 'lucide-react'
import { DailyRecordForm } from './DailyRecordForm'
import DoctorRecordForm from './DoctorRecordForm'

type Tab = 'daily' | 'doctor'

export const DailyRecordList: React.FC = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('daily')
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [docRecords, setDocRecords] = useState<DoctorRecord[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null)
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [editingDoctorRecord, setEditingDoctorRecord] = useState<DoctorRecord | null>(null)

  useEffect(() => {
    // Preselect patient from navigation hint
    const preset = localStorage.getItem('records_selected_patient')
    if (preset) {
      setSelectedPatient(preset)
      localStorage.removeItem('records_selected_patient')
    }
    fetchRecords()
    if (user?.role !== 'patient') {
      fetchPatients()
    }
  }, [user])

  const fetchRecords = async () => {
    try {
      const [dailyRes, docRes] = await Promise.all([
        getDailyRecords(undefined, user?.role === 'patient' ? user.id : undefined),
        getDoctorRecords(undefined, user?.role === 'patient' ? user.id : undefined)
      ])

      // Daily
      if (dailyRes.error) {
        console.error('Error fetching daily records:', dailyRes.error)
      } else {
        let list = dailyRes.data || []
        if (user?.role === 'volunteer') {
          const myName = (user.full_name || '').toLowerCase()
          list = list.filter((r:any)=> r.patient && typeof r.patient.assigned_vhv_name === 'string' && r.patient.assigned_vhv_name.toLowerCase().includes(myName))
        }
        setRecords(list as any)
      }

      // Doctor
      if (docRes.error) {
        console.error('Error fetching doctor records:', docRes.error)
      } else {
        let list = docRes.data || []
        if (user?.role === 'volunteer') {
          const myName = (user.full_name || '').toLowerCase()
          list = list.filter((r:any)=> r.patient && typeof r.patient.assigned_vhv_name === 'string' && r.patient.assigned_vhv_name.toLowerCase().includes(myName))
        }
        setDocRecords(list as any)
      }
    } catch (error) {
      console.error('Error fetching daily records:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const { data, error } = await getPatientProfiles()
      if (error) {
        console.error('Error fetching patients:', error)
      } else {
        if (user?.role === 'volunteer') {
          const myName = (user.full_name || '').toLowerCase()
          const assigned = (data || []).filter((p:any)=> typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(myName))
          setPatients(assigned as any)
        } else {
          setPatients(data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleEdit = (record: DailyRecord) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleEditDoctor = (record: DoctorRecord) => {
    setEditingDoctorRecord(record)
    setShowDoctorForm(true)
  }

  const handleDelete = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this daily record?')) {
      try {
        const { error } = await deleteDailyRecord(recordId)
        if (error) {
          console.error('Error deleting record:', error)
        } else {
          fetchRecords()
        }
      } catch (error) {
        console.error('Error deleting record:', error)
      }
    }
  }

  const handleDeleteDoctor = async (recordId: string) => {
    if (window.confirm('Delete this visit record?')) {
      const { error } = await deleteDoctorRecord(recordId)
      if (error) console.error('Error deleting record:', error)
      else fetchRecords()
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingRecord(null)
    fetchRecords()
  }

  const handleDoctorFormClose = () => {
    setShowDoctorForm(false)
    setEditingDoctorRecord(null)
    fetchRecords()
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.symptoms_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPatient = selectedPatient === 'all' || record.patient_id === selectedPatient
    
    return matchesSearch && matchesPatient
  })

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-orange-100 text-orange-800'
      case 'very_poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPainLevelColor = (level?: number) => {
    if (!level || level === 0) return 'text-green-600'
    if (level <= 3) return 'text-yellow-600'
    if (level <= 6) return 'text-orange-600'
    if (level <= 8) return 'text-red-600'
    return 'text-red-800'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <DailyRecordForm
        record={editingRecord}
        onClose={handleFormClose}
      />
    )
  }
  if (showDoctorForm) {
    return (
      <DoctorRecordForm
        record={editingDoctorRecord as any}
        onClose={handleDoctorFormClose}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
          <button className={`px-4 py-2 text-sm ${tab==='daily'?'bg-green-600 text-white':'bg-white text-gray-700'}`} onClick={()=>setTab('daily')}>Daily Records</button>
          <button className={`px-4 py-2 text-sm border-l border-gray-200 ${tab==='doctor'?'bg-blue-600 text-white':'bg-white text-gray-700'}`} onClick={()=>setTab('doctor')}>Visit Records</button>
        </div>
        <div className="flex items-center gap-2">
          {tab==='daily' && (user?.role === 'patient' || user?.role === 'doctor') && (
            <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Add Daily</span>
            </button>
          )}
          {tab==='doctor' && user?.role === 'doctor' && (
            <button onClick={() => setShowDoctorForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Add Visit Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {user?.role !== 'patient' && (
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Patients</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} - {patient.medical_record_number}
            </option>
          ))}
        </select>
      )}
        </div>
      </div>

      {/* Records Grid */}
      {tab==='daily' ? (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user?.role === 'patient' ? 'My Record' : record.patient?.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(record.record_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {(user?.role === 'doctor' || record.recorded_by === user?.id) && (
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Edit Record"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {(user?.role === 'doctor' || record.recorded_by === user?.id) && (
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Vital Signs Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Vital Signs</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {record.temperature && (
                  <div>
                    <span className="text-gray-500">Temp:</span>
                    <span className="ml-1 font-medium">{record.temperature}</span>
                  </div>
                )}
                {record.pulse && (
                  <div>
                    <span className="text-gray-500">Pulse:</span>
                    <span className="ml-1 font-medium">{record.pulse}</span>
                  </div>
                )}
                {record.blood_pressure && (
                  <div>
                    <span className="text-gray-500">BP:</span>
                    <span className="ml-1 font-medium">{record.blood_pressure}</span>
                  </div>
                )}
                {record.weight && (
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <span className="ml-1 font-medium">{record.weight}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Symptoms & Well-being */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mood:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(record.mood)}`}>
                  {record.mood?.replace('_', ' ').charAt(0).toUpperCase() + record.mood?.replace('_', ' ').slice(1)}
                </span>
              </div>

              {(record.pain_level !== undefined && record.pain_level > 0) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pain Level:</span>
                  <span className={`font-medium ${getPainLevelColor(record.pain_level)}`}>
                    {record.pain_level}/10
                  </span>
                </div>
              )}

              {(record.fatigue_level !== undefined && record.fatigue_level > 0) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fatigue:</span>
                  <span className={`font-medium ${getPainLevelColor(record.fatigue_level)}`}>
                    {record.fatigue_level}/10
                  </span>
                </div>
              )}

              {record.symptoms_description && (
                <div>
                  <span className="text-sm text-gray-600">Symptoms:</span>
                  <p className="text-sm text-gray-900 mt-1 line-clamp-2">
                    {record.symptoms_description}
                  </p>
                </div>
              )}

              {record.notes && (
                <div>
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="text-sm text-gray-900 mt-1 line-clamp-2">
                    {record.notes}
                  </p>
                </div>
              )}

              {record.dr_instructions && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900">Doctor Instructions</div>
                  <div className="text-sm text-blue-800 mt-1 whitespace-pre-wrap">{record.dr_instructions}</div>
                </div>
              )}

              {Array.isArray((record as any).custom_fields) && ((record as any).custom_fields as any[]).length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-semibold text-gray-800 mb-1">Additional Information</div>
                  <div className="space-y-1 text-sm">
                    {((record as any).custom_fields as any[]).map((f:any)=>{
                      const val = (record as any).custom_values ? (record as any).custom_values[f.id] : undefined
                      const display = Array.isArray(val) ? val.join(', ') : (val ?? '')
                      return (
                        <div key={f.id} className="flex justify-between gap-3">
                          <span className="text-gray-600">{f.label}</span>
                          <span className="text-gray-900 text-right break-words">{String(display) || '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3" />
                <span>Recorded by: {record.recorded_by_user?.full_name}</span>
              </div>
              <p className="mt-1">
                Created: {new Date(record.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || selectedPatient !== 'all' 
              ? 'No records found matching your filters.' 
              : 'No daily records found.'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Start tracking daily symptoms and vital signs by creating your first record.
          </p>
        </div>
      )}
    </>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {docRecords
          .filter(r => selectedPatient==='all' || r.patient_id === selectedPatient)
          .filter(r => (r.title||'').toLowerCase().includes(searchTerm.toLowerCase()) || (r.summary||'').toLowerCase().includes(searchTerm.toLowerCase()) || (r.diagnosis||'').toLowerCase().includes(searchTerm.toLowerCase()))
          .map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg"><Stethoscope className="w-5 h-5 text-blue-700"/></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{r.title || 'Visit Record'}</h3>
                  <div className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4"/>{new Date(r.visit_date).toLocaleDateString()} • <User className="w-4 h-4"/>{r.recorded_by_user?.full_name || 'Doctor'}</div>
                </div>
              </div>
              {user?.role === 'doctor' && (
                <div className="flex space-x-2">
                  <button onClick={()=>handleEditDoctor(r)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="w-4 h-4"/></button>
                  <button onClick={()=>handleDeleteDoctor(r.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4"/></button>
                </div>
              )}
            </div>
            {r.summary && (<div className="text-sm text-gray-800 mb-2"><span className="font-medium">Summary:</span> {r.summary}</div>)}
            {r.diagnosis && (<div className="text-sm text-gray-800 mb-2"><span className="font-medium">Diagnosis:</span> {r.diagnosis}</div>)}
            {r.prescriptions && (<div className="text-sm text-gray-800 mb-2"><span className="font-medium">Prescriptions:</span> {r.prescriptions}</div>)}
            {r.instructions && (<div className="text-sm text-gray-800 mb-2"><span className="font-medium">Instructions:</span> {r.instructions}</div>)}
          </div>
        ))}

        {docRecords.filter(r => selectedPatient==='all' || r.patient_id === selectedPatient).length === 0 && (
          <div className="text-center py-12 col-span-full">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No visit records found.</p>
          </div>
        )}
      </div>
      )}
    
    </div>
  )
}
