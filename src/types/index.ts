export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'patient' | 'volunteer';
  created_at: string;
  photo_url?: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  // Basic Information
  name: string;
  doe: string; // Date of Entry
  gender: 'male' | 'female' | 'other';
  address: string;
  phone_number?: string;
  caregivers_contact: string;
  assigned_doctor: string;
  last_record_date: string;
  today_date: string;
  assigned_vhv_name: string;
  medical_record_number: string;
  // Geolocation (optional)
  lat?: number;
  lng?: number;
  // Area assignment
  area_id?: string;
  area_name?: string;

  // Medical Information
  patient_categories: {
    critical: boolean;
    elderly: boolean;
    pregnant: boolean;
  };
  // Pregnancy-specific fields for richer visualization
  pregnancy_status?: 'pregnant' | 'postpartum' | 'none';
  due_date?: string; // ISO date if currently pregnant
  delivery_date?: string; // ISO date if postpartum
  personal_health_history: string;
  doctor_diagnosed: string;
  medications_history: string;
  food_allergies: string;
  medication_allergies: string;
  height: string;
  weight: string;
  bmi: string;
  temperature: string;
  pulse: string;
  blood_pressure: string;
  diabetes: string;
  mental_health_status: string;
  other_symptoms: string;
  pregnancy_details: string;
  smoker: boolean;
  doctors_note: string;
  photo_url?: string;

  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
  area?: MapArea;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  image_url?: string;
  image_name?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  recipient?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  assigned_by: string;
  patient_id?: string;
  due_date?: string;
  due_time?: string; // optional HH:MM (24h)
  report?: string; // optional completion note/result
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_to_user?: User;
  assigned_by_user?: User;
  patient?: PatientProfile;
  // Custom form fields for volunteers
  form_fields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
    required?: boolean;
    options?: string[]; // for select, checkbox, radio
  }>;
  form_responses?: Record<string, any>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
}

export interface DailyRecord {
  id: string;
  patient_id: string;
  recorded_by: string;
  record_date: string;
  
  // Vital Signs
  temperature?: string;
  pulse?: string;
  blood_pressure?: string;
  weight?: string;
  blood_sugar?: string;
  oxygen_saturation?: string;
  
  // Symptoms
  pain_level?: number; // 1-10 scale
  fatigue_level?: number; // 1-10 scale
  mood?: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  appetite?: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  sleep_quality?: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  
  // Additional Information
  symptoms_description?: string;
  medications_taken?: string;
  activities?: string;
  notes?: string;
  // Doctor-only notes visible to patient/volunteer
  dr_instructions?: string;
  // Optional custom fields for this record
  custom_fields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
    options?: string[];
    required?: boolean;
  }>;
  custom_values?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  patient?: PatientProfile;
  recorded_by_user?: User;
}

// Doctor-created medical record captured after a clinical visit
export interface DoctorRecord {
  id: string;
  patient_id: string;
  recorded_by: string; // doctor user id
  visit_date: string; // YYYY-MM-DD
  title?: string; // optional visit title
  summary?: string; // brief summary of the visit
  diagnosis?: string;
  prescriptions?: string; // free text summary
  instructions?: string; // advice for patient
  created_at: string;
  updated_at: string;
  patient?: PatientProfile;
  recorded_by_user?: User;
}

export interface MentalAssessment {
  id: string;
  patient_id: string;
  recorded_by: string;
  date: string;
  answers: number[];
  total_score: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  notes?: string;
  created_at: string;
  patient?: PatientProfile;
  recorded_by_user?: User;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage?: string;
  instructions?: string;
  times: string[]; // array of HH:MM (24h)
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  reminders_enabled: boolean;
  assigned_by?: string; // doctor id
  created_at: string;
  updated_at: string;
}

export interface MedicationIntakeLog {
  id: string;
  medication_id: string;
  patient_id: string;
  scheduled_at: string; // ISO timestamp of the scheduled dose
  taken_at?: string;    // ISO timestamp when patient marked taken
  status: 'due' | 'taken' | 'skipped' | 'overdue';
}

export interface MedicationRequest {
  id: string;
  patient_id: string;
  requested_by: string; // user id (patient or caregiver)
  title?: string;
  medication?: string; // requested medication name
  dosage?: string;
  quantity?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'declined' | 'fulfilled';
  resolved_by?: string; // doctor id
  doctor_notes?: string;
  created_at: string;
  updated_at: string;
  patient?: PatientProfile;
}

export interface VolunteerProfile {
  id: string;
  user_id: string;
  volunteer_code: string; // e.g., VHV-000123
  name: string;
  email: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  dob?: string; // YYYY-MM-DD
  photo_url?: string; // data URL or external link
  area_id?: string;
  area_name?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  area?: MapArea;
}

export interface MapArea {
  id: string;
  name: string;
  color: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}
