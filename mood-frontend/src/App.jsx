import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { MoodThemeProvider, useMoodTheme } from './context/MoodThemeContext';
import { UserPreferencesProvider, useUserPreferences } from './context/UserPreferencesContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import VibePage from './pages/VibePage';

// Applies a gentle mood-tinted background overlay that smoothly transitions on theme change.
// background-color is CSS-transitionable so this gives a real crossfade effect.
const ThemedWrapper = ({ children }) => {
  const { theme } = useMoodTheme();
  const { prefs } = useUserPreferences();
  const location = useLocation();
  const dark = prefs.appearance === 'dark';

  return (
    <div
      className={`app-shell relative min-h-screen overflow-x-hidden ${dark ? 'theme-dark' : 'theme-light'}`}
      style={{
        backgroundColor: dark ? '#11100d' : '#f8f7f4',
        '--mood-accent': theme?.accent || '#e6b54a',
        '--mood-soft': theme?.soft || '#faf0d4',
        '--mood-ink': theme?.ink || '#7a5916',
        '--page-bg': dark ? '#11100d' : '#f8f7f4',
        '--surface': theme
          ? `color-mix(in srgb, ${dark ? '#1f1d18' : '#ffffff'} ${dark ? '76%' : '66%'}, ${theme.soft})`
          : (dark ? 'rgba(31, 29, 24, 0.92)' : 'rgba(255, 255, 255, 0.9)'),
        '--surface-strong': theme
          ? `color-mix(in srgb, ${dark ? '#1f1d18' : '#ffffff'} ${dark ? '86%' : '74%'}, ${theme.soft})`
          : (dark ? '#1f1d18' : '#ffffff'),
        '--ink-main': dark ? '#f8f7f4' : '#1f1d18',
        '--ink-soft': dark ? '#d9d2c3' : '#52503f',
        '--ink-muted': dark ? '#a8a190' : '#7a7565',
        '--border': dark ? 'rgba(248,247,244,0.12)' : '#efeee8',
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: theme
            ? `linear-gradient(145deg, ${theme.soft} 0%, ${dark ? '#15140f' : '#f8f7f4'} 42%, ${theme.soft} 100%)`
            : dark
              ? 'linear-gradient(145deg, #17150f 0%, #11100d 100%)'
              : 'transparent',
          opacity: theme ? (dark ? 0.46 : 1) : dark ? 1 : 0,
          transition: 'opacity 0.8s ease, background 0.8s ease',
          mixBlendMode: dark ? 'normal' : 'multiply',
        }}
      />
      <div className="ambient-mood-orb pointer-events-none fixed -bottom-28 -right-24 z-0 h-80 w-80 rounded-full" />
      <div key={location.pathname} className="route-transition relative z-10 min-h-screen">{children}</div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <UserPreferencesProvider>
      <MoodThemeProvider>
        <ThemedWrapper>
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
                background: 'var(--surface-strong)',
                color: 'var(--ink-main)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(20,18,12,0.12)',
              },
              success: { iconTheme: { primary: '#7c5cff', secondary: '#fff' } },
            }}
          />
        </ThemedWrapper>
      </MoodThemeProvider>
    </UserPreferencesProvider>
  </AuthProvider>
);

export default App;
