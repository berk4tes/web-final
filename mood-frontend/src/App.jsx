import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { MoodThemeProvider, useMoodTheme } from './context/MoodThemeContext';
import { UserPreferencesProvider, useUserPreferences } from './context/UserPreferencesContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MotivationPage from './pages/MotivationPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import VibePage from './pages/VibePage';

// Applies a gentle mood-tinted background overlay that smoothly transitions on theme change.
// background-color is CSS-transitionable so this gives a real crossfade effect.
const MOOD_MOTION = {
  calm: { rhythm: '14s', fieldRhythm: '19s', drift: '24px', route: '520ms', ease: 'cubic-bezier(0.22, 1, 0.36, 1)', grain: 0.18 },
  sad: { rhythm: '18s', fieldRhythm: '24s', drift: '16px', route: '620ms', ease: 'cubic-bezier(0.33, 1, 0.68, 1)', grain: 0.13 },
  nostalgic: { rhythm: '16s', fieldRhythm: '22s', drift: '20px', route: '560ms', ease: 'cubic-bezier(0.25, 1, 0.5, 1)', grain: 0.2 },
  angry: { rhythm: '7s', fieldRhythm: '10s', drift: '34px', route: '280ms', ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)', grain: 0.26 },
  dreamy: { rhythm: '20s', fieldRhythm: '28s', drift: '28px', route: '700ms', ease: 'cubic-bezier(0.16, 1, 0.3, 1)', grain: 0.16 },
  happy: { rhythm: '10s', fieldRhythm: '14s', drift: '32px', route: '420ms', ease: 'cubic-bezier(0.22, 1, 0.36, 1)', grain: 0.22 },
  excited: { rhythm: '8s', fieldRhythm: '11s', drift: '42px', route: '320ms', ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)', grain: 0.24 },
};

const ThemedWrapper = ({ children }) => {
  const { theme, colorKey } = useMoodTheme();
  const { prefs } = useUserPreferences();
  const location = useLocation();
  const dark = prefs.appearance === 'dark';
  const motion = MOOD_MOTION[colorKey] || MOOD_MOTION.happy;
  const themeVars = {
    '--mood-accent': theme?.accent || '#e6b54a',
    '--mood-soft': theme?.soft || '#faf0d4',
    '--mood-ink': theme?.ink || '#7a5916',
    '--mood-rhythm': motion.rhythm,
    '--mood-field-rhythm': motion.fieldRhythm,
    '--mood-drift': motion.drift,
    '--route-duration': motion.route,
    '--route-ease': motion.ease,
    '--mood-grain-opacity': motion.grain,
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
  };

  useEffect(() => {
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [themeVars]);

  return (
    <div
      className={`app-shell relative min-h-screen overflow-x-hidden ${dark ? 'theme-dark' : 'theme-light'}`}
      data-mood={colorKey || 'neutral'}
      style={{
        backgroundColor: dark ? '#11100d' : '#f8f7f4',
        ...themeVars,
      }}
    >
      <div
        className="mood-atmosphere pointer-events-none fixed inset-0 z-0"
        style={{
          background: theme
            ? `radial-gradient(circle at 18% 18%, color-mix(in srgb, ${theme.accent} 46%, transparent), transparent 32%),
               radial-gradient(circle at 82% 24%, color-mix(in srgb, ${theme.soft} 88%, transparent), transparent 34%),
               radial-gradient(circle at 50% 76%, color-mix(in srgb, ${theme.accent} 26%, transparent), transparent 40%),
               linear-gradient(145deg, color-mix(in srgb, ${theme.soft} 82%, white) 0%, ${dark ? '#110f14' : '#f8f7f4'} 42%, color-mix(in srgb, ${theme.accent} 28%, ${theme.soft}) 100%)`
            : dark
              ? 'linear-gradient(145deg, #17150f 0%, #11100d 100%)'
              : 'transparent',
          opacity: theme ? (dark ? 0.46 : 1) : dark ? 1 : 0,
          transition: 'opacity 0.8s ease, background 0.8s ease',
          mixBlendMode: dark ? 'normal' : 'multiply',
        }}
      />
      <div className="mood-energy-grid pointer-events-none fixed inset-0 z-0" />
      <div className="mood-light-rays pointer-events-none fixed inset-0 z-0" />
      <div className="mood-aurora-band pointer-events-none fixed inset-0 z-0" />
      <div className="mood-breath-field pointer-events-none fixed inset-0 z-0" />
      <div className="ambient-mood-orb pointer-events-none fixed -bottom-28 -right-24 z-0 h-80 w-80 rounded-full" />
      <div className="ambient-mood-orb ambient-mood-orb-secondary pointer-events-none fixed -top-16 left-[-4rem] z-0 h-72 w-72 rounded-full" />
      <div key={location.pathname} className="route-transition relative z-10 min-h-screen">{children}</div>
    </div>
  );
};

const AppFooter = () => (
  <footer className="app-footer relative z-10">
    <div className="app-footer-inner">
      <p className="app-footer-copy">&copy; 2026 Luma. All rights reserved.</p>
      <p className="app-footer-note">Mood-led films, songs, and books.</p>
    </div>
  </footer>
);

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
                path="/motivation"
                element={
                  <ProtectedRoute>
                    <MotivationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moodboard"
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
          <AppFooter />
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
