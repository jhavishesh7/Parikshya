import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { 
  User, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Clock, 
  Award,
  Brain,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle
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

interface ProfileSectionProps {
  userProfile: Profile | null;
  testSessions: TestSession[];
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ userProfile, testSessions }) => {
  const { profile, signOut } = useAuthStore();

  const currentProfile = userProfile || profile;
  
  // Calculate performance metrics
  const accuracyPercentage = currentProfile?.total_questions_answered 
    ? Math.round((currentProfile.correct_answers / currentProfile.total_questions_answered) * 100)
    : 0;

  const averageScore = testSessions.length > 0
    ? Math.round(testSessions.reduce((sum, session) => 
        sum + (session.correct_answers / session.total_questions) * 100, 0) / testSessions.length)
    : 0;

  // Get unique weak and strong topics from recent sessions
  const recentWeakTopics = Array.from(new Set(
    testSessions
      .filter(session => session.weak_topics_identified)
      .flatMap(session => session.weak_topics_identified || [])
  )).slice(0, 5);

  const recentStrongTopics = Array.from(new Set(
    testSessions
      .filter(session => session.strong_topics_identified)
      .flatMap(session => session.strong_topics_identified || [])
  )).slice(0, 5);

  // Example customer care info
  const customerCare = {
    email: 'parikshya.blackbytes@gmail.com',
    phone: '+977-9820987206',
    
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentProfile?.full_name || 'User'}</h2>
            <p className="text-blue-400 font-medium">{currentProfile?.exam_type || 'Student'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
            <p className="text-gray-400 text-sm">Questions</p>
            <p className="text-white font-bold text-lg">{currentProfile?.total_questions_answered || 0}</p>
          </div>
          <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
            <p className="text-gray-400 text-sm">Accuracy</p>
            <p className="text-white font-bold text-lg">{accuracyPercentage}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Active</span>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Performance Overview</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">Average Score</span>
            </div>
            <span className="text-white font-bold">{averageScore}%</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">Study Streak</span>
            </div>
            <span className="text-white font-bold">{currentProfile?.study_streak || 0} days</span>
          </div>
        </div>
      </motion.div>

      {/* Weak Topics */}
      {recentWeakTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span>Focus Areas</span>
          </h3>
          
          <div className="space-y-3">
            {recentWeakTopics.map((topic, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">{topic}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-orange-400 text-sm">
              <strong>Tip:</strong> Focus on these areas to improve your overall performance.
            </p>
          </div>
        </motion.div>
      )}

      {/* Strong Topics */}
      {recentStrongTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Strong Areas</span>
          </h3>
          
          <div className="space-y-3">
            {recentStrongTopics.map((topic, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">{topic}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              <strong>Great job!</strong> Keep practicing these topics to maintain your strength.
            </p>
          </div>
        </motion.div>
      )}

      {/* Recent Test Performance */}
      {testSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Recent Tests</span>
          </h3>
          
          <div className="space-y-3">
            {testSessions.slice(0, 3).map((session, index) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{session.session_type}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">
                    {session.correct_answers}/{session.total_questions}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {Math.round((session.correct_answers / session.total_questions) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Customer Care */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <span>Need Help?</span>
        </h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-400">Email: <span className="text-white">{customerCare.email}</span></p>
          <p className="text-gray-400">Phone: <span className="text-white">{customerCare.phone}</span></p>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSection;
