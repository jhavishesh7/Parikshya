import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface DashboardStatsProps {
  loading?: boolean;
  userProfile?: any; // Add this prop to receive fresh profile data
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ loading = false, userProfile }) => {
  const { profile } = useAuthStore();
  
  // Use fresh profile data if available, otherwise fall back to store
  const currentProfile = userProfile || profile;

  if (!currentProfile) return null;

  const accuracyRate = currentProfile.total_questions_answered > 0 
    ? ((currentProfile.correct_answers / currentProfile.total_questions_answered) * 100).toFixed(1)
    : '0';

  const stats = [
    {
      title: 'Questions Answered',
      value: currentProfile.total_questions_answered.toLocaleString(),
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      title: 'Accuracy Rate',
      value: `${accuracyRate}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
    },
    {
      title: 'Study Streak',
      value: `${currentProfile.study_streak || 0} days`,
      icon: Clock,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-600/10',
      textColor: 'text-blue-400',
    },
    {
      title: 'AI Ability Score',
      value: (currentProfile.ai_ability_estimate || 0).toFixed(2),
      icon: Award,
      color: 'from-blue-700 to-blue-800',
      bgColor: 'bg-blue-700/10',
      textColor: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {loading && (
        <div className="col-span-full text-center py-4">
          <div className="inline-flex items-center space-x-2 text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Updating dashboard data...</span>
          </div>
        </div>
      )}
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`}></div>
          </div>
          
          <div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.title}</p>
          </div>

          <div className="mt-4">
            <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full`}></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;