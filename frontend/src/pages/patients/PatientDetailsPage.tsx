// src/pages/patients/PatientDetailsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';

import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import {
  usePatientsStore,
  PatientRecord,
  DoctorInfo,
} from '../../stores/patientsStore';
import { ShareCard } from '../../components/ShareCard';

type TabId = 'history' | 'files' | 'audit';
const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'history', label: 'Medical History', icon: <FileText className="h-4 w-4" /> },
  { id: 'files', label: 'Files', icon: <FileText className="h-4 w-4" /> },
  { id: 'audit', label: 'Audit Log', icon: <FileText className="h-4 w-4" /> },
];

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const {
    currentPatient,
    patientRecords,
    isLoading,
    error,
    fetchPatientById,
    fetchPatientRecords,
    updatePatientRecord,
  } = usePatientsStore();

  const [activeTab, setActiveTab] = useState<TabId>('history');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      void fetchPatientById(id);
      void fetchPatientRecords(id);
    }
  }, [id]);

  if (isLoading && !currentPatient) {
    return <p className="text-center mt-8 text-gray-500">Loading…</p>;
  }
  if (error) {
    return <p className="text-center mt-8 text-red-600">{error}</p>;
  }
  if (!currentPatient) return null;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/patients"
          className="inline-flex items-center text-sm text-primary-600 hover:underline mb-4"
        >
          <ArrowLeft className="mr-1" /> Back to Patients
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {currentPatient.firstName} {currentPatient.lastName}
          </h1>
          <ShareCard patientId={Number(currentPatient.id)} />
        </div>
      </motion.div>

      {/* TABS */}
      <Card>
        <Tabs
          tabs={tabs}
          defaultTab="history"
          onChange={(t) => setActiveTab(t as TabId)}
          className="mb-6"
        />

        {activeTab === 'history' &&
          patientRecords.map((rec) => (
            <HistoryItem
              key={rec.id}
              rec={rec}
              isEditing={editingId === rec.id}
              onEdit={() => setEditingId(rec.id)}
              onCancel={() => setEditingId(null)}
              onSave={async (form) => {
                if (id) await updatePatientRecord(id, rec.id, form);
                setEditingId(null);
                if (id) void fetchPatientRecords(id);
              }}
            />
          ))}

        {activeTab === 'files' && (
          <p className="text-center text-gray-500 py-10">Здесь файлы…</p>
        )}
        {activeTab === 'audit' && (
          <p className="text-center text-gray-500 py-10">Audit Log…</p>
        )}
      </Card>
    </div>
  );
}

interface HistoryItemProps {
  rec: PatientRecord;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (form: FormData) => Promise<void>;
}

function HistoryItem({
  rec,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}: HistoryItemProps) {
  /* ---------------- helpers ---------------- */
  const isImage = (name: string) => /\.(jpe?g|png|gif)$/i.test(name);
  /* ---------------- state ------------------- */
  const [visitDate, setVisitDate] = useState(rec.visit_date ?? '');
  const [location, setLocation] = useState(rec.appointment_location ?? '');
  const [notes, setNotes] = useState(rec.notes);
  const [files, setFiles] = useState<File[]>([]);
  const [toDelete, setToDelete] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const existing = rec.lab_files || [];

  /* ---------------- dropzone --------------- */
  const onDrop = useCallback(
    (accepted: File[]) => setFiles((prev) => [...prev, ...accepted]),
    []
  );
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: { 'image/*': [], 'application/pdf': [] },
  });

  /* ---------------- doctor ------------------ */
  const doc = rec.doctor as DoctorInfo | undefined;
  const dateLabel = rec.visit_date
    ? format(new Date(rec.visit_date), 'd MMMM yyyy')
    : '—';

  /* ============================================================================
   *  VIEW MODE
   * ==========================================================================*/
  if (!isEditing) {
    return (
      <div className="border rounded-lg overflow-hidden mb-4">
        {/* HEADER ROW */}
        <div className="grid grid-cols-[auto_1fr_auto_auto] items-center bg-gray-50 px-6 py-2 text-sm text-gray-600">
          <div>{dateLabel}</div>
          <div className="text-center">Комментарий / Заключение</div>
          <div className="text-right">Лабораторные данные</div>

          <button
            onClick={onEdit}
            className="ml-4 px-2 py-1 bg-primary-600 text-white text-xs rounded"
          >
            Edit
          </button>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-[auto_auto_2fr_1fr] gap-6 p-6">
          {/* Doctor */}
          <div className="flex flex-col items-center space-y-1">
            <img
              src={doc?.photo || '/images/doctor.png'}
              className="h-10 w-10 rounded-full"
            />
            <p className="font-medium">
              {doc?.full_name || 'Doctor not assigned'}
            </p>
            <p className="text-xs text-gray-500">
              {doc?.specialization || 'No specialization'}
            </p>
          </div>

          {/* Clinic / Location */}
          <div className="flex flex-col items-center space-y-1">
            <img
              src="/images/hospital.png"
              className="h-10 w-10 rounded-full"
            />
            <p className="font-medium">
              {rec.appointment_location || 'Location not provided'}
            </p>
            <p className="text-xs text-gray-500">No specialization</p>
          </div>

          {/* Notes */}
          <div className="text-gray-800 whitespace-pre-line">{rec.notes}</div>

          {/* Files */}
          <div className="flex flex-wrap gap-3">
            {existing.map((f) =>
              isImage(f.file) ? (
                <a
                  key={f.id}
                  href={f.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-24 w-24 border rounded overflow-hidden"
                >
                  <img
                    src={f.file}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </a>
              ) : (
                <a
                  key={f.id}
                  href={f.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-24 w-24 border rounded flex flex-col items-center justify-center bg-gray-50 text-primary-600"
                >
                  <FileText className="h-8 w-8" />
                  <span className="text-[10px] mt-1">PDF</span>
                </a>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================================
   *  EDIT MODE
   * ==========================================================================*/
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !visitDate &&
      !location &&
      !notes &&
      files.length === 0 &&
      toDelete.length === 0
    ) {
      setError('Заполните хотя бы одно поле или измените файлы');
      return;
    }

    const form = new FormData();
    if (visitDate) form.append('visit_date', visitDate);
    if (location) form.append('appointment_location', location);
    if (notes) form.append('notes', notes);
    toDelete.forEach((id) => form.append('delete_file_ids', String(id)));
    files.forEach((f) => form.append('files', f));

    await onSave(form);
  };

  return (
    <form
      onSubmit={handleSave}
      className="border rounded-lg overflow-hidden bg-gray-50 mb-4"
    >
      {error && <p className="text-red-600 m-4">{error}</p>}

      {/* HEADER ROW */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center bg-gray-100 px-6 py-2 text-sm text-gray-600">
        <div>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="border rounded p-1 text-sm w-full focus:ring-primary-500"
          />
        </div>

        <div className="text-center">Комментарий / Заключение</div>

        <div className="flex justify-end items-center space-x-2">
          <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1 border rounded"
          >
            Cancel
          </button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-[auto_auto_2fr_1fr] gap-6 p-6">
        {/* Doctor */}
        <div className="flex flex-col items-center space-y-1">
          <img
            src={doc?.photo || '/images/doctor.png'}
            className="h-10 w-10 rounded-full"
          />
          <input
            type="text"
            value={doc?.full_name || ''}
            placeholder="Doctor Name"
            className="border rounded p-1 text-sm w-full text-center focus:ring-primary-500"
            readOnly
          />
        </div>

        {/* Clinic / Location */}
        <div className="flex flex-col items-center space-y-1">
          <img
            src="/images/hospital.png"
            className="h-10 w-10 rounded-full"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Место приёма"
            className="border rounded p-1 text-sm w-full text-center focus:ring-primary-500"
          />
        </div>

        {/* Notes */}
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Комментарий"
            className="border rounded p-1 text-sm w-full focus:ring-primary-500"
          />
        </div>

        {/* Files */}
        <div className="flex flex-wrap gap-3">
          {/* EXISTING */}
          {existing.map(
            (f) =>
              !toDelete.includes(f.id) && (
                <div
                  key={f.id}
                  className="relative h-24 w-24 border rounded overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setToDelete((prev) => [...prev, f.id])}
                    className="absolute top-1 right-1 bg-white rounded-full p-0.5"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>

                  {isImage(f.file) ? (
                    <img
                      src={f.file}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 text-primary-600">
                      <FileText className="h-8 w-8" />
                      <span className="text-[10px] mt-1">PDF</span>
                    </div>
                  )}
                </div>
              )
          )}

          {/* NEW UPLOADS */}
          {files.map((f, i) => (
            <div
              key={i}
              className="relative h-24 w-24 border rounded overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setFiles((prev) => prev.filter((_, j) => j !== i))
                }
                className="absolute top-1 right-1 bg-white rounded-full p-0.5"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>

              {isImage(f.name) ? (
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 text-primary-600">
                  <FileText className="h-8 w-8" />
                  <span className="text-[10px] mt-1">PDF</span>
                </div>
              )}
            </div>
          ))}

          {/* ADD NEW */}
          <div
            {...getRootProps()}
            className="h-24 w-24 flex items-center justify-center border-2 border-dashed rounded text-gray-500 cursor-pointer"
          >
            <input {...getInputProps()} />
            <Plus className="h-6 w-6" />
          </div>
        </div>
      </div>
    </form>
  );
}
