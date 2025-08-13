import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Brain, 
  Target, 
  TrendingUp, 
  Database,
  BarChart3,
  Shield,
  Zap,
  Upload
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import UsersCRUD from './UsersCRUD';
import QuestionsCRUD from './QuestionsCRUD';
import NotesCRUD from './NotesCRUD';
import MockTestsCRUD from './MockTestsCRUD';
import SessionsCRUD from './SessionsCRUD';
import AIInteractionsCRUD from './AIInteractionsCRUD';
import AnalyticsCRUD from './AnalyticsCRUD';
import FileUploadForm from './FileUploadForm';

const AdminPanel: React.FC = () => {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuestions: 0,
    totalNotes: 0,
    totalSessions: 0,
    totalAIInteractions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: questionsCount },
        { count: notesCount },
        { count: sessionsCount },
        { count: aiCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('test_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('ai_interactions').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalQuestions: questionsCount || 0,
        totalNotes: notesCount || 0,
        totalSessions: sessionsCount || 0,
        totalAIInteractions: aiCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values if tables don't exist yet
      setStats({
        totalUsers: 0,
        totalQuestions: 0,
        totalNotes: 0,
        totalSessions: 0,
        totalAIInteractions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const adminTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      color: 'from-primary-500 to-primary-600'
    },
    {
      id: 'upload',
      label: 'Upload Files',
      icon: Upload,
      color: 'from-accent-green-500 to-accent-green-600'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      color: 'from-accent-green-500 to-accent-green-600'
    },
    {
      id: 'questions',
      label: 'Questions',
      icon: FileText,
      color: 'from-accent-orange-500 to-accent-orange-600'
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: BookOpen,
      color: 'from-primary-600 to-primary-700'
    },
    {
      id: 'mocktests',
      label: 'Mock Tests',
      icon: Target,
      color: 'from-accent-green-600 to-accent-green-700'
    },
    {
      id: 'sessions',
      label: 'Test Sessions',
      icon: TrendingUp,
      color: 'from-accent-orange-600 to-accent-orange-700'
    },
    {
      id: 'ai',
      label: 'AI Interactions',
      icon: Brain,
      color: 'from-primary-700 to-primary-800'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Database,
      color: 'from-accent-green-700 to-accent-green-800'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-green-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-gray-300 text-lg">Welcome, {profile?.full_name}! Manage the platform and monitor performance.</p>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-green-500 to-accent-green-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Questions</p>
                    <p className="text-3xl font-bold text-white">{stats.totalQuestions}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-orange-500 to-accent-orange-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Notes</p>
                    <p className="text-3xl font-bold text-white">{stats.totalNotes}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Test Sessions</p>
                    <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-orange-600 to-accent-orange-700 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">AI Interactions</p>
                    <p className="text-3xl font-bold text-white">{stats.totalAIInteractions}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-700 to-primary-800 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Quick Actions</p>
                    <p className="text-lg font-semibold text-white">Manage Platform</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-green-600 to-accent-green-700 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="w-full px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Upload Files
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className="w-full px-3 py-2 bg-accent-green-500 hover:bg-accent-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Questions
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case 'upload':
        return <FileUploadForm />;
      case 'users':
        return <UsersCRUD />;
      case 'questions':
        return <QuestionsCRUD />;
      case 'notes':
        return <NotesCRUD />;
      case 'mocktests':
        return <MockTestsCRUD />;
      case 'sessions':
        return <SessionsCRUD />;
      case 'ai':
        return <AIInteractionsCRUD />;
      case 'analytics':
        return <AnalyticsCRUD />;
      default:
        return <div>Select a tab</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-lg scale-105'
                    : 'bg-dark-800/50 text-gray-300 hover:bg-dark-700/50 hover:text-white border border-dark-700/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
