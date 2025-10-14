import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet';
import { Save, AlertCircle, Check } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VolunteerProfile, MapArea } from '../../types';
import { createVolunteer, updateVolunteer, getNextVolunteerCode } from '../../lib/volunteersService';
import { getAllMapAreas } from '../../lib/mapAreasService';
import { assignAreaDualMethod, AreaAssignmentResult } from '../../lib/areaAssignment';
import { supabase } from '../../lib/supabase';

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

      if (editing && record) {
        volunteerData.volunteer_code = formData.volunteer_code;
        const { error } = await updateVolunteer(record.id, volunteerData);
        if (error) throw error;
      } else {
        const { data: authUser } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: 'TempPass123!',
          email_confirm: true,
          user_metadata: {
            full_name: formData.name,
            role: 'volunteer'
          }
        });

        if (!authUser.user) {
          throw new Error('Failed to create user account');
        }

        volunteerData.user_id = authUser.user.id;
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
      <h2 className="text-xl font-semibold mb-4">{editing ? 'Edit Volunteer' : 'Create Volunteer'}</h2>

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
                onChange={e => setFormData(prev => ({ ...prev, province: e.target.value }))}
              >
                <option value="">Select</option>
                <option value="Nakhon Pathom">Nakhon Pathom</option>
                <option value="Bangkok">Bangkok</option>
                <option value="Nonthaburi">Nonthaburi</option>
                <option value="Pathum Thani">Pathum Thani</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                className="w-full px-4 py-3 border rounded-lg"
                value={formData.district}
                onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
              >
                <option value="">Select</option>
                <option value="Phutthamonthon">Phutthamonthon</option>
                <option value="Salaya">Salaya</option>
                <option value="Bang Khae">Bang Khae</option>
                <option value="Mueang">Mueang</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-District</label>
              <select
                className="w-full px-4 py-3 border rounded-lg"
                value={formData.subdistrict}
                onChange={e => setFormData(prev => ({ ...prev, subdistrict: e.target.value }))}
              >
                <option value="">Select</option>
                <option value="Phra Khanong Tai">Phra Khanong Tai</option>
                <option value="Maha Sawat">Maha Sawat</option>
                <option value="Salaya">Salaya</option>
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
    </div>
  );
};
