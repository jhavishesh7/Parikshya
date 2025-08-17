import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, BookOpen, Home, Target, FileText, Brain, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
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
    <>
      <motion.header 
        className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 shadow-2xl border-b border-primary-600/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <motion.div 
              className="flex items-center space-x-2 sm:space-x-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div 
                className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                <BookOpen className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary-400 via-white to-accent-green-400 bg-clip-text text-transparent truncate">
                  Parikshya
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">AI-Powered Adaptive Testing Platform</p>
              </div>
            </motion.div>

            {/* Navigation - Hidden on mobile */}
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
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-2 bg-dark-700/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-dark-600/50">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-accent-orange-500 to-accent-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="text-white font-medium text-xs sm:text-sm hidden sm:block">{profile?.full_name || 'User'}</span>
                  <span className="text-white font-medium text-xs sm:text-sm sm:hidden">{profile?.email?.split('@')[0] || 'User'}</span>
                </div>
                
                <motion.button
                  onClick={handleSignOut}
                  className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 shadow-lg shadow-red-600/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-dark-900 z-50 border-l border-dark-700/50 shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-dark-700/50">
              <h2 className="text-2xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-700/50 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex flex-col h-full">
              <div className="flex-1 p-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-5 py-4 rounded-xl text-base font-medium transition-all duration-200 flex items-center space-x-4 mb-3 ${
                        isActive(item.path)
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                          : 'text-gray-300 hover:text-white hover:bg-dark-700/50'
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* User Info in Mobile Menu */}
              <div className="p-6 pt-0 border-t border-dark-700/50">
                <div className="flex items-center space-x-4 px-5 py-4 bg-dark-700/50 rounded-xl mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-orange-500 to-accent-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-left truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-gray-400 text-sm text-left truncate">{profile?.email || 'user@example.com'}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-5 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg shadow-red-600/25"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;