import { supabase } from './supabase';
import { PatientProfile } from '../types';

export const getAllPatients = async () => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*, area:map_areas(*)')
    .order('name', { ascending: true });

  return { data: data as PatientProfile[] | null, error };
};

export const getPatientById = async (id: string) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*, area:map_areas(*)')
    .eq('id', id)
    .maybeSingle();

  return { data: data as PatientProfile | null, error };
};

export const getPatientByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*, area:map_areas(*)')
    .eq('user_id', userId)
    .maybeSingle();

  return { data: data as PatientProfile | null, error };
};

export const getPatientByMRN = async (mrn: string) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*, area:map_areas(*)')
    .eq('medical_record_number', mrn)
    .maybeSingle();

  return { data: data as PatientProfile | null, error };
};

export const createPatient = async (patient: Omit<PatientProfile, 'id' | 'created_at' | 'updated_at' | 'area'>) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .insert([patient])
    .select('*, area:map_areas(*)')
    .maybeSingle();

  return { data: data as PatientProfile | null, error };
};

export const updatePatient = async (id: string, updates: Partial<PatientProfile>) => {
  const cleanUpdates = { ...updates };
  delete (cleanUpdates as any).area;
  delete (cleanUpdates as any).created_by_user;

  const { data, error } = await supabase
    .from('patient_profiles')
    .update(cleanUpdates)
    .eq('id', id)
    .select('*, area:map_areas(*)')
    .maybeSingle();

  return { data: data as PatientProfile | null, error };
};

export const deletePatient = async (id: string) => {
  const { error } = await supabase
    .from('patient_profiles')
    .delete()
    .eq('id', id);

  return { error };
};

export const getNextMRN = async () => {
  const { data } = await supabase
    .from('patient_profiles')
    .select('medical_record_number')
    .order('medical_record_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.medical_record_number) {
    return 'MRN-000001';
  }

  const match = data.medical_record_number.match(/(\d+)/);
  const lastNum = match ? parseInt(match[1], 10) : 0;
  const nextNum = lastNum + 1;
  return `MRN-${String(nextNum).padStart(6, '0')}`;
};

export const getPatientsByArea = async (areaId: string) => {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('*, area:map_areas(*)')
    .eq('area_id', areaId)
    .order('name', { ascending: true });

  return { data: data as PatientProfile[] | null, error };
};
