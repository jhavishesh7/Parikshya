import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, BookOpen, Home, Target, FileText, Brain } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/exam', label: 'Adaptive Test', icon: Brain },
    { path: '/mock-tests', label: 'Mock Tests', icon: Target },
    { path: '/notes', label: 'Study Notes', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
      className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 shadow-2xl border-b border-primary-600/30 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div 
              className="w-12 h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow"
              onClick={() => navigate('/dashboard')}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-white to-accent-green-400 bg-clip-text text-transparent">
                NEB Exam Platform
              </h1>
              <p className="text-sm text-gray-300">AI-Powered Adaptive Testing</p>
            </div>
          </motion.div>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive(item.path)
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                        : 'text-gray-300 hover:text-white hover:bg-dark-700/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          )}

          {/* User Profile and Actions */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-dark-700/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-dark-600/50">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-orange-500 to-accent-green-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium text-sm">{profile?.full_name || 'User'}</span>
              </div>
              
              <motion.button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-red-600/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;