// src/pages/patients/PatientDetailsPage.tsx
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, User } from 'lucide-react'
import { format } from 'date-fns'

import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Tabs } from '../../components/common/Tabs'
import { AddRecordModal } from '../../components/AddRecordModal'
import { usePatientsStore } from '../../stores/patientsStore'
import type { PatientRecord, DoctorInfo } from '../../stores/patientsStore'
import { ShareCard } from '../../components/ShareCard'

type TabId = 'history' | 'files' | 'audit'
const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'history', label: 'Medical History', icon: <FileText className="h-4 w-4" /> },
  { id: 'files',   label: 'Files',           icon: <FileText className="h-4 w-4" /> },
  { id: 'audit',   label: 'Audit Log',       icon: <FileText className="h-4 w-4" /> },
]

const HistoryItem: React.FC<{ rec: PatientRecord }> = ({ rec }) => {
  const [expanded, setExpanded] = useState(false)

  const doctor = rec.doctor as DoctorInfo | undefined
  const docName = doctor?.full_name ?? 'Doctor not assigned'
  const docSpec = doctor?.specialization ?? 'No specialization'
  const avatar  = doctor?.photo ?? '/images/doctor.png'
  const place = rec.appointment_location || 'Location not provided'
  const placeLogo = '/images/hospital.png'
  const dateObj = rec.visit_date
    ? new Date(rec.visit_date)
    : rec.created_at
    ? new Date(rec.created_at)
    : null
  const dateLabel = dateObj && !isNaN(dateObj.valueOf())
    ? format(dateObj, 'd MMMM yyyy')
    : '—'

  const summary = rec.notes.length > 200 ? rec.notes.slice(0, 200) + '…' : rec.notes
  const files = rec.lab_files || []

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto] bg-gray-50 px-6 py-2 text-sm font-medium text-gray-600">
        <div>{dateLabel}</div>
        <div className="text-center">Комментарий / Заключение</div>
        <div className="text-right">Лабораторные данные</div>
      </div>
      <div className="grid grid-cols-[auto_auto_2fr_1fr] gap-6 p-6">
        <div className="flex flex-col items-center md:items-start space-y-1">
          <img src={avatar} alt={docName} className="h-10 w-10 rounded-full object-cover" />
          <p className="font-medium text-gray-900">{docName}</p>
          <p className="text-xs text-gray-500">{docSpec}</p>
        </div>
        <div className="flex flex-col items-center md:items-start space-y-1">
          <img src={placeLogo} alt={place} className="h-10 w-10 rounded-full object-cover" />
          <p className="font-medium text-gray-900">{place}</p>
          <p className="text-xs text-gray-500">No specialization</p>
        </div>
        <div>
          <div className="text-gray-800">
            {expanded ? rec.notes : summary}
            {rec.notes.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary-600 ml-2 text-sm"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {files.map(file => {
            const isImage = /\.(jpe?g|png|gif)$/i.test(file.file)
            const isPdf   = /\.pdf$/i.test(file.file)
            if (isImage) {
              return (
                <a key={file.id} href={file.file} target="_blank" rel="noopener noreferrer"
                   className="h-24 w-24 overflow-hidden rounded border">
                  <img src={file.file} alt="" className="h-full w-full object-cover" />
                </a>
              )
            }
            return (
              <a key={file.id} href={file.file} target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-center h-24 w-24 rounded border bg-gray-50">
                <FileText className="h-8 w-8 text-gray-400" />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const {
    currentPatient,
    patientRecords,
    isLoading,
    error,
    fetchPatientById,
    fetchPatientRecords,
  } = usePatientsStore()

  const [activeTab, setActiveTab]     = useState<TabId>('history')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (id) {
      void fetchPatientById(id)
      void fetchPatientRecords(id)
    }
  }, [id, fetchPatientById, fetchPatientRecords])

  if (isLoading && !currentPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading patient details…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }
  if (!currentPatient) return null

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
        <Link to="/patients" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Patient List
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPatient.firstName} {currentPatient.lastName}
            </h1>
            <p className="text-gray-500">Patient ID: {currentPatient.id}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add Record
            </Button>
            <ShareCard patientId={Number(currentPatient.id)} />
          </div>
        </div>
      </motion.div>

      {showAddModal && (
        <AddRecordModal
          patientId={id!}
          onClose={() => {
            setShowAddModal(false)
            void fetchPatientRecords(id!)
          }}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card icon={<User className="h-5 w-5" />} title="Personal Information">
          <div className="space-y-4">
            {[
              ['Date of Birth', currentPatient.birthday],
              ['Email',           currentPatient.email],
              ['Phone',           currentPatient.phone],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="mt-1">{value || '—'}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={<FileText className="h-5 w-5" />} title="Medical Records">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-primary-600">{patientRecords.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="mt-1">{currentPatient.lastVisit || 'No records'}</p>
            </div>
          </div>
        </Card>

        <Card icon={<User className="h-5 w-5" />} title="Recent Activity">
          <div className="space-y-4">
            {patientRecords.slice(0, 3).map(rec => (
              <div key={rec.id} className="text-sm">
                <p className="font-medium">{rec.notes || 'Record'}</p>
                <p className="text-gray-500">{rec.visit_date || '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Card>
        <Tabs tabs={tabs} defaultTab="history" onChange={t => setActiveTab(t as TabId)} className="mb-6" />

        {activeTab === 'history' && (
          <div className="space-y-6">
            {patientRecords.map(rec => <HistoryItem key={rec.id} rec={rec} />)}
          </div>
        )}
        {activeTab === 'files' && <div className="py-10 text-center text-gray-500">Здесь отображаются все файлы записи.</div>}
        {activeTab === 'audit' && <div className="py-10 text-center text-gray-500">В разработке…</div>}
      </Card>
    </div>
  )
}

export default PatientDetailsPage
