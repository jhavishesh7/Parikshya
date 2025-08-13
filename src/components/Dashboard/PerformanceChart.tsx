import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';

const PerformanceChart: React.FC = () => {
  const { profile } = useAuthStore();
  const [performanceData, setPerformanceData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'area'>('line');
  const [loading, setLoading] = useState(true);
  const [focusAreas, setFocusAreas] = useState<any>({});

  useEffect(() => {
    fetchPerformanceData();
    fetchSubjectData();
    fetchFocusAreas();
  }, [profile]);

  const fetchPerformanceData = async () => {
    if (!profile) return;

    try {
      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(15);

      if (sessions) {
        const chartData = sessions.map((session, index) => ({
          session: `Test ${index + 1}`,
          accuracy: session.questions_attempted > 0 
            ? (session.correct_answers / session.questions_attempted) * 100 
            : 0,
          ability: session.ai_ability_end || session.ai_ability_start,
          questions: session.questions_attempted,
          date: new Date(session.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          score: session.questions_attempted > 0 
            ? Math.round((session.correct_answers / session.questions_attempted) * 100)
            : 0
        }));
        setPerformanceData(chartData);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectData = async () => {
    if (!profile) return;

    try {
      const { data: responses } = await supabase
        .from('responses')
        .select(`
          *,
          questions!inner(
            *,
            subjects!inner(*)
          ),
          test_sessions!inner(user_id)
        `)
        .eq('test_sessions.user_id', profile.id);

      if (responses) {
        const subjectStats = responses.reduce((acc: any, response: any) => {
          const subjectName = response.questions.subjects.display_name;
          if (!acc[subjectName]) {
            acc[subjectName] = { correct: 0, total: 0, topics: new Set() };
          }
          acc[subjectName].total++;
          if (response.is_correct) {
            acc[subjectName].correct++;
          }
          if (response.questions.topic) {
            acc[subjectName].topics.add(response.questions.topic);
          }
          return acc;
        }, {});

        const chartData = Object.entries(subjectStats).map(([subject, stats]: [string, any]) => ({
          subject,
          accuracy: ((stats.correct / stats.total) * 100).toFixed(1),
          questions: stats.total,
          correct: stats.correct,
          topics: Array.from(stats.topics).slice(0, 3), // Top 3 topics
          percentage: parseFloat(((stats.correct / stats.total) * 100).toFixed(1))
        }));

        setSubjectData(chartData);
      }
    } catch (error) {
      console.error('Error fetching subject data:', error);
    }
  };

  const fetchFocusAreas = async () => {
    if (!profile) return;

    try {
      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('weak_topics_identified, strong_topics_identified, ai_analysis')
        .eq('user_id', profile.id)
        .not('weak_topics_identified', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sessions) {
        const weakTopics = new Map();
        const strongTopics = new Map();

        sessions.forEach(session => {
          if (session.weak_topics_identified) {
            session.weak_topics_identified.forEach((topic: string) => {
              weakTopics.set(topic, (weakTopics.get(topic) || 0) + 1);
            });
          }
          if (session.strong_topics_identified) {
            session.strong_topics_identified.forEach((topic: string) => {
              strongTopics.set(topic, (strongTopics.get(topic) || 0) + 1);
            });
          }
        });

        setFocusAreas({
          weak: Array.from(weakTopics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic, count]) => ({ topic, count })),
          strong: Array.from(strongTopics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic, count]) => ({ topic, count }))
        });
      }
    } catch (error) {
      console.error('Error fetching focus areas:', error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <span>Performance Analytics</span>
          </h3>
          <div className="flex space-x-2">
            {['line', 'bar', 'pie', 'area'].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ${
                  chartType === type
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  name="Score %"
                />
                <Line 
                  type="monotone" 
                  dataKey="ability" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  name="AI Ability"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="subject" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Bar dataKey="percentage" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="questions"
                  label={({ subject, questions }) => `${subject}: ${questions}`}
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {chartType === 'area' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Subject Performance Summary */}
      {subjectData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-accent-green-400" />
            <span>Subject Performance</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectData.map((subject, index) => (
              <div key={subject.subject} className="p-4 bg-dark-700/30 rounded-lg border border-dark-600/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-semibold">{subject.subject}</h4>
                  <span className={`text-sm font-bold ${
                    subject.percentage >= 80 ? 'text-accent-green-400' :
                    subject.percentage >= 60 ? 'text-accent-orange-400' : 'text-red-400'
                  }`}>
                    {subject.percentage}%
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-400">
                    Questions: <span className="text-white">{subject.questions}</span>
                  </p>
                  <p className="text-gray-400">
                    Correct: <span className="text-white">{subject.correct}</span>
                  </p>
                  {subject.topics.length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Topics:</p>
                      <div className="flex flex-wrap gap-1">
                        {subject.topics.map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Focus Areas */}
      {(focusAreas.weak?.length > 0 || focusAreas.strong?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Weak Topics */}
          {focusAreas.weak?.length > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-accent-orange-400" />
                <span>Focus Areas</span>
              </h3>
              <div className="space-y-3">
                {focusAreas.weak.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg border border-dark-600/30">
                    <span className="text-white font-medium">{item.topic}</span>
                    <span className="text-accent-orange-400 text-sm font-semibold">
                      {item.count} times
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Topics */}
          {focusAreas.strong?.length > 0 && (
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-accent-green-400" />
                <span>Strong Areas</span>
              </h3>
              <div className="space-y-3">
                {focusAreas.strong.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg border border-dark-600/30">
                    <span className="text-white font-medium">{item.topic}</span>
                    <span className="text-accent-green-400 text-sm font-semibold">
                      {item.count} times
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PerformanceChart;