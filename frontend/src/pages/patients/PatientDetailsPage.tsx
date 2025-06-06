import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, User, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { usePatientsStore } from '../../stores/patientsStore';

const PatientDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentPatient, patientRecords, fetchPatientById, fetchPatientRecords } = usePatientsStore();
  const [activeTab, setActiveTab] = useState('history');
  
  useEffect(() => {
    if (id) {
      fetchPatientById(id);
      fetchPatientRecords(id);
    }
  }, [id, fetchPatientById, fetchPatientRecords]);
  
  if (!currentPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading patient details...</p>
      </div>
    );
  }
  
  const tabs = [
    { id: 'history', label: 'Medical History', icon: <FileText className="h-4 w-4" /> },
    { id: 'files', label: 'Files', icon: <Download className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link 
          to="/patients" 
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Patient List
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPatient.firstName} {currentPatient.lastName}
            </h1>
            <p className="mt-1 text-gray-500">
              Patient ID: {currentPatient.id}
            </p>
          </div>
          
          <Button variant="primary">
            Add Record
          </Button>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card
          icon={<User className="h-5 w-5" />}
          title="Personal Information"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="mt-1">{format(new Date(currentPatient.dateOfBirth), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1">{currentPatient.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="mt-1">{currentPatient.phone || 'Not provided'}</p>
            </div>
          </div>
        </Card>
        
        <Card
          icon={<FileText className="h-5 w-5" />}
          title="Medical Records"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-primary-600">{patientRecords.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="mt-1">
                {currentPatient.lastVisit 
                  ? format(new Date(currentPatient.lastVisit), 'MMMM d, yyyy')
                  : 'No records'
                }
              </p>
            </div>
          </div>
        </Card>
        
        <Card
          icon={<Clock className="h-5 w-5" />}
          title="Recent Activity"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              {patientRecords.slice(0, 3).map(record => (
                <div key={record.id} className="text-sm">
                  <p className="font-medium">{record.title}</p>
                  <p className="text-gray-500">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card>
          <Tabs
            tabs={tabs}
            defaultTab="history"
            onChange={setActiveTab}
            className="mb-6"
          />
          
          {activeTab === 'history' && (
            <div className="space-y-6">
              {patientRecords.map(record => (
                <div 
                  key={record.id}
                  className="border-b border-gray-200 last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {record.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(record.date), 'MMMM d, yyyy')} by {record.doctor}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                  <p className="text-gray-700">{record.description}</p>
                  
                  {record.files && record.files.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Attached Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {record.files.map(file => (
                          <a
                            key={file.id}
                            href={file.url}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {record.versions && record.versions.length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Version History:</p>
                      <div className="space-y-1">
                        {record.versions.map(version => (
                          <div
                            key={version.id}
                            className="text-sm text-gray-500"
                          >
                            {format(new Date(version.date), 'MMM d, yyyy HH:mm')} - Modified by {version.changedBy}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'files' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientRecords.flatMap(record => 
                record.files?.map(file => (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-start">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Added on {format(new Date(record.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" fullWidth>
                        Download
                      </Button>
                    </div>
                  </div>
                )) ?? []
              )}
            </div>
          )}
          
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {patientRecords.flatMap(record =>
                record.versions?.map(version => (
                  <div
                    key={version.id}
                    className="flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{version.changedBy}</span>
                        {' '}modified{' '}
                        <span className="font-medium">{record.title}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(version.date), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )) ?? []
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default PatientDetailsPage;