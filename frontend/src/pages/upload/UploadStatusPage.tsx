import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useUploadStore } from '../../stores/uploadStore';

const UploadStatusPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { currentJob, getJobById, updateExtractedData } = useUploadStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (jobId) {
      getJobById(jobId);
    }
  }, [jobId, getJobById]);
  
  useEffect(() => {
    if (currentJob?.extractedData) {
      setFormData({
        patientName: currentJob.extractedData.patientName || '',
        patientId: currentJob.extractedData.patientId || '',
        dateOfBirth: currentJob.extractedData.dateOfBirth || '',
        email: currentJob.extractedData.email || '',
        phone: currentJob.extractedData.phone || '',
        documentDate: currentJob.extractedData.documentDate || '',
        documentType: currentJob.extractedData.documentType || '',
      });
    }
  }, [currentJob]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveChanges = () => {
    if (jobId && currentJob) {
      updateExtractedData(jobId, formData);
      setIsEditing(false);
    }
  };
  
  if (!currentJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading job status...</p>
      </div>
    );
  }
  
  const getStatusIcon = () => {
    switch (currentJob.status) {
      case 'completed':
        return <CheckCircle className="h-16 w-16 text-success-500" />;
      case 'failed':
        return <AlertTriangle className="h-16 w-16 text-error-500" />;
      default:
        return <FileText className="h-16 w-16 text-primary-500" />;
    }
  };
  
  const getStatusText = () => {
    switch (currentJob.status) {
      case 'completed':
        return 'Processing Complete';
      case 'failed':
        return 'Processing Failed';
      case 'processing':
        return 'Processing...';
      default:
        return 'Pending';
    }
  };
  
  const getStatusDescription = () => {
    switch (currentJob.status) {
      case 'completed':
        return 'The file has been successfully processed. You can review the extracted information below.';
      case 'failed':
        return `Processing failed: ${currentJob.error || 'Unknown error'}`;
      case 'processing':
        return 'Your file is being processed. This may take a few minutes.';
      default:
        return 'Your file is waiting to be processed.';
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Link 
          to="/upload" 
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Upload
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Upload Status</h1>
        <p className="mt-1 text-gray-500">
          Track the status of your uploaded file and review extracted information.
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <Card>
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="flex-shrink-0 flex items-center justify-center p-4">
              {getStatusIcon()}
            </div>
            <div className="ml-0 md:ml-6 text-center md:text-left">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {getStatusText()}
              </h3>
              <p className="text-gray-500">
                {getStatusDescription()}
              </p>
              
              <div className="mt-4 flex flex-col md:flex-row gap-2">
                <div className="bg-gray-100 px-4 py-2 rounded-md">
                  <p className="text-xs text-gray-500">File Name</p>
                  <p className="text-sm font-medium">{currentJob.file.name}</p>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-md">
                  <p className="text-xs text-gray-500">Uploaded</p>
                  <p className="text-sm font-medium">
                    {new Date(currentJob.startedAt).toLocaleString()}
                  </p>
                </div>
                {currentJob.completedAt && (
                  <div className="bg-gray-100 px-4 py-2 rounded-md">
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="text-sm font-medium">
                      {new Date(currentJob.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {currentJob.status === 'completed' && currentJob.extractedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card 
            title="Extracted Information"
            footer={
              <div className="flex justify-end">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSaveChanges}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="primary" 
                      className="ml-2"
                      onClick={() => {
                        // In a real app, this would save the data to the patient record
                        alert('Data saved to patient record');
                      }}
                    >
                      Save to Patient Record
                    </Button>
                  </>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <Input
                    label="Patient Name"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Patient ID"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Document Date"
                    name="documentDate"
                    type="date"
                    value={formData.documentDate}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Document Type"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleInputChange}
                  />
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Patient Name</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.patientName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Patient ID</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.patientId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.dateOfBirth || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Document Date</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.documentDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Document Type</p>
                    <p className="mt-1 text-gray-900">{currentJob.extractedData.documentType || '-'}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default UploadStatusPage;