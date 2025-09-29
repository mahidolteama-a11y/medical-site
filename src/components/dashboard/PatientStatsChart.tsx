import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { PatientProfile } from '../../types'
import SimpleModal from '../common/SimpleModal'

type Metric = 'gender' | 'elderly' | 'critical' | 'pregnant'
type ChartType = 'bar' | 'pie'

interface PatientStatsChartProps {
  patients: PatientProfile[]
}

// Modern palette (Tailwind-inspired)
const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6', '#a78bfa', '#06b6d4']

const metricLabels: Record<Metric, string> = {
  gender: 'Gender',
  elderly: 'Elderly vs Non‑Elderly',
  critical: 'Critical vs Non‑Critical',
  pregnant: 'Pregnancy Status',
}

export const PatientStatsChart: React.FC<PatientStatsChartProps> = ({ patients }) => {
  const [metric, setMetric] = useState<Metric>('gender')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPatients, setModalPatients] = useState<PatientProfile[]>([])

  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    if (metric === 'gender') {
      for (const p of patients) {
        const key = p.gender || 'unknown'
        counts[key] = (counts[key] || 0) + 1
      }
    } else if (metric === 'elderly') {
      for (const p of patients) {
        const key = p.patient_categories.elderly ? 'Elderly' : 'Non‑Elderly'
        counts[key] = (counts[key] || 0) + 1
      }
    } else if (metric === 'critical') {
      for (const p of patients) {
        const key = p.patient_categories.critical ? 'Critical' : 'Non‑Critical'
        counts[key] = (counts[key] || 0) + 1
      }
    } else if (metric === 'pregnant') {
      const now = Date.now()
      const FORTY_TWO_DAYS = 42 * 24 * 60 * 60 * 1000
      for (const p of patients) {
        if (p.pregnancy_status === 'pregnant' || p.patient_categories.pregnant) {
          counts['Pregnant'] = (counts['Pregnant'] || 0) + 1
          continue
        }
        if (p.pregnancy_status === 'postpartum') {
          const d = p.delivery_date ? new Date(p.delivery_date).getTime() : NaN
          if (!Number.isNaN(d) && now - d <= FORTY_TWO_DAYS) {
            counts['Recently Delivered'] = (counts['Recently Delivered'] || 0) + 1
          }
        }
      }
    }

    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [patients, metric])

  const total = patients.length

  const filterForSegment = (segment: string): PatientProfile[] => {
    if (metric === 'gender') {
      const key = segment.toLowerCase()
      return patients.filter(p => (p.gender || 'other').toLowerCase() === key)
    }
    if (metric === 'elderly') {
      const isElderly = segment === 'Elderly'
      return patients.filter(p => !!p.patient_categories.elderly === isElderly)
    }
    if (metric === 'critical') {
      const isCritical = segment === 'Critical'
      return patients.filter(p => !!p.patient_categories.critical === isCritical)
    }
    if (metric === 'pregnant') {
      const now = Date.now()
      const FORTY_TWO_DAYS = 42 * 24 * 60 * 60 * 1000
      if (segment === 'Pregnant') {
        return patients.filter(p => p.pregnancy_status === 'pregnant' || p.patient_categories.pregnant)
      }
      if (segment === 'Recently Delivered') {
        return patients.filter(p => {
          if (p.pregnancy_status !== 'postpartum') return false
          const d = p.delivery_date ? new Date(p.delivery_date).getTime() : NaN
          return !Number.isNaN(d) && now - d <= FORTY_TWO_DAYS
        })
      }
    }
    return []
  }

  const openModalForSegment = (segment: string) => {
    const list = filterForSegment(segment)
    setModalTitle(`${metricLabels[metric]} • ${segment} (${list.length})`)
    setModalPatients(list)
    setModalOpen(true)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Patient Overview</h2>
          <p className="text-sm text-gray-600">{metricLabels[metric]} • Total: {total}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as Metric)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="gender">Gender</option>
            <option value="elderly">Elderly</option>
            <option value="critical">Critical</option>
            <option value="pregnant">Pregnancy</option>
          </select>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
            <button
              className={`px-3 py-2 text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setChartType('bar')}
            >
              Bar
            </button>
            <button
              className={`px-3 py-2 text-sm border-l border-gray-300 ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setChartType('pie')}
            >
              Pie
            </button>
          </div>
        </div>
      </div>

      <div className="h-72">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">No data</div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name={metricLabels[metric]} radius={[4, 4, 0, 0]} onClick={(entry: any) => openModalForSegment(entry?.payload?.name)}>
                {data.map((_, idx) => (
                  <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label onClick={(e: any) => openModalForSegment(e?.name)}>
                {data.map((_, idx) => (
                  <Cell key={`pie-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <SimpleModal open={modalOpen} title={modalTitle} onClose={() => setModalOpen(false)}>
        {modalPatients.length === 0 ? (
          <div className="text-sm text-gray-500">No matching patients.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Gender</th>
                  <th className="py-2 pr-4">Doctor</th>
                  <th className="py-2 pr-4">MRN</th>
                </tr>
              </thead>
              <tbody>
                {modalPatients.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{p.name}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.gender}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.assigned_doctor}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.medical_record_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SimpleModal>
    </div>
  )
}

export default PatientStatsChart
