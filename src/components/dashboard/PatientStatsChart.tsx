import React, { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import type { PatientProfile } from '../../types'

interface PatientStatsChartProps {
  patients: PatientProfile[]
}

// Single clustered bar chart showing counts for each category

export const PatientStatsChart: React.FC<PatientStatsChartProps> = ({ patients }) => {
  const data = useMemo(() => {
    const total = patients.length
    const critical = patients.filter(p => !!p.patient_categories.critical).length
    const elderly = patients.filter(p => !!p.patient_categories.elderly).length
    const pregnant = patients.filter(p => !!p.patient_categories.pregnant).length
    return [
      { group: 'Critical', Yes: critical, No: Math.max(total - critical, 0) },
      { group: 'Elderly', Yes: elderly, No: Math.max(total - elderly, 0) },
      { group: 'Pregnant', Yes: pregnant, No: Math.max(total - pregnant, 0) },
    ]
  }, [patients])
  const total = patients.length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Patient Categories Overview</h2>
        <p className="text-sm text-gray-600">Total Patients: {total}</p>
      </div>
      <div className="h-72">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Yes" name="Yes" radius={[4,4,0,0]} fill="#2563eb" />
              <Bar dataKey="No" name="No" radius={[4,4,0,0]} fill="#cbd5e1" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default PatientStatsChart
