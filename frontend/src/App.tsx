import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from './components/common/LoadingScreen';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { useAuthStore } from './stores/authStore';

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DoctorDashboard = lazy(() => import('./pages/dashboard/DoctorDashboard'));
const PatientDashboard = lazy(() => import('./pages/dashboard/PatientDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const UploadPage = lazy(() => import('./pages/upload/UploadPage'));
const UploadStatusPage = lazy(() => import('./pages/upload/UploadStatusPage'));
const PatientListPage = lazy(() => import('./pages/patients/PatientListPage'));
const PatientDetailsPage = lazy(() => import('./pages/patients/PatientDetailsPage'));
const DoctorRequestPage = lazy(() => import('./pages/roles/DoctorRequestPage'));
const AdminPanelPage = lazy(() => import('./pages/admin/AdminPanelPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccountSettingsPage = lazy(() => import('./pages/settings/AccountSettingsPage'));
const ReviewRequestsPage = lazy(() => import('./pages/roles/ReviewRequestsPage'));
const ShareRequestForm  = lazy(() => import('./pages/ShareRequestForm'));
const ShareRequestsPage  = lazy(() => import('./pages/ShareRequestsPage'));

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Role-specific dashboards */}
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  user?.role === 'doctor' ? (
                    <Navigate to="/dashboard/doctor\" replace />
                  ) : user?.role === 'admin' ? (
                    <Navigate to="/dashboard/admin" replace />
                  ) : (
                    <Navigate to="/dashboard/patient" replace />
                  )
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              } 
            />
            
            <Route 
              path="/dashboard/doctor" 
              element={
                <RoleRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/dashboard/patient" 
              element={
                <RoleRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/dashboard/admin" 
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              } 
            />

            {/* Common protected routes */}
            <Route 
              path="/upload" 
              element={
                <RoleRoute allowedRoles={['doctor']}>
                  <UploadPage />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/upload/status/:jobId" 
              element={
                <RoleRoute allowedRoles={['doctor', 'admin', 'patient']}>
                  <UploadStatusPage />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/patients" 
              element={
                <RoleRoute allowedRoles={['doctor', 'admin', 'patient']}>
                  <PatientListPage />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/patients/:id" 
              element={
                <RoleRoute allowedRoles={['doctor', 'admin', 'patient']}>
                  <PatientDetailsPage />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/roles/request" 
              element={
                <RoleRoute allowedRoles={['patient']}>
                  <DoctorRequestPage />
                </RoleRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminPanelPage />
                </RoleRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={<AccountSettingsPage />} 
            />
            <Route 
              path="/roles/review" 
              element={
                <RoleRoute allowedRoles={['doctor']}>
                  <ReviewRequestsPage />
                </RoleRoute>
              } 
            />
          </Route>
        </Route>

        {/* Redirect from root to dashboard or login */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard\" replace />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          } 
        />

        {/* для доктора: форма отправки */}
        <Route path="/share/new" element={<ShareRequestForm />} />
        {/* для и доктора, и пациента: список запросов */}
        <Route path="/share/requests" element={<ShareRequestsPage />} />

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;