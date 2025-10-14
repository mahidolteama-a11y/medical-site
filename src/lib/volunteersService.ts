import { supabase } from './supabase';
import { VolunteerProfile } from '../types';

export const getAllVolunteers = async () => {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*, area:map_areas(*)')
    .order('name', { ascending: true });

  return { data: data as VolunteerProfile[] | null, error };
};

export const getVolunteerById = async (id: string) => {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*, area:map_areas(*)')
    .eq('id', id)
    .maybeSingle();

  return { data: data as VolunteerProfile | null, error };
};

export const getVolunteerByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('volunteers')
    .select('*, area:map_areas(*)')
    .eq('user_id', userId)
    .maybeSingle();

  return { data: data as VolunteerProfile | null, error };
};

export const createVolunteer = async (volunteer: Omit<VolunteerProfile, 'id' | 'created_at' | 'updated_at' | 'area'>) => {
  const { data, error } = await supabase
    .from('volunteers')
    .insert([volunteer])
    .select('*, area:map_areas(*)')
    .maybeSingle();

  return { data: data as VolunteerProfile | null, error };
};

export const updateVolunteer = async (id: string, updates: Partial<VolunteerProfile>) => {
  const cleanUpdates = { ...updates };
  delete (cleanUpdates as any).area;

  const { data, error } = await supabase
    .from('volunteers')
    .update(cleanUpdates)
    .eq('id', id)
    .select('*, area:map_areas(*)')
    .maybeSingle();

  return { data: data as VolunteerProfile | null, error };
};

export const deleteVolunteer = async (id: string) => {
  const { error } = await supabase
    .from('volunteers')
    .delete()
    .eq('id', id);

  return { error };
};

export const getNextVolunteerCode = async () => {
  const { data } = await supabase
    .from('volunteers')
    .select('volunteer_code')
    .order('volunteer_code', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.volunteer_code) {
    return 'VHV-000001';
  }

  const match = data.volunteer_code.match(/(\d+)/);
  const lastNum = match ? parseInt(match[1], 10) : 0;
  const nextNum = lastNum + 1;
  return `VHV-${String(nextNum).padStart(6, '0')}`;
};
