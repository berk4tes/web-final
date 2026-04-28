// App — router setup with protected routes and toast container (light theme)
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import VibePage from './pages/VibePage';

const App = () => (
  <AuthProvider>
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/vibe" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/vibe"
            element={
              <ProtectedRoute>
                <VibePage />
              </ProtectedRoute>
            }
          />
          <Route path="/mood" element={<Navigate to="/vibe" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: '#1f1d18',
            border: '1px solid #efeee8',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(20,18,12,0.06)',
          },
          success: { iconTheme: { primary: '#7c5cff', secondary: '#fff' } },
        }}
      />
    </div>
  </AuthProvider>
);

export default App;
