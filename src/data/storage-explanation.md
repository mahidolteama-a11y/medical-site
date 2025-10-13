# Data Storage in Medical Portal

## Current Implementation: localStorage

The application currently saves data in **localStorage** (browser storage), not in the actual dummy data files.

### How it works:
1. **Initial Data**: Loaded from `src/data/dummyData.ts` 
2. **Runtime Data**: Stored in browser's localStorage
3. **Persistence**: Data persists across browser sessions but only on the same device/browser

### Storage Keys:
- `dummyMessages` - All messages
- `dummyPatientProfiles` - Patient profiles  
- `dummyTasks` - Tasks
- `dummyAnnouncements` - Announcements
- `dummyUsers` - User accounts

### Limitations:
- Data is device/browser specific
- Clearing browser data removes all information
- Data is NOT saved back to the source files
- Different users on different devices won't see each other's data

## Alternative: File-Based Storage

If you want data saved to actual files, that would require:
1. A backend server
2. File system write permissions
3. Database integration

The current implementation is a **client-side simulation** of a database using browser storage.