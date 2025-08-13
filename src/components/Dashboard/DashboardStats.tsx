import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const DashboardStats: React.FC = () => {
  const { profile } = useAuthStore();

  if (!profile) return null;

  const accuracyRate = profile.total_questions_answered > 0 
    ? ((profile.correct_answers / profile.total_questions_answered) * 100).toFixed(1)
    : '0';

  const stats = [
    {
      title: 'Questions Answered',
      value: profile.total_questions_answered.toLocaleString(),
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      title: 'Accuracy Rate',
      value: `${accuracyRate}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
    },
    {
      title: 'Study Streak',
      value: `${profile.study_streak} days`,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
    },
    {
      title: 'AI Ability Score',
      value: profile.ai_ability_estimate.toFixed(2),
      icon: Award,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
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