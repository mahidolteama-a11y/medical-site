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
  
  const newProfile: DummyPatientProfile = {
    ...profileData,
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
