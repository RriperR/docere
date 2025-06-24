// src/pages/dashboard/PatientDashboard.tsx
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {FileText, CheckCircle, Clock, AlertTriangle, Upload} from 'lucide-react'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { useAuthStore } from '../../stores/authStore'
import { usePatientsStore } from '../../stores/patientsStore'

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
    case 'done':
      return <CheckCircle className="h-5 w-5 text-success-500" />
    case 'processing':
    case 'scheduled':
      return <Clock className="h-5 w-5 text-warning-500" />
    case 'failed':
      return <AlertTriangle className="h-5 w-5 text-error-500" />
    default:
      return null
  }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const PatientDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const {
    currentPatient,
    patientRecords,
    fetchPatientById,
    fetchPatientRecords,
  } = usePatientsStore()

  useEffect(() => {
    if (user?.id != null) {
      const sid = String(user.id)
      fetchPatientById(sid)
      fetchPatientRecords(sid)
    }
  }, [user?.id, fetchPatientById, fetchPatientRecords])

  // Теперь у currentPatient есть camelCase-поля
  const {
    firstName = 'Patient',
    lastName = '',
  } = currentPatient ?? {}

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {firstName} {lastName}
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
              icon={<FileText className="h-5 w-5"/>}
              title="Medical Cards"
              hoverable
              onClick={() => window.location.href = `/patients`}
              className="h-full"
          >
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold text-primary-600">
                ?
              </span>
              <span className="ml-1 text-gray-500">cards</span>
              <span className="text-3xl font-bold text-primary-600">
                ?
              </span>
              <span className="ml-1 text-gray-500">records</span>
            </div>
            <Button variant="outline" size="sm">
              View All Cards
            </Button>
          </Card>
        </motion.div>

        <motion.div variants={{hidden: {opacity: 0, y: 20}, show: {opacity: 1, y: 0}}}>
          <Card
              icon={<Upload className="h-5 w-5"/>}
              title="Upload Archive"
              hoverable
              onClick={() => (window.location.href = '/upload')}
              className="h-full"
          >
            <p className="text-gray-500 mb-4">
              Upload and process new medical records
            </p>
            <Button variant="primary" size="sm">
              Upload Files
            </Button>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card
              icon={<Clock className="h-5 w-5"/>}
              title="Doctor Role"
              hoverable
              onClick={() => (window.location.href = '/roles/request')}
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
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.3, duration: 0.5}}
      >
        <Card title="Your Medical Records">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patientRecords.length > 0 ? (
                  patientRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {rec.visit_date
                          ? new Date(rec.visit_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rec.appointment_location || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rec.notes || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(rec.doctor ? 'done' : 'processing')}
                          <span className="ml-1 capitalize">
                            {rec.doctor ? 'Completed' : 'Processing'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          to={`/patients/${user?.id}/records/${rec.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          View Record
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PatientDashboard
