// LoginPage — light, centered sign-in card
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const { theme } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/vibe" replace />;

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success(t('welcomeBack'));
      navigate(location.state?.from || '/vibe', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || (err.request ? 'Cannot reach server — is the backend running?' : 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-[560px] overflow-hidden rounded-[32px] border border-ink-100 shadow-soft lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              `linear-gradient(140deg, ${theme?.soft || '#faf0d4'} 0%, color-mix(in srgb, ${theme?.accent || '#e6b54a'} 36%, white) 48%, ${theme?.ink || '#7a5916'} 100%)`,
          }}
        />
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-white/35 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute inset-x-10 bottom-10">
          <p className="max-w-md font-display text-5xl font-semibold leading-tight text-white">
            {tr ? 'Her ruh haline uygun keşif alanı.' : 'Mood-first discovery for every kind of night.'}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {(tr ? ['Filmler', 'Kitaplar', 'Müzik'] : ['Films', 'Books', 'Music']).map((label) => (
              <div key={label} className="rounded-2xl border border-white/25 bg-white/20 p-4 text-sm font-semibold text-white backdrop-blur">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="card w-full animate-slide-up p-7 sm:p-9">
        <span className="section-eyebrow">{t('signIn')}</span>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink-700">{t('welcomeBack')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{t('signInCaption')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-600">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-600">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-accent w-full">
            {submitting ? `${t('signIn')}...` : t('signIn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          {t('newHere')}{' '}
          <Link to="/register" className="font-medium text-accent-ink hover:underline">
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
