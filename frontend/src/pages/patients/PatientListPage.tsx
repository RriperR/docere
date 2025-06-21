import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Calendar, FileText} from 'lucide-react'
import { format } from 'date-fns'

import { Card } from '../../components/common/Card'
import { Input } from '../../components/common/Input'
import { Button } from '../../components/common/Button'
import { usePatientsStore } from '../../stores/patientsStore'

const PatientListPage: React.FC = () => {
  const {
    filteredPatients,
    fetchPatients,
    searchPatients,
    filterPatientsByDate,
    isLoading,
    error,
  } = usePatientsStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const patientsPerPage = 10
  const indexLast  = currentPage * patientsPerPage
  const indexFirst = indexLast - patientsPerPage
  const current    = filteredPatients.slice(indexFirst, indexLast)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  useEffect(() => {
    searchPatients(searchQuery)
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    filterPatientsByDate(startDate, endDate)
    setCurrentPage(1)
  }, [startDate, endDate])

  const changePage = (n: number) => {
    if (n < 1 || n > totalPages) return
    setCurrentPage(n)
  }

  if (isLoading) {
    return <p className="text-center py-20">Loading patients…</p>
  }
  if (error) {
    return <p className="text-center py-20 text-red-600">{error}</p>
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Patient List</h1>
        <p className="text-gray-500">View and manage your patients.</p>
      </motion.div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search patients…"
            icon={<Search className="h-5 w-5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Input
            type="date"
            icon={<Calendar className="h-5 w-5" />}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            icon={<Calendar className="h-5 w-5" />}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Patient', 'DOB', 'Last Visit', 'Records', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {current.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-gray-500 text-sm">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {p.birthday
                      ? format(new Date(p.birthday), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {p.lastVisit
                      ? format(new Date(p.lastVisit), 'MMM d, yyyy')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-1" />
                      {p.recordCount ?? 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link to={`/patients/${p.id}`} className="text-primary-600 hover:underline">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t">
            <Button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </Button>
            <div className="space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? 'outline' : 'outline'}
                  onClick={() => changePage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default PatientListPage
