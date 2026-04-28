// RegisterPage — light registration card
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const { theme } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/vibe" replace />;

  const validate = () => {
    const e = {};
    if (form.username.trim().length < 3) e.username = 'At least 3 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(form.username.trim(), form.email, form.password);
      toast.success(t('createAccount'));
      navigate('/vibe', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="card w-full animate-slide-up p-7 sm:p-9">
        <span className="section-eyebrow">{t('getStarted')}</span>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink-700">{t('createAccount')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{t('registerCaption')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">{t('username')}</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
              placeholder="moodlover"
            />
            {errors.username && <p className="mt-1 text-xs text-rose-500">{errors.username}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">{t('email')}</label>
            <input
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
            <label className="mb-1 block text-sm font-medium text-ink-600">{t('password')}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">{t('confirmPassword')}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="input"
            />
            {errors.confirm && <p className="mt-1 text-xs text-rose-500">{errors.confirm}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-accent w-full">
            {submitting ? `${t('createAccount')}...` : t('createAccount')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          {t('alreadyAccount')}{' '}
          <Link to="/login" className="font-medium text-accent-ink hover:underline">
            {t('signIn')}
          </Link>
        </p>
      </div>

      <section className="relative hidden min-h-[620px] overflow-hidden rounded-[32px] border border-ink-100 shadow-soft lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              `linear-gradient(145deg, ${theme?.ink || '#7a5916'} 0%, ${theme?.accent || '#e6b54a'} 48%, ${theme?.soft || '#faf0d4'} 100%)`,
          }}
        />
        <div className="absolute left-10 top-10 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
        <div className="absolute -bottom-14 right-8 h-80 w-80 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute inset-x-10 bottom-10">
          <div className="grid grid-cols-2 gap-3">
            {(tr ? ['sessiz yağmur', 'paris kafesi', 'altın saat', 'gece yarısı'] : ['quiet rain', 'parisian cafe', 'golden hour', 'late night']).map((label, i) => (
              <div
                key={label}
                className={`rounded-3xl border border-white/25 bg-white/20 p-5 font-display text-2xl font-semibold text-white backdrop-blur ${i % 2 ? 'translate-y-6' : ''}`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
