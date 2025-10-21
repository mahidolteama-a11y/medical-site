import { VolunteerProfile, MapArea } from '../types';
import { getVolunteers as dbGetVolunteers, createVolunteer as dbCreateVolunteer, updateVolunteer as dbUpdateVolunteer, getNextVolunteerCode as dbGetNextVolunteerCode } from './dummyDatabase';
import { getAllMapAreas } from './mapAreasService';

// LocalStorage-backed volunteers service with area enrichment

export const getAllVolunteers = async () => {
  const [{ data: volunteers }, { data: areas }] = await Promise.all([
    dbGetVolunteers(),
    getAllMapAreas(),
  ]);
  const byId = new Map<string, MapArea>((areas || []).map(a => [a.id, a]));
  const enriched = (volunteers || []).map(v => ({ ...v, area: v.area_id ? byId.get(v.area_id) : undefined }));
  return { data: enriched as VolunteerProfile[] | null, error: null as any };
};

export const getVolunteerById = async (id: string) => {
  const all = await getAllVolunteers();
  const found = (all.data || []).find(v => v.id === id) || null;
  return { data: found as VolunteerProfile | null, error: null as any };
};

export const getVolunteerByUserId = async (userId: string) => {
  const all = await getAllVolunteers();
  const found = (all.data || []).find(v => v.user_id === userId) || null;
  return { data: found as VolunteerProfile | null, error: null as any };
};

export const createVolunteer = async (volunteer: Omit<VolunteerProfile, 'id' | 'created_at' | 'updated_at' | 'area'>) => {
  const { data, error } = await dbCreateVolunteer(volunteer as any);
  return { data: data as VolunteerProfile | null, error } as any;
};

export const updateVolunteer = async (id: string, updates: Partial<VolunteerProfile>) => {
  const cleanUpdates = { ...updates } as any;
  delete (cleanUpdates as any).area;
  const { data, error } = await dbUpdateVolunteer(id, cleanUpdates);
  return { data: data as VolunteerProfile | null, error } as any;
};

export const deleteVolunteer = async (_id: string) => {
  // Not used in UI currently; implement if needed
  return { error: { message: 'Not implemented in demo' } } as any;
};

export const getNextVolunteerCode = async () => {
  return dbGetNextVolunteerCode();
};
