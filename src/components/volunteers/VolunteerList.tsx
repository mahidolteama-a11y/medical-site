import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllVolunteers } from '../../lib/volunteersService';
import { getPatientProfiles } from '../../lib/dummyDatabase';
import { VolunteerProfile } from '../../types';
import { Plus, Search, Eye } from 'lucide-react';
import { VolunteerForm } from './VolunteerForm';

export const VolunteerListPage: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [items, setItems] = useState<VolunteerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VolunteerProfile | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: volunteers }, { data: patients }] = await Promise.all([
      getAllVolunteers(),
      getPatientProfiles(),
    ]);
    setItems(volunteers || []);
    // Build counts by volunteer id
    const counts: Record<string, number> = {};
    const people = (patients || []) as any[];
    (volunteers || []).forEach((v: any) => {
      const name = (v.user?.full_name || v.name || '').toLowerCase();
      const cnt = people.filter(p => typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(name)).length;
      counts[v.id] = cnt;
    });
    setAssignedCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchAll() }, []);

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return items.filter(v =>
      v.name.toLowerCase().includes(t) ||
      (v.volunteer_code || '').toLowerCase().includes(t) ||
      (v.email || '').toLowerCase().includes(t) ||
      (v.phone || '').toLowerCase().includes(t) ||
      (v.area_name || '').toLowerCase().includes(t)
    );
  }, [items, search]);

  if (loading) return <div className="py-10 text-center">Loading…</div>;
  if (showForm) return <VolunteerForm record={editing} onClose={() => { setShowForm(false); setEditing(null); fetchAll() }} />;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search volunteers..." className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        {isDoctor && (
          <button onClick={()=>setShowForm(true)} className="ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200"><Plus className="w-4 h-4"/>Create Volunteer</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sky-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Volunteer ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Area</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigned Patients</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{v.volunteer_code}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      {v.photo_url ? (
                        <img src={v.photo_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100" />
                      )}
                      <span>{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{v.email}</td>
                  <td className="px-4 py-3 text-sm">{v.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {v.area_name ? (
                      <div className="flex items-center gap-2">
                        {v.area?.color && <div className="w-3 h-3 rounded" style={{ backgroundColor: v.area.color }} />}
                        <span>{v.area_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{assignedCounts[v.id] ?? 0}</td>
                  <td className="px-4 py-3 text-sm">
                    <button onClick={() => { setEditing(v); setShowForm(true) }} className="text-sky-700 hover:underline inline-flex items-center gap-1"><Eye className="w-4 h-4"/>View Detail</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No volunteers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
