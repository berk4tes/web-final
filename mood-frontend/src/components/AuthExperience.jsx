import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useMoodTheme } from '../context/MoodThemeContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const contentFor = (tr) => [
  {
    kind: 'cinema',
    title: tr ? 'Yağmurdan sonra sinema' : 'Cinema after rain',
    meta: tr ? 'Film / Dizi' : 'Film / Series',
    tag: tr ? 'gece' : 'late night',
    size: 'wide',
  },
  {
    kind: 'music',
    title: tr ? 'Lo-fi sabah rotası' : 'Lo-fi morning route',
    meta: tr ? 'Müzik' : 'Music',
    tag: tr ? 'playlist' : 'playlist',
  },
  {
    kind: 'book',
    title: tr ? 'Altı çizili sayfalar' : 'Underlined pages',
    meta: tr ? 'Kitap' : 'Book',
    tag: tr ? 'sessiz' : 'quiet',
    size: 'tall',
  },
  {
    kind: 'series',
    title: tr ? 'Tek bölüm daha' : 'One more episode',
    meta: tr ? 'Dizi' : 'Series',
    tag: tr ? 'merak' : 'curious',
  },
  {
    kind: 'album',
    title: tr ? 'Kalp ritmi arşivi' : 'Heartbeat archive',
    meta: tr ? 'Albüm' : 'Album',
    tag: tr ? 'dream pop' : 'dream pop',
    size: 'wide',
  },
  {
    kind: 'book dark',
    title: tr ? 'Kışlık romanlar' : 'Winter novels',
    meta: tr ? 'Kitaplık' : 'Shelf',
    tag: tr ? 'yavaş' : 'slow',
  },
  {
    kind: 'cinema gold',
    title: tr ? 'Altın saat fragmanı' : 'Golden hour trailer',
    meta: tr ? 'Film' : 'Movie',
    tag: tr ? 'sıcak' : 'warm',
    size: 'tall',
  },
  {
    kind: 'music teal',
    title: tr ? "Şehir ışıkları miks'i" : 'City lights mix',
    meta: tr ? 'Müzik' : 'Music',
    tag: tr ? 'sürüş' : 'drive',
  },
];

const AuthBackground = ({ tr }) => {
  const tiles = useMemo(() => contentFor(tr), [tr]);
  const tracks = [tiles, [...tiles].reverse(), [...tiles.slice(3), ...tiles.slice(0, 3)]];

  return (
    <div className="auth-canvas" aria-hidden="true">
      <div className="auth-vignette" />
      {tracks.map((track, trackIndex) => (
        <div
          key={trackIndex}
          className={`auth-media-track auth-media-track-${trackIndex + 1}`}
        >
          {[...track, ...track].map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className={`auth-media-tile ${item.kind} ${item.size || ''}`}
            >
              <span className="auth-media-type">{item.meta}</span>
              <strong>{item.title}</strong>
              <em>{item.tag}</em>
              {item.kind.includes('music') || item.kind.includes('album') ? (
                <span className="auth-record" />
              ) : null}
              {item.kind.includes('cinema') || item.kind.includes('series') ? (
                <span className="auth-frame-lines" />
              ) : null}
            </article>
          ))}
        </div>
      ))}
    </div>
  );
};

const AuthExperience = ({ mode }) => {
  const isRegister = mode === 'register';
  const { login, register, isAuthenticated } = useAuth();
  const { theme } = useMoodTheme();
  const { prefs, t } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/vibe" replace />;

  const copy = {
    eyebrow: isRegister ? t('getStarted') : t('signIn'),
    title: isRegister ? t('createAccount') : t('welcomeBack'),
    body: isRegister
      ? (tr ? 'Mood’una uyan film, dizi, kitap ve müzikleri kendi arşivinde biriktir.' : 'Start building a personal archive of films, series, books, and songs that match your mood.')
      : (tr ? 'Kaldığın yerden devam et; yeni vibe’lar ve kayıtlı keşiflerin seni bekliyor.' : 'Pick up where you left off with saved discoveries and a fresh mood queue.'),
    heroTitle: tr ? 'Moodun, kürasyonun.' : 'Your mood, curated.',
    heroBody: tr ? 'Hissinden doğan kısa bir keşif panosu.' : 'Stories, songs, pages. One mood.',
  };

  const validate = () => {
    const nextErrors = {};
    if (isRegister && form.username.trim().length < 3) {
      nextErrors.username = tr ? 'En az 3 karakter olmalı' : 'At least 3 characters';
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = tr ? 'Geçerli bir e-posta gir' : 'Enter a valid email';
    }
    if (form.password.length < 6) {
      nextErrors.password = tr ? 'En az 6 karakter olmalı' : 'At least 6 characters';
    }
    if (isRegister && form.password !== form.confirm) {
      nextErrors.confirm = tr ? 'Şifreler eşleşmiyor' : 'Passwords do not match';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form.username.trim(), form.email, form.password);
        toast.success(t('createAccount'));
        navigate('/vibe', { replace: true });
      } else {
        await login(form.email, form.password);
        toast.success(t('welcomeBack'));
        navigate(location.state?.from || '/vibe', { replace: true });
      }
    } catch (err) {
      const fallback = isRegister
        ? (tr ? 'Kayıt tamamlanamadı' : 'Registration failed')
        : (err.request ? (tr ? 'Sunucuya ulaşılamıyor. Backend çalışıyor mu?' : 'Cannot reach server - is the backend running?') : (tr ? 'E-posta veya şifre hatalı' : 'Invalid email or password'));
      toast.error(err.response?.data?.message || fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        '--auth-accent': theme?.accent || '#d94f45',
        '--auth-soft': theme?.soft || '#f5d7a1',
        '--auth-ink': theme?.ink || '#193a35',
      }}
    >
      <AuthBackground tr={tr} />

      <section className="auth-stage">
        <div className="auth-story">
          <Link to="/vibe" className="auth-brand auth-step" style={{ '--step': 0 }}>
            <span className="auth-brand-mark">L</span>
            <span>Luma</span>
          </Link>
          <h1 className="auth-hero-title auth-step" style={{ '--step': 1 }}>
            {copy.heroTitle}
          </h1>
          <p className="auth-hero-copy auth-step" style={{ '--step': 2 }}>
            {copy.heroBody}
          </p>
          <div className="auth-pill-row auth-step" style={{ '--step': 3 }}>
            {(tr ? ['Film', 'Dizi', 'Müzik', 'Kitap'] : ['Film', 'Series', 'Music', 'Books']).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="auth-panel" key={mode}>
          <div className="auth-mode-switch auth-step" style={{ '--step': 0 }}>
            <Link to="/login" className={!isRegister ? 'is-active' : ''}>
              {t('signIn')}
            </Link>
            <Link to="/register" className={isRegister ? 'is-active' : ''}>
              {t('getStarted')}
            </Link>
          </div>

          <div className="auth-step" style={{ '--step': 1 }}>
            <span className="section-eyebrow">{copy.eyebrow}</span>
            <h2>{copy.title}</h2>
            <p>{copy.body}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {isRegister && (
              <label className="auth-field auth-step" style={{ '--step': 2 }}>
                <span>{t('username')}</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  placeholder={tr ? 'moodgezgini' : 'moodlover'}
                />
                {errors.username && <small>{errors.username}</small>}
              </label>
            )}

            <label className="auth-field auth-step" style={{ '--step': isRegister ? 3 : 2 }}>
              <span>{t('email')}</span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
              {errors.email && <small>{errors.email}</small>}
            </label>

            <label className="auth-field auth-step" style={{ '--step': isRegister ? 4 : 3 }}>
              <span>{t('password')}</span>
              <input
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={tr ? 'En az 6 karakter' : 'At least 6 characters'}
              />
              {errors.password && <small>{errors.password}</small>}
            </label>

            {isRegister && (
              <label className="auth-field auth-step" style={{ '--step': 5 }}>
                <span>{t('confirmPassword')}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
                {errors.confirm && <small>{errors.confirm}</small>}
              </label>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="auth-submit auth-step"
              style={{ '--step': isRegister ? 6 : 4 }}
            >
              {submitting ? `${isRegister ? t('createAccount') : t('signIn')}...` : (isRegister ? t('createAccount') : t('signIn'))}
            </button>
          </form>

          <p className="auth-alt auth-step" style={{ '--step': isRegister ? 7 : 5 }}>
            {isRegister ? t('alreadyAccount') : t('newHere')}{' '}
            <Link to={isRegister ? '/login' : '/register'}>
              {isRegister ? t('signIn') : t('createAccount')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default AuthExperience;
