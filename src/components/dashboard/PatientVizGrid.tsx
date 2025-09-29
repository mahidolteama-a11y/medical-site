import React, { useMemo, useState } from 'react'
import type { PatientProfile } from '../../types'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import SimpleModal from '../common/SimpleModal'

interface PatientVizGridProps {
  patients: PatientProfile[]
}

const PALETTE = ['#0ea5e9', '#22c55e', '#f59e0b', '#f43f5e', '#6366f1', '#14b8a6', '#a78bfa', '#06b6d4']

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="h-56">
      {children}
    </div>
  </div>
)

function parseBMI(bmi: string | undefined): number | null {
  if (!bmi) return null
  const val = parseFloat(String(bmi).replace(/[^0-9.]/g, ''))
  return Number.isFinite(val) ? val : null
}

export const PatientVizGrid: React.FC<PatientVizGridProps> = ({ patients }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalPatients, setModalPatients] = useState<PatientProfile[]>([])
  const genderData = useMemo(() => {
    const counts: Record<string, number> = { male: 0, female: 0, other: 0 }
    for (const p of patients) {
      const key = (p.gender || 'other').toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts).map(([name, count]) => ({ name: name[0].toUpperCase() + name.slice(1), value: count }))
  }, [patients])

  const elderlyData = useMemo(() => {
    let elderly = 0
    let non = 0
    for (const p of patients) {
      if (p.patient_categories.elderly) elderly++
      else non++
    }
    return [
      { name: 'Elderly', value: elderly },
      { name: 'Non‑Elderly', value: non },
    ]
  }, [patients])

  const criticalData = useMemo(() => {
    let crit = 0
    let non = 0
    for (const p of patients) {
      if (p.patient_categories.critical) crit++
      else non++
    }
    return [
      { name: 'Critical', value: crit },
      { name: 'Non‑Critical', value: non },
    ]
  }, [patients])

  const pregnantData = useMemo(() => {
    let pregnant = 0
    let recent = 0
    const now = Date.now()
    const FORTY_TWO_DAYS = 42 * 24 * 60 * 60 * 1000
    for (const p of patients) {
      const status = p.pregnancy_status
      if (status === 'pregnant' || p.patient_categories.pregnant) {
        pregnant++
        continue
      }
      if (status === 'postpartum') {
        const d = p.delivery_date ? new Date(p.delivery_date).getTime() : NaN
        if (!Number.isNaN(d) && now - d <= FORTY_TWO_DAYS) {
          recent++
        }
      }
    }
    return [
      { name: 'Pregnant', value: pregnant },
      { name: 'Recently Delivered', value: recent },
    ]
  }, [patients])

  const bmiData = useMemo(() => {
    const buckets: Record<string, number> = { Underweight: 0, Normal: 0, Overweight: 0, Obese: 0 }
    for (const p of patients) {
      const bmi = parseBMI(p.bmi)
      if (bmi == null) continue
      if (bmi < 18.5) buckets.Underweight++
      else if (bmi < 25) buckets.Normal++
      else if (bmi < 30) buckets.Overweight++
      else buckets.Obese++
    }
    return Object.entries(buckets).map(([name, count]) => ({ name, count }))
  }, [patients])

  const doctorLoadData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of patients) {
      const doc = (p.assigned_doctor || 'Unassigned').split('-')[0].trim()
      counts[doc] = (counts[doc] || 0) + 1
    }
    const items = Object.entries(counts).map(([name, count]) => ({ name, count }))
    // Sort and take top 6
    items.sort((a, b) => b.count - a.count)
    return items.slice(0, 6)
  }, [patients])

  const openModal = (title: string, list: PatientProfile[]) => {
    setModalTitle(`${title} (${list.length})`)
    setModalPatients(list)
    setModalOpen(true)
  }

  const byGender = (name: string) => patients.filter(p => (p.gender || 'other').toLowerCase() === name.toLowerCase())
  const byElderly = (name: string) => patients.filter(p => !!p.patient_categories.elderly === (name === 'Elderly'))
  const byCritical = (name: string) => patients.filter(p => !!p.patient_categories.critical === (name === 'Critical'))
  const byPregnancy = (name: string) => {
    const now = Date.now()
    const FORTY_TWO_DAYS = 42 * 24 * 60 * 60 * 1000
    if (name === 'Pregnant') return patients.filter(p => p.pregnancy_status === 'pregnant' || p.patient_categories.pregnant)
    if (name === 'Recently Delivered') return patients.filter(p => {
      if (p.pregnancy_status !== 'postpartum') return false
      const d = p.delivery_date ? new Date(p.delivery_date).getTime() : NaN
      return !Number.isNaN(d) && now - d <= FORTY_TWO_DAYS
    })
    return []
  }
  const parseBMIValue = (p: PatientProfile) => {
    const n = parseFloat(String(p.bmi || '').replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  const byBmiBucket = (name: string) => patients.filter(p => {
    const n = parseBMIValue(p)
    if (n == null) return false
    if (name === 'Underweight') return n < 18.5
    if (name === 'Normal') return n >= 18.5 && n < 25
    if (name === 'Overweight') return n >= 25 && n < 30
    if (name === 'Obese') return n >= 30
    return false
  })
  const byDoctor = (name: string) => patients.filter(p => (p.assigned_doctor || 'Unassigned').split('-')[0].trim() === name)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <ChartCard title="Gender Distribution" subtitle="Patients by gender">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2} onClick={(e: any) => openModal(`Gender: ${e?.name}`, byGender(e?.name))}>
              {genderData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Elderly Status" subtitle="Elderly vs non‑elderly">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={elderlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} onClick={(entry: any) => openModal(`Elderly: ${entry?.payload?.name}`, byElderly(entry?.payload?.name))}>
              {elderlyData.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Criticality" subtitle="Critical vs non‑critical">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={criticalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} onClick={(entry: any) => openModal(`Criticality: ${entry?.payload?.name}`, byCritical(entry?.payload?.name))}>
              {criticalData.map((_, i) => (
                <Cell key={i} fill={PALETTE[(i + 3) % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Pregnancy" subtitle="Pregnant vs recently delivered">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie data={pregnantData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2} onClick={(e: any) => openModal(`Pregnancy: ${e?.name}`, byPregnancy(e?.name))}>
              {pregnantData.map((_, i) => (
                <Cell key={i} fill={PALETTE[(i + 4) % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="BMI Categories" subtitle="Underweight/Normal/Overweight/Obese">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bmiData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={(entry: any) => openModal(`BMI: ${entry?.payload?.name}`, byBmiBucket(entry?.payload?.name))}>
              {bmiData.map((_, i) => (
                <Cell key={i} fill={PALETTE[(i + 1) % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Patients per Doctor" subtitle="Top providers by assigned patients">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={doctorLoadData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} height={50} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={(entry: any) => openModal(`Doctor: ${entry?.payload?.name}`, byDoctor(entry?.payload?.name))}>
              {doctorLoadData.map((_, i) => (
                <Cell key={i} fill={PALETTE[(i + 2) % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

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

export default PatientVizGrid
