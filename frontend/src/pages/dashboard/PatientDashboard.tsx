import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';
import { usePatientsStore } from '../../stores/patientsStore';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const { currentPatient, patientRecords, fetchPatientById, fetchPatientRecords } = usePatientsStore();
  
  useEffect(() => {
    if (user?.id) {
      fetchPatientById(user.id);
      fetchPatientRecords(user.id);
    }
  }, [user?.id, fetchPatientById, fetchPatientRecords]);
  
  // Mock data for current checkups
  const currentCheckups = [
    {
      id: 'check1',
      name: 'Annual Physical',
      date: '2023-04-20',
      status: 'scheduled',
      doctor: 'Dr. Alex Smith'
    },
    {
      id: 'check2',
      name: 'Blood Work',
      date: '2023-03-18',
      status: 'completed',
      doctor: 'Dr. Maria Johnson'
    },
    {
      id: 'check3',
      name: 'Cardiology Evaluation',
      date: '2023-03-05',
      status: 'processing',
      doctor: 'Dr. Alex Smith'
    }
  ];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'scheduled':
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
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.firstName || 'Patient'}
        </h1>
        <p className="mt-1 text-gray-500">
          Here's a summary of your medical records and upcoming checkups.
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
            icon={<FileText className="h-5 w-5" />}
            title="Medical Records"
            hoverable
            onClick={() => window.location.href = `/patients/${user?.id}`}
            className="h-full"
          >
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {patientRecords?.length || 0}
              </span>
              <span className="ml-1 text-gray-500">records</span>
            </div>
            <Button variant="outline" size="sm">
              View All Records
            </Button>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card
            icon={<User className="h-5 w-5" />}
            title="Your Information"
            hoverable
            className="h-full"
          >
            <ul className="space-y-2 text-gray-600 mb-4">
              <li><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</li>
              <li><span className="font-medium">Email:</span> {user?.email}</li>
              <li><span className="font-medium">Birth Date:</span> {user?.dateOfBirth || 'Not provided'}</li>
            </ul>
            <Button variant="outline" size="sm">
              Update Profile
            </Button>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card
            icon={<Clock className="h-5 w-5" />}
            title="Doctor Role"
            hoverable
            onClick={() => window.location.href = '/roles/request'}
            className="h-full"
          >
            <p className="text-gray-500 mb-4">
              Request doctor role privileges to manage patient records
            </p>
            <Button variant="primary" size="sm">
              Request Access
            </Button>
          </Card>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card title="Current Checkups">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checkup
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
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
                {currentCheckups.map((checkup) => (
                  <tr key={checkup.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{checkup.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{checkup.doctor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{checkup.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        {getStatusIcon(checkup.status)}
                        <span className="ml-1.5 capitalize">{checkup.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to="#" className="text-primary-600 hover:text-primary-900">
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

export default PatientDashboard;