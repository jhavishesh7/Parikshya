

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const AIInteractionsCRUD: React.FC = () => {
  const [ai, setAI] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    user_id: '',
    interaction_type: '',
    query_text: '',
    ai_response: '',
    context_data: '',
    created_at: ''
  });

  useEffect(() => { 
    fetchAI(); 
  }, []);

  async function fetchAI() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching AI interactions:', error);
      } else {
        setAI(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const aiData = {
        ...form,
        context_data: form.context_data ? JSON.parse(form.context_data) : {}
      };

      if (editingId) {
        const { error } = await supabase
          .from('ai_interactions')
          .update(aiData)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('ai_interactions')
          .insert([aiData]);
        
        if (error) throw error;
      }

      // Reset form
      setForm({
        user_id: '',
        interaction_type: '',
        query_text: '',
        ai_response: '',
        context_data: '',
        created_at: ''
      });
      
      fetchAI();
    } catch (error) {
      console.error('Error saving AI interaction:', error);
      alert('Error saving AI interaction data');
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      ...item,
      context_data: typeof item.context_data === 'object' ? JSON.stringify(item.context_data) : item.context_data || ''
    });
    setEditingId(item.id);
  };

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this AI interaction?')) {
      try {
        const { error } = await supabase
          .from('ai_interactions')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchAI();
      } catch (error) {
        console.error('Error deleting AI interaction:', error);
        alert('Error deleting AI interaction');
      }
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading AI interactions...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">AI Interactions Management</h2>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit AI Interaction' : 'Add New AI Interaction'}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Interaction Type</label>
            <select
              value={form.interaction_type}
              onChange={(e) => setForm({ ...form, interaction_type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select type</option>
              <option value="question_generation">Question Generation</option>
              <option value="explanation">Explanation</option>
              <option value="study_plan">Study Plan</option>
              <option value="feedback">Feedback</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Query Text</label>
            <textarea
              value={form.query_text}
              onChange={(e) => setForm({ ...form, query_text: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter the user's query..."
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Response</label>
            <textarea
              value={form.ai_response}
              onChange={(e) => setForm({ ...form, ai_response: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter the AI's response..."
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Context Data (JSON format)</label>
            <textarea
              value={form.context_data}
              onChange={(e) => setForm({ ...form, context_data: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder='{"subject": "Physics", "topic": "Mechanics"}'
            />
          </div>
          
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingId ? 'Update Interaction' : 'Add Interaction'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    user_id: '',
                    interaction_type: '',
                    query_text: '',
                    ai_response: '',
                    context_data: '',
                    created_at: ''
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
          <h3 className="text-lg font-semibold text-gray-800">AI Interactions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ai.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.interaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={item.query_text}>
                      {item.query_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={item.ai_response}>
                      {item.ai_response}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.user_id}
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
        
        {ai.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No AI interactions found
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInteractionsCRUD;
