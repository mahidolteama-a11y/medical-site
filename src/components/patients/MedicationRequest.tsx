import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfileByUserId, getUsers, getVolunteers, sendMessageToDatabase, createMedicationRequest, getMedicationRequests } from '../../lib/dummyDatabase'
import { Pill, Send, Stethoscope, User as UserIcon } from 'lucide-react'

export const MedicationRequest: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [medication, setMedication] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [patientId, setPatientId] = useState<string | null>(null)

  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [vhvUserId, setVhvUserId] = useState<string | null>(null)
  const [doctorName, setDoctorName] = useState('')
  const [vhvName, setVhvName] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { data: profile } = await getPatientProfileByUserId(user?.id || '')
        const [{ data: users }, { data: volunteers }] = await Promise.all([getUsers(), getVolunteers()])
        if (profile) {
          const doc = (users || []).find(u => u.role === 'doctor' && (u.full_name || '').toLowerCase().includes((profile.assigned_doctor || '').toLowerCase()))
          if (doc) { setDoctorId(doc.id); setDoctorName(doc.full_name) }
          const vhv = (volunteers || []).find((v: any) => (v.name || '').toLowerCase().includes((profile.assigned_vhv_name || '').toLowerCase()))
          if (vhv) { setVhvUserId(vhv.user_id); setVhvName(vhv.name) }
          setPatientId(profile.id)
        }
        if (profile) {
          const { data: reqs } = await getMedicationRequests(profile.id)
          setHistory(reqs || [])
        }
      } finally { setLoading(false) }
    })()
  }, [user?.id])

  const canSubmit = useMemo(() => medication.trim().length > 0 && (doctorId || vhvUserId), [medication, doctorId, vhvUserId])

  const submit = async () => {
    if (!canSubmit) return
    if (!patientId) { alert('Cannot find your patient profile.'); return }
    setSubmitting(true)
    try {
      const subject = 'Medication Request'
      const body = `Patient requests medication refill/order.\n\nMedication: ${medication}\nQuantity: ${quantity || 'N/A'}\nNotes: ${notes || 'N/A'}`
      const recipients = [doctorId, vhvUserId].filter(Boolean) as string[]
      // Persist request
      await createMedicationRequest({ patient_id: patientId, requested_by: user!.id, title: subject, medication, dosage: '', quantity, notes, status: 'pending' } as any)
      await Promise.all(recipients.map(r => sendMessageToDatabase({ sender_id: user!.id, recipient_id: r, subject, content: body, is_read: false } as any)))
      setMedication(''); setQuantity(''); setNotes('')
      alert('Request sent to your care team.')
      const { data: reqs } = await getMedicationRequests(patientId)
      setHistory(reqs || [])
    } catch (e) {
      alert('Failed to send request')
    } finally { setSubmitting(false) }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6 flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg"><Pill className="w-6 h-6 text-purple-700"/></div>
          <h1 className="text-2xl font-bold text-gray-900">Medication Request</h1>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
              <input value={medication} onChange={e=>setMedication(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., Metformin 500mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., 30 tablets" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Any additional information..." />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800 mb-2 font-medium">This request will be sent to:</div>
            <ul className="text-sm text-blue-900 list-disc pl-5 space-y-1">
              {doctorId ? <li className="flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Dr. {doctorName}</li> : <li>No doctor found from your profile.</li>}
              {vhvUserId ? <li className="flex items-center gap-2"><UserIcon className="w-4 h-4"/> {vhvName} (VHV)</li> : <li>No VHV found from your profile.</li>}
            </ul>
          </div>
          <div className="flex justify-end">
            <button disabled={!canSubmit || submitting} onClick={submit} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2 w-full sm:w-auto justify-center">
              <Send className="w-4 h-4"/> Submit Request
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
        <div className="p-4 text-gray-900 font-semibold">My Medication Requests</div>
        <div className="p-4">
          {history.length === 0 ? (
            <div className="text-gray-600 text-sm">No requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Medication</th>
                    <th className="px-3 py-2 text-left">Quantity</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((r:any)=> (
                    <tr key={r.id}>
                      <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{r.medication || '-'}</td>
                      <td className="px-3 py-2">{r.quantity || '-'}</td>
                      <td className="px-3 py-2 capitalize">{r.status.replace('_',' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MedicationRequest
