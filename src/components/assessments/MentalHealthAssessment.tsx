import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatientProfileByUserId, getUsers, getVolunteers, createMentalAssessment, sendMessageToDatabase, getMentalAssessments } from '../../lib/dummyDatabase'
import { Heart, Send, ClipboardList } from 'lucide-react'

const PHQ9 = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or thoughts of hurting yourself'
]

function classifyPHQ9(score: number) {
  if (score >= 20) return 'severe'
  if (score >= 15) return 'moderately_severe'
  if (score >= 10) return 'moderate'
  if (score >= 5) return 'mild'
  return 'minimal'
}

export const MentalHealthAssessment: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>(Array(PHQ9.length).fill(0))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await getPatientProfileByUserId(user?.id || '')
      setProfile(data)
      if (data) {
        const res = await getMentalAssessments(data.id)
        setHistory(res.data || [])
      }
      setLoading(false)
    })()
  }, [user?.id])

  const total = useMemo(() => (answers || []).reduce((s,n)=>s+(Number.isFinite(n)?n:0),0), [answers])
  const severity = classifyPHQ9(total)

  const setAnswer = (idx: number, v: number) => {
    setAnswers(prev => prev.map((x,i)=> i===idx? v : x))
  }

  const submit = async () => {
    if (!profile) return
    setSubmitting(true)
    try {
      const date = new Date().toISOString()
      await createMentalAssessment({ patient_id: profile.id, recorded_by: user!.id, date, answers, total_score: total, severity, notes })

      // Notify assigned VHV and, for high severity, doctor(s)
      const [{ data: users }, { data: volunteers }] = await Promise.all([getUsers(), getVolunteers()])
      const doctorName = (profile.assigned_doctor || '').toLowerCase()
      const assignedDoctors = (users || []).filter((u:any)=>u.role==='doctor' && (u.full_name || '').toLowerCase().includes(doctorName))
      const vhvName = (profile.assigned_vhv_name || '').toLowerCase()
      const assignedVhvs = (volunteers || []).filter((v:any)=>(v.name || '').toLowerCase().includes(vhvName))

      const recipientsVhv = assignedVhvs.map((v:any)=>v.user_id).filter(Boolean)
      const recipientsDr = (severity === 'moderately_severe' || severity === 'severe')
        ? assignedDoctors.map((d:any)=>d.id).filter(Boolean)
        : []
      const recipients = [...recipientsVhv, ...recipientsDr]

      const subject = 'New Mental Health Assessment Submitted'
      const content = `Patient: ${profile.name}\nMRN: ${profile.medical_record_number}\nSeverity: ${severity.replace('_',' ')}\nScore: ${total}\nSubmitted at: ${new Date().toLocaleString()}\n\nNotes: ${notes || 'N/A'}`

      await Promise.all(recipients.map(r => sendMessageToDatabase({ sender_id: user!.id, recipient_id: r, subject, content, is_read: false } as any)))

      alert('Assessment submitted. Your care team has been notified.')
      // refresh history and reset
      const res = await getMentalAssessments(profile.id)
      setHistory(res.data || [])
      setNotes('')
      setAnswers(Array(PHQ9.length).fill(0))
    } catch (e) {
      alert('Failed to submit assessment')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div></div>
  )

  if (!profile) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-700">No patient profile found.</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6 flex items-center gap-3">
          <div className="bg-pink-100 p-2 rounded-lg"><Heart className="w-6 h-6 text-pink-700"/></div>
          <h1 className="text-2xl font-bold text-gray-900">Mental Health Assessment (PHQ-9)</h1>
        </div>
        <div className="p-6 space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
            Answer each question for the last two weeks. 0 = Not at all, 1 = Several days, 2 = More than half the days, 3 = Nearly every day.
          </div>

          <div className="space-y-5">
            {PHQ9.map((q, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div className="md:col-span-3 text-gray-900">{i+1}. {q}</div>
                <div className="md:col-span-2 flex items-center gap-2">
                  {[0,1,2,3].map(v => (
                    <label key={v} className={`px-3 py-2 rounded-lg border cursor-pointer ${answers[i]===v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-800 hover:bg-gray-50'}`}> 
                      <input type="radio" name={`q${i}`} value={v} checked={answers[i]===v} onChange={() => setAnswer(i,v)} className="hidden" />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-blue-800">Total Score</div>
              <div className="text-xl font-semibold text-blue-900">{total}</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <div className="text-sm text-purple-800">Severity</div>
              <div className="text-xl font-semibold text-purple-900 capitalize">{severity.replace('_',' ')}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Anything you'd like to share..." />
          </div>

          <div className="flex justify-end">
            <button disabled={submitting} onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 w-full sm:w-auto justify-center">
              <Send className="w-4 h-4"/> Submit Assessment
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2 text-gray-900 font-semibold">
          <ClipboardList className="w-5 h-5"/> Previous Assessments
        </div>
        <div className="p-4">
          {history.length === 0 ? (
            <div className="text-gray-600 text-sm">No assessments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Score</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((r:any)=> (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-sm">{new Date(r.date).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{r.total_score}</td>
                      <td className="px-4 py-2 text-sm capitalize">{String(r.severity).replace('_',' ')}</td>
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

export default MentalHealthAssessment
