import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomerMenu from './pages/CustomerMenu';
import NotFound from './pages/NotFound';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />
          } />
          
          {/* Customer Menu Route */}
          <Route path="/menu" element={<CustomerMenu />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />
          } />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </SocketProvider>
  );
}

export default App; 