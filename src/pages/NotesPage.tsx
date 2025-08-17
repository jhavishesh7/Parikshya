

import React, { useEffect, useState } from 'react';
import { BookOpen, Eye, FileText, Plus, Search, Brain, Target, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string;
  subject_id: string;
  exam_type: string;
  subjects?: {
    display_name: string;
  };
}

interface Subject {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  useEffect(() => {
    fetchNotes();
    fetchSubjects();
  }, []);

  // Listen for refresh trigger from admin panel
  useEffect(() => {
    const handleNotesRefresh = () => {
      fetchNotes();
    };
    
    window.addEventListener('notes-refresh', handleNotesRefresh);
    
    return () => {
      window.removeEventListener('notes-refresh', handleNotesRefresh);
    };
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          subjects:subject_id(display_name)
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const filteredNotesBySubject = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !selectedSubject || note.subject_id === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.display_name || 'Unknown';
  };

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    switch (subject?.name) {
      case 'physics':
        return 'from-blue-500 to-blue-600';
      case 'chemistry':
        return 'from-orange-500 to-orange-600';
      case 'biology':
        return 'from-green-500 to-green-600';
      case 'mathematics':
        return 'from-blue-600 to-blue-700';
      case 'english':
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const handleViewNote = (note: Note) => {
    // Create a new window with the note content
    const noteWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (noteWindow) {
      noteWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${note.title || 'Note'}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: white;
              color: black;
              margin: 0;
              padding: 40px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 2.5em;
              font-weight: bold;
              color: #333;
              margin: 0;
            }
            .meta {
              margin-top: 10px;
              color: #666;
              font-size: 1.1em;
            }
            .content {
              font-size: 1.2em;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .content img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 10px 0;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .content img:hover {
              transform: scale(1.02);
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 4em;
              font-weight: bold;
              color: rgba(0,0,0,0.03);
              pointer-events: none;
              z-index: 1000;
              font-family: 'Arial', sans-serif;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
              margin: 20px 0 10px 0;
              color: #333;
            }
            .content p {
              margin: 10px 0;
            }
            .content strong, .content b {
              font-weight: bold;
            }
            .content em, .content i {
              font-style: italic;
            }
            .content u {
              text-decoration: underline;
            }
            .download-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              background-color: #007bff;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1em;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .download-btn:hover {
              background-color: #0056b3;
            }
            .subject-tag {
              display: inline-block;
              background-color: #e9ecef;
              color: #495057;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.9em;
              margin-left: 10px;
            }
            .difficulty-tag {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.9em;
              margin-left: 10px;
              font-weight: bold;
            }
            .difficulty-easy { background-color: #d4edda; color: #155724; }
            .difficulty-moderate { background-color: #fff3cd; color: #856404; }
            .difficulty-difficult { background-color: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="watermark">PARIKSYA</div>
          <button class="download-btn" onclick="downloadNote()">📥 Download Note</button>
          
          <div class="header">
            <h1 class="title">${note.title || 'Untitled Note'}</h1>
            <div class="meta">
              <strong>Exam Type:</strong> ${note.exam_type || 'IOE'}
              <span class="subject-tag">${note.subjects?.display_name || note.subject_id || 'No Subject'}</span>

            </div>
          </div>
          
          <div class="content" id="note-content">${note.content || 'No content available'}</div>
          
          <script>
            function downloadNote() {
              const content = \`${note.title || 'Untitled Note'}

Exam Type: ${note.exam_type || 'IOE'}
Subject: ${note.subjects?.display_name || note.subject_id || 'No Subject'}

${note.content || 'No content available'}\`;
              
              const blob = new Blob([content], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '${(note.title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }
          </script>
        </body>
        </html>
      `);
      noteWindow.document.close();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-xl transition-all duration-200 border border-gray-600/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-8 shadow-2xl animate-pulse-glow">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Study Notes</h1>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto">
            Access comprehensive study materials, PDFs, and resources organized by subject and exam type. 
            <span className="text-green-400 font-medium"> Enhance your preparation with our curated collection.</span>
          </p>
          <div className="mt-6">
            <span className="text-blue-400 text-lg font-medium">Powered by Parikshya</span>
          </div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="appearance-none px-6 py-4 pr-12 bg-gray-800/50 border border-gray-600/50 rounded-2xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm cursor-pointer hover:border-gray-500/50 min-w-[180px]"
              >
                <option value="" className="bg-gray-800 text-white">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id} className="bg-gray-800 text-white">
                    {subject.display_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-400 text-lg">Loading study materials...</p>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredNotesBySubject.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                {/* Subject Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 bg-gradient-to-r ${getSubjectColor(note.subject_id)} text-white text-xs font-medium rounded-full`}>
                    {getSubjectName(note.subject_id)}
                  </span>
                  <span className="text-xs text-gray-400">{note.exam_type}</span>
                </div>

                {/* Note Title */}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{note.title}</h3>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleViewNote(note)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Note</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* No Notes Found */}
        {!loading && filteredNotesBySubject.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No Notes Found</h3>
            <p className="text-gray-400 text-lg">
              {searchTerm || selectedSubject 
                ? 'Try adjusting your search criteria or subject filter.'
                : 'No study materials are available yet.'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
