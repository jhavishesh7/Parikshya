import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import { useAuthStore } from '../store/authStore';
import Header from '../components/Layout/Header';
import QuestionCard from '../components/Exam/QuestionCard';

const ExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { 
    currentSession, 
    timeRemaining, 
    questionIndex, 
    startSession, 
    setTimeRemaining 
  } = useExamStore();

  useEffect(() => {
    if (!currentSession && profile) {
      startSession(profile.exam_type, 'adaptive');
    }
  }, [profile, currentSession, startSession]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, setTimeRemaining]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = currentSession 
    ? (questionIndex / currentSession.total_questions) * 100 
    : 0;

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center">
            <div className="animate-spin w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Preparing your adaptive test...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Exam Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div>
              <h1 className="text-2xl font-bold text-white">
                {currentSession.exam_type} Adaptive Test
              </h1>
              <p className="text-gray-400">
                AI-powered personalized examination
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Progress</span>
              </div>
              <p className="text-white font-bold">
                {questionIndex} / {currentSession.total_questions}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Time Left</span>
              </div>
              <p className={`font-bold font-mono ${
                timeRemaining < 300 ? 'text-red-400' : 'text-white'
              }`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="bg-gray-700 rounded-full h-2 mb-8"
        >
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            style={{ width: `${progressPercentage}%` }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>

        {/* Question Card */}
        <div className="max-w-4xl mx-auto">
          <QuestionCard />
        </div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30"
        >
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Session Type: {currentSession.session_type.toUpperCase()}</span>
            <span>Exam: {currentSession.exam_type}</span>
            <span>Started: {new Date(currentSession.start_time).toLocaleTimeString()}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamPage;