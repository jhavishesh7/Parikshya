import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const AnalyticsCRUD: React.FC = () => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    user_id: '',
    test_session_id: '',
    subject: '',
    topic: '',
    score: 0,
    time_taken: 0,
    questions_attempted: 0,
    correct_answers: 0,
    weak_areas: '',
    strong_areas: '',
    recommendations: '',
    ai_insights: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching analytics:', error);
        if (error.code === '42P01') {
          // Table doesn't exist
          setTableExists(false);
        }
      } else {
        setAnalytics(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setTableExists(false);
    } finally {
      setLoading(false);
    }
  };

  // If table doesn't exist, show a message
  if (!tableExists) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Analytics Management</h2>
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Analytics Table Not Available</h3>
            <p className="text-yellow-200 mb-4">
              The analytics table has not been created yet. Please run the database migration to enable analytics features.
            </p>
            <div className="bg-dark-700/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">To enable analytics:</h4>
              <ol className="text-sm text-gray-300 space-y-1 text-left">
                <li>1. Run the database migration: <code className="bg-dark-600 px-2 py-1 rounded">npx supabase db reset</code></li>
                <li>2. Or apply the migration manually</li>
                <li>3. Refresh this page after migration</li>
              </ol>
            </div>
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
          <p className="text-gray-400 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const analyticsData = {
        ...form,
        weak_areas: form.weak_areas ? form.weak_areas.split(',').map(area => area.trim()) : [],
        strong_areas: form.strong_areas ? form.strong_areas.split(',').map(area => area.trim()) : [],
        ai_insights: form.ai_insights ? JSON.parse(form.ai_insights) : {}
      };

      if (editingId) {
        const { error } = await supabase
          .from('analytics')
          .update(analyticsData)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('analytics')
          .insert([analyticsData]);
        
        if (error) throw error;
      }

      // Reset form
      setForm({
        user_id: '',
        test_session_id: '',
        subject: '',
        topic: '',
        score: 0,
        time_taken: 0,
        questions_attempted: 0,
        correct_answers: 0,
        weak_areas: '',
        strong_areas: '',
        recommendations: '',
        ai_insights: ''
      });
      
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving analytics:', error);
      alert('Error saving analytics data');
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      ...item,
      weak_areas: Array.isArray(item.weak_areas) ? item.weak_areas.join(', ') : item.weak_areas || '',
      strong_areas: Array.isArray(item.strong_areas) ? item.strong_areas.join(', ') : item.strong_areas || '',
      ai_insights: typeof item.ai_insights === 'object' ? JSON.stringify(item.ai_insights) : item.ai_insights || ''
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this analytics record?')) {
      try {
        const { error } = await supabase
          .from('analytics')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchAnalytics();
      } catch (error) {
        console.error('Error deleting analytics:', error);
        alert('Error deleting analytics record');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Analytics Management</h2>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Analytics' : 'Add New Analytics'}
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter user ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Session ID</label>
            <input
              type="text"
              value={form.test_session_id}
              onChange={(e) => setForm({ ...form, test_session_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter test session ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Physics, Chemistry"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mechanics, Organic Chemistry"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: parseFloat(e.target.value) || 0 })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0-100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Taken (minutes)</label>
            <input
              type="number"
              min="0"
              value={form.time_taken}
              onChange={(e) => setForm({ ...form, time_taken: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Time in minutes"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions Attempted</label>
            <input
              type="number"
              min="0"
              value={form.questions_attempted}
              onChange={(e) => setForm({ ...form, questions_attempted: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of questions"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answers</label>
            <input
              type="number"
              min="0"
              value={form.correct_answers}
              onChange={(e) => setForm({ ...form, correct_answers: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of correct answers"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Weak Areas (comma-separated)</label>
            <input
              type="text"
              value={form.weak_areas}
              onChange={(e) => setForm({ ...form, weak_areas: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mechanics, Thermodynamics"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Strong Areas (comma-separated)</label>
            <input
              type="text"
              value={form.strong_areas}
              onChange={(e) => setForm({ ...form, strong_areas: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Algebra, Geometry"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
            <textarea
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Study recommendations..."
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Insights (JSON format)</label>
            <textarea
              value={form.ai_insights}
              onChange={(e) => setForm({ ...form, ai_insights: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder='{"insight": "value"}'
            />
          </div>
          
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingId ? 'Update Analytics' : 'Add Analytics'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    user_id: '',
                    test_session_id: '',
                    subject: '',
                    topic: '',
                    score: 0,
                    time_taken: 0,
                    questions_attempted: 0,
                    correct_answers: 0,
                    weak_areas: '',
                    strong_areas: '',
                    recommendations: '',
                    ai_insights: ''
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Analytics Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{item.subject}</div>
                      {item.topic && <div className="text-gray-500 text-xs">{item.topic}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.score >= 80 ? 'bg-green-100 text-green-800' :
                      item.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.correct_answers}/{item.questions_attempted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.time_taken} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {analytics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No analytics records found
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCRUD;
