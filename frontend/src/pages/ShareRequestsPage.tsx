// src/pages/ShareRequestsPage.tsx
import React, { useEffect, useState } from 'react'
import api from '../api/api'
import { Button } from '../components/common/Button'

interface ShareReq {
  id: string
  from_user:    string  // ФИО доктора
  to_email:     string
  status:       'pending' | 'accepted' | 'declined'
  patient:      number
  patient_name:string  // ← теперь приходит из API
  created_at:   string
}

const ShareRequestsPage: React.FC = () => {
  const [reqs, setReqs]     = useState<ShareReq[]>([])
  const [error, setError]   = useState<string|null>(null)

  useEffect(() => {
    api.get<ShareReq[]>('/share-requests/')
      .then(res => setReqs(res.data))
      .catch(() => setError('Не удалось загрузить запросы'))
  }, [])

  const respond = (id: string, accept: boolean) => {
    api.post<ShareReq>(`/share-requests/${id}/respond/`, { accepted: accept })
      .then(res => {
        setReqs(rs => rs.map(r => r.id === id ? res.data : r))
      })
      .catch(() => setError('Ошибка при отправке ответа'))
  }

  if (error) {
    return <p className="text-red-600">{error}</p>
  }
  if (!reqs.length) {
    return <p className="text-gray-500">У вас нет входящих запросов на шаринг карточек.</p>
  }

  return (
    <div className="space-y-6">
      {reqs.map(r => (
        <div
          key={r.id}
          className="bg-white shadow rounded-lg p-6 flex justify-between items-center"
        >
          <div className="space-y-1">
            <p className="text-gray-800">
              Доктор <strong>{r.from_user}</strong> хочет
              поделиться с вами карточкой пациента <strong>{r.patient_name}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Отправлено: {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
          <div className="space-x-2">
            {r.status === 'pending' && (
              <>
                <Button size="sm" onClick={() => respond(r.id, true)}>
                  Принять
                </Button>
                <Button variant="outline" size="sm" onClick={() => respond(r.id, false)}>
                  Отклонить
                </Button>
              </>
            )}
            {r.status === 'accepted' && (
              <span className="text-green-600 font-medium">Принято ✓</span>
            )}
            {r.status === 'declined' && (
              <span className="text-red-600 font-medium">Отклонено ✗</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ShareRequestsPage
