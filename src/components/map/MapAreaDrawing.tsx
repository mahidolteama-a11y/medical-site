import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import { Save, Trash2, Edit3, X, Plus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapArea } from '../../types';
import { getAllMapAreas, createMapArea, updateMapArea, deleteMapArea, getAreaStatistics } from '../../lib/mapAreasService';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePolygonCentroid } from '../../lib/areaAssignment';

interface MapAreaDrawingProps {
  onClose: () => void;
  onAreaChanged?: () => void;
}

const DEFAULT_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export const MapAreaDrawing: React.FC<MapAreaDrawingProps> = ({ onClose, onAreaChanged }) => {
  const { user } = useAuth();
  const [areas, setAreas] = useState<MapArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [editingArea, setEditingArea] = useState<MapArea | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState(DEFAULT_COLORS[0]);
  const [selectedArea, setSelectedArea] = useState<MapArea | null>(null);
  const [areaStats, setAreaStats] = useState<{ volunteerCount: number; patientCount: number } | null>(null);

  const loadAreas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getAllMapAreas();
    if (!error && data) {
      setAreas(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  useEffect(() => {
    if (selectedArea) {
      getAreaStatistics(selectedArea.id).then(stats => {
        setAreaStats(stats);
      });
    } else {
      setAreaStats(null);
    }
  }, [selectedArea]);

  const startDrawing = () => {
    setIsDrawing(true);
    setCurrentPolygon([]);
  };

  const finishDrawing = () => {
    if (currentPolygon.length >= 3) {
      setShowNameModal(true);
    } else {
      alert('Please draw at least 3 points to create an area');
      setIsDrawing(false);
      setCurrentPolygon([]);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPolygon([]);
  };

  const handleSaveArea = async () => {
    if (!newAreaName.trim()) {
      alert('Please enter a name for the area');
      return;
    }

    if (currentPolygon.length < 3) {
      alert('Area must have at least 3 points');
      return;
    }

    const geometry = {
      type: 'Polygon' as const,
      coordinates: [[...currentPolygon.map(p => [p[0], p[1]]), currentPolygon[0]].map(p => [p[0], p[1]])]
    };

    const { data, error } = await createMapArea({
      name: newAreaName,
      color: newAreaColor,
      geometry,
      created_by: user?.id || ''
    });

    if (error) {
      console.error('Error creating area:', error);
      alert('Failed to create area: ' + error.message);
      return;
    }

    setShowNameModal(false);
    setIsDrawing(false);
    setCurrentPolygon([]);
    setNewAreaName('');
    setNewAreaColor(DEFAULT_COLORS[0]);
    await loadAreas();
    if (onAreaChanged) onAreaChanged();
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this area? Volunteers and patients will be unassigned.')) {
      return;
    }

    const { error } = await deleteMapArea(areaId);

    if (error) {
      console.error('Error deleting area:', error);
      alert('Failed to delete area: ' + error.message);
      return;
    }

    setSelectedArea(null);
    await loadAreas();
    if (onAreaChanged) onAreaChanged();
  };

  const handleUpdateAreaColor = async (areaId: string, color: string) => {
    const { error } = await updateMapArea(areaId, { color });

    if (error) {
      console.error('Error updating area color:', error);
      return;
    }

    await loadAreas();
    if (onAreaChanged) onAreaChanged();
  };

  const DrawingHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        if (isDrawing) {
          setCurrentPolygon(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
        }
      }
    });
    return null;
  };

  const MapController: React.FC = () => {
    const map = useMap();
    useEffect(() => {
      map.setView([13.793, 100.321], 13);
    }, [map]);
    return null;
  };

  if (loading) {
    return <div className="py-10 text-center">Loading areas...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Map Area Management</h1>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            {!isDrawing ? (
              <button
                onClick={startDrawing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Draw New Area
              </button>
            ) : (
              <>
                <button
                  onClick={finishDrawing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  Finish Drawing
                </button>
                <button
                  onClick={cancelDrawing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <span className="text-sm text-gray-600">
                  Click on map to add points ({currentPolygon.length} points)
                </span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="h-[600px] w-full border border-gray-200 rounded-lg overflow-hidden">
                <MapContainer
                  center={[13.793, 100.321]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <MapController />
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <DrawingHandler />

                  {areas.map(area => {
                    if (!area.geometry?.coordinates?.[0]) return null;
                    const coords = area.geometry.coordinates[0].map(c => [c[0], c[1]] as [number, number]);

                    return (
                      <Polygon
                        key={`area-polygon-${area.id}`}
                        positions={coords}
                        pathOptions={{
                          color: area.color,
                          fillColor: area.color,
                          fillOpacity: selectedArea?.id === area.id ? 0.4 : 0.2,
                          weight: selectedArea?.id === area.id ? 3 : 2
                        }}
                        eventHandlers={{
                          click: () => setSelectedArea(area)
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <div className="font-semibold text-lg mb-2">{area.name}</div>
                            {areaStats && selectedArea?.id === area.id && (
                              <div className="text-sm space-y-1">
                                <div>Volunteers: {areaStats.volunteerCount}</div>
                                <div>Patients: {areaStats.patientCount}</div>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  })}

                  {isDrawing && currentPolygon.length > 0 && (
                    <>
                      {currentPolygon.length >= 2 && (
                        <Polygon
                          positions={currentPolygon}
                          pathOptions={{
                            color: newAreaColor,
                            fillColor: newAreaColor,
                            fillOpacity: 0.3,
                            weight: 2,
                            dashArray: '5, 5'
                          }}
                        />
                      )}
                      {currentPolygon.map((point, idx) => (
                        <CircleMarker
                          key={`drawing-point-${idx}`}
                          center={point}
                          radius={8}
                          pathOptions={{ color: newAreaColor, fillColor: newAreaColor, fillOpacity: 0.8, weight: 2 }}
                        />
                      ))}
                    </>
                  )}
                </MapContainer>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Areas ({areas.length})</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {areas.map(area => (
                    <div
                      key={area.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedArea?.id === area.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedArea(area)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: area.color }}
                          />
                          <span className="font-medium text-sm">{area.name}</span>
                        </div>
                      </div>
                      {selectedArea?.id === area.id && (
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Color:</label>
                            <input
                              type="color"
                              value={area.color}
                              onChange={(e) => handleUpdateAreaColor(area.id, e.target.value)}
                              className="w-8 h-6 rounded cursor-pointer"
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArea(area.id);
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete Area
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {areas.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-8">
                      No areas yet. Click "Draw New Area" to create one.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Name Your Area</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area Name</label>
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g., North District Zone 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newAreaColor}
                    onChange={(e) => setNewAreaColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewAreaColor(color)}
                        className={`w-8 h-8 rounded ${newAreaColor === color ? 'ring-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNameModal(false);
                    setIsDrawing(false);
                    setCurrentPolygon([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveArea}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Area
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
