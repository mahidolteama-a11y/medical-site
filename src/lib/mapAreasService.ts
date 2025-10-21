import { MapArea } from '../types';
import { generateId, getCurrentTimestamp, dummyMapAreas } from '../data/dummyData';
import { getVolunteers, updateVolunteer, getPatientProfiles, updatePatientProfile } from './dummyDatabase';

// LocalStorage-backed Map Areas service (no Supabase)
const STORAGE_KEY = 'dummyMapAreas';

const saveToStorage = (areas: MapArea[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
  } catch (e) {
    console.error('Failed saving areas to localStorage', e);
  }
};

const loadFromStorage = (): MapArea[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...dummyMapAreas];
  } catch (e) {
    console.error('Failed loading areas from localStorage', e);
    return [...dummyMapAreas];
  }
};

export const getAllMapAreas = async () => {
  const data = loadFromStorage().sort((a, b) => a.name.localeCompare(b.name));
  return { data, error: null as any };
};

export const getMapAreaById = async (id: string) => {
  const area = loadFromStorage().find(a => a.id === id) || null;
  return { data: area, error: null as any };
};

export const createMapArea = async (area: Omit<MapArea, 'id' | 'created_at' | 'updated_at'>) => {
  const areas = loadFromStorage();
  const rec: MapArea = {
    ...area,
    id: generateId(),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  };
  areas.push(rec);
  saveToStorage(areas);
  return { data: rec, error: null as any };
};

export const updateMapArea = async (id: string, updates: Partial<MapArea>) => {
  const areas = loadFromStorage();
  const idx = areas.findIndex(a => a.id === id);
  if (idx === -1) return { data: null as any, error: { message: 'Area not found' } };
  areas[idx] = { ...areas[idx], ...updates, updated_at: getCurrentTimestamp() };
  saveToStorage(areas);
  return { data: areas[idx], error: null as any };
};

export const deleteMapArea = async (id: string) => {
  const areas = loadFromStorage();
  const idx = areas.findIndex(a => a.id === id);
  if (idx === -1) return { error: { message: 'Area not found' } } as any;
  const [removed] = areas.splice(idx, 1);
  saveToStorage(areas);

  // Unassign volunteers and patients that referenced this area
  try {
    const vols = await getVolunteers();
    await Promise.all((vols.data || [])
      .filter(v => v.area_id === id || v.area_name === removed?.name)
      .map(v => updateVolunteer(v.id, { area_id: undefined, area_name: undefined })));
  } catch {}
  try {
    const pats = await getPatientProfiles();
    await Promise.all((pats.data || [])
      .filter(p => (p as any).area_id === id || (p as any).area_name === removed?.name)
      .map(p => updatePatientProfile(p.id, { area_id: undefined, area_name: undefined } as any)));
  } catch {}

  return { error: null } as any;
};

export const getMapAreasByDoctor = async (doctorId: string) => {
  const data = loadFromStorage().filter(a => a.created_by === doctorId).sort((a, b) => a.name.localeCompare(b.name));
  return { data, error: null as any };
};

export const updateVolunteerArea = async (volunteerId: string, areaId: string | null, areaName: string | null) => {
  const { data, error } = await updateVolunteer(volunteerId, { area_id: areaId || undefined, area_name: areaName || undefined } as any);
  return { data, error } as any;
};

export const updatePatientArea = async (patientId: string, areaId: string | null, areaName: string | null) => {
  const { data, error } = await updatePatientProfile(patientId, { area_id: areaId || undefined, area_name: areaName || undefined } as any);
  return { data, error } as any;
};

export const getVolunteersByArea = async (areaId: string) => {
  const vols = await getVolunteers();
  const data = (vols.data || []).filter(v => v.area_id === areaId);
  return { data, error: null as any };
};

export const getPatientsByArea = async (areaId: string) => {
  const pats = await getPatientProfiles();
  const data = (pats.data || []).filter((p: any) => p.area_id === areaId);
  return { data, error: null as any };
};

export const getAreaStatistics = async (areaId: string) => {
  const [vols, pats] = await Promise.all([getVolunteers(), getPatientProfiles()]);
  return {
    volunteerCount: (vols.data || []).filter(v => v.area_id === areaId).length,
    patientCount: (pats.data || []).filter((p: any) => p.area_id === areaId).length,
    error: null as any,
  };
};
