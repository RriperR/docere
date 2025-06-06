import { create } from 'zustand';

export interface UploadJob {
  id: string;
  file: {
    name: string;
    size: number;
    type: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  extractedData?: {
    patientName?: string;
    patientId?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    documentDate?: string;
    documentType?: string;
  };
  error?: string;
}

interface UploadState {
  currentUpload: File | null;
  uploadJobs: UploadJob[];
  currentJob: UploadJob | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
  setCurrentUpload: (file: File | null) => void;
  uploadFile: (file: File) => Promise<string>;
  getJobById: (id: string) => Promise<void>;
  clearUpload: () => void;
  updateExtractedData: (jobId: string, data: Partial<UploadJob['extractedData']>) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  currentUpload: null,
  uploadJobs: [],
  currentJob: null,
  isUploading: false,
  progress: 0,
  error: null,
  
  setCurrentUpload: (file) => {
    set({ currentUpload: file });
  },
  
  uploadFile: async (file) => {
    set({ 
      isUploading: true, 
      progress: 0, 
      error: null 
    });
    
    try {
      // Create a new job
      const jobId = `job_${Date.now()}`;
      const newJob: UploadJob = {
        id: jobId,
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        status: 'pending',
        progress: 0,
        startedAt: new Date().toISOString()
      };
      
      set(state => ({ 
        uploadJobs: [...state.uploadJobs, newJob],
        currentJob: newJob
      }));
      
      // Simulate upload process with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        set(state => {
          const updatedJobs = state.uploadJobs.map(job => 
            job.id === jobId ? { ...job, progress, status: progress < 100 ? 'processing' : 'completed' } : job
          );
          
          const updatedJob = updatedJobs.find(job => job.id === jobId) || null;
          
          return {
            uploadJobs: updatedJobs,
            currentJob: updatedJob,
            progress
          };
        });
      }
      
      // Simulate data extraction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update with extracted data
      const extractedData = {
        patientName: file.name.includes('patient') ? 'John Doe' : 'Jane Smith',
        patientId: `P${Math.floor(Math.random() * 10000)}`,
        dateOfBirth: '1985-04-12',
        email: 'patient@example.com',
        phone: '555-123-4567',
        documentDate: new Date().toISOString().split('T')[0],
        documentType: file.name.includes('lab') ? 'Lab Results' : 'Medical Report'
      };
      
      set(state => {
        const completedJob = {
          ...state.currentJob!,
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
          extractedData
        };
        
        const updatedJobs = state.uploadJobs.map(job => 
          job.id === jobId ? completedJob : job
        );
        
        return {
          uploadJobs: updatedJobs,
          currentJob: completedJob,
          isUploading: false
        };
      });
      
      return jobId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      set(state => {
        const failedJob = {
          ...state.currentJob!,
          status: 'failed',
          error: errorMessage
        };
        
        const updatedJobs = state.uploadJobs.map(job => 
          job.id === state.currentJob?.id ? failedJob : job
        );
        
        return {
          uploadJobs: updatedJobs,
          currentJob: failedJob,
          isUploading: false,
          error: errorMessage
        };
      });
      
      throw new Error(errorMessage);
    }
  },
  
  getJobById: async (id: string) => {
    set({ error: null });
    
    const { uploadJobs } = get();
    const job = uploadJobs.find(job => job.id === id);
    
    if (job) {
      set({ currentJob: job });
    } else {
      // Simulate fetching job from API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create a mock job for demonstration
      const mockJob: UploadJob = {
        id,
        file: {
          name: 'medical_report.pdf',
          size: 2500000,
          type: 'application/pdf'
        },
        status: 'completed',
        progress: 100,
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date().toISOString(),
        extractedData: {
          patientName: 'Emily Williams',
          patientId: 'P5432',
          dateOfBirth: '1990-08-22',
          email: 'emily.williams@example.com',
          phone: '555-987-6543',
          documentDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          documentType: 'Annual Checkup'
        }
      };
      
      set(state => ({
        uploadJobs: [...state.uploadJobs, mockJob],
        currentJob: mockJob
      }));
    }
  },
  
  clearUpload: () => {
    set({ 
      currentUpload: null, 
      currentJob: null, 
      progress: 0 
    });
  },
  
  updateExtractedData: (jobId, data) => {
    set(state => {
      const updatedJobs = state.uploadJobs.map(job => 
        job.id === jobId ? { 
          ...job, 
          extractedData: { ...job.extractedData, ...data } 
        } : job
      );
      
      const updatedJob = updatedJobs.find(job => job.id === jobId) || null;
      
      return {
        uploadJobs: updatedJobs,
        currentJob: updatedJob === state.currentJob ? updatedJob : state.currentJob
      };
    });
  }
}));