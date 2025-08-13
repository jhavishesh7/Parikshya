import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import DashboardStats from '../components/Dashboard/DashboardStats';
import PerformanceChart from '../components/Dashboard/PerformanceChart';
import ProfileSection from '../components/Dashboard/ProfileSection';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Brain, 
  TrendingUp, 
  Award,
  Zap,
  Star,
  Activity,
  Target,
  TrendingDown
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  exam_type: 'IOE' | 'CEE';
  role: 'student' | 'admin';
  ai_ability_estimate: number;
  total_questions_answered: number;
  correct_answers: number;
  study_streak: number;
  weak_topics: string[];
  strong_topics: string[];
}

interface TestSession {
  id: string;
  session_type: string;
  correct_answers: number;
  total_questions: number;
  created_at: string;
  ai_analysis?: any;
  weak_topics_identified?: string[];
  strong_topics_identified?: string[];
}

const Dashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchTestSessions();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setTestSessions(data || []);
    } catch (error) {
      console.error('Error fetching test sessions:', error);
    }
  };

  const quickActions = [
    {
      title: 'Adaptive Test',
      description: 'AI-powered personalized testing',
      icon: Brain,
      color: 'from-primary-500 to-primary-600',
      action: () => navigate('/exam'),
    },
    {
      title: 'Mock Tests',
      description: 'Practice with timed exams',
      icon: Clock,
      color: 'from-accent-orange-500 to-accent-orange-600',
      action: () => navigate('/mock-tests'),
    },
    {
      title: 'Study Notes',
      description: 'Access comprehensive materials',
      icon: BookOpen,
      color: 'from-accent-green-500 to-accent-green-600',
      action: () => navigate('/notes'),
    },
    {
      title: 'Performance',
      description: 'Track your progress',
      icon: TrendingUp,
      color: 'from-primary-600 to-primary-700',
      action: () => navigate('/dashboard'),
    },
  ];

  if (profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-orange-500 to-accent-green-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
                <p className="text-gray-300 text-lg">Welcome, {profile.full_name}! Manage the platform and monitor performance.</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/admin')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Content Management</h3>
              <p className="text-gray-400">Manage questions, notes, and subjects</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/admin')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-green-500 to-accent-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Analytics Dashboard</h3>
              <p className="text-gray-400">Monitor user performance and AI insights</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/admin')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-orange-500 to-accent-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">AI Configuration</h3>
              <p className="text-gray-400">Configure Gemini AI and adaptive algorithms</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <Header />
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-green-500 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {userProfile?.full_name || profile?.full_name}!
              </h1>
              <p className="text-gray-300 text-lg">
                Ready to continue your {userProfile?.exam_type || profile?.exam_type} exam preparation? 
                <span className="text-accent-green-400 font-medium"> Let's achieve your goals together.</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <DashboardStats />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 text-left group shadow-xl hover:shadow-2xl"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <action.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{action.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{action.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Chart */}
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          
          {/* Enhanced Profile Section */}
          <div className="lg:col-span-1">
            <ProfileSection 
              userProfile={userProfile}
              testSessions={testSessions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;