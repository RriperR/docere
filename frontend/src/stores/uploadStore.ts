import { create } from 'zustand'
import api from '../api/api'

export interface UploadJob {
  id: string
  file: { name: string; size: number; type: string }
  status: 'pending' | 'processing' | 'done' | 'failed'
  uploadedAt: string
  completedAt?: string
  log?: string
  rawExtracted?: {
    fios: string[]
    dobs: string[]
    phones: string[]
    emails: string[]
  }
  recordId?: number
}

interface UploadState {
  currentUpload: File | null
  currentJob: UploadJob | null
  isUploading: boolean
  error: string | null

  setCurrentUpload: (file: File | null) => void
  uploadFile: (file: File) => Promise<string>
  getJobById: (id: string) => Promise<void>
  updateExtractedData: (
    jobId: string,
    data: Partial<UploadJob['rawExtracted']>
  ) => void
  clearUpload: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
  currentUpload: null,
  currentJob: null,
  isUploading: false,
  error: null,

  setCurrentUpload: (file) =>
    set({ currentUpload: file }),

  uploadFile: async (file) => {
    set({ isUploading: true, error: null })
    const form = new FormData()
    form.append('archive_file', file)

    try {
      const { data } = await api.post<{ job_id: string }>(
        '/process-zip/',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      const now = new Date().toISOString()
      const newJob: UploadJob = {
        id: data.job_id,
        file: { name: file.name, size: file.size, type: file.type },
        status: 'pending',
        uploadedAt: now,
        log: '',
      }
      set({ currentJob: newJob, isUploading: false })
      return data.job_id
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Upload failed'
      set({ error: msg, isUploading: false })
      throw new Error(msg)
    }
  },

  getJobById: async (id) => {
    set({ error: null })
    try {
      const { data } = await api.get<{
        id: string
        status: 'pending' | 'processing' | 'done' | 'failed'
        log: string
        raw_extracted: {
          fios: string[]
          dobs: string[]
          phones: string[]
          emails: string[]
        }
        uploaded_at: string
        completed_at?: string
        record?: number
        file_name: string
      }>(`/task-status/${id}/`)

      set((state) => ({
        currentJob: {
          id: data.id,
          file: {
            name: data.file_name || state.currentJob?.file.name || '—',
            size: state.currentJob?.file.size || 0,
            type: state.currentJob?.file.type || '',
          },
          status: data.status,
          uploadedAt: state.currentJob?.uploadedAt || data.uploaded_at,
          completedAt: data.completed_at,
          log: data.log,
          rawExtracted: data.raw_extracted,
          recordId: data.record,
        },
      }))
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Failed to fetch job status'
      set({ error: msg })
    }
  },

  updateExtractedData: (jobId, upd) =>
    set((state) => {
      if (!state.currentJob || state.currentJob.id !== jobId) {
        return {} as Partial<UploadState>
      }
      return {
        currentJob: {
          ...state.currentJob,
          rawExtracted: {
            ...state.currentJob.rawExtracted!,
            ...upd,
          },
        },
      }
    }),

  clearUpload: () =>
    set({
      currentUpload: null,
      currentJob: null,
      isUploading: false,
      error: null,
    }),
}))
