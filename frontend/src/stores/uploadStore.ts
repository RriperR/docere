import { create } from 'zustand';
import api from '../api/api';

export interface UploadJob {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  log: string;
  // сюда потом можно дописать extractedData из job.log или result
}

interface UploadState {
  currentUpload: File | null;
  currentJob: UploadJob | null;
  isUploading: boolean;
  error: string | null;
  setCurrentUpload: (file: File | null) => void;
  uploadFile: (file: File) => Promise<string>;
  getJobById: (id: string) => Promise<void>;
  clearUpload: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  currentUpload: null,
  currentJob: null,
  isUploading: false,
  error: null,

  setCurrentUpload: (file) => {
    set({ currentUpload: file });
  },

  uploadFile: async (file) => {
    set({ isUploading: true, error: null });

    try {
      // 1) Формируем form-data и шлём на бэкенд
      const form = new FormData();
      form.append('archive_file', file);

      const { data } = await api.post<{ job_id: number }>('/process-zip/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const jobId = String(data.job_id);

      // 2) Сохраняем ссылку на текущую задачу
      const newJob: UploadJob = {
        id: jobId,
        status: 'pending',
        log: ''
      };
      set({ currentJob: newJob, isUploading: false });

      return jobId;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      set({ error: msg, isUploading: false });
      throw new Error(msg);
    }
  },

  getJobById: async (id: string) => {
    set({ error: null });
    try {
      const { data } = await api.get<{ status: string; log: string }>(`/task-status/${id}/`);
      const job: UploadJob = {
        id,
        status: data.status as UploadJob['status'],
        log: data.log || ''
      };
      set({ currentJob: job });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch job status';
      set({ error: msg });
    }
  },

  clearUpload: () => {
    set({
      currentUpload: null,
      currentJob: null,
      isUploading: false,
      error: null
    });
  }
}));
