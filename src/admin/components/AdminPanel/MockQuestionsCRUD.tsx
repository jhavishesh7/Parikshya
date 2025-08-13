

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

type Subject = {
  id: string;
  name: string;
  display_name: string;
  applicable_exams: string[];
};

const MockQuestionsCRUD: React.FC = () => {
  const [mockQuestions, setMockQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    mock_test_id: '',
    subject_id: '',
  });
  const [mockTestSubject, setMockTestSubject] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMockQuestions();
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    const { data, error } = await supabase.from('subjects').select('*');
    if (!error && data) setSubjects(data);
  }

  async function fetchMockQuestions() {
    setLoading(true);
    const { data, error } = await supabase.from('mock_questions').select('*').limit(20);
    if (!error) setMockQuestions(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('mock_questions').delete().eq('id', id);
    fetchMockQuestions();
  }

  async function handleEdit(q: any) {
    setForm({
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      mock_test_id: q.mock_test_id,
      subject_id: q.subject_id || '',
    });
    setEditingId(q.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formWithSubject = { ...form, subject_id: mockTestSubject || form.subject_id };
    if (editingId) {
      await supabase.from('mock_questions').update(formWithSubject).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('mock_questions').insert([formWithSubject]);
    }
    setForm({ question_text: '', options: ['', '', '', ''], correct_answer: 0, mock_test_id: '', subject_id: '' });
    setMockTestSubject('');
    fetchMockQuestions();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Mock Questions</h2>
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <select className="w-full p-2 rounded bg-gray-700 text-white" value={mockTestSubject} onChange={e => setMockTestSubject(e.target.value)} required>
          <option value="">Select Subject for Mock Test</option>
          {subjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.display_name} ({sub.name})</option>
          ))}
        </select>
        <input className="w-full p-2 rounded bg-gray-700 text-white" placeholder="Question text" value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} required />
        <div className="grid grid-cols-2 gap-2">
          {form.options.map((opt, i) => (
            <input key={i} className="p-2 rounded bg-gray-700 text-white" placeholder={`Option ${i+1}`} value={opt} onChange={e => setForm(f => { const opts = [...f.options]; opts[i] = e.target.value; return { ...f, options: opts }; })} required />
          ))}
        </div>
        <input className="w-full p-2 rounded bg-gray-700 text-white" placeholder="Correct answer (0-3)" type="number" min={0} max={3} value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: Number(e.target.value) }))} required />
        <input className="w-full p-2 rounded bg-gray-700 text-white" placeholder="Mock Test ID" value={form.mock_test_id} onChange={e => setForm(f => ({ ...f, mock_test_id: e.target.value }))} required />
        <select className="w-full p-2 rounded bg-gray-700 text-white" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} required>
          <option value="">Select Subject</option>
          {subjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.display_name} ({sub.name})</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Add'} Mock Question</button>
      </form>
      {loading ? <div className="text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-400">
            <thead>
              <tr>
                <th>Text</th><th>Options</th><th>Answer</th><th>Mock Test</th><th>Subject</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockQuestions.map(q => (
                <tr key={q.id} className="border-b border-gray-700">
                  <td>{q.question_text}</td>
                  <td>{q.options?.join(', ')}</td>
                  <td>{q.correct_answer}</td>
                  <td>{q.mock_test_id}</td>
                  <td>{subjects.find(s => s.id === q.subject_id)?.display_name || q.subject_id}</td>
                  <td>
                    <button className="text-blue-400 mr-2" onClick={() => handleEdit(q)}>Edit</button>
                    <button className="text-red-400" onClick={() => handleDelete(q.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MockQuestionsCRUD;
