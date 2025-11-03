import { MapArea } from '../types';

export interface DummyUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'doctor' | 'patient' | 'volunteer';
  created_at: string;
  photo_url?: string;
  // Optional extra attributes stored on user records
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  // For doctors we generate a code for sign-in similar to volunteers
  doctor_code?: string; // e.g., DR-000123
}

export interface DummyPatientProfile {
  id: string;
  user_id: string;
  // Basic Information
  name: string;
  doe: string;
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
  due_date?: string;
  delivery_date?: string;
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
}

export interface DummyMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  image_url?: string;
  image_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface DummyTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  assigned_by: string;
  patient_id?: string;
  due_date?: string;
  report?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Custom form data for volunteers
  form_fields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'radio';
    required?: boolean;
    options?: string[];
  }>;
  form_responses?: Record<string, any>;
}

export interface DummyAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DummyDailyRecord {
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
  pain_level?: number;
  fatigue_level?: number;
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
}

export interface DummyDoctorRecord {
  id: string;
  patient_id: string;
  recorded_by: string; // doctor id
  visit_date: string; // YYYY-MM-DD
  title?: string;
  summary?: string;
  diagnosis?: string;
  prescriptions?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface DummyMentalAssessment {
  id: string;
  patient_id: string;
  recorded_by: string;
  date: string;
  answers: number[];
  total_score: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
  notes?: string;
  created_at: string;
}

export const dummyMentalAssessments: DummyMentalAssessment[] = []

export interface DummyMedication {
  id: string;
  patient_id: string;
  name: string;
  dosage?: string;
  instructions?: string;
  times: string[]; // HH:MM 24h
  start_date?: string;
  end_date?: string;
  reminders_enabled: boolean;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DummyMedicationIntake {
  id: string;
  medication_id: string;
  patient_id: string;
  scheduled_at: string;
  taken_at?: string;
  status: 'due' | 'taken' | 'skipped' | 'overdue';
}

export const dummyMedications: DummyMedication[] = []
export const dummyMedicationIntakes: DummyMedicationIntake[] = []

export const dummyDoctorRecords: DummyDoctorRecord[] = []

export interface DummyMedicationRequest {
  id: string;
  patient_id: string;
  requested_by: string;
  title?: string;
  medication?: string;
  dosage?: string;
  quantity?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'declined' | 'fulfilled';
  resolved_by?: string;
  doctor_notes?: string;
  created_at: string;
  updated_at: string;
}

export const dummyMedicationRequests: DummyMedicationRequest[] = []

// Helper for dynamic 'today' date (YYYY-MM-DD)
const TODAY = new Date().toISOString().slice(0, 10);
const datePlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Hoisted helpers (used by seeded data below)
export function generateId() {
  return crypto.randomUUID();
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Dummy Users
export const dummyUsers: DummyUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'dr.smith@hospital.com',
    password: 'password321',
    full_name: 'Dr. Sarah Smith',
    role: 'doctor',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'john.doe@email.com',
    password: 'password321',
    full_name: 'John Doe',
    role: 'patient',
    created_at: '2024-01-16T09:30:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'volunteer@hospital.com',
    password: 'password321',
    full_name: 'Maria Garcia',
    role: 'volunteer',
    created_at: '2024-01-17T10:15:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'jane.wilson@email.com',
    password: 'password321',
    full_name: 'Jane Wilson',
    role: 'patient',
    created_at: '2024-01-18T11:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'dr.johnson@hospital.com',
    password: 'password321',
    full_name: 'Dr. Michael Johnson',
    role: 'doctor',
    created_at: '2024-01-19T07:45:00Z'
  }
];

// Default map areas (seeded into localStorage on first run)
// An area polygon roughly around Mahidol University, Salaya
export const dummyMapAreas: MapArea[] = [
  {
    id: 'area-default-salaya',
    name: 'Mahidol University Salaya',
    color: '#F97316',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        // Rough bounding polygon around MU Salaya campus
        [13.8070, 100.3198],
        [13.8068, 100.3278],
        [13.8002, 100.3318],
        [13.7915, 100.3306],
        [13.7870, 100.3230],
        [13.7900, 100.3160],
        [13.7970, 100.3135],
      ]]
    },
    created_by: '550e8400-e29b-41d4-a716-446655440001', // Dr. Sarah Smith
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z'
  }
];

// Additional Patient Profiles for better visualization
export const additionalPatientProfiles: DummyPatientProfile[] = [
  {
    id: 'patient-3',
    user_id: 'user-6',
    name: 'Robert Chen',
    doe: '2024-01-10',
    gender: 'male',
    address: '789 Pine Street, Springfield, IL 62703',
    caregivers_contact: 'Linda Chen - (555) 456-7890',
    assigned_doctor: 'Dr. Sarah Smith',
    last_record_date: '2024-01-24',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-009876',
    lat: 13.804,
    lng: 100.326,
    phone_number: '+66 80 777 8899',
    patient_categories: {
      critical: true,
      elderly: true,
      pregnant: false
    },
    personal_health_history: 'History of heart disease, stroke in 2019, diabetes since 2015',
    doctor_diagnosed: 'Congestive Heart Failure, Type 2 Diabetes, Hypertension',
    medications_history: 'Metoprolol 50mg daily, Lisinopril 20mg daily, Insulin glargine',
    food_allergies: 'Dairy products',
    medication_allergies: 'Sulfa drugs',
    height: '168 cm',
    weight: '85 kg',
    bmi: '30.1',
    temperature: '99.2°F',
    pulse: '88 bpm',
    blood_pressure: '145/92 mmHg',
    diabetes: 'Type 2 - HbA1c: 8.1%',
    mental_health_status: 'Mild depression, receiving counseling',
    other_symptoms: 'Shortness of breath, swelling in legs',
    pregnancy_details: 'N/A',
    smoker: true,
    doctors_note: 'Critical patient requiring close monitoring. Heart failure symptoms worsening.',
    created_by: 'user-1',
    created_at: '2024-01-15T11:20:00Z',
    updated_at: '2024-01-26T14:30:00Z'
  },
  {
    id: 'patient-11',
    user_id: 'user-14',
    name: 'Olivia Brown',
    doe: '2025-08-15',
    gender: 'female',
    address: '22 Meadow Ln, Springfield, IL 62701',
    caregivers_contact: 'Mark Brown - (555) 777-8899',
    assigned_doctor: 'Dr. Sarah Smith',
    last_record_date: '2025-09-25',
    today_date: '2025-09-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-202509-01',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    pregnancy_status: 'postpartum',
    delivery_date: '2025-09-20',
    personal_health_history: 'Uncomplicated pregnancy and delivery',
    doctor_diagnosed: 'Postpartum recovery',
    medications_history: 'Prenatal vitamins',
    food_allergies: 'None known',
    medication_allergies: 'None known',
    height: '165 cm',
    weight: '68 kg',
    bmi: '25.0',
    temperature: '98.6°F',
    pulse: '76 bpm',
    blood_pressure: '118/76 mmHg',
    diabetes: 'None',
    mental_health_status: 'Good',
    other_symptoms: 'Mild fatigue',
    pregnancy_details: 'Delivered a healthy baby',
    smoker: false,
    doctors_note: 'Routine postpartum follow-up in 6 weeks',
    created_by: 'user-5',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-26T09:00:00Z'
  },
  {
    id: 'patient-12',
    user_id: 'user-15',
    name: 'Ava Nguyen',
    doe: '2025-08-28',
    gender: 'female',
    address: '90 Hillcrest Rd, Springfield, IL 62702',
    caregivers_contact: 'Tom Nguyen - (555) 222-3344',
    assigned_doctor: 'Dr. Michael Johnson',
    last_record_date: '2025-09-24',
    today_date: '2025-09-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-202509-02',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    pregnancy_status: 'postpartum',
    delivery_date: '2025-08-30',
    personal_health_history: 'Gestational diabetes, controlled',
    doctor_diagnosed: 'Postpartum monitoring',
    medications_history: 'Insulin during pregnancy',
    food_allergies: 'None',
    medication_allergies: 'None',
    height: '162 cm',
    weight: '67 kg',
    bmi: '25.5',
    temperature: '98.4°F',
    pulse: '74 bpm',
    blood_pressure: '120/78 mmHg',
    diabetes: 'None',
    mental_health_status: 'Good',
    other_symptoms: 'None',
    pregnancy_details: 'Delivered a healthy baby',
    smoker: false,
    doctors_note: 'Blood sugar normalized postpartum',
    created_by: 'user-5',
    created_at: '2025-09-01T11:00:00Z',
    updated_at: '2025-09-26T08:30:00Z'
  },
  {
    id: 'patient-9',
    user_id: 'user-12',
    name: 'Sofia Martinez',
    doe: '2024-01-18',
    gender: 'female',
    address: '12 River Park, Springfield, IL 62701',
    caregivers_contact: 'Daniel Martinez - (555) 111-2233',
    assigned_doctor: 'Dr. Sarah Smith',
    last_record_date: '2024-01-26',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-889900',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    pregnancy_status: 'postpartum',
    delivery_date: '2024-01-20',
    personal_health_history: 'Healthy pregnancy, normal delivery',
    doctor_diagnosed: 'Postpartum recovery',
    medications_history: 'Prenatal vitamins, iron supplements',
    food_allergies: 'None known',
    medication_allergies: 'None known',
    height: '164 cm',
    weight: '66 kg',
    bmi: '24.5',
    temperature: '98.6°F',
    pulse: '76 bpm',
    blood_pressure: '120/78 mmHg',
    diabetes: 'None',
    mental_health_status: 'Good',
    other_symptoms: 'Mild fatigue',
    pregnancy_details: 'Delivered a healthy baby boy',
    smoker: false,
    doctors_note: 'Recovering well postpartum. Routine follow-up in 6 weeks.',
    created_by: 'user-5',
    created_at: '2024-01-20T12:30:00Z',
    updated_at: '2024-01-26T09:30:00Z'
  },
  {
    id: 'patient-10',
    user_id: 'user-13',
    name: 'Hannah Lee',
    doe: '2023-12-28',
    gender: 'female',
    address: '98 Lake View, Springfield, IL 62702',
    caregivers_contact: 'Eric Lee - (555) 333-4455',
    assigned_doctor: 'Dr. Michael Johnson',
    last_record_date: '2024-01-25',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-991122',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    pregnancy_status: 'postpartum',
    delivery_date: '2023-12-30',
    personal_health_history: 'Gestational hypertension in late pregnancy',
    doctor_diagnosed: 'Postpartum monitoring',
    medications_history: 'Labetalol during pregnancy',
    food_allergies: 'None known',
    medication_allergies: 'None known',
    height: '168 cm',
    weight: '70 kg',
    bmi: '24.8',
    temperature: '98.4°F',
    pulse: '74 bpm',
    blood_pressure: '124/80 mmHg',
    diabetes: 'None',
    mental_health_status: 'Some anxiety, improving',
    other_symptoms: 'Occasional headaches',
    pregnancy_details: 'Delivered a healthy baby girl',
    smoker: false,
    doctors_note: 'BP stable postpartum. Continue monitoring.',
    created_by: 'user-5',
    created_at: '2024-01-01T11:20:00Z',
    updated_at: '2024-01-26T10:10:00Z'
  },
  {
    id: 'patient-4',
    user_id: 'user-7',
    name: 'Emily Rodriguez',
    doe: '2024-01-12',
    gender: 'female',
    address: '321 Oak Drive, Springfield, IL 62704',
    caregivers_contact: 'Carlos Rodriguez - (555) 234-5678',
    assigned_doctor: 'Dr. Michael Johnson',
    last_record_date: '2024-01-25',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-112233',
    lat: 13.786,
    lng: 100.317,
    phone_number: '+66 80 222 3344',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: true
    },
    pregnancy_status: 'pregnant',
    due_date: '2024-04-02',
    personal_health_history: 'Second pregnancy, first child born healthy in 2020',
    doctor_diagnosed: 'Pregnancy - 32 weeks, Mild Anemia',
    medications_history: 'Prenatal vitamins, Iron supplements',
    food_allergies: 'None known',
    medication_allergies: 'None known',
    height: '162 cm',
    weight: '72 kg',
    bmi: '27.4',
    temperature: '98.2°F',
    pulse: '82 bpm',
    blood_pressure: '125/78 mmHg',
    diabetes: 'None',
    mental_health_status: 'Good, excited about pregnancy',
    other_symptoms: 'Mild fatigue, occasional heartburn',
    pregnancy_details: '32 weeks gestation, estimated due date: April 2, 2024. Baby developing normally, mild anemia being treated.',
    smoker: false,
    doctors_note: 'Pregnancy progressing well. Monitor iron levels and continue supplements.',
    created_by: 'user-5',
    created_at: '2024-01-16T09:45:00Z',
    updated_at: '2024-01-26T10:15:00Z'
  },
  {
    id: 'patient-5',
    user_id: 'user-8',
    name: 'Michael Thompson',
    doe: '2024-01-08',
    gender: 'male',
    address: '654 Maple Avenue, Springfield, IL 62705',
    caregivers_contact: 'Sarah Thompson - (555) 345-6789',
    assigned_doctor: 'Dr. Sarah Smith',
    last_record_date: '2024-01-26',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-445566',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    personal_health_history: 'Generally healthy, occasional sports injuries',
    doctor_diagnosed: 'Acute Bronchitis, Seasonal Allergies',
    medications_history: 'Albuterol inhaler as needed, Claritin during allergy season',
    food_allergies: 'None known',
    medication_allergies: 'None known',
    height: '180 cm',
    weight: '75 kg',
    bmi: '23.1',
    temperature: '98.8°F',
    pulse: '68 bpm',
    blood_pressure: '118/72 mmHg',
    diabetes: 'None',
    mental_health_status: 'Good',
    other_symptoms: 'Persistent cough, mild congestion',
    pregnancy_details: 'N/A',
    smoker: false,
    doctors_note: 'Recovering from bronchitis. Should improve with current treatment.',
    created_by: 'user-1',
    created_at: '2024-01-12T13:30:00Z',
    updated_at: '2024-01-26T16:20:00Z'
  },
  {
    id: 'patient-6',
    user_id: 'user-9',
    name: 'Margaret Foster',
    doe: '2024-01-05',
    gender: 'female',
    address: '987 Cedar Lane, Springfield, IL 62706',
    caregivers_contact: 'David Foster - (555) 567-8901',
    assigned_doctor: 'Dr. Michael Johnson',
    last_record_date: '2024-01-25',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-778899',
    patient_categories: {
      critical: false,
      elderly: true,
      pregnant: false
    },
    personal_health_history: 'Osteoporosis, mild cognitive decline, history of falls',
    doctor_diagnosed: 'Osteoporosis, Mild Dementia, Hypertension',
    medications_history: 'Alendronate weekly, Amlodipine 5mg daily, Donepezil 10mg daily',
    food_allergies: 'None known',
    medication_allergies: 'Aspirin',
    height: '155 cm',
    weight: '58 kg',
    bmi: '24.1',
    temperature: '98.4°F',
    pulse: '76 bpm',
    blood_pressure: '138/82 mmHg',
    diabetes: 'None',
    mental_health_status: 'Mild anxiety, some confusion',
    other_symptoms: 'Occasional dizziness, memory issues',
    pregnancy_details: 'N/A',
    smoker: false,
    doctors_note: 'Stable condition. Family support is excellent. Continue current medications.',
    created_by: 'user-5',
    created_at: '2024-01-10T08:15:00Z',
    updated_at: '2024-01-26T11:45:00Z'
  },
  {
    id: 'patient-7',
    user_id: 'user-10',
    name: 'James Patterson',
    doe: '2024-01-14',
    gender: 'male',
    address: '147 Birch Street, Springfield, IL 62707',
    caregivers_contact: 'Helen Patterson - (555) 678-9012',
    assigned_doctor: 'Dr. Sarah Smith',
    last_record_date: '2024-01-26',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-334455',
    patient_categories: {
      critical: true,
      elderly: true,
      pregnant: false
    },
    personal_health_history: 'COPD, former heavy smoker, multiple hospitalizations',
    doctor_diagnosed: 'Chronic Obstructive Pulmonary Disease (COPD), Chronic Kidney Disease',
    medications_history: 'Tiotropium inhaler daily, Prednisone 10mg daily, Furosemide 40mg daily',
    food_allergies: 'None known',
    medication_allergies: 'Penicillin, Codeine',
    height: '175 cm',
    weight: '62 kg',
    bmi: '20.2',
    temperature: '99.4°F',
    pulse: '92 bpm',
    blood_pressure: '152/88 mmHg',
    diabetes: 'None',
    mental_health_status: 'Moderate depression due to chronic illness',
    other_symptoms: 'Severe shortness of breath, chronic fatigue, frequent coughing',
    pregnancy_details: 'N/A',
    smoker: false,
    doctors_note: 'Critical patient with advanced COPD. Requires frequent monitoring and possible hospitalization.',
    created_by: 'user-1',
    created_at: '2024-01-18T15:20:00Z',
    updated_at: '2024-01-26T17:10:00Z'
  },
  {
    id: 'patient-8',
    user_id: 'user-11',
    name: 'Lisa Wang',
    doe: '2024-01-20',
    gender: 'female',
    address: '258 Elm Court, Springfield, IL 62708',
    caregivers_contact: 'Kevin Wang - (555) 789-0123',
    assigned_doctor: 'Dr. Michael Johnson',
    last_record_date: '2024-01-26',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-556677',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: true
    },
    pregnancy_status: 'pregnant',
    due_date: '2024-05-20',
    personal_health_history: 'First pregnancy, generally healthy',
    doctor_diagnosed: 'Pregnancy - 24 weeks, Gestational Hypertension',
    medications_history: 'Prenatal vitamins, Labetalol 200mg twice daily',
    food_allergies: 'Shellfish',
    medication_allergies: 'None known',
    height: '158 cm',
    weight: '65 kg',
    bmi: '26.0',
    temperature: '98.6°F',
    pulse: '85 bpm',
    blood_pressure: '142/85 mmHg',
    diabetes: 'None',
    mental_health_status: 'Some anxiety about pregnancy complications',
    other_symptoms: 'Mild headaches, swelling in hands and feet',
    pregnancy_details: '24 weeks gestation, estimated due date: May 20, 2024. Developing gestational hypertension, requires close monitoring.',
    smoker: false,
    doctors_note: 'Monitor blood pressure closely. May need to consider early delivery if hypertension worsens.',
    created_by: 'user-5',
    created_at: '2024-01-22T12:30:00Z',
    updated_at: '2024-01-26T13:45:00Z'
  }
];

// Dummy Patient Profiles
export const dummyPatientProfiles: DummyPatientProfile[] = [
  {
    id: 'patient-1',
    user_id: 'user-2',
    name: 'John Doe',
    doe: '2024-01-15',
    gender: 'male',
    address: '123 Main Street, Springfield, IL 62701',
    caregivers_contact: 'Mary Doe - (555) 123-4567',
    assigned_doctor: 'Dr. Sarah Smith - (111) 123-4567',
    last_record_date: '2024-01-20',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia - (111) 123-4567',
    medical_record_number: 'MRN-001234',
    lat: 13.7992,
    lng: 100.3195,
    phone_number: '+66 80 111 2233',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: false
    },
    personal_health_history: 'Family history of cardiovascular disease. Previous surgery for appendectomy in 2010.',
    doctor_diagnosed: 'Hypertension, Type 2 Diabetes Mellitus',
    medications_history: 'Lisinopril 10mg daily since 2020, Metformin 500mg twice daily since 2021',
    food_allergies: 'Shellfish, Nuts',
    medication_allergies: 'Penicillin',
    height: '175 cm',
    weight: '80 kg',
    bmi: '26.1',
    temperature: '98.6°F',
    pulse: '72 bpm',
    blood_pressure: '130/85 mmHg',
    diabetes: 'Type 2 - HbA1c: 7.2%',
    mental_health_status: 'Stable, no current concerns',
    other_symptoms: 'Occasional headaches, mild fatigue',
    pregnancy_details: 'N/A',
    smoker: false,
    doctors_note: 'Patient shows good compliance with medication. Blood pressure slightly elevated, recommend lifestyle modifications and regular monitoring.',
    created_by: 'user-1',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-25T16:45:00Z'
  },
  {
    id: 'patient-2',
    user_id: 'user-4',
    name: 'Jane Wilson',
    doe: '2024-01-18',
    gender: 'female',
    address: '456 Oak Avenue, Springfield, IL 62702',
    caregivers_contact: 'Robert Wilson - (555) 987-6543',
    assigned_doctor: 'Dr. Michael Johnson',
    last_record_date: '2024-01-25',
    today_date: '2024-01-26',
    assigned_vhv_name: 'Maria Garcia',
    medical_record_number: 'MRN-005678',
    lat: 13.7901,
    lng: 100.3282,
    phone_number: '+66 80 444 5566',
    patient_categories: {
      critical: false,
      elderly: false,
      pregnant: true
    },
    pregnancy_status: 'pregnant',
    due_date: '2024-03-15',
    personal_health_history: 'No significant past medical history. First pregnancy.',
    doctor_diagnosed: 'Gestational Diabetes, Pregnancy - 28 weeks',
    medications_history: 'Prenatal vitamins, Insulin as needed for glucose control',
    food_allergies: 'None known',
    medication_allergies: 'None known',
    height: '165 cm',
    weight: '68 kg',
    bmi: '25.0',
    temperature: '98.4°F',
    pulse: '78 bpm',
    blood_pressure: '118/75 mmHg',
    diabetes: 'Gestational - Fasting glucose: 95 mg/dL',
    mental_health_status: 'Mild anxiety related to pregnancy, receiving counseling',
    other_symptoms: 'Morning sickness (resolved), mild back pain',
    pregnancy_details: '28 weeks gestation, estimated due date: March 15, 2024. Regular prenatal checkups, baby developing normally.',
    smoker: false,
    doctors_note: 'Pregnancy progressing well. Gestational diabetes well controlled with diet and occasional insulin. Continue regular monitoring.',
    created_by: 'user-3',
    created_at: '2024-01-21T10:15:00Z',
    updated_at: '2024-01-26T09:20:00Z'
  },
  {
    "name": "Zach",
    "doe": "2025-09-25",
    "gender": "male",
    "address": "Bangkok",
    "caregivers_contact": "111",
    "assigned_doctor": "Strange",
    "last_record_date": "2025-09-25",
    "today_date": "2025-09-25",
    "assigned_vhv_name": "Ironman",
    "medical_record_number": "12345",
    "patient_categories": {
      "critical": false,
      "elderly": true,
      "pregnant": false
    },
    "personal_health_history": "Good Healthy",
    "doctor_diagnosed": "Lack of sleep",
    "medications_history": "Sleeping pills",
    "food_allergies": "prawns",
    "medication_allergies": "none",
    "height": "170cm",
    "weight": "70kg",
    "bmi": "22.9",
    "temperature": "98.6",
    "pulse": "72",
    "blood_pressure": "120/80",
    "diabetes": "Type2",
    "mental_health_status": "Sound Mind",
    "other_symptoms": "Dream walking",
    "pregnancy_details": "",
    "smoker": false,
    "doctors_note": "Good To Go",
    "created_by": "user-1",
    "user_id": "user-1",
    "id": "id-uqy6ynvpa",
    "created_at": "2025-09-24T18:14:30.861Z",
    "updated_at": "2025-09-24T18:16:35.460Z"
  },
  ...additionalPatientProfiles
];

// Dummy Tasks
export const dummyTasks: DummyTask[] = [
  {
    id: 'task-1',
    title: 'Follow-up Blood Pressure Check',
    description: 'Schedule and conduct follow-up blood pressure monitoring for patient John Doe. Check medication compliance and adjust dosage if necessary.',
    priority: 'high',
    status: 'pending',
    assigned_to: 'user-3',
    assigned_by: 'user-1',
    patient_id: 'patient-1',
    due_date: '2024-01-28',
    created_at: '2024-01-25T10:30:00Z',
    updated_at: '2024-01-25T10:30:00Z'
  },
  // === Volunteer Maria Garcia (user-3) — Today's appointments and todos ===
  {
    id: 'task-v1',
    title: 'Home Visit - John Doe',
    description: 'Check blood pressure, confirm medications, record vitals.',
    priority: 'high',
    status: 'pending',
    assigned_to: 'user-3', // Maria Garcia (volunteer)
    assigned_by: 'user-1', // Dr. Sarah Smith
    patient_id: 'patient-1',
    due_date: TODAY,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  },
  {
    id: 'task-v2',
    title: 'Follow-up Call - Jane Wilson',
    description: 'Call to review glucose logs and confirm prenatal visit.',
    priority: 'medium',
    status: 'pending',
    assigned_to: 'user-3',
    assigned_by: 'user-5', // Dr. Michael Johnson
    patient_id: 'patient-2',
    due_date: TODAY,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  },
  {
    id: 'task-v3',
    title: 'Supply Check - Outreach Kits',
    description: 'Verify stock of glucose strips and BP cuffs for field work.',
    priority: 'low',
    status: 'pending',
    assigned_to: 'user-3',
    assigned_by: 'user-1',
    // No patient_id => shows under Today’s To‑Do
    due_date: TODAY,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  },
  {
    id: 'task-2',
    title: 'Prenatal Care Coordination',
    description: 'Coordinate prenatal care appointments and ensure all necessary tests are scheduled for Jane Wilson. Monitor gestational diabetes management.',
    priority: 'urgent',
    status: 'in_progress',
    assigned_to: 'user-3',
    assigned_by: 'user-5',
    patient_id: 'patient-2',
    due_date: '2024-01-27',
    created_at: '2024-01-24T14:15:00Z',
    updated_at: '2024-01-26T09:45:00Z'
  },
  {
    id: 'task-3',
    title: 'Medication Inventory Check',
    description: 'Review and update medication inventory. Ensure adequate stock of diabetes medications and blood pressure medications.',
    priority: 'medium',
    status: 'completed',
    assigned_to: 'user-3',
    assigned_by: 'user-1',
    due_date: '2024-01-26',
    created_at: '2024-01-23T08:00:00Z',
    updated_at: '2024-01-26T16:30:00Z',
    completed_at: '2024-01-26T16:30:00Z'
  },
  {
    id: 'task-4',
    title: 'Patient Education Session',
    description: 'Conduct diabetes management education session for newly diagnosed patients. Prepare educational materials and schedule group session.',
    priority: 'medium',
    status: 'pending',
    assigned_to: 'user-1',
    assigned_by: 'user-5',
    due_date: '2024-01-30',
    created_at: '2024-01-25T11:00:00Z',
    updated_at: '2024-01-25T11:00:00Z'
  },
  // Upcoming and overdue appointments for John Doe (patient-1)
  {
    id: 'appt-jd-1',
    title: 'Clinic Visit - BP Review',
    description: 'Follow-up on blood pressure and medication adherence.',
    priority: 'medium',
    status: 'pending',
    assigned_to: 'user-1', // Dr. Sarah Smith
    assigned_by: 'user-1',
    patient_id: 'patient-1',
    due_date: datePlus(3), // in 3 days
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  },
  {
    id: 'appt-jd-2',
    title: 'Lab Results Discussion',
    description: 'Discuss recent lab results and adjust care plan as needed.',
    priority: 'low',
    status: 'pending',
    assigned_to: 'user-1',
    assigned_by: 'user-1',
    patient_id: 'patient-1',
    due_date: datePlus(10), // in 10 days
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  },
  {
    id: 'appt-jd-overdue',
    title: 'Missed Appointment - Check-in',
    description: 'Reschedule missed appointment and check symptoms.',
    priority: 'high',
    status: 'pending',
    assigned_to: 'user-1',
    assigned_by: 'user-1',
    patient_id: 'patient-1',
    due_date: datePlus(-2), // 2 days ago -> overdue
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp()
  }
];

// Dummy Messages
export const dummyMessages: DummyMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'user-1',
    recipient_id: 'user-2',
    subject: 'Follow-up Appointment',
    content: 'Hi John, I wanted to follow up on your recent blood pressure readings. Please schedule an appointment for next week.',
    image_url: undefined,
    image_name: undefined,
    is_read: false,
    created_at: '2024-01-25T09:30:00Z'
  },
  {
    id: 'msg-2',
    sender_id: 'user-2',
    recipient_id: 'user-1',
    subject: 'Re: Follow-up Appointment',
    content: 'Thank you Dr. Smith. I will call the office today to schedule the appointment.',
    image_url: undefined,
    image_name: undefined,
    is_read: true,
    created_at: '2024-01-25T14:15:00Z'
  },
  {
    id: 'msg-3',
    sender_id: 'user-3',
    recipient_id: 'user-4',
    subject: 'Medication Reminder',
    content: 'Hi Jane, this is a friendly reminder to take your evening insulin. Let me know if you have any questions!',
    image_url: undefined,
    image_name: undefined,
    is_read: false,
    created_at: '2024-01-26T19:00:00Z'
  },
  {
    id: 'msg-4',
    sender_id: 'user-5',
    recipient_id: 'user-2',
    subject: 'Lab Results Available',
    content: 'Your recent lab results are now available. Overall looking good, but we should discuss a few items at your next visit.',
    image_url: undefined,
    image_name: undefined,
    is_read: false,
    created_at: '2024-01-26T11:30:00Z'
  }
];

// Dummy Announcements
export const dummyAnnouncements: DummyAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'New Health Guidelines',
    content: 'Please note the updated health and safety guidelines for patient care. All staff should review the new protocols for infection control and patient interaction.',
    priority: 'high',
    created_by: 'user-1',
    created_at: '2024-01-25T08:00:00Z',
    updated_at: '2024-01-25T08:00:00Z'
  },
  {
    id: 'ann-2',
    title: 'Medication Inventory Update',
    content: 'The medication inventory has been updated. Please check the new stock levels and report any shortages immediately.',
    priority: 'medium',
    created_by: 'user-5',
    created_at: '2024-01-24T14:30:00Z',
    updated_at: '2024-01-24T14:30:00Z'
  },
  {
    id: 'ann-3',
    title: 'Emergency Contact Information',
    content: 'Updated emergency contact information has been distributed. Please ensure all patients have current emergency contacts on file.',
    priority: 'urgent',
    created_by: 'user-1',
    created_at: '2024-01-26T10:15:00Z',
    updated_at: '2024-01-26T10:15:00Z'
  }
];

// Dummy Daily Records
export const dummyDailyRecords: DummyDailyRecord[] = [
  {
    id: 'record-1',
    patient_id: 'patient-1',
    recorded_by: 'user-2',
    record_date: '2024-01-26',
    temperature: '98.6°F',
    pulse: '75 bpm',
    blood_pressure: '128/82 mmHg',
    weight: '79.5 kg',
    blood_sugar: '110 mg/dL',
    pain_level: 3,
    fatigue_level: 4,
    mood: 'good',
    appetite: 'good',
    sleep_quality: 'fair',
    symptoms_description: 'Mild headache in the morning, feeling better now',
    medications_taken: 'Lisinopril 10mg, Metformin 500mg',
    activities: 'Light walking for 30 minutes',
    notes: 'Feeling overall better than yesterday',
    created_at: '2024-01-26T08:30:00Z',
    updated_at: '2024-01-26T08:30:00Z'
  },
  {
    id: 'record-2',
    patient_id: 'patient-2',
    recorded_by: 'user-4',
    record_date: '2024-01-26',
    temperature: '98.4°F',
    pulse: '80 bpm',
    blood_pressure: '115/70 mmHg',
    weight: '68.2 kg',
    blood_sugar: '92 mg/dL',
    pain_level: 2,
    fatigue_level: 3,
    mood: 'excellent',
    appetite: 'excellent',
    sleep_quality: 'good',
    symptoms_description: 'Baby is very active today, no morning sickness',
    medications_taken: 'Prenatal vitamins',
    activities: 'Prenatal yoga, light housework',
    notes: 'Feeling great, baby movements are strong',
    created_at: '2024-01-26T09:15:00Z',
    updated_at: '2024-01-26T09:15:00Z'
  },
  {
    id: 'record-3',
    patient_id: 'patient-1',
    recorded_by: 'user-2',
    record_date: '2024-01-25',
    temperature: '99.1°F',
    pulse: '78 bpm',
    blood_pressure: '132/85 mmHg',
    weight: '80 kg',
    blood_sugar: '125 mg/dL',
    pain_level: 5,
    fatigue_level: 6,
    mood: 'fair',
    appetite: 'poor',
    sleep_quality: 'poor',
    symptoms_description: 'Persistent headache, feeling tired',
    medications_taken: 'Lisinopril 10mg, Metformin 500mg, Tylenol for headache',
    activities: 'Mostly resting',
    notes: 'Not feeling well today, headache is bothering me',
    created_at: '2024-01-25T19:00:00Z',
    updated_at: '2024-01-25T19:00:00Z'
  }
];

// Geospatial locations for map (Salaya area)
export interface DummyLocation {
  id: string;
  type: 'volunteer' | 'center' | 'hospital';
  name: string;
  lat: number;
  lng: number;
  address?: string;
  user_id?: string; // for volunteer links
  phone?: string;
}

// Approx center: Salaya, Phutthamonthon, Nakhon Pathom, Thailand ~ 13.793, 100.321
export const dummyLocations: DummyLocation[] = [
  // Volunteers (user-3 is Maria Garcia)
  { id: 'loc-v-1', type: 'volunteer', name: 'Maria Garcia (Volunteer)', lat: 13.8005, lng: 100.3231, address: 'Near Salaya Market', user_id: 'user-3' },

  // Health centers
  { id: 'loc-c-1', type: 'center', name: 'Community Health Center - Salaya', lat: 13.7963, lng: 100.3127, address: 'Salaya Rd', phone: '+66 2 555 0101' },
  { id: 'loc-c-2', type: 'center', name: 'Phutthamonthon Health Center', lat: 13.8048, lng: 100.3342, address: 'Phutthamonthon', phone: '+66 2 555 0202' },

  // Hospitals
  { id: 'loc-h-1', type: 'hospital', name: 'Nakhon Pathom Hospital (Annex)', lat: 13.7769, lng: 100.3186, address: 'Near Salaya', phone: '+66 2 555 0303' },
];

// Helper functions to simulate database operations
// moved to top as hoisted function declarations
