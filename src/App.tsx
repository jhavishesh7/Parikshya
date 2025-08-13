import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Lazy load components for better performance
const LoginForm = lazy(() => import('./components/Auth/LoginForm'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MockTestPage = lazy(() => import('./pages/MockTestPage'));
const MockTestTakingPage = lazy(() => import('./pages/MockTestTakingPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const { user, loading } = useAuthStore();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : <Navigate to="/" />;
});

ProtectedRoute.displayName = 'ProtectedRoute';

function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
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
      </Suspense>
    </Router>
  );
}

export default App;