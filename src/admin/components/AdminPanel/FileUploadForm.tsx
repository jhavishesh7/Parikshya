import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  BookOpen, 
  FilePlus, 
  CheckCircle, 
  AlertCircle,
  X,
  Download,
  Plus,
  Save,
  Search
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import RichTextEditor from '../../../components/RichTextEditor';
import Papa from 'papaparse';

const FileUploadForm: React.FC = () => {
  const { profile } = useAuthStore();
  const [uploadType, setUploadType] = useState<'questions' | 'notes' | 'mocktests'>('questions');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  


  // Notes form state
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    exam_type: 'IOE' as 'IOE' | 'CEE'
  });

  // Mock test form state
  const [mockTestForm, setMockTestForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    instructions: '',
    difficulty_level: 'moderate' as 'easy' | 'moderate' | 'difficult'
  });

  // Questions state for mock test creation
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsSearchTerm, setQuestionsSearchTerm] = useState('');
  
  // Additional filter states for mock test question selection
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchSubjects();
    if (uploadType === 'mocktests') {
      fetchAvailableQuestions();
    }
  }, [uploadType]);

  // Fetch available questions for mock test creation
  const fetchAvailableQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, difficulty, topic, subject_id')
        .order('created_at', { ascending: false })
        .limit(100); // Limit to recent 100 questions
      
      if (error) {
        console.error('Error fetching questions:', error);
      } else {
        setAvailableQuestions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setQuestionsLoading(false);
    }
    }

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    try {
      switch (uploadType) {
        case 'questions':
          await handleQuestionsUpload(file);
          break;
        default:
          throw new Error('Invalid upload type');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle mock test form submission
  const handleMockTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTestForm.name.trim() || selectedQuestions.length === 0) {
      setUploadStatus({
        type: 'error',
        message: 'Validation Error',
        details: 'Please fill in the test name and select at least one question.'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(30);

    try {
      // Create mock test record
      const mockTestData = {
        name: mockTestForm.name.trim(),
        description: mockTestForm.description.trim() || 'Mock test created from selected questions',
        subject_id: selectedSubject || null,
        exam_type: 'IOE',
        duration_minutes: mockTestForm.duration_minutes,
        total_questions: selectedQuestions.length,
        difficulty_level: mockTestForm.difficulty_level,
        instructions: mockTestForm.instructions.trim() || 'Answer all questions within the time limit.',
        created_by: profile?.id,
        status: 'ready'
      };

      setUploadProgress(50);

      const { data: mockTest, error: insertError } = await supabase
        .from('mock_tests')
        .insert([mockTestData])
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(70);

      // Create mock_questions entries linking selected questions to the mock test
      const mockQuestionsData = selectedQuestions.map(questionId => ({
        mock_test_id: mockTest.id,
        question_id: questionId, // Link to existing question
        subject_id: selectedSubject || null,
        difficulty_level: mockTestForm.difficulty_level
      }));

      const { error: questionsError } = await supabase
        .from('mock_questions')
        .insert(mockQuestionsData);

      if (questionsError) throw questionsError;

      setUploadProgress(100);
      setUploadStatus({
        type: 'success',
        message: 'Mock Test created successfully!',
        details: `Created mock test "${mockTestForm.name}" with ${selectedQuestions.length} questions.`
      });

      // Reset form
      setMockTestForm({
        name: '',
        description: '',
        duration_minutes: 60,
        instructions: '',
        difficulty_level: 'moderate'
      });
      setSelectedQuestions([]);

    } catch (error) {
      console.error('Mock test creation error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Mock Test creation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Handle notes form submission
  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      setUploadStatus({
        type: 'error',
        message: 'Validation Error',
        details: 'Please fill in both title and content fields.'
      });
      return;
    }

    setLoading(true);
    setUploadProgress(30);

    try {
              const noteData = {
          title: noteForm.title.trim(),
          subject_id: selectedSubject || null,
          exam_type: noteForm.exam_type,

          content: noteForm.content.trim(),
          file_path: null, // Set to null for direct text input
          file_size: noteForm.content.length,
          uploaded_by: profile?.id,
        };

      setUploadProgress(70);

      const { error } = await supabase.from('notes').insert([noteData]);
      if (error) throw error;

      setUploadProgress(100);
      setUploadStatus({
        type: 'success',
        message: 'Note added successfully!',
        details: `Note "${noteForm.title}" has been saved to the database.`
      });

      // Reset form
      setNoteForm({
        title: '',
        content: '',
        exam_type: 'IOE'
      });
      
      // Clear subject selection
      setSelectedSubject('');
      
      // Trigger notes refresh by dispatching custom event
      window.dispatchEvent(new CustomEvent('notes-refresh'));

    } catch (error) {
      console.error('Notes submission error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Note submission failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleQuestionsUpload = async (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      // CSV upload for questions
      return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: async (results: any) => {
            try {
          setUploadProgress(50);
              
              // Validate CSV structure
              const validRows = results.data.filter((row: any) => 
                row.question && row.option_a && row.option_b && row.option_c && row.option_d && row.correct_answer
              );

              if (validRows.length === 0) {
                throw new Error('No valid questions found in CSV. Please check the format.');
              }

              setUploadProgress(70);
              setUploadStatus({
                type: 'info',
                message: `Found ${validRows.length} questions!`,
                details: 'Saving questions to database...'
              });

                             // Map subject names to UUIDs with automatic fallback
               const questionsData = validRows.map((row: any) => {
                 let subjectId = selectedSubject; // Use selected subject if available
                 
                 // If no selected subject, try to find by name from CSV
                 if (!subjectId && row.subject_name && row.subject_name.trim() !== '') {
                   const subject = subjects.find(s => 
                     s.display_name.toLowerCase() === row.subject_name.toLowerCase() ||
                     s.name.toLowerCase() === row.subject_name.toLowerCase()
                   );
                   subjectId = subject?.id || null;
                   
                   // Log warning if subject not found
                   if (!subjectId) {
                     console.warn(`Subject "${row.subject_name}" not found. Available subjects:`, 
                       subjects.map(s => `${s.display_name} (${s.name})`));
                   }
                 }
                 
                 // If still no subject ID, set to null (will be handled by database default or constraint)
                 if (!subjectId) {
                   console.log(`Setting subject_id to null for question: "${row.question}"`);
                 }
                 
                 // Normalize difficulty to allowed values
                 let normalizedDifficulty = 'moderate'; // default
                 if (row.difficulty) {
                   const difficultyLower = row.difficulty.toLowerCase().trim();
                   if (difficultyLower === 'easy' || difficultyLower === 'e') {
                     normalizedDifficulty = 'easy';
                   } else if (difficultyLower === 'moderate' || difficultyLower === 'medium' || difficultyLower === 'm') {
                     normalizedDifficulty = 'moderate';
                   } else if (difficultyLower === 'difficult' || difficultyLower === 'hard' || difficultyLower === 'd' || difficultyLower === 'h') {
                     normalizedDifficulty = 'difficult';
                   }
                 }
                 
                 return {
                   question_text: row.question,
                   options: [row.option_a, row.option_b, row.option_c, row.option_d],
                   correct_answer: parseInt(row.correct_answer) - 1, // Convert 1-based to 0-based
                   difficulty: normalizedDifficulty,
                   subject_id: subjectId || null, // Explicitly set to null if no valid subject
                   topic: row.topic || '',
                   explanation: row.explanation || '',
                   exam_types: row.exam_type?.split(',') || ['IOE', 'CEE'],
                 };
               });
               
               // Log the final data being inserted
               console.log('Final questions data to insert:', questionsData);
               console.log('Subjects available:', subjects.map(s => ({ id: s.id, name: s.display_name })));
               
                              // Check if any questions have invalid subject IDs
               const invalidQuestions = questionsData.filter((q: any) => q.subject_id === '');
               if (invalidQuestions.length > 0) {
                 console.warn(`${invalidQuestions.length} questions have empty string subject IDs - these will be set to null`);
               }

               // Filter out any questions with empty string subject IDs and ensure all have proper null values
               const cleanQuestionsData = questionsData.map((q: any) => ({
                 ...q,
                 subject_id: q.subject_id === '' ? null : q.subject_id
               }));

               console.log('Clean questions data to insert:', cleanQuestionsData);

              const { error } = await supabase.from('questions').insert(cleanQuestionsData);
            if (error) throw error;
            
            setUploadProgress(100);
            setUploadStatus({
              type: 'success',
                message: `Successfully uploaded ${validRows.length} questions!`,
                details: `Processed ${results.data.length} rows, ${validRows.length} valid questions added.`
              });
              
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: (error: any) => {
            reject(new Error(`CSV parsing error: ${error.message}`));
          }
        });
      });
    } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
      // Text file upload for questions
      setUploadProgress(30);
      setUploadStatus({
        type: 'info',
        message: 'Processing text file for questions...',
        details: 'Reading and parsing questions...'
      });

      try {
        const textContent = await file.text();
        const questions = parseQuestionsFromText(textContent);
        
        if (questions.length === 0) {
          throw new Error('No valid questions found in the text file. Please check the format.');
        }
    
    setUploadProgress(70);
        setUploadStatus({
          type: 'info',
          message: `Found ${questions.length} questions!`,
          details: 'Saving questions to database...'
        });

        const questionsData = questions.map((q: any) => ({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty || 'moderate',
          subject_id: selectedSubject,
          topic: q.topic || '',
          explanation: q.explanation || '',
          exam_types: ['IOE', 'CEE'],
        }));

        const { error } = await supabase.from('questions').insert(questionsData);
        if (error) throw error;
    
    setUploadProgress(100);
    setUploadStatus({
      type: 'success',
          message: `Successfully uploaded ${questions.length} questions!`,
          details: `Created ${questions.length} questions from ${file.name}`
        });
      } catch (error) {
        console.error('Questions upload error:', error);
        setUploadStatus({
          type: 'error',
          message: 'Questions upload failed',
          details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        throw error; // Re-throw to be caught by the main handler
      }
    } else {
      throw new Error('Please upload a .csv or .txt file for questions');
    }
  };

  // Helper function to parse questions from text content
  const parseQuestionsFromText = (text: string) => {
    const questions: any[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion: any = null;
    let optionIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a question (starts with number or Q)
      if (/^\d+\.|^Q\d*\.|^Question\s*\d*:/.test(line)) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.options.length === 4) {
          questions.push(currentQuestion);
        }
        
        // Start new question
        currentQuestion = {
          question_text: line.replace(/^\d+\.|^Q\d*\.|^Question\s*\d*:\s*/i, '').trim(),
          options: [],
          correct_answer: -1,
          difficulty: 'moderate',
          explanation: '',
          topic: ''
        };
        optionIndex = 0;
      }
      // Check if this is an option (starts with A, B, C, D or a, b, c, d)
      else if (/^[A-Da-d]\.|^[A-Da-d]\)/.test(line) && currentQuestion) {
        const optionText = line.replace(/^[A-Da-d][\.\)]\s*/, '').trim();
        currentQuestion.options.push(optionText);
        optionIndex++;
        
        // If this is the 4th option, look for correct answer indicator
        if (optionIndex === 4) {
          // Look ahead for correct answer indicator
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j].toLowerCase();
            if (nextLine.includes('correct') || nextLine.includes('answer') || nextLine.includes('key')) {
              // Try to find which option is correct
              if (nextLine.includes('a') || nextLine.includes('1')) currentQuestion.correct_answer = 0;
              else if (nextLine.includes('b') || nextLine.includes('2')) currentQuestion.correct_answer = 1;
              else if (nextLine.includes('c') || nextLine.includes('3')) currentQuestion.correct_answer = 2;
              else if (nextLine.includes('d') || nextLine.includes('4')) currentQuestion.correct_answer = 3;
              break;
            }
          }
          
          // If no correct answer found, default to first option
          if (currentQuestion.correct_answer === -1) {
            currentQuestion.correct_answer = 0;
          }
        }
      }
      // Check if this is an explanation or additional info
      else if (currentQuestion && line.startsWith('Explanation:') || line.startsWith('Note:')) {
        currentQuestion.explanation = line.replace(/^Explanation:|^Note:\s*/i, '').trim();
      }
    }
    
    // Add the last question if it has 4 options
    if (currentQuestion && currentQuestion.options.length === 4) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  // Mock test creation is now handled by handleMockTestSubmit function
  // which creates mock tests by selecting questions from the questions table

  // Helper functions for question selection
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAllQuestions = () => {
    setSelectedQuestions(availableQuestions.map(q => q.id));
  };

  const clearSelection = () => {
    setSelectedQuestions([]);
  };

     // Filter questions based on search term and filters
   const filteredQuestions = availableQuestions.filter(question => {
     // Search filter
     const matchesSearch = questionsSearchTerm === '' || 
       question.question_text.toLowerCase().includes(questionsSearchTerm.toLowerCase()) ||
       (question.topic && question.topic.toLowerCase().includes(questionsSearchTerm.toLowerCase())) ||
       question.difficulty.toLowerCase().includes(questionsSearchTerm.toLowerCase());
     
     // Difficulty filter
     const matchesDifficulty = selectedDifficulty === '' || question.difficulty === selectedDifficulty;
     
     // Subject filter
     const matchesSubject = selectedSubject === '' || question.subject_id === selectedSubject;
     
     return matchesSearch && matchesDifficulty && matchesSubject;
   });
   
   // Sort filtered questions
   const sortedQuestions = [...filteredQuestions].sort((a, b) => {
     switch (sortBy) {
       case 'question_text':
         return a.question_text.localeCompare(b.question_text);
       case 'difficulty':
         const difficultyOrder: { [key: string]: number } = { easy: 1, moderate: 2, difficult: 3 };
         return (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2);
       case 'topic':
         return (a.topic || '').localeCompare(b.topic || '');
       case 'created_at':
       default:
         return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
     }
   });

  // Helper function to parse MCQs from text content
  const parseMCQsFromText = (text: string) => {
    const questions: any[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentQuestion: any = null;
    let optionIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a question (starts with number or Q)
      if (/^\d+\.|^Q\d*\.|^Question\s*\d*:/.test(line)) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.options.length === 4) {
          questions.push(currentQuestion);
        }
        
        // Start new question
        currentQuestion = {
          question_text: line.replace(/^\d+\.|^Q\d*\.|^Question\s*\d*:\s*/i, '').trim(),
          options: [],
          correct_answer: -1,
          difficulty: 'moderate',
          explanation: '',
          topic: ''
        };
        optionIndex = 0;
      }
      // Check if this is an option (starts with A, B, C, D or a, b, c, d)
      else if (/^[A-Da-d]\.|^[A-Da-d]\)/.test(line) && currentQuestion) {
        const optionText = line.replace(/^[A-Da-d][\.\)]\s*/, '').trim();
        currentQuestion.options.push(optionText);
        optionIndex++;
        
        // If this is the 4th option, look for correct answer indicator
        if (optionIndex === 4) {
          // Look ahead for correct answer indicator
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j].toLowerCase();
            if (nextLine.includes('correct') || nextLine.includes('answer') || nextLine.includes('key')) {
              // Try to find which option is correct
              if (nextLine.includes('a') || nextLine.includes('1')) currentQuestion.correct_answer = 0;
              else if (nextLine.includes('b') || nextLine.includes('2')) currentQuestion.correct_answer = 1;
              else if (nextLine.includes('c') || nextLine.includes('3')) currentQuestion.correct_answer = 2;
              else if (nextLine.includes('d') || nextLine.includes('4')) currentQuestion.correct_answer = 3;
              break;
            }
          }
          
          // If no correct answer found, default to first option
          if (currentQuestion.correct_answer === -1) {
            currentQuestion.correct_answer = 0;
          }
        }
      }
      // Check if this is an explanation or additional info
      else if (currentQuestion && line.startsWith('Explanation:') || line.startsWith('Note:')) {
        currentQuestion.explanation = line.replace(/^Explanation:|^Note:\s*/i, '').trim();
      }
    }
    
    // Add the last question if it has 4 options
    if (currentQuestion && currentQuestion.options.length === 4) {
      questions.push(currentQuestion);
    }
    
    return questions;
  };

  const downloadTemplate = (type: string) => {
    let template = '';
    let filename = '';
    let mimeType = 'text/plain';
    
    switch (type) {
             case 'questions':
         template = `question,option_a,option_b,option_c,option_d,correct_answer,difficulty,topic,explanation,exam_type,subject_name
 "What is the SI unit of force?",Newton,Joule,Watt,Pascal,1,moderate,Mechanics,"Force is measured in Newtons",IOE,Physics
 "What is the chemical symbol for gold?",Au,Ag,Fe,Cu,1,easy,Chemistry,"Au comes from the Latin word 'aurum'",IOE,Chemistry
 "What is the SI unit of time?",Second,Minute,Hour,Day,1,easy,Mechanics,"Time is measured in seconds",IOE,`;
        filename = 'questions_template.csv';
        mimeType = 'text/csv';
        break;
      case 'questions-txt':
        template = `1. What is the SI unit of force?
A. Newton
B. Joule
C. Watt
D. Pascal
Correct Answer: A

2. What is the chemical symbol for gold?
A. Au
B. Ag
C. Fe
D. Cu
Correct Answer: A`;
        filename = 'questions_template.txt';
        break;
      case 'mocktests':
        template = `MOCK TEST TEMPLATE - Physics
================================

1. What is the SI unit of force?
A. Newton
B. Joule
C. Watt
D. Pascal
Correct Answer: A

2. Which of the following is a vector quantity?
A. Mass
B. Temperature
C. Velocity
D. Time
Correct Answer: C

NOTES:
- Each question should start with a number followed by a period
- Options should be labeled A, B, C, D
- Include "Correct Answer:" after the options
- Make sure each question has exactly 4 options`;
        filename = 'mock_test_template.txt';
        break;
      case 'mocktests-csv':
        template = `question,option_a,option_b,option_c,option_d,correct_answer,difficulty,explanation,topic
"What is the SI unit of force?",Newton,Joule,Watt,Pascal,1,moderate,"Force is measured in Newtons",Mechanics
"Which of the following is a vector quantity?",Mass,Temperature,Velocity,Time,3,moderate,"Velocity has both magnitude and direction",Mechanics`;
        filename = 'mock_test_template.csv';
        mimeType = 'text/csv';
        break;
      default:
        return;
    }
    
    const blob = new Blob([template], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uploadTypes = [
    {
      id: 'questions',
      label: 'Questions',
      icon: FileText,
      description: 'Upload CSV or TXT files with questions',
      acceptedTypes: '.csv,.txt',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: BookOpen,
      description: 'Add study notes directly (Coming Soon: CSV upload)',
      acceptedTypes: 'Text input only',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'mocktests',
      label: 'Mock Tests',
      icon: FilePlus,
      description: 'Create mock tests by selecting questions from the questions table',
      acceptedTypes: 'Question selection',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-green-500 to-accent-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Content Management Center</h1>
            <p className="text-gray-300 text-lg">Upload questions, add notes, and create mock tests to expand the platform content.</p>
          </div>
        </div>
      </motion.div>

      {/* Upload Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {uploadTypes.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => setUploadType(type.id as any)}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
              uploadType === type.id
                ? `bg-gradient-to-r ${type.color} text-white border-transparent shadow-lg scale-105`
                : 'bg-dark-800/50 text-gray-300 border-dark-700/50 hover:border-accent-green-500/50 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
             <div className="flex items-center justify-start space-x-3 mb-3">
               <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              <type.icon className="w-6 h-6" />
               </div>
              <h3 className="text-lg font-semibold">{type.label}</h3>
            </div>
            <p className="text-sm opacity-80">{type.description}</p>
             <p className="text-xs mt-2 opacity-60">{type.acceptedTypes}</p>
          </motion.button>
        ))}
      </div>

      {/* Content Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50"
      >
        <h2 className="text-xl font-bold text-white mb-4">
          {uploadType === 'notes' ? 'Add New Note' : 
           uploadType === 'mocktests' ? 'Create Mock Test' : 
           `Upload ${uploadTypes.find(t => t.id === uploadType)?.label}`}
        </h2>

        {/* Notes Form */}
        {uploadType === 'notes' && (
          <form onSubmit={handleNotesSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  placeholder="Note title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject (Optional)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                >
                  <option value="">Select Subject (Optional)</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exam Type
                </label>
                <select
                  value={noteForm.exam_type}
                  onChange={(e) => setNoteForm({ ...noteForm, exam_type: e.target.value as 'IOE' | 'CEE' })}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                >
                  <option value="IOE">IOE</option>
                  <option value="CEE">CEE</option>
                </select>
              </div>
              

            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content *
              </label>
              <RichTextEditor
                content={noteForm.content}
                onChange={(content) => setNoteForm({ ...noteForm, content })}
                placeholder="Enter your note content here..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent-green-500 hover:bg-accent-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Note'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Mock Test Form */}
        {uploadType === 'mocktests' && (
          <form onSubmit={handleMockTestSubmit} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Name *
                </label>
                <input
                  type="text"
                  value={mockTestForm.name}
                  onChange={(e) => setMockTestForm({ ...mockTestForm, name: e.target.value })}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  placeholder="Enter test name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject (Optional)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                >
                  <option value="">Select Subject (Optional)</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={mockTestForm.duration_minutes}
                  onChange={(e) => setMockTestForm({ ...mockTestForm, duration_minutes: parseInt(e.target.value) || 60 })}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                  min="1"
                  max="300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={mockTestForm.difficulty_level}
                  onChange={(e) => setMockTestForm({ ...mockTestForm, difficulty_level: e.target.value as 'easy' | 'moderate' | 'difficult' })}
                  className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="difficult">Difficult</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={mockTestForm.description}
                onChange={(e) => setMockTestForm({ ...mockTestForm, description: e.target.value })}
                className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                placeholder="Enter test description..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instructions
              </label>
              <textarea
                value={mockTestForm.instructions}
                onChange={(e) => setMockTestForm({ ...mockTestForm, instructions: e.target.value })}
                className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                placeholder="Enter test instructions..."
                rows={3}
              />
            </div>
          </form>
        )}

                 {/* Questions Selection for Mock Tests */}
         {uploadType === 'mocktests' && (
           <div className="mb-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-white">Select Questions</h3>
               <div className="flex space-x-2">
                 <button
                   type="button"
                   onClick={selectAllQuestions}
                   className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                 >
                   Select All
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

                           {/* Enhanced Search and Filter Controls */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  {/* Subject Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
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
                   Found {sortedQuestions.length} questions out of {availableQuestions.length} total
                 </div>
               </div>
            
            {questionsLoading ? (
              <div className="text-center py-8 text-gray-400">
                Loading questions...
              </div>
                         ) : availableQuestions.length === 0 ? (
               <div className="text-center py-8 text-gray-400">
                 No questions available. Please upload some questions first in the Questions section.
               </div>
             ) : sortedQuestions.length === 0 ? (
               <div className="text-center py-8 text-gray-400">
                 No questions match your search criteria. Try adjusting your search terms.
               </div>
             ) : (
               <div className="max-h-96 overflow-y-auto border border-dark-600/50 rounded-lg">
                 <div className="grid gap-2 p-4">
                   {sortedQuestions.map((question) => (
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
            )}
            
            <div className="mt-4 text-right">
              <button
                type="submit"
                onClick={handleMockTestSubmit}
                disabled={loading || selectedQuestions.length === 0}
                className="px-6 py-3 bg-accent-green-500 hover:bg-accent-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Creating...' : `Create Mock Test (${selectedQuestions.length} questions)`}</span>
              </button>
            </div>
          </div>
        )}

        {/* File Upload for Questions Only */}
        {uploadType === 'questions' && (
          <>
                         {/* Subject Selection */}
             <div className="mb-4">
               <label className="block text-sm font-medium text-gray-300 mb-2">
                 Subject (Optional)
               </label>
               <select
                 value={selectedSubject}
                 onChange={(e) => setSelectedSubject(e.target.value)}
                 className="w-full p-3 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
               >
                 <option value="">Select Subject (Optional)</option>
                 {subjects.map((subject) => (
                   <option key={subject.id} value={subject.id}>
                     {subject.display_name}
                   </option>
                 ))}
               </select>
               <p className="text-xs text-gray-400 mt-1">
                 If no subject is selected here, the system will use subject_name from CSV or set to null if not found.
               </p>
             </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-dark-600/50 rounded-lg p-8 text-center hover:border-accent-green-500/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept={uploadTypes.find(t => t.id === uploadType)?.acceptedTypes}
            className="hidden"
            disabled={loading}
          />
          
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-white">
                {loading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {uploadTypes.find(t => t.id === uploadType)?.acceptedTypes} files accepted
              </p>
            </div>
            
            {!loading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-accent-green-500 hover:bg-accent-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Choose File
              </button>
            )}
          </div>
        </div>
          </>
        )}

        {/* Progress Bar */}
        {loading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-dark-700/50 rounded-full h-2">
              <div
                className="bg-accent-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg flex items-start space-x-3 ${
              uploadStatus.type === 'success' ? 'bg-green-500/20 border border-green-500/30' :
              uploadStatus.type === 'error' ? 'bg-red-500/20 border border-red-500/30' :
              'bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            ) : uploadStatus.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                uploadStatus.type === 'success' ? 'text-green-400' :
                uploadStatus.type === 'error' ? 'text-red-400' :
                'text-blue-400'
              }`}>
                {uploadStatus.message}
              </p>
              {uploadStatus.details && (
                <p className="text-sm text-gray-400 mt-1">{uploadStatus.details}</p>
              )}
            </div>
            <button
              onClick={() => setUploadStatus(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Template Downloads */}
        {(uploadType === 'questions' || uploadType === 'mocktests') && (
          <div className="mt-6 p-4 bg-dark-700/30 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-2">Need templates?</h3>
            <div className="space-y-2">
        {uploadType === 'questions' && (
                <>
            <button
              onClick={() => downloadTemplate('questions')}
              className="flex items-center space-x-2 text-accent-green-400 hover:text-accent-green-300 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Template</span>
            </button>
                  <button
                    onClick={() => downloadTemplate('questions-txt')}
                    className="flex items-center space-x-2 text-accent-green-400 hover:text-accent-green-300 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download TXT Template</span>
                  </button>
                </>
              )}
              {uploadType === 'mocktests' && (
                <>
                  <button
                    onClick={() => downloadTemplate('mocktests')}
                    className="flex items-center space-x-2 text-accent-green-400 hover:text-accent-green-300 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download TXT Template</span>
                  </button>
                  <button
                    onClick={() => downloadTemplate('mocktests-csv')}
                    className="flex items-center space-x-4 text-accent-green-400 hover:text-accent-green-300 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV Template</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Notes Coming Soon Message */}
        {uploadType === 'notes' && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-blue-400">CSV Upload Coming Soon!</p>
                <p className="text-sm text-blue-300 mt-1">
                  For now, you can add notes directly using the form above. CSV bulk upload will be available soon!
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FileUploadForm;
