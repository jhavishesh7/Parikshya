

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const UsersCRUD: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'student',
    institution: '',
    performance_score: 0,
    questions_attempted: 0,
    questions_correct: 0,
    strong_subjects: '',
    weak_subjects: '',
    study_hours: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  }

  async function handleEdit(u: any) {
    setForm({
      full_name: u.full_name || '',
      email: u.email || '',
      role: u.role || 'student',
      institution: u.institution || '',
      performance_score: u.performance_score || 0,
      questions_attempted: u.questions_attempted || 0,
      questions_correct: u.questions_correct || 0,
      strong_subjects: Array.isArray(u.strong_subjects) ? u.strong_subjects.join(', ') : u.strong_subjects || '',
      weak_subjects: Array.isArray(u.weak_subjects) ? u.weak_subjects.join(', ') : u.weak_subjects || '',
      study_hours: u.study_hours || 0
    });
    setEditingId(u.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const userData = {
        ...form,
        strong_subjects: form.strong_subjects ? form.strong_subjects.split(',').map(subject => subject.trim()) : [],
        weak_subjects: form.weak_subjects ? form.weak_subjects.split(',').map(subject => subject.trim()) : []
      };

      if (editingId) {
        const { error } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([userData]);
        
        if (error) throw error;
      }

      // Reset form
      setForm({
        full_name: '',
        email: '',
        role: 'student',
        institution: '',
        performance_score: 0,
        questions_attempted: 0,
        questions_correct: 0,
        strong_subjects: '',
        weak_subjects: '',
        study_hours: 0
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user data');
    }
  }

  const resetForm = () => {
    setForm({
      full_name: '',
      email: '',
      role: 'student',
      institution: '',
      performance_score: 0,
      questions_attempted: 0,
      questions_correct: 0,
      strong_subjects: '',
      weak_subjects: '',
      study_hours: 0
    });
    setEditingId(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Users Management</h2>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit User' : 'Add New User'}
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full Name"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., IOE, TU"
              value={form.institution}
              onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance Score</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0 - 1.0"
              value={form.performance_score}
              onChange={e => setForm(f => ({ ...f, performance_score: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions Attempted</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of questions"
              value={form.questions_attempted}
              onChange={e => setForm(f => ({ ...f, questions_attempted: parseInt(e.target.value) || 0 }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions Correct</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Number of correct answers"
              value={form.questions_correct}
              onChange={e => setForm(f => ({ ...f, questions_correct: parseInt(e.target.value) || 0 }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Study Hours</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Hours per week"
              value={form.study_hours}
              onChange={e => setForm(f => ({ ...f, study_hours: parseInt(e.target.value) || 0 }))}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Strong Subjects (comma-separated)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Physics, Mathematics"
              value={form.strong_subjects}
              onChange={e => setForm(f => ({ ...f, strong_subjects: e.target.value }))}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Weak Subjects (comma-separated)</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chemistry, Biology"
              value={form.weak_subjects}
              onChange={e => setForm(f => ({ ...f, weak_subjects: e.target.value }))}
            />
          </div>
          
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingId ? 'Update User' : 'Add User'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
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
          <h3 className="text-lg font-semibold text-gray-800">Users</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{u.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.institution || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {u.performance_score ? `${(u.performance_score * 100).toFixed(1)}%` : '-'}
                      </span>
                      {u.questions_attempted > 0 && (
                        <span className="text-xs text-gray-500">
                          ({u.questions_correct}/{u.questions_attempted})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => handleEdit(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersCRUD;
