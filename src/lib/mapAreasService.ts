import { supabase } from './supabase';
import { MapArea } from '../types';

export const getAllMapAreas = async () => {
  const { data, error } = await supabase
    .from('map_areas')
    .select('*')
    .order('name', { ascending: true });

  return { data: data as MapArea[] | null, error };
};

export const getMapAreaById = async (id: string) => {
  const { data, error } = await supabase
    .from('map_areas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return { data: data as MapArea | null, error };
};

export const createMapArea = async (area: Omit<MapArea, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('map_areas')
    .insert([area])
    .select()
    .maybeSingle();

  return { data: data as MapArea | null, error };
};

export const updateMapArea = async (id: string, updates: Partial<MapArea>) => {
  const { data, error } = await supabase
    .from('map_areas')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  return { data: data as MapArea | null, error };
};

export const deleteMapArea = async (id: string) => {
  const { error } = await supabase
    .from('map_areas')
    .delete()
    .eq('id', id);

  return { error };
};

export const getMapAreasByDoctor = async (doctorId: string) => {
  const { data, error } = await supabase
    .from('map_areas')
    .select('*')
    .eq('created_by', doctorId)
    .order('name', { ascending: true });

  return { data: data as MapArea[] | null, error };
};

export const updateVolunteerArea = async (volunteerId: string, areaId: string | null, areaName: string | null) => {
  const { data, error } = await supabase
    .from('volunteers')
    .update({ area_id: areaId, area_name: areaName })
    .eq('id', volunteerId)
    .select()
    .maybeSingle();

  return { data, error };
};

export const updatePatientArea = async (patientId: string, areaId: string | null, areaName: string | null) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .update({ area_id: areaId, area_name: areaName })
    .eq('id', patientId)
    .select()
    .maybeSingle();

  return { data, error };
};

export const getVolunteersByArea = async (areaId: string) => {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*')
    .eq('area_id', areaId);

  return { data, error };
};

export const getPatientsByArea = async (areaId: string) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*')
    .eq('area_id', areaId);

  return { data, error };
};

export const getAreaStatistics = async (areaId: string) => {
  const volunteersPromise = supabase
    .from('volunteers')
    .select('id', { count: 'exact', head: true })
    .eq('area_id', areaId);

  const patientsPromise = supabase
    .from('patient_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('area_id', areaId);

  const [volunteersResult, patientsResult] = await Promise.all([volunteersPromise, patientsPromise]);

  return {
    volunteerCount: volunteersResult.count || 0,
    patientCount: patientsResult.count || 0,
    error: volunteersResult.error || patientsResult.error
  };
};
