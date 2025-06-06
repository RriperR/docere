import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';
import { usePatientsStore } from '../../stores/patientsStore';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const { patients, fetchPatients } = usePatientsStore();
  
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  // Mock recent uploads
  const recentUploads = [
    {
      id: 'upload1',
      patientName: 'John Doe',
      date: '2023-03-15',
      status: 'completed',
      documentType: 'Blood Test Results'
    },
    {
      id: 'upload2',
      patientName: 'Jane Smith',
      date: '2023-03-14',
      status: 'processing',
      documentType: 'MRI Scan'
    },
    {
      id: 'upload3',
      patientName: 'Robert Johnson',
      date: '2023-03-13',
      status: 'completed',
      documentType: 'Cardiology Report'
    },
    {
      id: 'upload4',
      patientName: 'Emily Williams',
      date: '2023-03-12',
      status: 'failed',
      documentType: 'Prescription'
    },
    {
      id: 'upload5',
      patientName: 'Michael Brown',
      date: '2023-03-11',
      status: 'completed',
      documentType: 'Vaccination Record'
    }
  ];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-warning-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-error-500" />;
      default:
        return null;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, Dr. {user?.lastName}</h1>
        <p className="mt-1 text-gray-500">
          Here's what's happening with your patients today.
        </p>
      </motion.div>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
      >
        <motion.div variants={item}>
          <Card
            icon={<Upload className="h-5 w-5" />}
            title="Upload Archive"
            hoverable
            onClick={() => window.location.href = '/upload'}
            className="h-full"
          >
            <p className="text-gray-500 mb-4">
              Upload and process new patient medical records
            </p>
            <Button variant="primary" size="sm">
              Upload Files
            </Button>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card
            icon={<Users className="h-5 w-5" />}
            title="Patient List"
            hoverable
            onClick={() => window.location.href = '/patients'}
            className="h-full"
          >
            <p className="text-gray-500 mb-4">
              View and manage your {patients.length} patients
            </p>
            <Button variant="outline" size="sm">
              See All Patients
            </Button>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card
            icon={<Clock className="h-5 w-5" />}
            title="Pending Requests"
            hoverable
            className="h-full"
          >
            <p className="text-gray-500 mb-4">
              You have 3 pending role requests to review
            </p>
            <Button variant="outline" size="sm">
              Review Requests
            </Button>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card title="Recent Uploads">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{upload.patientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{upload.documentType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{upload.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        {getStatusIcon(upload.status)}
                        <span className="ml-1.5 capitalize">{upload.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to={`/upload/status/${upload.id}`} className="text-primary-600 hover:text-primary-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;