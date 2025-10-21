import { dummyUsers, DummyUser, generateId, getCurrentTimestamp } from '../data/dummyData';
import { isValidUUID } from './sessionValidator';

// Simulate local storage for session management
const SESSION_KEY = 'medical_portal_session';
const USERS_KEY = 'dummyUsers';

// Helper function to save users to localStorage
const saveUsersToStorage = (users: DummyUser[]) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
};

// Helper function to load users from localStorage
const loadUsersFromStorage = (): DummyUser[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [...dummyUsers];
  } catch (error) {
    console.error('Error loading users from localStorage:', error);
    return [...dummyUsers];
  }
};

// Initialize persistent users
let persistentUsers = loadUsersFromStorage();

// Ensure reads reflect latest localStorage
const refreshUsers = () => {
  persistentUsers = loadUsersFromStorage();
};

export interface AuthSession {
  user: DummyUser;
  token: string;
  expires_at: string;
}

export const signUp = async (email: string, password: string, fullName: string, role: string) => {
  // Check if user already exists
  const existingUser = persistentUsers.find(user => user.email === email);
  if (existingUser) {
    return { 
      data: null, 
      error: { message: 'User already exists with this email' } 
    };
  }

  // Create new user
  const newUser: DummyUser = {
    id: generateId(),
    email,
    password,
    full_name: fullName,
    role: role as 'doctor' | 'patient' | 'volunteer',
    created_at: getCurrentTimestamp()
  };

  // Add to persistent users array and save to localStorage
  persistentUsers.push(newUser);
  saveUsersToStorage(persistentUsers);

  // Create session
  const session: AuthSession = {
    user: newUser,
    token: generateId(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  // Save session to localStorage
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { 
    data: { user: newUser, session }, 
    error: null 
  };
};

export const signIn = async (email: string, password: string) => {
  refreshUsers();
  // Find user
  const user = persistentUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return { 
      data: null, 
      error: { message: 'Invalid email or password' } 
    };
  }

  // Create session
  const session: AuthSession = {
    user,
    token: generateId(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  // Save session to localStorage
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { 
    data: { user, session }, 
    error: null 
  };
};

export const signOut = async () => {
  localStorage.removeItem(SESSION_KEY);
  return { error: null };
};

export const getCurrentSession = (): AuthSession | null => {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  try {
    const session: AuthSession = JSON.parse(sessionData);

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Validate user ID is a proper UUID
    if (!isValidUUID(session.user.id)) {
      console.warn('Invalid user ID format detected. Clearing session. Please log in again.');
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const getUserById = (id: string): DummyUser | undefined => {
  refreshUsers();
  return persistentUsers.find(user => user.id === id);
};

export const setUserPassword = async (userId: string, password: string) => {
  const idx = persistentUsers.findIndex(u => u.id === userId);
  if (idx === -1) return { error: { message: 'User not found' } };
  persistentUsers[idx].password = password || '';
  try {
    localStorage.setItem('dummyUsers', JSON.stringify(persistentUsers));
  } catch {}
  return { error: null };
};

export const setUserEmail = async (userId: string, email: string) => {
  refreshUsers();
  const idx = persistentUsers.findIndex(u => u.id === userId);
  if (idx === -1) return { error: { message: 'User not found' } };
  // Prevent duplicate emails
  const exists = persistentUsers.find((u, i) => i !== idx && u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { error: { message: 'Email already in use' } };
  persistentUsers[idx].email = email;
  try {
    localStorage.setItem('dummyUsers', JSON.stringify(persistentUsers));
  } catch {}
  return { error: null };
};
