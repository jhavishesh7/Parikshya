import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Plus,
  Edit3,
  Trash2,
  Bell,
  Play,
  Pause,
  Square,
  Timer,
  CheckCircle,
  AlertCircle,
  Zap,
  X
} from 'lucide-react';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  study_hours_per_day: number;
  reminder_time: string;
  pomodoro_duration: number;
  break_duration: number;
  long_break_duration: number;
  topics: string[];
  is_active: boolean;
}

interface StudySession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  topics_covered: string[];
  pomodoro_sessions: number;
}

interface StudyReminder {
  id: string;
  title: string;
  message: string;
  reminder_time: string;
  is_recurring: boolean;
  recurrence_pattern: string;
}

const StudyPlanner: React.FC = () => {
  const { profile } = useAuthStore();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [strongTopics, setStrongTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'topics' | 'planner' | 'timer'>('topics');
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'break' | 'long-break'>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);

  // Form state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    study_hours_per_day: 2,
    reminder_time: '09:00',
    pomodoro_duration: 25,
    break_duration: 5,
    long_break_duration: 15,
    topics: [] as string[]
  });

  const fetchUserData = useCallback(async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile for weak/strong topics
      const { data: profileData } = await supabase
        .from('profiles')
        .select('weak_topics, strong_topics, total_questions_answered, correct_answers, study_streak')
        .eq('id', profile.id)
        .single();
      
      if (profileData) {
        setWeakTopics(profileData.weak_topics || []);
        setStrongTopics(profileData.strong_topics || []);
      }

      // Try to fetch study plans (graceful degradation if table doesn't exist)
      try {
        const { data: plansData } = await supabase
          .from('study_plans')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (plansData) {
          setStudyPlans(plansData);
        }
      } catch (error) {
        console.log('Study plans table not available yet');
      }

      // Try to fetch study sessions (graceful degradation if table doesn't exist)
      try {
        const { data: sessionsData } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .order('start_time', { ascending: false })
          .limit(10);
        
        if (sessionsData) {
          // setStudySessions(sessionsData); // This state was removed
        }
      } catch (error) {
        console.log('Study sessions table not available yet');
      }

      // Try to fetch study reminders (graceful degradation if table doesn't exist)
      try {
        const { data: remindersData } = await supabase
          .from('study_reminders')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_recurring', true)
          .order('reminder_time', { ascending: true });
        
        if (remindersData) {
          // setStudyReminders(remindersData); // This state was removed
        }
      } catch (error) {
        console.log('Study reminders table not available yet');
      }

      // Try to fetch mock test results for enhanced topic analysis
      try {
        const { data: mockResults } = await supabase
          .from('mock_test_results')
          .select('*')
          .eq('user_id', profile.id)
          .order('completed_at', { ascending: false })
          .limit(5);
        
        if (mockResults && mockResults.length > 0) {
          // Enhanced topic analysis based on mock test performance
          console.log('Mock test results available for enhanced analysis');
        }
      } catch (error) {
        console.log('Mock test results table not available yet');
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const createStudyPlan = async () => {
    if (!profile || !planForm.title.trim()) return;
    
    try {
      // Try to create study plan (graceful degradation if table doesn't exist)
      try {
        const { data, error } = await supabase
          .from('study_plans')
          .insert({
            user_id: profile.id,
            title: planForm.title,
            description: planForm.description,
            study_hours_per_day: planForm.study_hours_per_day,
            reminder_time: planForm.reminder_time,
            pomodoro_duration: planForm.pomodoro_duration,
            break_duration: planForm.break_duration,
            long_break_duration: planForm.long_break_duration,
            topics: planForm.topics,
            is_active: true
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setStudyPlans(prev => [data, ...prev]);
          setPlanForm({
            title: '',
            description: '',
            study_hours_per_day: 2,
            reminder_time: '09:00',
            pomodoro_duration: 25,
            break_duration: 5,
            long_break_duration: 15,
            topics: []
          });
          setShowPlanForm(false);
        }
      } catch (error) {
        console.log('Study plans table not available yet, creating local plan');
        // Create local plan for demo purposes
        const newPlan: StudyPlan = {
          id: Date.now().toString(),
          ...planForm,
          is_active: true
        };
        setStudyPlans(prev => [newPlan, ...prev]);
        setPlanForm({
          title: '',
          description: '',
          study_hours_per_day: 2,
          reminder_time: '09:00',
          pomodoro_duration: 25,
          break_duration: 5,
          long_break_duration: 15,
          topics: []
        });
        setShowPlanForm(false);
      }
    } catch (error) {
      console.error('Error creating study plan:', error);
    }
  };

  const startTimer = (plan: StudyPlan) => {
    setCurrentPlan(plan);
    setTimeRemaining(plan.pomodoro_duration * 60);
    setTimerMode('pomodoro');
    setActiveTab('timer');
    // setSessionStartTime(new Date()); // This state was removed
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
    }
  };

  const resetTimer = () => {
    if (currentPlan) {
      setTimeRemaining(currentPlan.pomodoro_duration * 60);
      setTimerMode('pomodoro');
    }
    setIsTimerRunning(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer finished, switch modes
            if (timerMode === 'pomodoro') {
              setTimerMode('break');
              setTimeRemaining(currentPlan?.break_duration || 5 * 60);
            } else if (timerMode === 'break') {
              setTimerMode('long-break');
              setTimeRemaining(currentPlan?.long_break_duration || 15 * 60);
            } else {
              setTimerMode('pomodoro');
              setTimeRemaining(currentPlan?.pomodoro_duration || 25 * 60);
            }
            return timeRemaining;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining, timerMode, currentPlan]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading study planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Study Planner</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'topics'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
            }`}
          >
            Topics Analysis
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'planner'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'timer'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
            }`}
          >
            Pomodoro Timer
          </button>
        </div>
      </div>

      {/* Topics Analysis Tab */}
      {activeTab === 'topics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weak Topics */}
            <div>
              <h4 className="text-red-300 font-medium mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Weak Topics ({weakTopics.length})
              </h4>
              {weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {weakTopics.slice(0, 5).map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
                    >
                      <p className="text-red-300 font-medium">{topic}</p>
                      <p className="text-red-400/70 text-sm">Focus: High Priority</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-600" />
                  <p>No weak topics identified yet.</p>
                  <p className="text-sm">Take some tests to identify areas for improvement.</p>
                </div>
              )}
            </div>

            {/* Strong Topics */}
            <div>
              <h4 className="text-green-300 font-medium mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Strong Topics ({strongTopics.length})
              </h4>
              {strongTopics.length > 0 ? (
                <div className="space-y-2">
                  {strongTopics.slice(0, 5).map((topic, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-green-500/20 border border-green-500/30 rounded-lg p-3"
                    >
                      <p className="text-green-300 font-medium">{topic}</p>
                      <p className="text-green-400/70 text-sm">Strength: High</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p>No strong topics identified yet.</p>
                  <p className="text-sm">Keep practicing to build your strengths.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <h4 className="text-primary-300 font-medium mb-2 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Study Recommendations
            </h4>
            <p className="text-gray-300 text-sm">
              Focus on weak topics first, then maintain your strong areas. 
              Aim for at least 2 hours of focused study daily.
            </p>
          </div>
        </motion.div>
      )}

      {/* Study Plans Tab */}
      {activeTab === 'planner' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Your Study Plans</h3>
            <button
              onClick={() => setShowPlanForm(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Plan</span>
            </button>
          </div>

          {studyPlans.length > 0 ? (
            <div className="space-y-4">
              {studyPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-white font-medium">{plan.title}</h4>
                      <p className="text-gray-400 text-sm">{plan.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startTimer(plan)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        title="Start Study Session"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{plan.study_hours_per_day}h/day</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{plan.pomodoro_duration}min sessions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{plan.reminder_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{plan.topics.length} topics</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">No Study Plans Yet</h3>
              <p className="text-gray-400 mb-4">Create your first study plan to get started with organized learning.</p>
              <button
                onClick={() => setShowPlanForm(true)}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Plan</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Pomodoro Timer Tab */}
      {activeTab === 'timer' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {currentPlan ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Active Study Plan</h3>
                <p className="text-gray-400">{currentPlan.title}</p>
              </div>
              
              <div className="bg-dark-700/50 rounded-2xl p-8 border border-dark-600/50">
                <div className="mb-6">
                  <div className="text-6xl font-mono font-bold text-white mb-4">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-lg text-gray-400 capitalize">
                    {timerMode === 'pomodoro' ? 'Focus Time' : 
                     timerMode === 'break' ? 'Short Break' : 'Long Break'}
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={toggleTimer}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-lg font-semibold text-white mb-2">No Active Study Plan</h3>
              <p className="text-gray-400 mb-4">Select a study plan to start your Pomodoro timer.</p>
              <button
                onClick={() => setActiveTab('planner')}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Choose Study Plan
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Study Plan Form Modal */}
      <AnimatePresence>
        {showPlanForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New Study Plan</h3>
                <button
                  onClick={() => setShowPlanForm(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={planForm.title}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Enter plan title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Describe your study goals..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Hours/Day</label>
                    <input
                      type="number"
                      value={planForm.study_hours_per_day}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, study_hours_per_day: parseInt(e.target.value) || 2 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      min="1"
                      max="8"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Reminder Time</label>
                    <input
                      type="time"
                      value={planForm.reminder_time}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, reminder_time: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Focus (min)</label>
                    <input
                      type="number"
                      value={planForm.pomodoro_duration}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, pomodoro_duration: parseInt(e.target.value) || 25 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      min="15"
                      max="60"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Break (min)</label>
                    <input
                      type="number"
                      value={planForm.break_duration}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, break_duration: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      min="1"
                      max="15"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Long Break (min)</label>
                    <input
                      type="number"
                      value={planForm.long_break_duration}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, long_break_duration: parseInt(e.target.value) || 15 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      min="10"
                      max="30"
                    />
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPlanForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createStudyPlan}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Create Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyPlanner;
