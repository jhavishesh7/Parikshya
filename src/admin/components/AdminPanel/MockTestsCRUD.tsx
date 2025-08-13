import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

const MockTestsCRUD: React.FC = () => {
  const { profile } = useAuthStore();
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject_id: '',
    exam_type: 'IOE' as 'IOE' | 'CEE',
    duration_minutes: 60,
    total_questions: 20,
    difficulty_level: 'moderate' as 'easy' | 'moderate' | 'difficult',
    instructions: '',
    passing_score: 60
  });

  useEffect(() => {
    fetchMockTests();
    fetchSubjects();
  }, []);

  const fetchMockTests = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!profile?.id) {
        console.error('No authenticated user found');
        setMockTests([]);
        return;
      }
      
      console.log('User authenticated:', profile.id);
      
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('mock_tests')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Table check error:', tableCheckError);
        if (tableCheckError.code === 'PGRST116') {
          // Table doesn't exist
          setMockTests([]);
          return;
        }
      }
      
      // Try a simpler query first to avoid join issues
      console.log('Attempting to fetch mock tests...');
      
      // First try to get just the count to see if we can access the table
      const { count, error: countError } = await supabase
        .from('mock_tests')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Count query error:', countError);
        throw countError;
      }
      
      console.log(`Found ${count} mock tests, now fetching details...`);
      
      const { data, error } = await supabase
        .from('mock_tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching mock tests:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setMockTests([]);
      } else {
        setMockTests(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setMockTests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' || name === 'total_questions' || name === 'passing_score' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.subject_id) {
      alert('Please select a subject');
      return;
    }

    try {
      setLoading(true);
      
      const testData = {
        ...form,
        created_by: profile?.id
      };
      
      if (editing) {
        const { error } = await supabase
          .from('mock_tests')
          .update(testData)
          .eq('id', editing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mock_tests')
          .insert([testData]);
        
        if (error) throw error;
      }
      
      // Reset form
      setForm({
        name: '',
        description: '',
        subject_id: '',
        exam_type: 'IOE',
        duration_minutes: 60,
        total_questions: 20,
        difficulty_level: 'moderate',
        instructions: '',
        passing_score: 60
      });
      setEditing(null);
      fetchMockTests();
      
    } catch (error) {
      console.error('Error saving mock test:', error);
      alert('Error saving mock test');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test: any) => {
    setForm({
      name: test.name || '',
      description: test.description || '',
      subject_id: test.subject_id || '',
      exam_type: test.exam_type || 'IOE',
      duration_minutes: test.duration_minutes || 60,
      total_questions: test.total_questions || 20,
      difficulty_level: test.difficulty_level || 'moderate',
      instructions: test.instructions || '',
      passing_score: test.passing_score || 60
    });
    setEditing(test);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this mock test?')) {
      try {
        const { error } = await supabase
          .from('mock_tests')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchMockTests();
      } catch (error) {
        console.error('Error deleting mock test:', error);
        alert('Error deleting mock test');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      subject_id: '',
      exam_type: 'IOE',
      duration_minutes: 60,
      total_questions: 20,
      difficulty_level: 'moderate',
      instructions: '',
      passing_score: 60
    });
    setEditing(null);
  };

  if (loading && mockTests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">Loading mock tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
        <h2 className="text-2xl font-bold text-white mb-6">Mock Tests Management</h2>
        
        {/* Form */}
        <div className="bg-dark-700/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            {editing ? 'Edit Mock Test' : 'Create New Mock Test'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Test Name *</label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  placeholder="Enter test name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject *</label>
                <select
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleChange}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty Level</label>
              <select
                name="difficulty_level"
                value={form.difficulty_level}
                onChange={handleChange}
                className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
                <input
                  name="duration_minutes"
                  type="number"
                  min="15"
                  max="300"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Passing Score (%)</label>
                <input
                  name="passing_score"
                  type="number"
                  min="0"
                  max="100"
                  value={form.passing_score}
                  onChange={handleChange}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:border-transparent"
                  placeholder="60"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                placeholder="Brief description of the test"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Instructions</label>
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                placeholder="Instructions for students taking this test..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent-green-500 hover:bg-accent-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editing ? 'Update Mock Test' : 'Create Mock Test')}
              </button>
              
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Note about new creation method */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">ℹ</span>
            </div>
            <div>
              <p className="font-medium text-blue-400">New Mock Test Creation Method</p>
              <p className="text-sm text-blue-300 mt-1">
                Mock tests are now created by selecting questions from the Questions table. 
                Go to the "Upload Files" section → "Mock Tests" tab to create tests with question selection.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mock Tests Table */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-dark-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700/50">
          <h3 className="text-lg font-semibold text-white">Mock Tests ({mockTests.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700/50">
            <thead className="bg-dark-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-dark-800/30 divide-y divide-dark-700/50">
              {mockTests.map(test => (
                <tr key={test.id} className="hover:bg-dark-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <div>
                      <div className="font-medium">{test.name}</div>
                      {test.description && (
                        <div className="text-gray-400 text-xs truncate max-w-xs">
                          {test.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                      {test.subjects?.display_name || test.subject_id}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {test.duration_minutes} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      test.status === 'ready' ? 'bg-green-500/20 text-green-300' :
                      test.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {test.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      test.difficulty_level === 'easy' ? 'bg-green-500/20 text-green-300' :
                      test.difficulty_level === 'moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {test.difficulty_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(test)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(test.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {mockTests.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No mock tests found. Create your first mock test above!
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestsCRUD;
