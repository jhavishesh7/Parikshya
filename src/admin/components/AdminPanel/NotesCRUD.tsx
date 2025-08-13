

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

type Subject = {
  id: string;
  name: string;
  display_name: string;
  applicable_exams: string[];
};

const NotesCRUD: React.FC = () => {
  const { profile } = useAuthStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    subject_id: '',
    exam_type: 'IOE' as 'IOE' | 'CEE',
    difficulty_level: 'moderate' as 'easy' | 'moderate' | 'difficult'
  });

  useEffect(() => {
    fetchNotes();
    fetchSubjects();
  }, []);
  
  // Listen for refresh trigger from FileUploadForm
  useEffect(() => {
    const handleNotesRefresh = () => {
      fetchNotes();
    };
    
    // Listen for custom event when notes are added
    window.addEventListener('notes-refresh', handleNotesRefresh);
    
    return () => {
      window.removeEventListener('notes-refresh', handleNotesRefresh);
    };
  }, []);

  async function fetchSubjects() {
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
  }

  async function fetchNotes() {
    try {
      setLoading(true);
             const { data, error } = await supabase
         .from('notes')
         .select(`
           *,
           subjects:subject_id(display_name),
           profiles:uploaded_by(full_name)
         `)
         .order('id', { ascending: false })
         .limit(50);
      
      if (error) {
        console.error('Error fetching notes:', error);
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note');
      }
    }
  }

  function handleViewNote(note: any) {
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
          <button class="download-btn" onclick="downloadNote()">📥 Download Note</button>
          
          <div class="header">
            <h1 class="title">${note.title || 'Untitled Note'}</h1>
            <div class="meta">
              <strong>Exam Type:</strong> ${note.exam_type || 'IOE'}
              <span class="subject-tag">${note.subjects?.display_name || note.subject_id || 'No Subject'}</span>
              <span class="difficulty-tag difficulty-${note.difficulty_level || 'moderate'}">${note.difficulty_level || 'moderate'}</span>
            </div>
          </div>
          
          <div class="content">${note.content || 'No content available'}</div>
          
          <script>
            function downloadNote() {
              const content = \`${note.title || 'Untitled Note'}

Exam Type: ${note.exam_type || 'IOE'}
Subject: ${note.subjects?.display_name || note.subject_id || 'No Subject'}
Difficulty: ${note.difficulty_level || 'moderate'}

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
  }

  async function handleEdit(note: any) {
    setForm({
      title: note.title || '',
      content: note.content || '',
      subject_id: note.subject_id || '',
      exam_type: note.exam_type || 'IOE',
      difficulty_level: note.difficulty_level || 'moderate'
    });
    setEditingId(note.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.title.trim() || !form.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setUploading(true);

             const noteData = {
         title: form.title.trim(),
         content: form.content.trim(),
         subject_id: form.subject_id || null,
         exam_type: form.exam_type,
         difficulty_level: form.difficulty_level
       };

      if (editingId) {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([noteData]);
        
        if (error) throw error;
      }

      // Reset form
      setForm({
        title: '',
        content: '',
        subject_id: '',
        exam_type: 'IOE',
        difficulty_level: 'moderate'
      });
      fetchNotes();
      
    } catch (error) {
      console.error('Error saving note:', error);
      alert(`Error saving note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
        <h2 className="text-2xl font-bold text-white mb-6">Notes Management</h2>
      
      {/* Form */}
        <div className="bg-dark-700/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
          {editingId ? 'Edit Note' : 'Add New Note'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
                placeholder="Note title"
                required
              />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
              >
                <option value="">Select Subject</option>
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
               <label className="block text-sm font-medium text-gray-300 mb-1">Exam Type</label>
               <select
                 value={form.exam_type}
                 onChange={(e) => setForm({ ...form, exam_type: e.target.value as any })}
                 className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
               >
                 <option value="IOE">IOE</option>
                 <option value="CEE">CEE</option>
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty Level</label>
               <select
                 value={form.difficulty_level}
                 onChange={(e) => setForm({ ...form, difficulty_level: e.target.value as any })}
                 className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
               >
                 <option value="easy">Easy</option>
                 <option value="moderate">Moderate</option>
                 <option value="difficult">Difficult</option>
               </select>
             </div>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">Content *</label>
             <textarea
               value={form.content}
               onChange={(e) => setForm({ ...form, content: e.target.value })}
               rows={6}
               className="w-full p-3 bg-dark-600/50 border border-dark-500/50 rounded-lg text-white focus:ring-2 focus:ring-accent-green-500 focus:border-transparent"
               placeholder="Enter your note content here..."
               required
             />
           </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
                className="px-6 py-3 bg-accent-green-500 hover:bg-accent-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : (editingId ? 'Update Note' : 'Add Note')}
            </button>
            
                         {editingId && (
               <button
                 type="button"
                 onClick={() => {
                   setEditingId(null);
                   setForm({
                     title: '',
                     content: '',
                     subject_id: '',
                     exam_type: 'IOE',
                     difficulty_level: 'moderate'
                   });
                 }}
                 className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
               >
                 Cancel
               </button>
             )}
          </div>
        </form>
        </div>
      </div>
      
      {/* Notes Table */}
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-dark-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Notes ({notes.length})</h3>
          <button
            onClick={fetchNotes}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700/50">
                         <thead className="bg-dark-700/30">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Title</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Difficulty</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exam Type</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
               </tr>
             </thead>
                           <tbody className="bg-dark-800/30 divide-y divide-dark-700/50">
                 {notes.map((note) => (
                   <tr key={note.id} className="hover:bg-dark-700/30">
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                       <div>
                         <div className="font-medium">{note.title}</div>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                       <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                         {note.subjects?.display_name || note.subject_id || 'N/A'}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                       <div className="text-gray-300 text-xs truncate max-w-xs">
                         {note.content || '-'}
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                         note.difficulty_level === 'easy' ? 'bg-green-500/20 text-green-300' :
                         note.difficulty_level === 'moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                         'bg-red-500/20 text-red-300'
                       }`}>
                         {note.difficulty_level}
                       </span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                       <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                         {note.exam_type || 'IOE'}
                       </span>
                     </td>
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewNote(note)}
                          className="text-green-400 hover:text-green-300 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(note)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
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
        
        {notes.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No notes found. Add your first note above!
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesCRUD;
