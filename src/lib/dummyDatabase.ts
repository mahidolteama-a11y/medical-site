import { 
  dummyPatientProfiles, 
  dummyMessages, 
  dummyUsers,
  dummyTasks,
  dummyAnnouncements,
  dummyDailyRecords,
  DummyPatientProfile, 
  DummyMessage, 
  DummyUser,
  DummyTask,
  DummyAnnouncement,
  DummyDailyRecord,
  // locations
  dummyLocations,
  DummyLocation,
  generateId,
  getCurrentTimestamp 
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
let persistentLocations = loadFromStorage('dummyLocations', [...dummyLocations]);
let persistentVolunteers: VolunteerProfile[] = loadFromStorage('dummyVolunteers', []);

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
        return {
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

// Update user profile (e.g., name, photo)
export const updateUserById = async (id: string, updates: Partial<DummyUser>) => {
  await new Promise(resolve => setTimeout(resolve, 150));
  const idx = persistentUsers.findIndex(u => u.id === id)
  if (idx === -1) return { data: null, error: { message: 'User not found' } }
  persistentUsers[idx] = { ...persistentUsers[idx], ...updates }
  saveToStorage('dummyUsers', persistentUsers)
  return { data: persistentUsers[idx], error: null }
}

// Locations Operations
export const getLocations = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { data: persistentLocations as DummyLocation[], error: null };
};

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
