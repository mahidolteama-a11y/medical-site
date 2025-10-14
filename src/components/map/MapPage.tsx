import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { ArrowLeft, MapPin, Settings } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap, Marker, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getLocations, getPatientProfiles, getVolunteers } from '../../lib/dummyDatabase'
import { useAuth } from '../../contexts/AuthContext'
import L from 'leaflet'
import { getAllMapAreas } from '../../lib/mapAreasService'
import { MapArea } from '../../types'
import { MapAreaDrawing } from './MapAreaDrawing'
import { calculatePolygonCentroid } from '../../lib/areaAssignment'

interface MapPageProps {
  onBack: () => void
}

type FilterType = 'all' | 'volunteer' | 'center' | 'hospital' | 'patients'

const SALAYA: [number, number] = [13.793, 100.321]

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (x: number) => (x * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const MapPage: React.FC<MapPageProps> = ({ onBack }) => {
  const { user } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')
  const [radiusKm, setRadiusKm] = useState(10)
  const [locations, setLocations] = useState<any[]>([])
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [center, setCenter] = useState<[number, number]>(SALAYA)
  const [assignedPatients, setAssignedPatients] = useState<any[]>([])
  const [mySubdistrict, setMySubdistrict] = useState<string>('')
  const [areas, setAreas] = useState<MapArea[]>([])
  const [showAreas, setShowAreas] = useState(true)
  const [showAreaManager, setShowAreaManager] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await getLocations()
      setLocations(data || [])
    })()
  }, [])

  const loadAreas = useCallback(async () => {
    const { data } = await getAllMapAreas()
    setAreas(data || [])
  }, [])

  useEffect(() => {
    loadAreas()
  }, [loadAreas])

  useEffect(() => {
    ;(async () => {
      if (user?.role !== 'volunteer') return
      const { data } = await getPatientProfiles()
      const fullName = user.full_name
      const mine = (data || []).filter((p: any) =>
        typeof p.assigned_vhv_name === 'string' && p.assigned_vhv_name.toLowerCase().includes(fullName.toLowerCase())
      )
      // Get volunteer sub-district from volunteer profile address
      const vols = await getVolunteers()
      const me = (vols.data || []).find((v: any) => v.user_id === user.id)
      const extractSub = (addr?: string) => {
        if (!addr) return ''
        const parts = addr.split(',').map((s: string)=>s.trim()).filter(Boolean)
        return parts.length >= 3 ? parts[parts.length - 3] : ''
      }
      const sub = extractSub(me?.address)
      setMySubdistrict(sub)
      // Filter assigned patients to same sub-district
      const filteredMine = mine.filter((p: any) => extractSub(p.address) === sub)
      setAssignedPatients(filteredMine)
    })()
  }, [user])

  const filtered = useMemo(() => {
    return (locations || []).filter((loc) => {
      if (filter !== 'all' && filter !== 'patients' && loc.type !== filter) return false
      const origin = userPos || SALAYA
      const d = haversineKm(origin, [loc.lat, loc.lng])
      return d <= radiusKm
    })
  }, [locations, filter, radiusKm, userPos])

  const filteredPatients = useMemo(() => {
    if (user?.role !== 'volunteer') return [] as any[]
    const origin = userPos || SALAYA
    const extractSub = (addr?: string) => {
      if (!addr) return ''
      const parts = addr.split(',').map((s: string)=>s.trim()).filter(Boolean)
      return parts.length >= 3 ? parts[parts.length - 3] : ''
    }
    return (assignedPatients || [])
      .filter((p: any) => extractSub(p.address) === mySubdistrict)
      .filter((p: any) => typeof p.lat === 'number' && typeof p.lng === 'number')
      .filter((p: any) => haversineKm(origin, [p.lat, p.lng]) <= radiusKm)
  }, [assignedPatients, mySubdistrict, userPos, radiusKm, user])

  const colorByType = (t: string) =>
    t === 'volunteer' ? '#22c55e' : t === 'center' ? '#0ea5e9' : '#ef4444'

  const myLocationIcon = useMemo(() =>
    L.divIcon({
      className: 'custom-my-location-icon',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,0.25);color:#fff;font-size:16px;line-height:1">🧍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    })
  , [])

  const requestMyLocation = () => {
    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation not supported by this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(coords)
        setCenter(coords)
      },
      (err) => {
        setGeoError(err.message || 'Unable to get current location')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const resetToSalaya = () => {
    setCenter(SALAYA)
  }

  const CenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap()
    useEffect(() => {
      map.setView(center)
    }, [center])
    return null
  }

  if (showAreaManager) {
    return <MapAreaDrawing onClose={() => setShowAreaManager(false)} onAreaChanged={loadAreas} />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Nearby Care Network</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All</option>
                <option value="volunteer">Volunteers</option>
                <option value="center">Centers</option>
                <option value="hospital">Hospitals</option>
                {user?.role === 'volunteer' && <option value="patients">My Patients</option>}
              </select>
              <select value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
              <button onClick={requestMyLocation} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Use My Location</button>
              <button onClick={resetToSalaya} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Reset</button>
              <button onClick={() => setShowAreas(!showAreas)} className={`px-3 py-2 text-sm rounded-lg border ${showAreas ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                {showAreas ? 'Hide' : 'Show'} Areas
              </button>
              {user?.role === 'doctor' && (
                <button onClick={() => setShowAreaManager(true)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 inline-flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Manage Areas
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="h-[600px] w-full border border-gray-200 rounded-lg overflow-hidden">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <CenterMap center={center} />
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Radius circle from origin */}
              <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#0ea5e9', weight: 1 }} />

              {/* Display map areas */}
              {showAreas && areas.map(area => {
                if (!area.geometry?.coordinates?.[0]) return null
                const coords = area.geometry.coordinates[0].map(c => [c[0], c[1]] as [number, number])

                return (
                  <Polygon
                    key={`area-${area.id}`}
                    positions={coords}
                    pathOptions={{
                      color: area.color,
                      fillColor: area.color,
                      fillOpacity: 0.15,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="font-semibold">{area.name}</div>
                    </Popup>
                  </Polygon>
                )
              })}

              {/* Show current user location if available */}
              {userPos && (
                <Marker position={userPos} icon={myLocationIcon}>
                  <Popup>
                    <div className="font-semibold">You are here</div>
                  </Popup>
                </Marker>
              )}
              {filtered.map((loc) => (
                <CircleMarker key={loc.id} center={[loc.lat, loc.lng]} radius={10} pathOptions={{ color: colorByType(loc.type), weight: 2, fillOpacity: 0.6 }}>
                  <Popup>
                    <div className="space-y-1">
                      <div className="font-semibold">{loc.name}</div>
                      <div className="text-xs text-gray-600 capitalize">{loc.type}</div>
                      {loc.address && <div className="text-xs text-gray-700">{loc.address}</div>}
                      {loc.phone && <div className="text-xs text-gray-700">📞 {loc.phone}</div>}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Assigned patients for volunteers */}
              {user?.role === 'volunteer' && (filter === 'all' || filter === 'patients') && filteredPatients.map((p: any) => (
                <Marker key={`pat-${p.id}`} position={[p.lat, p.lng]} icon={L.divIcon({
                  className: 'custom-patient-icon',
                  html: `<div style=\"display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#a21caf;border:2px solid #fff;box-shadow:0 0 0 3px rgba(162,28,175,0.25);color:#fff;font-size:14px;line-height:1\">👤</div>`,
                  iconSize: [26,26], iconAnchor: [13,13], popupAnchor: [0,-13]
                })}>
                  <Popup>
                    <div className="space-y-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-600">Patient</div>
                      <div className="text-xs text-gray-700">MRN: {p.medical_record_number}</div>
                      {p.phone_number && <div className="text-xs text-gray-700">📞 {p.phone_number}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">About this map</h3>
            <div className="text-blue-700 text-sm space-y-1">
              <p><strong>Center:</strong> Salaya, Nakhon Pathom</p>
              <p><strong>Filters:</strong> {filter} • {radiusKm} km radius</p>
              <p><strong>Legend:</strong> <span className="text-green-700">Volunteers</span>, <span className="text-sky-700">Centers</span>, <span className="text-red-700">Hospitals</span></p>
              {geoError && <p className="text-red-700">Location error: {geoError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
