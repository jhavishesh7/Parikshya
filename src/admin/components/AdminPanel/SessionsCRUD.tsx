

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const SessionsCRUD: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchSessions(); }, []);

  async function fetchSessions() {
    setLoading(true);
    const { data, error } = await supabase.from('test_sessions').select('*').limit(20);
    if (!error) setSessions(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('test_sessions').delete().eq('id', id);
    fetchSessions();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Test Sessions</h2>
      {loading ? <div className="text-gray-400">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-400">
            <thead>
              <tr>
                <th>User</th><th>Type</th><th>Exam</th><th>Start</th><th>End</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b border-gray-700">
                  <td>{s.user_id}</td>
                  <td>{s.session_type}</td>
                  <td>{s.exam_type}</td>
                  <td>{s.start_time}</td>
                  <td>{s.end_time || '-'}</td>
                  <td>
                    <button className="text-red-400" onClick={() => handleDelete(s.id)}>Delete</button>
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

export default SessionsCRUD;
