

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

type Subject = {
  id: string;
  name: string;
  display_name: string;
  applicable_exams: string[];
};

const QuestionsCRUD: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    difficulty: 'easy',
    subject_id: '',
    exam_types: ['IOE'],
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
  }, []);
  
  // Refetch questions when filters, sorting, or pagination change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchQuestions();
  }, [searchTerm, selectedDifficulty, selectedSubject, sortBy, sortOrder]);
  
  // Refetch questions when page changes
  useEffect(() => {
    fetchQuestions();
  }, [currentPage]);

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase.from('subjects').select('*');
      if (error) {
        console.error('Error fetching subjects:', error);
      } else if (data) {
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function fetchQuestions() {
    try {
      setLoading(true);
      
      // Build query with filters
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' });
      
      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`question_text.ilike.%${searchTerm}%,topic.ilike.%${searchTerm}%`);
      }
      
      // Apply difficulty filter
      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty);
      }
      
      // Apply subject filter
      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching questions:', error);
      } else {
        setQuestions(data || []);
        setTotalQuestions(count || 0);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question');
      }
    }
  }

  async function handleEdit(q: any) {
    setForm({
      question_text: q.question_text,
      options: q.options || ['', '', '', ''],
      correct_answer: q.correct_answer,
      difficulty: q.difficulty,
      subject_id: q.subject_id,
      exam_types: q.exam_types || ['IOE'],
    });
    setEditingId(q.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('questions')
          .update(form)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([{ ...form }]);
        
        if (error) throw error;
      }
      
      // Reset form
      setForm({ 
        question_text: '', 
        options: ['', '', '', ''], 
        correct_answer: 0, 
        difficulty: 'easy', 
        subject_id: '', 
        exam_types: ['IOE'] 
      });
      
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error saving question data');
    }
  }

  const resetForm = () => {
    setForm({ 
      question_text: '', 
      options: ['', '', '', ''], 
      correct_answer: 0, 
      difficulty: 'easy', 
      subject_id: '', 
      exam_types: ['IOE'] 
    });
    setEditingId(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading questions...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Questions Management</h2>
      
      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Question' : 'Add New Question'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the question text..."
              value={form.question_text}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    value={i}
                    checked={form.correct_answer === i}
                    onChange={e => setForm(f => ({ ...f, correct_answer: Number(e.target.value) }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${i+1}`}
                    value={opt}
                    onChange={e => setForm(f => { 
                      const opts = [...f.options]; 
                      opts[i] = e.target.value; 
                      return { ...f, options: opts }; 
                    })}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.subject_id} 
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} 
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.display_name} ({sub.name})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.difficulty} 
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingId ? 'Update Question' : 'Add Question'}
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
          <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="bg-dark-700/30 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
              />
            </div>
            
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-2 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
              </select>
            </div>
            
            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.display_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full p-2 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="question_text-asc">Question A-Z</option>
                <option value="question_text-desc">Question Z-A</option>
                <option value="difficulty-asc">Difficulty Low-High</option>
                <option value="difficulty-desc">Difficulty High-Low</option>
              </select>
            </div>
          </div>
          
          {/* Results Info */}
          <div className="text-sm text-gray-400">
            Showing {questions.length} of {totalQuestions} questions (Page {currentPage} of {totalPages})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map(q => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={q.question_text}>
                      {q.question_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {q.options?.map((opt: string, i: number) => (
                        <div key={i} className={`text-xs ${i === q.correct_answer ? 'font-bold text-green-600' : 'text-gray-600'}`}>
                          {i + 1}. {opt}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Option {q.correct_answer + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      q.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subjects.find(s => s.id === q.subject_id)?.display_name || q.subject_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3" 
                      onClick={() => handleEdit(q)}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900" 
                      onClick={() => handleDelete(q.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No questions found
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Page {currentPage} of {totalPages} ({totalQuestions} total questions)
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700/70 transition-colors"
              >
                ← Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-accent-green-500 text-white'
                          : 'bg-dark-700/50 border border-dark-600/50 text-white hover:bg-dark-700/70'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700/70 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionsCRUD;
