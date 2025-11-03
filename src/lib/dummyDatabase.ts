import { 
  dummyPatientProfiles, 
  dummyMessages, 
  dummyUsers,
  dummyTasks,
  dummyAnnouncements,
  dummyDailyRecords,
  DummyDoctorRecord,
  dummyDoctorRecords,
  DummyPatientProfile, 
  DummyMessage, 
  DummyUser,
  DummyTask,
  DummyAnnouncement,
  DummyDailyRecord,
  DummyMentalAssessment,
  dummyMentalAssessments,
  DummyMedication,
  DummyMedicationIntake,
  dummyMedications,
  dummyMedicationIntakes,
  DummyMedicationRequest,
  dummyMedicationRequests,
  // locations
  dummyLocations,
  DummyLocation,
  generateId,
  getCurrentTimestamp,
  dummyMapAreas,
} from '../data/dummyData';
import { VolunteerProfile } from '../types';

// Helper function to save data to localStorage for persistence
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`📁 Data saved to LOCALSTORAGE with key: ${key}`, data.length || Object.keys(data).length);
    console.log(`🔍 This data is stored in your BROWSER, not in actual files`);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Helper function to load data from localStorage
const loadFromStorage = (key: string, defaultData: any) => {
  try {
    const stored = localStorage.getItem(key);
    const result = stored ? JSON.parse(stored) : defaultData;
    console.log(`📂 Data loaded from LOCALSTORAGE with key: ${key}`, result.length || Object.keys(result).length);
    console.log(`🔍 This data comes from your BROWSER storage, not actual files`);
    return result;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultData;
  }
};

// Initialize data from localStorage or use defaults
let persistentPatientProfiles = loadFromStorage('dummyPatientProfiles', [...dummyPatientProfiles]);
let persistentMessages = loadFromStorage('dummyMessages', [...dummyMessages]);
let persistentUsers = loadFromStorage('dummyUsers', [...dummyUsers]);
let persistentTasks = loadFromStorage('dummyTasks', [...dummyTasks]);
let persistentAnnouncements = loadFromStorage('dummyAnnouncements', [...dummyAnnouncements]);
let persistentDailyRecords = loadFromStorage('dummyDailyRecords', [...dummyDailyRecords]);
let persistentDoctorRecords: DummyDoctorRecord[] = loadFromStorage('dummyDoctorRecords', [...dummyDoctorRecords]);
let persistentLocations = loadFromStorage('dummyLocations', [...dummyLocations]);
let persistentVolunteers: VolunteerProfile[] = loadFromStorage('dummyVolunteers', []);
let persistentMentalAssessments: DummyMentalAssessment[] = loadFromStorage('dummyMentalAssessments', [...dummyMentalAssessments]);
let persistentMedications: DummyMedication[] = loadFromStorage('dummyMedications', [...dummyMedications]);
let persistentMedicationIntakes: DummyMedicationIntake[] = loadFromStorage('dummyMedicationIntakes', [...dummyMedicationIntakes]);
let persistentMedicationRequests: DummyMedicationRequest[] = loadFromStorage('dummyMedicationRequests', [...dummyMedicationRequests]);

// Ensure every patient profile has a corresponding user entry so they are reachable
// in messaging and task assignment flows. Seed minimal user records if missing.
try {
  const seeded: DummyUser[] = []
  for (const p of persistentPatientProfiles) {
    const exists = persistentUsers.find(u => u.id === p.user_id)
    if (!exists) {
      const u: DummyUser = {
        id: p.user_id || generateId(),
        email: `patient+${(p.user_id || '').toLowerCase() || Math.random().toString(36).slice(2)}@example.local`,
        password: '',
        full_name: p.name || 'Patient',
        role: 'patient',
        created_at: getCurrentTimestamp(),
      }
      persistentUsers.push(u)
      seeded.push(u)
    }
  }
  if (seeded.length > 0) {
    saveToStorage('dummyUsers', persistentUsers)
    console.log(`Seeded ${seeded.length} user(s) from patient profiles`)
  }
} catch (e) {
  console.warn('Unable to seed users from patient profiles', e)
}

// Normalize and clean demo data so everything is linked and usable by default
try {
  const userById = new Map<string, DummyUser>((persistentUsers || []).map(u => [u.id, u]))
  const doctors = (persistentUsers || []).filter(u => u.role === 'doctor')
  const defaultDoctor = doctors[0]
  // Ensure doctor_code for doctors
  for (const d of doctors as any[]) {
    if (!d.doctor_code) {
      const idx = doctors.indexOf(d)
      d.doctor_code = `DR-${String(idx + 1).padStart(6, '0')}`
    }
  }
  saveToStorage('dummyUsers', persistentUsers)

  const defaultArea = (dummyMapAreas || [])[0]
  const centroid = defaultArea ? (() => {
    const coords = defaultArea.geometry.coordinates[0] || []
    const lat = coords.reduce((s,c)=>s+(c?.[0]||0),0) / (coords.length || 1)
    const lng = coords.reduce((s,c)=>s+(c?.[1]||0),0) / (coords.length || 1)
    return { lat, lng }
  })() : { lat: 13.793, lng: 100.321 }

  // Clean patient profiles
  let changed = false
  persistentPatientProfiles = (persistentPatientProfiles || []).filter(p => !!p && !!p.name)
    .map(p => {
      const pp = { ...p }
      // Fix assigned doctor to a known doctor
      const doctorNames = doctors.map(d => (d.full_name || '').toLowerCase())
      const docName = (pp.assigned_doctor || '').toLowerCase()
      const matchDoctor = doctorNames.find(n => docName.includes(n))
      if (!matchDoctor && defaultDoctor) {
        pp.assigned_doctor = defaultDoctor.full_name
        changed = true
      }
      // Fix VHV name to our seeded volunteer (Maria Garcia) if unknown
      const knownVhv = 'Maria Garcia'
      if (typeof pp.assigned_vhv_name !== 'string' || pp.assigned_vhv_name.length === 0 || /(ironman|unknown|n\/a)/i.test(pp.assigned_vhv_name)) {
        pp.assigned_vhv_name = knownVhv
        changed = true
      }
      // Ensure MRN format
      if (!pp.medical_record_number || !/^MRN-/.test(pp.medical_record_number)) {
        const num = Math.floor(100000 + Math.random() * 899999)
        pp.medical_record_number = `MRN-${String(num).padStart(6, '0')}`
        changed = true
      }
      // Ensure lat/lng present
      if (typeof pp.lat !== 'number' || typeof pp.lng !== 'number') {
        const jitter = () => (Math.random() - 0.5) * 0.01
        pp.lat = centroid.lat + jitter()
        pp.lng = centroid.lng + jitter()
        changed = true
      }
      // Ensure area name
      // @ts-ignore allow assignment
      if (!(pp as any).area_name && defaultArea) {
        // @ts-ignore
        (pp as any).area_name = defaultArea.name
        changed = true
      }
      // Ensure user exists (already seeded above), and correct role
      if (!pp.user_id || !userById.get(pp.user_id)) {
        const uid = generateId()
        pp.user_id = uid
        persistentUsers.push({ id: uid, email: `patient+${uid.slice(0,6)}@example.local`, password: '', full_name: pp.name, role: 'patient', created_at: getCurrentTimestamp() })
        saveToStorage('dummyUsers', persistentUsers)
        changed = true
      }
      return pp
    })
  if (changed) saveToStorage('dummyPatientProfiles', persistentPatientProfiles)

  // Volunteers: if none, seeding already occurs in getVolunteers. Ensure at least one exists for linking
  if ((persistentVolunteers || []).length === 0) {
    // force initialize by calling getVolunteers logic lazily later; nothing here
  }

  // Remove messages with missing users
  const beforeMsgs = (persistentMessages || []).length
  persistentMessages = (persistentMessages || []).filter(m => userById.has(m.sender_id) && userById.has(m.recipient_id))
  if (persistentMessages.length !== beforeMsgs) saveToStorage('dummyMessages', persistentMessages)

  // Remove tasks with missing users or patients
  const patientIds = new Set((persistentPatientProfiles || []).map(p => p.id))
  const beforeTasks = (persistentTasks || []).length
  persistentTasks = (persistentTasks || []).filter(t => userById.has(t.assigned_to) && userById.has(t.assigned_by) && (!t.patient_id || patientIds.has(t.patient_id)))
  if (persistentTasks.length !== beforeTasks) saveToStorage('dummyTasks', persistentTasks)

  // Remove daily records with missing refs
  const beforeRec = (persistentDailyRecords || []).length
  persistentDailyRecords = (persistentDailyRecords || []).filter(r => patientIds.has(r.patient_id) && userById.has(r.recorded_by))
  if (persistentDailyRecords.length !== beforeRec) saveToStorage('dummyDailyRecords', persistentDailyRecords)

  // Clean doctor records with missing refs
  const beforeDocRec = (persistentDoctorRecords || []).length
  persistentDoctorRecords = (persistentDoctorRecords || []).filter(r => patientIds.has(r.patient_id) && userById.has(r.recorded_by))
  if (persistentDoctorRecords.length !== beforeDocRec) saveToStorage('dummyDoctorRecords', persistentDoctorRecords)

  // Clean locations with missing users
  const beforeLoc = (persistentLocations || []).length
  persistentLocations = (persistentLocations || []).filter((l:any) => !l.user_id || userById.has(l.user_id))
  if (persistentLocations.length !== beforeLoc) saveToStorage('dummyLocations', persistentLocations)
} catch (e) {
  console.warn('Normalization pass skipped:', e)
}
// MRN helpers
const parseMrnNumber = (mrn?: string) => {
  if (!mrn) return 0;
  const m = (mrn.match(/(\d+)/) || [])[1];
  return m ? parseInt(m, 10) : 0;
};

const formatMrn = (num: number) => `MRN-${String(num).padStart(6, '0')}`;

export const getNextMRN = async () => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const maxNum = persistentPatientProfiles.reduce((max, p) => Math.max(max, parseMrnNumber(p.medical_record_number)), 0);
  return formatMrn(maxNum + 1);
};

// Volunteer helpers
const parseVolunteerNum = (code?: string) => {
  if (!code) return 0
  const m = (code.match(/(\d+)/) || [])[1]
  return m ? parseInt(m, 10) : 0
}
const formatVolunteerCode = (num: number) => `VHV-${String(num).padStart(6, '0')}`
export const getNextVolunteerCode = async () => {
  await new Promise(r => setTimeout(r, 20))
  const maxNum = persistentVolunteers.reduce((m, v) => Math.max(m, parseVolunteerNum(v.volunteer_code)), 0)
  return formatVolunteerCode(maxNum + 1)
}

// Doctor helpers
const parseDoctorNum = (code?: string) => {
  if (!code) return 0
  const m = (code.match(/(\d+)/) || [])[1]
  return m ? parseInt(m, 10) : 0
}
const formatDoctorCode = (num: number) => `DR-${String(num).padStart(6, '0')}`
export const getNextDoctorCode = async () => {
  await new Promise(r => setTimeout(r, 20))
  const maxNum = persistentUsers
    .filter(u => u.role === 'doctor')
    .reduce((m, u: any) => Math.max(m, parseDoctorNum((u as any).doctor_code)), 0)
  return formatDoctorCode(maxNum + 1)
}

// Patient Profiles Operations
export const getPatientProfiles = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    data: persistentPatientProfiles.map(profile => ({
      ...profile,
      created_by_user: persistentUsers.find(user => user.id === profile.created_by)
    })),
    error: null
  };
};

// Find a patient by MRN (medical record number)
export const getPatientByMRN = async (mrn: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const profile = persistentPatientProfiles.find(p => (p.medical_record_number || '').toLowerCase() === (mrn || '').toLowerCase());
  if (!profile) return { data: null, error: { message: 'No patient with that ID' } };
  return { data: profile, error: null };
};

export const getPatientProfileByUserId = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const profile = persistentPatientProfiles.find(p => p.user_id === userId);
  if (!profile) {
    return { data: null, error: { code: 'PGRST116', message: 'No profile found' } };
  }

  return {
    data: {
      ...profile,
      created_by_user: persistentUsers.find(user => user.id === profile.created_by)
    },
    error: null
  };
};

export const createPatientProfile = async (profileData: Omit<DummyPatientProfile, 'id' | 'created_at' | 'updated_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  // Ensure MRN is present and formatted consistently
  let mrn = profileData.medical_record_number;
  if (!mrn) {
    const next = await getNextMRN();
    mrn = next;
  }

  const newProfile: DummyPatientProfile = {
    ...profileData,
    medical_record_number: mrn,
    id: generateId(),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };

  persistentPatientProfiles.push(newProfile);
  saveToStorage('dummyPatientProfiles', persistentPatientProfiles);
  
  return { data: newProfile, error: null };
};

export const updatePatientProfile = async (id: string, updates: Partial<DummyPatientProfile>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const profileIndex = persistentPatientProfiles.findIndex(p => p.id === id);
  if (profileIndex === -1) {
    return { data: null, error: { message: 'Profile not found' } };
  }

  persistentPatientProfiles[profileIndex] = {
    ...persistentPatientProfiles[profileIndex],
    ...updates,
    updated_at: getCurrentTimestamp()
  };

  saveToStorage('dummyPatientProfiles', persistentPatientProfiles);
  
  return { data: persistentPatientProfiles[profileIndex], error: null };
};

// Volunteers Operations
export const getVolunteers = async () => {
  await new Promise(r => setTimeout(r, 200))
  // Seed volunteers from existing users if none saved yet (first-run convenience)
  if ((persistentVolunteers || []).length === 0) {
    const seedList: VolunteerProfile[] = (persistentUsers || [])
      .filter(u => u.role === 'volunteer')
      .map((u, idx) => {
        const loc = (dummyLocations || []).find(l => l.user_id === u.id)
        // Default to center of first default area if present (for Maria)
        const defaultArea = (dummyMapAreas || [])[0]
        const center = defaultArea ? (() => {
          const coords = defaultArea.geometry.coordinates[0] || []
          const lat = coords.reduce((s,c)=>s+(c?.[0]||0),0) / (coords.length || 1)
          const lng = coords.reduce((s,c)=>s+(c?.[1]||0),0) / (coords.length || 1)
          return { lat, lng }
        })() : undefined

        const base: VolunteerProfile = {
          id: generateId(),
          user_id: u.id,
          volunteer_code: formatVolunteerCode(idx + 1),
          name: u.full_name,
          email: u.email,
          phone: undefined,
          address: loc?.address,
          lat: loc?.lat,
          lng: loc?.lng,
          created_at: getCurrentTimestamp(),
          updated_at: getCurrentTimestamp(),
        } as VolunteerProfile

        // Assign default area to our default volunteer (Maria Garcia)
        if ((u.email || '').toLowerCase() === 'volunteer@hospital.com' && defaultArea) {
          base.area_id = defaultArea.id
          base.area_name = defaultArea.name
          if (!base.lat || !base.lng) {
            base.lat = center?.lat
            base.lng = center?.lng
          }
        }

        return base
      })
    if (seedList.length > 0) {
      persistentVolunteers = seedList
      saveToStorage('dummyVolunteers', persistentVolunteers)
    }
  }
  const withUsers = persistentVolunteers.map(v => ({
    ...v,
    user: persistentUsers.find(u => u.id === v.user_id)
  }))
  return { data: withUsers, error: null }
}

export const getVolunteerByCode = async (code: string) => {
  await new Promise(r => setTimeout(r, 150))
  const v = persistentVolunteers.find(x => (x.volunteer_code || '').toLowerCase() === code.toLowerCase())
  return { data: v || null, error: v ? null : { message: 'Not found' } }
}

export const createVolunteer = async (v: Omit<VolunteerProfile, 'id' | 'created_at' | 'updated_at' | 'volunteer_code'> & { volunteer_code?: string }) => {
  await new Promise(r => setTimeout(r, 200))
  const code = v.volunteer_code || await getNextVolunteerCode()
  const rec: VolunteerProfile = {
    ...v,
    volunteer_code: code,
    id: generateId(),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  }
  persistentVolunteers.push(rec)
  saveToStorage('dummyVolunteers', persistentVolunteers)
  return { data: rec, error: null }
}

export const updateVolunteer = async (id: string, updates: Partial<VolunteerProfile>) => {
  await new Promise(r => setTimeout(r, 200))
  const idx = persistentVolunteers.findIndex(x => x.id === id)
  if (idx === -1) return { data: null, error: { message: 'Volunteer not found' } }
  persistentVolunteers[idx] = { ...persistentVolunteers[idx], ...updates, updated_at: getCurrentTimestamp() }
  saveToStorage('dummyVolunteers', persistentVolunteers)
  return { data: persistentVolunteers[idx], error: null }
}

// Messages Operations
export const getMessages = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const userMessages = persistentMessages
    .filter(msg => msg.sender_id === userId || msg.recipient_id === userId)
    .map(msg => ({
      ...msg,
      sender: persistentUsers.find(user => user.id === msg.sender_id),
      recipient: persistentUsers.find(user => user.id === msg.recipient_id)
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { data: userMessages, error: null };
};

export const sendMessageToDatabase = async (messageData: Omit<DummyMessage, 'id' | 'created_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newMessage: DummyMessage = {
    ...messageData,
    id: generateId(),
    created_at: getCurrentTimestamp()
  };

  persistentMessages.push(newMessage);
  saveToStorage('dummyMessages', persistentMessages);
  
  // Enhanced logging for clarity
  console.log('💾 Message saved to BROWSER LOCALSTORAGE:', newMessage);
  console.log('📊 Total messages in BROWSER storage:', persistentMessages.length);
  console.log('⚠️  NOTE: Data is NOT saved to actual files, only in browser localStorage');
  
  return { data: newMessage, error: null };
};

export const markMessageAsRead = async (messageId: string, userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const messageIndex = persistentMessages.findIndex(msg => 
    msg.id === messageId && msg.recipient_id === userId
  );
  
  if (messageIndex !== -1) {
    persistentMessages[messageIndex].is_read = true;
    saveToStorage('dummyMessages', persistentMessages);
  }
  
  return { error: null };
};

// Users Operations
export const getUsers = async (excludeUserId?: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const users = excludeUserId 
    ? persistentUsers.filter(user => user.id !== excludeUserId)
    : persistentUsers;
  
  return { data: users, error: null };
};

// Create a patient user without affecting current session
export const createPatientUser = async (email: string, fullName: string) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  if (!email) return { data: null, error: { message: 'Email is required' } };
  const exists = persistentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { data: exists, error: null };
  const newUser: DummyUser = {
    id: generateId(),
    email,
    password: '', // no password yet; patient will set on first login
    full_name: fullName || email.split('@')[0],
    role: 'patient',
    created_at: getCurrentTimestamp(),
  };
  persistentUsers.push(newUser);
  saveToStorage('dummyUsers', persistentUsers);
  return { data: newUser, error: null };
};

export const createVolunteerUser = async (email: string, fullName: string) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  if (!email) return { data: null, error: { message: 'Email is required' } };
  const exists = persistentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { data: exists, error: null };
  const newUser: DummyUser = {
    id: generateId(),
    email,
    password: '',
    full_name: fullName || email.split('@')[0],
    role: 'volunteer',
    created_at: getCurrentTimestamp(),
  };
  persistentUsers.push(newUser);
  saveToStorage('dummyUsers', persistentUsers);
  return { data: newUser, error: null };
};

export const createDoctorUser = async (email: string, fullName: string) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  if (!email) return { data: null, error: { message: 'Email is required' } };
  const exists = persistentUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { data: exists, error: null };
  const code = await getNextDoctorCode()
  const newUser: DummyUser = {
    id: generateId(),
    email,
    password: '',
    full_name: fullName || email.split('@')[0],
    role: 'doctor',
    created_at: getCurrentTimestamp(),
    doctor_code: code,
  };
  persistentUsers.push(newUser);
  saveToStorage('dummyUsers', persistentUsers);
  return { data: newUser, error: null };
};

// Update user profile (e.g., name, photo)
export const updateUserById = async (id: string, updates: Partial<DummyUser>) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  const idx = persistentUsers.findIndex(u => u.id === id)
  if (idx === -1) return { data: null, error: { message: 'User not found' } }
  persistentUsers[idx] = { ...persistentUsers[idx], ...updates }
  saveToStorage('dummyUsers', persistentUsers)
  return { data: persistentUsers[idx], error: null }
}

// Delete user (used for doctor account management)
export const deleteUserById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 120));
  const idx = persistentUsers.findIndex(u => u.id === id)
  if (idx === -1) return { data: null, error: { message: 'User not found' } }
  const [removed] = persistentUsers.splice(idx, 1)
  saveToStorage('dummyUsers', persistentUsers)
  return { data: removed, error: null }
}

// Locations Operations
export const getLocations = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { data: persistentLocations as DummyLocation[], error: null };
};

export const getDoctorByCode = async (code: string) => {
  await new Promise(r => setTimeout(r, 120))
  const d = (persistentUsers || []).find((u:any) => (u.role === 'doctor') && ((u.doctor_code || '').toLowerCase() === (code || '').toLowerCase()))
  return { data: d || null, error: d ? null : { message: 'Not found' } }
}

// Tasks Operations
export const getTasks = async (userId?: string) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let tasks = persistentTasks.map(task => ({
    ...task,
    assigned_to_user: persistentUsers.find(user => user.id === task.assigned_to),
    assigned_by_user: persistentUsers.find(user => user.id === task.assigned_by),
    patient: task.patient_id ? persistentPatientProfiles.find(p => p.id === task.patient_id) : undefined
  }));

  // If userId is provided, filter tasks assigned to or created by that user
  if (userId) {
    tasks = tasks.filter(task => task.assigned_to === userId || task.assigned_by === userId);
  }
  
  return { data: tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), error: null };
};

export const createTask = async (taskData: Omit<DummyTask, 'id' | 'created_at' | 'updated_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newTask: DummyTask = {
    ...taskData,
    id: generateId(),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };

  persistentTasks.push(newTask);
  saveToStorage('dummyTasks', persistentTasks);
  
  return { data: newTask, error: null };
};

export const updateTask = async (id: string, updates: Partial<DummyTask>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const taskIndex = persistentTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return { data: null, error: { message: 'Task not found' } };
  }

  // If status is being updated to completed, set completed_at
  if (updates.status === 'completed' && persistentTasks[taskIndex].status !== 'completed') {
    updates.completed_at = getCurrentTimestamp();
  }

  persistentTasks[taskIndex] = {
    ...persistentTasks[taskIndex],
    ...updates,
    updated_at: getCurrentTimestamp()
  };

  saveToStorage('dummyTasks', persistentTasks);
  
  return { data: persistentTasks[taskIndex], error: null };
};

export const deleteTask = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const taskIndex = persistentTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return { data: null, error: { message: 'Task not found' } };
  }

  persistentTasks.splice(taskIndex, 1);
  saveToStorage('dummyTasks', persistentTasks);
  
  return { data: null, error: null };
};

// Announcements Operations
export const getAnnouncements = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const announcements = persistentAnnouncements.map(announcement => ({
    ...announcement,
    created_by_user: persistentUsers.find(user => user.id === announcement.created_by)
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return { data: announcements, error: null };
};

export const createAnnouncement = async (announcementData: Omit<DummyAnnouncement, 'id' | 'created_at' | 'updated_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newAnnouncement: DummyAnnouncement = {
    ...announcementData,
    id: generateId(),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };

  persistentAnnouncements.push(newAnnouncement);
  saveToStorage('dummyAnnouncements', persistentAnnouncements);
  
  return { data: newAnnouncement, error: null };
};

export const updateAnnouncement = async (id: string, updates: Partial<DummyAnnouncement>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const announcementIndex = persistentAnnouncements.findIndex(a => a.id === id);
  if (announcementIndex === -1) {
    return { data: null, error: { message: 'Announcement not found' } };
  }

  persistentAnnouncements[announcementIndex] = {
    ...persistentAnnouncements[announcementIndex],
    ...updates,
    updated_at: getCurrentTimestamp()
  };

  saveToStorage('dummyAnnouncements', persistentAnnouncements);
  
  return { data: persistentAnnouncements[announcementIndex], error: null };
};

export const deleteAnnouncement = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const announcementIndex = persistentAnnouncements.findIndex(a => a.id === id);
  if (announcementIndex === -1) {
    return { data: null, error: { message: 'Announcement not found' } };
  }

  persistentAnnouncements.splice(announcementIndex, 1);
  saveToStorage('dummyAnnouncements', persistentAnnouncements);
  
  return { data: null, error: null };
};

// Daily Records Operations
export const getDailyRecords = async (patientId?: string, userId?: string) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let records = persistentDailyRecords.map(record => ({
    ...record,
    patient: persistentPatientProfiles.find(p => p.id === record.patient_id),
    recorded_by_user: persistentUsers.find(u => u.id === record.recorded_by)
  }));

  // Filter by patient if specified
  if (patientId) {
    records = records.filter(record => record.patient_id === patientId);
  }

  // Filter by user if specified (for patients to see only their own records)
  if (userId) {
    const userPatient = persistentPatientProfiles.find(p => p.user_id === userId);
    if (userPatient) {
      records = records.filter(record => record.patient_id === userPatient.id);
    }
  }
  
  return { 
    data: records.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()), 
    error: null 
  };
};

export const createDailyRecord = async (recordData: Omit<DummyDailyRecord, 'id' | 'created_at' | 'updated_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newRecord: DummyDailyRecord = {
    ...recordData,
    id: generateId(),
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  };

  persistentDailyRecords.push(newRecord);
  saveToStorage('dummyDailyRecords', persistentDailyRecords);
  
  return { data: newRecord, error: null };
};

export const updateDailyRecord = async (id: string, updates: Partial<DummyDailyRecord>) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const recordIndex = persistentDailyRecords.findIndex(r => r.id === id);
  if (recordIndex === -1) {
    return { data: null, error: { message: 'Daily record not found' } };
  }

  persistentDailyRecords[recordIndex] = {
    ...persistentDailyRecords[recordIndex],
    ...updates,
    updated_at: getCurrentTimestamp()
  };

  saveToStorage('dummyDailyRecords', persistentDailyRecords);
  
  return { data: persistentDailyRecords[recordIndex], error: null };
};

export const deleteDailyRecord = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const recordIndex = persistentDailyRecords.findIndex(r => r.id === id);
  if (recordIndex === -1) {
    return { data: null, error: { message: 'Daily record not found' } };
  }

  persistentDailyRecords.splice(recordIndex, 1);
  saveToStorage('dummyDailyRecords', persistentDailyRecords);
  
  return { data: null, error: null };
};

// Doctor Records Operations
export const getDoctorRecords = async (patientId?: string, userId?: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let records = (persistentDoctorRecords || []).map(r => ({
    ...r,
    patient: persistentPatientProfiles.find(p => p.id === r.patient_id),
    recorded_by_user: persistentUsers.find(u => u.id === r.recorded_by)
  }))
  if (patientId) records = records.filter(r => r.patient_id === patientId)
  if (userId) {
    const p = persistentPatientProfiles.find(pp => pp.user_id === userId)
    if (p) records = records.filter(r => r.patient_id === p.id)
  }
  return { data: records.sort((a,b)=> new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()), error: null }
}

export const createDoctorRecord = async (rec: Omit<DummyDoctorRecord, 'id' | 'created_at' | 'updated_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 250));
  const row: DummyDoctorRecord = { ...rec, id: generateId(), created_at: getCurrentTimestamp(), updated_at: getCurrentTimestamp() }
  persistentDoctorRecords.push(row)
  saveToStorage('dummyDoctorRecords', persistentDoctorRecords)
  return { data: row, error: null }
}

export const updateDoctorRecord = async (id: string, updates: Partial<DummyDoctorRecord>) => {
  await new Promise(resolve => setTimeout(resolve, 250));
  const idx = persistentDoctorRecords.findIndex(r => r.id === id)
  if (idx === -1) return { data: null, error: { message: 'Record not found' } }
  persistentDoctorRecords[idx] = { ...persistentDoctorRecords[idx], ...updates, updated_at: getCurrentTimestamp() }
  saveToStorage('dummyDoctorRecords', persistentDoctorRecords)
  return { data: persistentDoctorRecords[idx], error: null }
}

export const deleteDoctorRecord = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const idx = persistentDoctorRecords.findIndex(r => r.id === id)
  if (idx === -1) return { data: null, error: { message: 'Record not found' } }
  persistentDoctorRecords.splice(idx, 1)
  saveToStorage('dummyDoctorRecords', persistentDoctorRecords)
  return { data: null, error: null }
}

// Mental Health Assessments Operations
export const getMentalAssessments = async (patientId?: string, userId?: string) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  let list = persistentMentalAssessments.map(r => ({
    ...r,
    patient: persistentPatientProfiles.find(p => p.id === r.patient_id),
    recorded_by_user: persistentUsers.find(u => u.id === r.recorded_by)
  }))
  if (patientId) list = list.filter(r => r.patient_id === patientId)
  if (userId) list = list.filter(r => r.recorded_by === userId)
  return { data: list.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()), error: null }
}

export const createMentalAssessment = async (rec: Omit<DummyMentalAssessment, 'id' | 'created_at'>) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const row: DummyMentalAssessment = { ...rec, id: generateId(), created_at: getCurrentTimestamp() }
  persistentMentalAssessments.push(row)
  saveToStorage('dummyMentalAssessments', persistentMentalAssessments)
  return { data: row, error: null }
}

// Medications
export const getMedications = async (patientId?: string) => {
  await new Promise(r => setTimeout(r, 100))
  let meds = [...persistentMedications]
  if (patientId) meds = meds.filter(m => m.patient_id === patientId)
  return { data: meds, error: null }
}

export const createMedication = async (m: Omit<DummyMedication, 'id' | 'created_at' | 'updated_at'>) => {
  await new Promise(r => setTimeout(r, 100))
  const rec: DummyMedication = { ...m, id: generateId(), created_at: getCurrentTimestamp(), updated_at: getCurrentTimestamp() }
  persistentMedications.push(rec)
  saveToStorage('dummyMedications', persistentMedications)
  return { data: rec, error: null }
}

export const updateMedication = async (id: string, updates: Partial<DummyMedication>) => {
  await new Promise(r => setTimeout(r, 100))
  const idx = persistentMedications.findIndex(x => x.id === id)
  if (idx === -1) return { data: null, error: { message: 'Medication not found' } }
  persistentMedications[idx] = { ...persistentMedications[idx], ...updates, updated_at: getCurrentTimestamp() }
  saveToStorage('dummyMedications', persistentMedications)
  return { data: persistentMedications[idx], error: null }
}

export const deleteMedication = async (id: string) => {
  await new Promise(r => setTimeout(r, 100))
  const idx = persistentMedications.findIndex(x => x.id === id)
  if (idx !== -1) {
    persistentMedications.splice(idx, 1)
    saveToStorage('dummyMedications', persistentMedications)
  }
  return { data: null, error: null }
}

export const logMedicationIntake = async (medicationId: string, patientId: string, scheduledAt: string) => {
  await new Promise(r => setTimeout(r, 100))
  const exist = persistentMedicationIntakes.find(x => x.medication_id === medicationId && x.scheduled_at === scheduledAt)
  if (exist) {
    exist.status = 'taken'
    exist.taken_at = getCurrentTimestamp()
  } else {
    persistentMedicationIntakes.push({ id: generateId(), medication_id: medicationId, patient_id: patientId, scheduled_at: scheduledAt, taken_at: getCurrentTimestamp(), status: 'taken' })
  }
  saveToStorage('dummyMedicationIntakes', persistentMedicationIntakes)
  return { data: true, error: null }
}

const hhmmToDateToday = (hhmm: string) => {
  const [h, m] = (hhmm || '00:00').split(':').map(n=>parseInt(n,10)||0)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export const getDueMedicationRemindersForUser = async (userId: string) => {
  await new Promise(r => setTimeout(r, 50))
  const patient = persistentPatientProfiles.find(p => p.user_id === userId)
  if (!patient) return { data: [], error: null }
  const today = new Date()
  const ymd = today.toISOString().slice(0,10)
  const meds = persistentMedications.filter(m => m.patient_id === patient.id && m.reminders_enabled !== false)
    .filter(m => (!m.start_date || m.start_date <= ymd) && (!m.end_date || m.end_date >= ymd))
  const due: Array<{ medication: DummyMedication; scheduledAt: string }> = []
  const windowMin = 5
  for (const m of meds) {
    for (const t of (m.times || [])) {
      const dt = hhmmToDateToday(t)
      const diffMin = Math.abs((today.getTime() - dt.getTime()) / 60000)
      if (diffMin <= windowMin) {
        const scheduledAt = new Date(dt.getTime()).toISOString()
        const taken = persistentMedicationIntakes.find(x => x.medication_id === m.id && x.scheduled_at === scheduledAt && x.status === 'taken')
        if (!taken) due.push({ medication: m, scheduledAt })
      }
    }
  }
  return { data: due, error: null }
}

// Medication Requests
export const getMedicationRequests = async (patientId?: string) => {
  await new Promise(r => setTimeout(r, 120))
  let list = (persistentMedicationRequests || []).map(r => ({
    ...r,
    patient: (persistentPatientProfiles || []).find(p => p.id === r.patient_id)
  }))
  if (patientId) list = list.filter(r => r.patient_id === patientId)
  return { data: list.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), error: null }
}

export const createMedicationRequest = async (payload: Omit<DummyMedicationRequest, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: DummyMedicationRequest['status'] }) => {
  await new Promise(r => setTimeout(r, 120))
  const rec: DummyMedicationRequest = { ...payload, status: payload.status || 'pending', id: generateId(), created_at: getCurrentTimestamp(), updated_at: getCurrentTimestamp() }
  persistentMedicationRequests.push(rec)
  saveToStorage('dummyMedicationRequests', persistentMedicationRequests)
  return { data: rec, error: null }
}

export const updateMedicationRequest = async (id: string, updates: Partial<DummyMedicationRequest>) => {
  await new Promise(r => setTimeout(r, 120))
  const idx = persistentMedicationRequests.findIndex(x => x.id === id)
  if (idx === -1) return { data: null, error: { message: 'Request not found' } }
  persistentMedicationRequests[idx] = { ...persistentMedicationRequests[idx], ...updates, updated_at: getCurrentTimestamp() }
  saveToStorage('dummyMedicationRequests', persistentMedicationRequests)
  return { data: persistentMedicationRequests[idx], error: null }
}
