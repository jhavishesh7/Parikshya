import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { Search } from 'lucide-react';

const MockTestsCRUD: React.FC = () => {
  const { profile } = useAuthStore();
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  
  // Question selection state
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsSearchTerm, setQuestionsSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [totalQuestionCount, setTotalQuestionCount] = useState<number>(0);

  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  
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
    console.log('🔄 MockTestsCRUD: Loading data from existing tables...');
    fetchMockTests();
    fetchSubjects();
    fetchAvailableQuestions();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchAvailableQuestions();
  }, [selectedDifficulty, sortBy]);

  const fetchAvailableQuestions = useCallback(async () => {
    try {
      setQuestionsLoading(true);
      
      // First, get the total count
      const { count: totalCount, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error getting question count:', countError);
      } else {
        console.log(`Total questions in database: ${totalCount}`);
        setTotalQuestionCount(totalCount || 0);
        setTotalPages(Math.ceil((totalCount || 0) / questionsPerPage));
      }

      // Calculate pagination range
      const start = (currentPage - 1) * questionsPerPage;
      const end = start + questionsPerPage - 1;

      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .order(sortBy, { ascending: sortBy === 'created_at' ? false : true })
        .range(start, end);

      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty);
      }

      // Fetch questions for current page from existing questions table
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching questions:', error);
        setAvailableQuestions([]);
      } else {
        setAvailableQuestions(data || []);
        console.log(`Fetched page ${currentPage}: ${data?.length || 0} questions from existing table (${start + 1}-${end + 1} of ${totalCount})`);
      }
    } catch (error) {
      console.error('Error:', error);
      setAvailableQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  }, [selectedDifficulty, sortBy, currentPage, questionsPerPage]);

  const filteredQuestions = useMemo(() => {
    if (!questionsSearchTerm.trim()) return availableQuestions;
    
    const searchLower = questionsSearchTerm.toLowerCase();
    return availableQuestions.filter(question => 
      question.question_text?.toLowerCase().includes(searchLower) ||
      question.topic?.toLowerCase().includes(searchLower) ||
      question.difficulty?.toLowerCase().includes(searchLower)
    );
  }, [availableQuestions, questionsSearchTerm]);

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAllQuestions = () => {
    setSelectedQuestions(filteredQuestions.map(q => q.id));
  };

  const clearSelection = () => {
    setSelectedQuestions([]);
  };



  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleQuestionsPerPageChange = (newPerPage: number) => {
    setQuestionsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
    setTotalPages(Math.ceil(totalQuestionCount / newPerPage));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => {
    if (totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const handleViewQuestions = async (test: any) => {
    try {
      const { data: mockQuestions, error } = await supabase
        .from('mock_questions')
        .select(`
          question_id,
          questions (
            question_text,
            difficulty,
            topic,
            options
          )
        `)
        .eq('mock_test_id', test.id);

      if (error) {
        console.error('Error fetching test questions:', error);
        alert('Error loading questions');
        return;
      }

      const questions = mockQuestions.map(mq => mq.questions).filter(Boolean);
      const questionsText = questions.map((q: any, i: number) => 
        `${i + 1}. ${q.question_text}\n   Options: ${q.options?.join(', ') || 'N/A'}\n   Difficulty: ${q.difficulty}\n   Topic: ${q.topic || 'N/A'}\n`
      ).join('\n');

      alert(`Questions in "${test.name}":\n\n${questionsText}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading questions');
    }
  };

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
      
      // Fetch mock tests with related data from existing tables
      const { data, error } = await supabase
        .from('mock_tests')
        .select(`
          *,
          subjects(display_name, name),
          mock_questions(count)
        `)
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
        console.log(`Successfully fetched ${data?.length || 0} mock tests from existing tables`);
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
        console.log(`Successfully fetched ${data?.length || 0} subjects from existing table`);
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
    
    if (!form.name.trim()) {
      alert('Please enter a test name');
      return;
    }

    if (selectedQuestions.length === 0) {
      alert('Please select at least one question for the mock test');
      return;
    }

    if (selectedQuestions.length < 1) {
      alert('Please select at least one question for the mock test');
      return;
    }

    try {
      setLoading(true);
      
      const testData = {
        name: form.name.trim(),
        description: form.description.trim() || 'Mock test created from selected questions',
        subject_id: form.subject_id || null,
        exam_type: form.exam_type,
        duration_minutes: form.duration_minutes,
        total_questions: selectedQuestions.length,
        difficulty_level: form.difficulty_level,
        instructions: form.instructions.trim() || 'Answer all questions within the time limit.',
        passing_score: form.passing_score,
        created_by: profile?.id,
        status: 'ready'
      };
      
      if (editing) {
        // Update existing test
        const { error } = await supabase
          .from('mock_tests')
          .update(testData)
          .eq('id', editing.id);
        
        if (error) throw error;

        // Remove old question links and add new ones
        await supabase
          .from('mock_questions')
          .delete()
          .eq('mock_test_id', editing.id);

        const mockQuestionsData = selectedQuestions.map(questionId => ({
          mock_test_id: editing.id,
          question_id: questionId,
          subject_id: form.subject_id || null,
          difficulty_level: form.difficulty_level
        }));

        const { error: questionsError } = await supabase
          .from('mock_questions')
          .insert(mockQuestionsData);

        if (questionsError) throw questionsError;

      } else {
        // Create new test
        const { data: mockTest, error } = await supabase
          .from('mock_tests')
          .insert([testData])
          .select()
          .single();
        
        if (error) throw error;

        // Create mock_questions entries linking selected questions to the mock test
        const mockQuestionsData = selectedQuestions.map(questionId => ({
          mock_test_id: mockTest.id,
          question_id: questionId,
          subject_id: form.subject_id || null,
          difficulty_level: form.difficulty_level
        }));

        const { error: questionsError } = await supabase
          .from('mock_questions')
          .insert(mockQuestionsData);

        if (questionsError) throw questionsError;
      }
      
      // Reset form and selection
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
      setSelectedQuestions([]);
      setEditing(null);
      fetchMockTests();
      
      alert(editing ? 'Mock test updated successfully!' : 'Mock test created successfully!');
      
    } catch (error) {
      console.error('Error saving mock test:', error);
      alert('Error saving mock test: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (test: any) => {
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

    // Load existing questions for this test
    try {
      const { data: mockQuestions, error } = await supabase
        .from('mock_questions')
        .select('question_id')
        .eq('mock_test_id', test.id);

      if (error) {
        console.error('Error fetching test questions:', error);
        setSelectedQuestions([]);
      } else {
        setSelectedQuestions(mockQuestions.map(mq => mq.question_id));
      }
    } catch (error) {
      console.error('Error:', error);
      setSelectedQuestions([]);
    }

    // Also fetch available questions if not already loaded
    if (availableQuestions.length === 0) {
      fetchAvailableQuestions();
    }
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
    setSelectedQuestions([]);
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
        <div className="text-sm text-gray-400 mb-4">
          📊 Fetching data from existing user tables: mock_tests, questions, subjects
        </div>
        
        {/* Existing Mock Tests Summary */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">📊</span>
            </div>
            <div>
              <p className="font-medium text-blue-400">Existing Data Found</p>
              <p className="text-sm text-blue-300 mt-1">
                {loading ? 'Loading...' : `Found ${mockTests.length} existing mock tests, ${subjects.length} subjects, and ${totalQuestionCount} questions in the database`}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-dark-700/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            {editing ? 'Edit Mock Test' : 'Create New Mock Test'} 
            {selectedQuestions.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({selectedQuestions.length} questions selected)
              </span>
            )}
            {editing && (
              <div className="text-sm font-normal text-gray-400 mt-1">
                Current test: {editing.total_questions || 0} questions
              </div>
            )}
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
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject (Optional)</label>
                <select
                  name="subject_id"
                  value={form.subject_id}
                  onChange={handleChange}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                >
                  <option value="">Select Subject (Optional)</option>
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
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Total Questions</label>
                <input
                  name="total_questions"
                  type="number"
                  min="1"
                  max="1000"
                  value={selectedQuestions.length}
                  disabled
                  className="w-full p-3 bg-dark-600/30 border border-dark-500/50 rounded-lg text-gray-400 cursor-not-allowed"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-calculated from selected questions</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Exam Type</label>
                <select
                  name="exam_type"
                  value={form.exam_type}
                  onChange={handleChange}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                >
                  <option value="IOE">IOE</option>
                  <option value="CEE">CEE</option>
                </select>
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
                disabled={loading || selectedQuestions.length === 0}
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

        {/* Question Selection Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Select Questions ({selectedQuestions.length} selected)
                {selectedQuestions.length > 0 && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    - Test will be {form.duration_minutes} minutes long
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={selectAllQuestions}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  Select All ({filteredQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions by text, topic, or difficulty..."
                  value={questionsSearchTerm}
                  onChange={(e) => setQuestionsSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white placeholder-gray-400 focus:border-accent-green-500 focus:ring-2 focus:ring-accent-green-500/20 transition-all duration-200"
                />
              </div>
              
              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full p-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="difficult">Difficult</option>
                  </select>
                </div>
                
                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-xs font-medium text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="question_text">Question A-Z</option>
                    <option value="difficulty">Difficulty</option>
                    <option value="topic">Topic A-Z</option>
                  </select>
                </div>
              </div>
              
              <div className="text-sm text-gray-400">
                Showing {filteredQuestions.length} questions on page {currentPage}
                {totalQuestionCount > 0 && (
                  <span className="text-blue-400 ml-2">
                    (Total in database: {totalQuestionCount})
                  </span>
                )}
                {totalPages > 1 && (
                  <span className="text-gray-400 ml-2">
                    • Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-dark-700/30 rounded-lg p-4 border border-dark-600/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-300">Questions per page:</label>
                      <select
                        value={questionsPerPage}
                        onChange={(e) => handleQuestionsPerPageChange(parseInt(e.target.value))}
                        className="px-2 py-1 bg-dark-600/50 border border-dark-500/50 rounded text-white text-sm"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                      </select>
                    </div>
                    
                    <div className="text-sm text-gray-300">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-dark-600/50 hover:bg-dark-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded border border-dark-500/50"
                    >
                      First
                    </button>
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-dark-600/50 hover:bg-dark-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded border border-dark-500/50"
                    >
                      Previous
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
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 text-sm rounded border ${
                              currentPage === pageNum
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-dark-600/50 text-white border-dark-500/50 hover:bg-dark-500/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-dark-600/50 hover:bg-dark-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded border border-dark-500/50"
                    >
                      Next
                    </button>
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-dark-600/50 hover:bg-dark-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded border border-dark-500/50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Questions List */}
            {questionsLoading ? (
              <div className="text-center py-8 text-gray-400">
                Loading questions...
              </div>
            ) : availableQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No questions available. Please upload some questions first in the Questions section.
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No questions match your search criteria. Try adjusting your search terms.
              </div>
            ) : (
              <>
                <div className="mb-4 text-center text-sm text-gray-400">
                  Showing questions {(currentPage - 1) * questionsPerPage + 1} to {Math.min(currentPage * questionsPerPage, totalQuestionCount)} of {totalQuestionCount}
                </div>
                <div className="max-h-96 overflow-y-auto border border-dark-600/50 rounded-lg">
                  <div className="grid gap-2 p-4">
                    {filteredQuestions.map((question) => (
                      <div
                        key={question.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedQuestions.includes(question.id)
                            ? 'bg-accent-green-500/20 border-accent-green-500/50'
                            : 'bg-dark-700/30 border-dark-600/50 hover:bg-dark-700/50'
                        }`}
                        onClick={() => toggleQuestionSelection(question.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question.id)}
                            onChange={() => toggleQuestionSelection(question.id)}
                            className="mt-1 w-4 h-4 text-accent-green-500 bg-dark-700 border-dark-600 rounded focus:ring-accent-green-500 focus:ring-2"
                          />
                          <div className="flex-1">
                            <p className="text-white text-sm line-clamp-2">{question.question_text}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <span>Difficulty: {question.difficulty}</span>
                              {question.topic && <span>Topic: {question.topic}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
          );
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Questions</th>
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
                    {test.mock_questions?.[0]?.count || test.total_questions || 0} questions
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
                      onClick={() => handleViewQuestions(test)}
                      className="text-green-400 hover:text-green-300 mr-3"
                    >
                      View Questions
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
 
};

export default MockTestsCRUD;
