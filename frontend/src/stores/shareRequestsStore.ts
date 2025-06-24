import { create } from 'zustand'
import api from '../api/api'

export type ShareRequest = {
  id: number
  from_user: {
    id: number
    full_name: string
  }
  to_user: {
    id: number
    full_name: string
  }
  patient: {
    id: number
    first_name: string
    last_name: string
  }
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

interface ShareRequestsState {
  requests: ShareRequest[]
  loading: boolean
  error: string | null

  fetchMyRequests: () => Promise<void>
  createRequest: (toUserId: number, patientId: number) => Promise<void>
  respondRequest: (id: number, accepted: boolean) => Promise<void>
}

export const useShareRequestsStore = create<ShareRequestsState>((set, get) => ({
  requests: [],
  loading: false,
  error: null,

  fetchMyRequests: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<ShareRequest[]>('/share-requests/')
      set({ requests: data })
    } catch (e: any) {
      set({ error: e.message || 'Failed to load requests' })
    } finally {
      set({ loading: false })
    }
  },

  createRequest: async (toUserId, patientId) => {
    set({ loading: true, error: null })
    try {
      await api.post('/share-requests/', { to_user: toUserId, patient: patientId })
      await get().fetchMyRequests()
    } catch (e: any) {
      set({ error: e.message || 'Failed to send request' })
    } finally {
      set({ loading: false })
    }
  },

  respondRequest: async (id, accepted) => {
    set({ loading: true, error: null })
    try {
      await api.post(`/share-requests/${id}/respond/`, { accepted })
      await get().fetchMyRequests()
    } catch (e: any) {
      set({ error: e.message || 'Failed to respond' })
    } finally {
      set({ loading: false })
    }
  },
}))
