import { create } from 'zustand';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  lastVisit?: string;
  recordCount: number;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  date: string;
  title: string;
  description: string;
  doctor: string;
  files?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  versions?: {
    id: string;
    date: string;
    changedBy: string;
  }[];
}

interface PatientsState {
  patients: Patient[];
  filteredPatients: Patient[];
  currentPatient: Patient | null;
  patientRecords: PatientRecord[];
  isLoading: boolean;
  error: string | null;
  fetchPatients: () => Promise<void>;
  fetchPatientById: (id: string) => Promise<void>;
  fetchPatientRecords: (patientId: string) => Promise<void>;
  searchPatients: (query: string) => void;
  filterPatientsByDate: (startDate?: string, endDate?: string) => void;
}

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1985-04-12',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    lastVisit: '2023-03-15',
    recordCount: 12
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1990-08-22',
    email: 'jane.smith@example.com',
    phone: '555-987-6543',
    lastVisit: '2023-02-28',
    recordCount: 8
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Johnson',
    dateOfBirth: '1978-11-03',
    email: 'robert.johnson@example.com',
    phone: '555-456-7890',
    lastVisit: '2023-03-10',
    recordCount: 15
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Williams',
    dateOfBirth: '1995-06-17',
    email: 'emily.williams@example.com',
    phone: '555-234-5678',
    lastVisit: '2023-03-05',
    recordCount: 5
  },
  {
    id: '5',
    firstName: 'Michael',
    lastName: 'Brown',
    dateOfBirth: '1982-09-30',
    email: 'michael.brown@example.com',
    phone: '555-876-5432',
    lastVisit: '2023-02-20',
    recordCount: 10
  }
];

const mockRecords: PatientRecord[] = [
  {
    id: '101',
    patientId: '1',
    date: '2023-03-15',
    title: 'Annual Checkup',
    description: 'Regular annual physical examination. Blood pressure, cholesterol, and blood sugar levels were measured. All values within normal range.',
    doctor: 'Dr. Alex Smith',
    files: [
      { id: 'f1', name: 'blood_test.pdf', url: '#', type: 'application/pdf' },
      { id: 'f2', name: 'ecg.jpg', url: '#', type: 'image/jpeg' }
    ],
    versions: [
      { id: 'v1', date: '2023-03-15T10:30:00', changedBy: 'Dr. Alex Smith' },
      { id: 'v2', date: '2023-03-16T14:45:00', changedBy: 'Dr. Maria Johnson' }
    ]
  },
  {
    id: '102',
    patientId: '1',
    date: '2023-01-20',
    title: 'Flu Symptoms',
    description: 'Patient presented with fever, cough, and fatigue. Diagnosed with seasonal influenza. Prescribed bed rest and over-the-counter medication.',
    doctor: 'Dr. Maria Johnson',
    files: [
      { id: 'f3', name: 'prescription.pdf', url: '#', type: 'application/pdf' }
    ],
    versions: [
      { id: 'v3', date: '2023-01-20T09:15:00', changedBy: 'Dr. Maria Johnson' }
    ]
  }
];

export const usePatientsStore = create<PatientsState>((set, get) => ({
  patients: [],
  filteredPatients: [],
  currentPatient: null,
  patientRecords: [],
  isLoading: false,
  error: null,
  
  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ 
        patients: mockPatients, 
        filteredPatients: mockPatients,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: 'Failed to fetch patients', 
        isLoading: false 
      });
    }
  },
  
  fetchPatientById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const patient = mockPatients.find(p => p.id === id) || null;
      set({ currentPatient: patient, isLoading: false });
    } catch (error) {
      set({ 
        error: 'Failed to fetch patient details', 
        isLoading: false 
      });
    }
  },
  
  fetchPatientRecords: async (patientId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      const records = mockRecords.filter(r => r.patientId === patientId);
      set({ patientRecords: records, isLoading: false });
    } catch (error) {
      set({ 
        error: 'Failed to fetch patient records', 
        isLoading: false 
      });
    }
  },
  
  searchPatients: (query: string) => {
    const { patients } = get();
    if (!query.trim()) {
      set({ filteredPatients: patients });
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = patients.filter(
      patient => 
        patient.firstName.toLowerCase().includes(lowercaseQuery) ||
        patient.lastName.toLowerCase().includes(lowercaseQuery) ||
        patient.email.toLowerCase().includes(lowercaseQuery)
    );
    
    set({ filteredPatients: filtered });
  },
  
  filterPatientsByDate: (startDate?: string, endDate?: string) => {
    const { patients } = get();
    if (!startDate && !endDate) {
      set({ filteredPatients: patients });
      return;
    }
    
    const filtered = patients.filter(patient => {
      if (patient.lastVisit) {
        if (startDate && endDate) {
          return patient.lastVisit >= startDate && patient.lastVisit <= endDate;
        }
        if (startDate) {
          return patient.lastVisit >= startDate;
        }
        if (endDate) {
          return patient.lastVisit <= endDate;
        }
      }
      return false;
    });
    
    set({ filteredPatients: filtered });
  }
}));