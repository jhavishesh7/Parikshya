import React from 'react';
import Header from '../components/Layout/Header';
import AdminPanel from '../admin/components/AdminPanel/AdminPanel';

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <AdminPanel />
      </div>
    </div>
  );
};

export default AdminPage;
