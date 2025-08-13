import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './pages/Dashboard';
import ExamPage from './pages/ExamPage';
import AdminPage from './pages/AdminPage';
import MockTestPage from './pages/MockTestPage';
import MockTestTakingPage from './pages/MockTestTakingPage';
import NotesPage from './pages/NotesPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing platform...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" /> : <LoginForm />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/exam" 
          element={
            <ProtectedRoute>
              <ExamPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mock-tests" 
          element={
            <ProtectedRoute>
              <MockTestPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/mock-test/:testId" 
          element={
            <ProtectedRoute>
              <MockTestTakingPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/notes" 
          element={
            <ProtectedRoute>
              <NotesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;