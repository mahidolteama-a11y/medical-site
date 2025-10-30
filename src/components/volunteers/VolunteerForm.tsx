import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet';
import { Save, AlertCircle, Check } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VolunteerProfile, MapArea } from '../../types';
import { createVolunteer, updateVolunteer, getNextVolunteerCode } from '../../lib/volunteersService';
import { getAllMapAreas } from '../../lib/mapAreasService';
import { assignAreaDualMethod, AreaAssignmentResult } from '../../lib/areaAssignment';
import { createVolunteerUser, getPatientProfiles, updatePatientProfile } from '../../lib/dummyDatabase';
import THAI_PROVINCES from '../../data/thaiProvinces';
import THAI_ADMIN_MAP from '../../data/thaiAdministrative';

interface VolunteerFormProps {
  record: VolunteerProfile | null;
  onClose: () => void;
}

export const VolunteerForm: React.FC<VolunteerFormProps> = ({ record, onClose }) => {
  const editing = !!record;
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<MapArea[]>([]);
  const [assignmentResult, setAssignmentResult] = useState<AreaAssignmentResult | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const volunteerDisplayName = (record?.user?.full_name || record?.name || '').trim();
  const volunteerAreaName = (record?.area_name || '').toLowerCase();

  const [formData, setFormData] = useState({
    name: record?.name || '',
    email: record?.email || '',
    phone: record?.phone || '',
    dob: record?.dob || '',
    photo_url: record?.photo_url || '',
    volunteer_code: record?.volunteer_code || '',
    province: '',
    district: '',
    subdistrict: '',
    addressLine: '',
    lat: record?.lat,
    lng: record?.lng
  });

  useEffect(() => {
    (async () => {
      const { data } = await getAllMapAreas();
      setAreas(data || []);
    })();

    if (record?.address) {
      const parts = record.address.split(',').map(s => s.trim()).filter(Boolean);
      setFormData(prev => ({
        ...prev,
        province: parts.slice(-1)[0] || '',
        district: parts.slice(-2, -1)[0] || '',
        subdistrict: parts.slice(-3, -2)[0] || '',
        addressLine: parts.slice(0, -3).join(', ')
      }));
    }

    if (!record) {
      getNextVolunteerCode().then(code => {
        setFormData(prev => ({ ...prev, volunteer_code: code }));
      });
    }
  }, [record]);

  // Load assigned patients when viewing/editing an existing volunteer
  useEffect(() => {
    (async () => {
      if (!record) return;
      const { data } = await getPatientProfiles();
      const patients = data || [];
      setAllPatients(patients);
      if (volunteerDisplayName) {
        const mine = patients.filter((p: any) => typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(volunteerDisplayName.toLowerCase()));
        setAssignedPatients(mine);
      } else {
        setAssignedPatients([]);
      }
    })();
  }, [record, volunteerDisplayName]);

  useEffect(() => {
    const fullAddress = [formData.addressLine, formData.subdistrict, formData.district, formData.province]
      .filter(Boolean)
      .join(', ');

    if ((formData.lat && formData.lng) || fullAddress.length > 5) {
      const timeoutId = setTimeout(async () => {
        setIsAssigning(true);
        const result = await assignAreaDualMethod(formData.lat, formData.lng, fullAddress, areas);
        setAssignmentResult(result);

        if (result.geocodedLat && result.geocodedLng && !formData.lat && !formData.lng) {
          setFormData(prev => ({
            ...prev,
            lat: result.geocodedLat,
            lng: result.geocodedLng
          }));
        }
        setIsAssigning(false);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.lat, formData.lng, formData.addressLine, formData.subdistrict, formData.district, formData.province, areas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const composedAddress = [formData.addressLine, formData.subdistrict, formData.district, formData.province]
        .filter(Boolean)
        .join(', ');

      const volunteerData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: composedAddress,
        lat: formData.lat,
        lng: formData.lng,
        dob: formData.dob,
        photo_url: formData.photo_url,
        area_id: assignmentResult?.area?.id || null,
        area_name: assignmentResult?.area?.name || null
      };

      // Require map location and area assignment for creation
      if (!formData.lat || !formData.lng) {
        alert('Please click on the map to set the volunteer\'s exact location.');
        setLoading(false);
        return;
      }
      if (!assignmentResult?.area) {
        alert('Please place the volunteer inside a defined area created by a doctor.');
        setLoading(false);
        return;
      }

      if (editing && record) {
        volunteerData.volunteer_code = formData.volunteer_code;
        const { error } = await updateVolunteer(record.id, volunteerData);
        if (error) throw error;
      } else {
        const { data: volUser, error: uerr } = await createVolunteerUser(formData.email, formData.name);
        if (uerr) throw uerr;
        volunteerData.user_id = volUser?.id;
        volunteerData.volunteer_code = formData.volunteer_code;

        const { error } = await createVolunteer(volunteerData);
        if (error) throw error;
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving volunteer:', error);
      alert('Failed to save volunteer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAssigned = async () => {
    const { data } = await getPatientProfiles();
    const patients = data || [];
    setAllPatients(patients);
    if (volunteerDisplayName) {
      const mine = patients.filter((p: any) => typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(volunteerDisplayName.toLowerCase()));
      setAssignedPatients(mine);
    }
  };

  const handleAssignPatient = async (patientId: string) => {
    if (!record || !patientId) return;
    // Enforce area match on assignment
    const target = (allPatients || []).find((p: any) => p.id === patientId);
    const sameArea = ((target?.area_name || '').toLowerCase() === volunteerAreaName) || volunteerAreaName === '';
    if (!sameArea) {
      alert('This patient is not in the same area as the volunteer.');
      return;
    }
    await updatePatientProfile(patientId, { assigned_vhv_name: volunteerDisplayName } as any);
    await refreshAssigned();
  };

  const handleUnassignPatient = async (patientId: string) => {
    if (!patientId) return;
    await updatePatientProfile(patientId, { assigned_vhv_name: '' } as any);
    await refreshAssigned();
  };

  const icon = useMemo(() => L.divIcon({
    className: 'vol-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 0 0 3px rgba(34,197,94,0.25);color:#fff;font-size:14px;line-height:1">🤝</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  }), []);

  const center: [number, number] = formData.lat && formData.lng ? [formData.lat, formData.lng] : [13.793, 100.321];

  const ClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        setFormData(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{editing ? 'Edit Volunteer' : 'Create Volunteer'}</h2>
        {editing && record && (
          <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">Record ID: <span className="font-mono">{record.id}</span></span>
            <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">User ID: <span className="font-mono">{record.user_id}</span></span>
            {record.volunteer_code && (
              <span className="px-2 py-1 bg-gray-100 border border-gray-200 rounded">Volunteer ID: <span className="font-mono">{record.volunteer_code}</span></span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              required
              className="w-full px-4 py-3 border rounded-lg"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border rounded-lg"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              className="w-full px-4 py-3 border rounded-lg"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              className="w-full px-4 py-3 border rounded-lg"
              value={formData.dob}
              onChange={e => setFormData(prev => ({ ...prev, dob: e.target.value }))}
            />
          </div>

          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Volunteer ID</label>
              <input
                className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                value={formData.volunteer_code}
                readOnly
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <input
              placeholder="Image URL"
              className="w-full px-4 py-3 border rounded-lg"
              value={formData.photo_url}
              onChange={e => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
              <select
                className="w-full px-4 py-3 border rounded-lg"
                value={formData.province}
                onChange={e => setFormData(prev => ({ ...prev, province: e.target.value, district: '', subdistrict: '' }))}
              >
                <option value="">Select Province</option>
                {THAI_PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                className="w-full px-4 py-3 border rounded-lg"
                value={formData.district}
                onChange={e => setFormData(prev => ({ ...prev, district: e.target.value, subdistrict: '' }))}
                disabled={!formData.province}
              >
                <option value="">Select District</option>
                {Object.keys(THAI_ADMIN_MAP[formData.province] || {}).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-District</label>
              <select
                className="w-full px-4 py-3 border rounded-lg"
                value={formData.subdistrict}
                onChange={e => setFormData(prev => ({ ...prev, subdistrict: e.target.value }))}
                disabled={!formData.district}
              >
                <option value="">Select Sub-District</option>
                {(THAI_ADMIN_MAP[formData.province]?.[formData.district] || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address Line</label>
              <input
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="House number, street, village"
                value={formData.addressLine}
                onChange={e => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {assignmentResult && (
          <div className={`p-4 rounded-lg border-2 ${
            assignmentResult.area
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {assignmentResult.area ? (
                <>
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900">Area Assigned</div>
                    <div className="text-sm text-green-700 mt-1">
                      This volunteer will be assigned to: <strong>{assignmentResult.area.name}</strong>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: assignmentResult.area.color }}
                      />
                      <span className="text-xs text-green-600">
                        Confidence: {assignmentResult.confidence} ({assignmentResult.method})
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-900">No Area Match</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      This location is not within any defined area. The volunteer will be unassigned.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isAssigning && (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            Determining area assignment...
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location (click map to set)</label>
          <div className="h-80 w-full border rounded-lg overflow-hidden">
            <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <ClickHandler />

              {areas.map(area => {
                if (!area.geometry?.coordinates?.[0]) return null;
                const coords = area.geometry.coordinates[0].map(c => [c[0], c[1]] as [number, number]);
                const isAssigned = assignmentResult?.area?.id === area.id;

                return (
                  <Polygon
                    key={area.id}
                    positions={coords}
                    pathOptions={{
                      color: area.color,
                      fillColor: area.color,
                      fillOpacity: isAssigned ? 0.3 : 0.1,
                      weight: isAssigned ? 3 : 2
                    }}
                  />
                );
              })}

              {formData.lat && formData.lng && (
                <Marker position={[formData.lat, formData.lng]} icon={icon} />
              )}
            </MapContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 border rounded"
                value={formData.lat ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 border rounded"
                value={formData.lng ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? 'Saving...' : 'Save Volunteer'}
          </button>
        </div>
      </form>

      {editing && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-3">Assigned Patients</h3>
          <div className="text-sm text-gray-600 mb-4">Patients assigned to {volunteerDisplayName || 'this volunteer'}.</div>

          {/* Assign new patient */}
          <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                placeholder="Search patients by name or MRN"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <select
                className="flex-1 px-3 py-2 border rounded"
                onChange={e => handleAssignPatient(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Assign a patient…</option>
                {allPatients
                  .filter((p: any) => {
                    const t = patientSearch.toLowerCase();
                    const inText = (p.name || '').toLowerCase().includes(t) || (p.medical_record_number || '').toLowerCase().includes(t);
                    const alreadyMine = typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(volunteerDisplayName.toLowerCase());
                    const sameArea = ((p.area_name || '').toLowerCase() === volunteerAreaName) || volunteerAreaName === '';
                    return inText && !alreadyMine && sameArea;
                  })
                  .slice(0, 20)
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} • {p.medical_record_number}</option>
                  ))}
              </select>
            </div>
            <div className="text-xs text-gray-500 mt-2">Selecting a patient will immediately assign them to this volunteer. Only patients from the same area are listed.</div>
          </div>

          {/* Current assignments */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">MRN</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Area</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignedPatients.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-sm">{p.medical_record_number}</td>
                    <td className="px-4 py-2 text-sm">{p.name}</td>
                    <td className="px-4 py-2 text-sm">{p.area_name || '-'}</td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleUnassignPatient(p.id)}
                        className="px-3 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {assignedPatients.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>No patients assigned.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
