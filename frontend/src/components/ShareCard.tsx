// src/components/ShareCard.tsx
import React, { useState, useEffect } from 'react'
import api from '../api/api'

interface Props {
  patientId: number
}

type ShareStatus = 'idle' | 'pending' | 'accepted' | 'declined'

export const ShareCard: React.FC<Props> = ({ patientId }) => {
  const [toEmail, setToEmail] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // При монтировании подгружаем уже существующий запрос (если есть)
  useEffect(() => {
    api
      .get<{
        id: string
        status: ShareStatus
        to_email: string
      }[]>('/share-requests/', {
        params: { patient_id: patientId },
      })
      .then(res => {
        const existing = res.data[0]
        if (existing) {
          setRequestId(existing.id)
          setStatus(existing.status)
          setToEmail(existing.to_email)
        }
      })
      .catch(() => {
        // если пусто или ошибка — остаёмся в idle
      })
  }, [patientId])

  // Если статус pending — опрашиваем сервер, чтобы узнать когда сменится
  useEffect(() => {
    let timer: number
    if (status === 'pending' && requestId) {
      timer = window.setInterval(() => {
        api
          .get<{
            id: string
            status: ShareStatus
            to_email: string
          }>(`/share-requests/${requestId}/`)
          .then(res => {
            const { status: newStatus, to_email } = res.data
            if (newStatus !== 'pending') {
              setStatus(newStatus)
              setToEmail(to_email)
              clearInterval(timer)
            }
          })
          .catch(() => {
            clearInterval(timer)
          })
      }, 10000)
    }
    return () => clearInterval(timer)
  }, [status, requestId])

  const openModal = () => {
    setError(null)
    setToEmail('')
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const handleSend = async () => {
    setError(null)
    try {
      const { data } = await api.post<{ id: string }>('/share-requests/', {
        patient_id: patientId,
        to_email:    toEmail,
      })
      setRequestId(data.id)
      setStatus('pending')
      closeModal()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to send request')
    }
  }

  const handleCancel = async () => {
    if (!requestId) return
    try {
      await api.delete(`/share-requests/${requestId}/`)
      setStatus('idle')
      setRequestId(null)
      setToEmail('')
    } catch {
      // игнорируем
    }
  }

  return (
    <div className="mt-4">
      {status === 'idle' && (
        <button
          className="px-2.5 py-1.5 bg-primary-600 text-white rounded"
          onClick={openModal}
        >
          Share Card
        </button>
      )}

      {status === 'pending' && (
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">
            Pending share to <strong>{toEmail}</strong>…
          </span>
          <button
            className="text-sm text-red-600 underline"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <div className="text-green-600">
          Patient <strong>{toEmail}</strong> has accepted the share ✅
        </div>
      )}

      {status === 'declined' && (
        <div className="flex items-center space-x-2">
          <span className="text-red-600">
            Patient <strong>{toEmail}</strong> has declined the share ❌
          </span>
          <button
            className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
            onClick={openModal}
          >
            Resend
          </button>
        </div>
      )}

      {/* Модалка */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-medium mb-4">Share to Patient</h2>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <input
              type="email"
              className="w-full border px-3 py-2 rounded mb-4"
              placeholder="Patient email"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSend}
                disabled={!toEmail}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
