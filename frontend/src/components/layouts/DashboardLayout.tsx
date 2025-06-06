import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ActivitySquare, 
  Users, 
  Upload, 
  User, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Shield 
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../common/Button';

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Navigation links based on user role
  const getNavLinks = () => {
    const commonLinks = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ];

    const roleSpecificLinks = {
      doctor: [
        {
          path: '/upload',
          label: 'Upload Archive',
          icon: <Upload className="h-5 w-5" />,
        },
        {
          path: '/patients',
          label: 'Patients',
          icon: <Users className="h-5 w-5" />,
        },
      ],
      admin: [
        {
          path: '/patients',
          label: 'Patients',
          icon: <Users className="h-5 w-5" />,
        },
        {
          path: '/admin',
          label: 'Admin Panel',
          icon: <Shield className="h-5 w-5" />,
        },
      ],
      patient: [
        {
          path: `/patients/${user?.id}`,
          label: 'My Records',
          icon: <User className="h-5 w-5" />,
        },
        {
          path: '/roles/request',
          label: 'Request Doctor Role',
          icon: <Shield className="h-5 w-5" />,
        },
      ],
    };

    return [
      ...commonLinks,
      ...(user?.role ? roleSpecificLinks[user.role] : []),
    ];
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New upload completed',
      message: 'Patient records for John Doe have been uploaded.',
      time: '5 minutes ago',
    },
    {
      id: 2,
      title: 'Doctor role request',
      message: 'Dr. Maria Johnson requested doctor privileges.',
      time: '1 hour ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <ActivitySquare className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MedRecord</span>
              </div>
            </div>
            <div className="flex items-center">
              {/* Notifications */}
              <div className="ml-4 relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 ring-2 ring-white"></span>
                </button>
                
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                            >
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-500">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-2 border-t border-gray-200">
                          <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                            View all notifications
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Profile dropdown */}
              <div className="ml-4 relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Account Settings
                        </Link>
                        {user?.role === 'doctor' && (
                          <Link
                            to="/roles/review"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Review Requests
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Mobile menu button */}
              <div className="ml-2 -mr-2 flex items-center lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar for desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:border-r lg:border-gray-200 lg:bg-white lg:overflow-y-auto">
          <nav className="mt-8 flex-1 px-4 space-y-1">
            {getNavLinks().map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`mr-3 ${isActive(link.path) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}

            <div className="pt-8">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </div>
              <Link
                to="/settings"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <span className="mr-3 text-gray-400 group-hover:text-gray-500">
                  <Settings className="h-5 w-5" />
                </span>
                Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-error-700"
              >
                <span className="mr-3 text-gray-400 group-hover:text-error-500">
                  <LogOut className="h-5 w-5" />
                </span>
                Logout
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex z-40 lg:hidden"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="px-4 pt-5 pb-4 sm:px-6">
                  <div className="-ml-1 flex items-center justify-between">
                    <div className="flex items-center">
                      <ActivitySquare className="h-8 w-8 text-primary-600" />
                      <span className="ml-2 text-xl font-bold text-gray-900">MedRecord</span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    >
                      <span className="sr-only">Close menu</span>
                      <X className="h-6 w-6 text-gray-400" />
                    </button>
                  </div>
                  <div className="mt-6">
                    <div className="border-t border-gray-200 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                            {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-gray-800">
                            {user?.firstName} {user?.lastName}
                          </div>
                          <div className="text-sm font-medium text-gray-500">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex-1 h-0 overflow-y-auto">
                  <nav className="px-4 space-y-1">
                    {getNavLinks().map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                          isActive(link.path)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className={`mr-4 ${isActive(link.path) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                          {link.icon}
                        </span>
                        {link.label}
                      </Link>
                    ))}
                    <div className="pt-8">
                      <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Settings
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <span className="mr-4 text-gray-400 group-hover:text-gray-500">
                          <Settings className="h-5 w-5" />
                        </span>
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-error-700"
                      >
                        <span className="mr-4 text-gray-400 group-hover:text-error-500">
                          <LogOut className="h-5 w-5" />
                        </span>
                        Logout
                      </button>
                    </div>
                  </nav>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};