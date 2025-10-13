import React from 'react'
import { Download, Database } from 'lucide-react'

export const DataExport: React.FC = () => {
  const exportData = (key: string, filename: string) => {
    try {
      const data = localStorage.getItem(key)
      if (!data) {
        alert(`No data found for ${key}`)
        return
      }

      const parsedData = JSON.parse(data)
      const exportContent = `export const ${key.replace('dummy', '').toLowerCase()} = ${JSON.stringify(parsedData, null, 2)};`
      
      const blob = new Blob([exportContent], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data')
    }
  }

  const exportAllData = () => {
    try {
      // Get all data from localStorage
      const messages = localStorage.getItem('dummyMessages')
      const patients = localStorage.getItem('dummyPatientProfiles')
      const tasks = localStorage.getItem('dummyTasks')
      const announcements = localStorage.getItem('dummyAnnouncements')
      const users = localStorage.getItem('dummyUsers')
      const dailyRecords = localStorage.getItem('dummyDailyRecords')

      const allData = {
        dummyMessages: messages ? JSON.parse(messages) : [],
        dummyPatientProfiles: patients ? JSON.parse(patients) : [],
        dummyTasks: tasks ? JSON.parse(tasks) : [],
        dummyAnnouncements: announcements ? JSON.parse(announcements) : [],
        dummyUsers: users ? JSON.parse(users) : [],
        dummyDailyRecords: dailyRecords ? JSON.parse(dailyRecords) : []
      }

      // Create the complete dummyData.ts file content
      const fileContent = `export interface DummyUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'doctor' | 'patient' | 'volunteer';
  created_at: string;
}

export interface DummyPatientProfile {
  id: string;
  user_id: string;
  // Basic Information
  name: string;
  doe: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  caregivers_contact: string;
  assigned_doctor: string;
  last_record_date: string;
  today_date: string;
  assigned_vhv_name: string;
  medical_record_number: string;
  
  // Medical Information
  patient_categories: {
    critical: boolean;
    elderly: boolean;
    pregnant: boolean;
  };
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
  created_at: string;
  updated_at: string;
  completed_at?: string;
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

// Dummy Users
export const dummyUsers: DummyUser[] = ${JSON.stringify(allData.dummyUsers, null, 2)};

// Dummy Patient Profiles
export const dummyPatientProfiles: DummyPatientProfile[] = ${JSON.stringify(allData.dummyPatientProfiles, null, 2)};

// Dummy Tasks
export const dummyTasks: DummyTask[] = ${JSON.stringify(allData.dummyTasks, null, 2)};

// Dummy Messages
export const dummyMessages: DummyMessage[] = ${JSON.stringify(allData.dummyMessages, null, 2)};

// Dummy Announcements
export const dummyAnnouncements: DummyAnnouncement[] = ${JSON.stringify(allData.dummyAnnouncements, null, 2)};

// Dummy Daily Records
export const dummyDailyRecords: DummyDailyRecord[] = ${JSON.stringify(allData.dummyDailyRecords, null, 2)};

// Helper functions to simulate database operations
export const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 9);
};

export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};`

      const blob = new Blob([fileContent], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'dummyData.ts'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('Complete dummyData.ts file downloaded! Replace the existing file in src/data/ with this updated version.')
    } catch (error) {
      console.error('Error exporting all data:', error)
      alert('Error exporting data')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <Database className="w-5 h-5" />
        <span>Export Data to Files</span>
      </h3>
      
      <p className="text-gray-600 mb-4 text-sm">
        Download updated dummy data files with all your changes. Replace the original files in your project.
      </p>

      <div className="space-y-3">
        <button
          onClick={exportAllData}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Download Complete dummyData.ts</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => exportData('dummyMessages', 'messages.js')}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Messages</span>
          </button>

          <button
            onClick={() => exportData('dummyPatientProfiles', 'patients.js')}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Patients</span>
          </button>

          <button
            onClick={() => exportData('dummyTasks', 'tasks.js')}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tasks</span>
          </button>

          <button
            onClick={() => exportData('dummyAnnouncements', 'announcements.js')}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Announcements</span>
          </button>

          <button
            onClick={() => exportData('dummyDailyRecords', 'daily-records.js')}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Daily Records</span>
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-xs">
          <strong>Note:</strong> After downloading, manually replace the files in your project's src/data/ folder to make the changes permanent.
        </p>
      </div>
    </div>
  )
}