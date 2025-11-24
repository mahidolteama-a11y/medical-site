# Healthcare Management Platform

A comprehensive web-based healthcare management system designed for coordinating patient care between doctors, patients, and volunteer healthcare workers. The platform features role-based access control, real-time health monitoring, medication tracking, appointment scheduling, and geographic area management.

## Overview

This application provides a complete solution for managing patient care in community healthcare settings. It enables doctors to oversee patient populations, assign tasks to volunteer healthcare workers, track vital signs and medications, and coordinate care through an intuitive interface with interactive mapping capabilities.

## Key Features

- **Role-Based Access Control**: Separate interfaces and permissions for doctors, patients, and volunteers
- **Patient Management**: Comprehensive patient profiles with medical history, vital signs, and categorization
- **Daily Health Records**: Track patient vital signs, symptoms, and daily observations
- **Task Management**: Assign and track tasks for volunteer healthcare workers with custom forms
- **Messaging System**: Secure communication between doctors, patients, and volunteers
- **Appointment Scheduling**: Manage and coordinate patient appointments
- **Medication Management**: Track prescriptions, set medication reminders, and monitor adherence
- **Mental Health Assessments**: Standardized mental health screening tools with scoring
- **Geographic Mapping**: Interactive map with area assignment and patient location tracking
- **Data Visualization**: Charts and statistics for monitoring patient populations and trends
- **Volunteer Coordination**: Manage volunteer assignments and track their activities

## Technology Stack

### Frontend
- **React 18.3.1** - Modern UI library with hooks
- **TypeScript 5.5.3** - Type-safe development
- **Vite 5.4.2** - Fast build tool and development server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework

### UI Components & Visualization
- **Lucide React 0.344.0** - Icon library
- **Recharts 3.2.1** - Data visualization and charting

### Mapping
- **Leaflet 1.9.4** - Interactive maps
- **React Leaflet 4.2.1** - React bindings for Leaflet
- **Leaflet Draw 1.0.4** - Map drawing and editing tools

### Backend & Database
- **Supabase 2.57.4** - Backend-as-a-Service (PostgreSQL database, authentication, real-time subscriptions)

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
The application includes Supabase migrations in the `supabase/migrations` directory. Apply these to set up the database schema.

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Default User Accounts

The application comes with pre-configured demo accounts for testing:

### Doctor Account
- **Email**: `dr.smith@hospital.com`
- **Password**: `password321`
- **Name**: Dr. Sarah Smith
- **Role**: Doctor

### Patient Account
- **Email**: `john.doe@email.com`
- **Password**: `password321`
- **Name**: John Doe
- **Role**: Patient

### Volunteer Account
- **Email**: `volunteer@hospital.com`
- **Password**: `password321`
- **Name**: Maria Garcia
- **Role**: Volunteer

### Additional Accounts

#### Doctor
- **Email**: `dr.johnson@hospital.com`
- **Password**: `password321`
- **Name**: Dr. Michael Johnson

#### Patient
- **Email**: `jane.wilson@email.com`
- **Password**: `password321`
- **Name**: Jane Wilson

## Features by Role

### Doctor Features
- View and manage all patients
- Create and update patient profiles
- Assign patients to volunteers and geographic areas
- Create tasks for volunteers with custom forms
- Review daily health records and trends
- Approve/decline medication requests
- Create doctor visit records with diagnoses and prescriptions
- Review mental health assessments
- Send messages to patients and volunteers
- Manage appointments
- View patient locations on interactive map
- Create and manage geographic areas
- View analytics and statistics dashboard
- Create system announcements

### Patient Features
- View personal medical profile
- Record daily health observations
- Track medications with reminders
- Log medication intake
- Request medication refills
- Schedule appointments
- Complete mental health assessments
- View appointment history
- Send messages to doctor and assigned volunteer
- View assigned tasks
- Update contact information

### Volunteer Features
- View assigned patients
- Record patient vital signs during home visits
- Complete assigned tasks with custom form responses
- Deliver medications to patients
- Help coordinate appointments
- View patient locations on map for route planning
- Send messages to doctors and patients
- View task assignments and due dates
- Submit task completion reports

## Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── appointments/    # Appointment management
│   │   ├── assessments/     # Mental health assessments
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard and analytics
│   │   ├── doctors/         # Doctor management
│   │   ├── layout/          # Navigation and layout
│   │   ├── map/             # Mapping components
│   │   ├── medications/     # Medication tracking
│   │   ├── messages/        # Messaging system
│   │   ├── patients/        # Patient management
│   │   ├── profile/         # User profiles
│   │   ├── records/         # Health records
│   │   ├── tasks/           # Task management
│   │   └── volunteers/      # Volunteer management
│   ├── contexts/            # React context providers
│   ├── data/                # Dummy data and constants
│   ├── lib/                 # Utilities and services
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── supabase/
│   └── migrations/          # Database migrations
├── public/                  # Static assets
├── dist/                    # Built production files
└── package.json             # Dependencies and scripts

```

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- **users** - User accounts with role-based access
- **patient_profiles** - Comprehensive patient information
- **daily_records** - Daily health observations and vital signs
- **doctor_records** - Clinical visit records
- **tasks** - Task assignments for volunteers
- **messages** - Internal messaging system
- **medications** - Patient medication schedules
- **medication_intake_logs** - Medication adherence tracking
- **medication_requests** - Patient medication refill requests
- **mental_assessments** - Mental health screening results
- **volunteer_profiles** - Volunteer information and assignments
- **map_areas** - Geographic area definitions
- **announcements** - System-wide announcements

## Key Libraries and Their Purpose

- **React Leaflet**: Provides interactive mapping for viewing patient locations and volunteer service areas
- **Recharts**: Visualizes patient statistics and health trends on the dashboard
- **Supabase Client**: Handles database operations, authentication, and real-time updates
- **Lucide React**: Provides modern, consistent icons throughout the interface
- **Tailwind CSS**: Enables responsive design with utility classes for all screen sizes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

### Code Quality

The project uses TypeScript for type safety and ESLint for code quality. All components are organized by feature area for maintainability.

## Security Features

- Role-based access control (RBAC)
- Secure authentication via Supabase
- Row Level Security (RLS) policies on database tables
- Session validation and automatic cleanup
- Password reset functionality
- Secure medication reminder system

## Browser Support

The application supports all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Mobile Support

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

Volunteers can use the application in the field on mobile devices for patient home visits.

## Contributing

When contributing to this project:

1. Follow the existing code structure and naming conventions
2. Use TypeScript types for all new components
3. Write clear commit messages
4. Test all features across different user roles
5. Ensure responsive design works on mobile devices

## License

This project is private and proprietary.

## Support

For issues, questions, or feature requests, please contact the development team.

---

**Version**: 0.0.0
**Last Updated**: November 2024
