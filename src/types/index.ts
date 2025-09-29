export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'patient' | 'volunteer';
  created_at: string;
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
  
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
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
  report?: string; // optional completion note/result
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_to_user?: User;
  assigned_by_user?: User;
  patient?: PatientProfile;
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
  
  created_at: string;
  updated_at: string;
  patient?: PatientProfile;
  recorded_by_user?: User;
}
