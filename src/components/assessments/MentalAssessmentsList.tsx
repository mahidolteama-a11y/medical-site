import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getMentalAssessments } from '../../lib/dummyDatabase'
import { ClipboardList, Search } from 'lucide-react'

const severityLabel = (s: string) => s.replace('_', ' ')

export const MentalAssessmentsList: React.FC = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState<string>('')

  const fetchAll = async () => {
    setLoading(true)
    const { data } = await getMentalAssessments()
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = useMemo(() => {
    const t = search.toLowerCase()
    return (items || [])
      .filter(r => !severity || String(r.severity) === severity)
      .filter(r => {
        const name = (r.patient?.name || '').toLowerCase()
        const mrn = (r.patient?.medical_record_number || '').toLowerCase()
        const note = (r.notes || '').toLowerCase()
        return name.includes(t) || mrn.includes(t) || note.includes(t)
      })
  }, [items, search, severity])

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><div className="flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div></div>
  )

  if (user?.role !== 'doctor') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-700">Only doctors can view mental health assessments.</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg"><ClipboardList className="w-6 h-6 text-purple-700"/></div>
          <h1 className="text-2xl font-bold text-gray-900">Mental Health Assessments</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search patients, MRN or notes..." className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={severity} onChange={e=>setSeverity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All severities</option>
            <option value="minimal">Minimal</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="moderately_severe">Moderately severe</option>
            <option value="severe">Severe</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">MRN</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(r.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{r.patient?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{r.patient?.medical_record_number || '-'}</td>
                  <td className="px-4 py-3 text-sm">{r.total_score}</td>
                  <td className="px-4 py-3 text-sm capitalize">{severityLabel(String(r.severity))}</td>
                  <td className="px-4 py-3 text-sm truncate max-w-[320px]">{r.notes || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>No assessments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MentalAssessmentsList

