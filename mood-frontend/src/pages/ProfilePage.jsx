import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PREFS_KEY = 'moodflix.preferences';

const MOOD_THEMES = [
  { key: 'calm', label: 'Calm', desc: 'Soft greens, quiet textures' },
  { key: 'sad', label: 'Melancholic', desc: 'Cool blues, introspective' },
  { key: 'nostalgic', label: 'Nostalgic', desc: 'Warm ambers, golden tones' },
  { key: 'happy', label: 'Sunlit', desc: 'Bright yellows, warm energy' },
  { key: 'excited', label: 'Electric', desc: 'Vivid oranges, bold energy' },
  { key: 'angry', label: 'Intense', desc: 'Deep reds, raw emotion' },
  { key: 'dreamy', label: 'Dreamy', desc: 'Soft lavenders, dreamy fog' },
];

const REC_PREFS_DEFAULTS = {
  showMovies: true,
  showSeries: true,
  showBooks: true,
  showMusic: true,
  showPopular: true,
  showNiche: true,
  highMatchOnly: false,
};

const REC_PREFS_LABELS = {
  showMovies: 'Film recommendations',
  showSeries: 'Series recommendations',
  showBooks: 'Book recommendations',
  showMusic: 'Music recommendations',
  showPopular: 'Show popular content',
  showNiche: 'Show niche / hidden gems',
  highMatchOnly: 'High-match results only',
};

const Toggle = ({ checked, onChange }) => (
  <input type="checkbox" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
);

const MOOD_HEX = {
  calm: '#6dbb8a', sad: '#6c8ec9', nostalgic: '#c89868',
  happy: '#e6b54a', excited: '#e87a4d', angry: '#d96762', dreamy: '#b693d8',
};

const MOOD_SOFT = {
  calm: '#e7f3ec', sad: '#e3eaf6', nostalgic: '#f4ead9',
  happy: '#faf0d4', excited: '#fae0d3', angry: '#f7e0de', dreamy: '#efe7f7',
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ username: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  // Preferences
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      return {
        defaultTheme: stored.defaultTheme ?? null,
        recPrefs: { ...REC_PREFS_DEFAULTS, ...(stored.recPrefs || {}) },
      };
    } catch {
      return { defaultTheme: null, recPrefs: REC_PREFS_DEFAULTS };
    }
  });

  useEffect(() => {
    if (user) setForm({ username: user.username || '', avatar: user.avatar || '' });
  }, [user]);

  const savePrefs = (next) => {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const handleProfileSave = async (ev) => {
    ev.preventDefault();
    if (!user) return;
    if (form.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, {
        username: form.username.trim(),
        avatar: form.avatar.trim(),
      });
      updateUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (ev) => {
    ev.preventDefault();
    if (pwForm.next.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    toast('Password change requires backend support — coming soon.');
    setShowPwChange(false);
    setPwForm({ current: '', next: '', confirm: '' });
  };

  const handleThemeSelect = (key) => {
    savePrefs({ ...prefs, defaultTheme: prefs.defaultTheme === key ? null : key });
  };

  const handleRecPrefToggle = (key, val) => {
    savePrefs({ ...prefs, recPrefs: { ...prefs.recPrefs, [key]: val } });
  };

  const initials = useMemo(() => (user?.username?.[0] || 'U').toUpperCase(), [user]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <span className="section-eyebrow">Account</span>
        <h1 className="section-title mt-2">Profile & Preferences</h1>
        <p className="mt-1 text-sm text-ink-400">Manage your account and personalize your experience.</p>
      </div>

      {/* Account Info */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink-700 mb-5">Account info</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
          {/* Avatar */}
          <div className="card flex flex-col items-center py-8">
            {form.avatar ? (
              <img
                src={form.avatar}
                alt={user?.username}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-accent/30"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-accent via-rose-300 to-amber-200 text-3xl font-bold text-white">
                {initials}
              </div>
            )}
            <h3 className="mt-4 font-display text-lg font-semibold text-ink-700">{user?.username}</h3>
            <p className="text-xs text-ink-400">{user?.email}</p>
          </div>

          {/* Edit form */}
          <div className="card space-y-5">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input"
                  placeholder="moodlover"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">Email</label>
                <input value={user?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">Avatar URL</label>
                <input
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPwChange((v) => !v)}
                  className="text-sm text-ink-400 hover:text-ink-600 hover:underline"
                >
                  {showPwChange ? 'Cancel password change' : 'Change password'}
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>

            {showPwChange && (
              <form onSubmit={handlePasswordChange} className="border-t border-ink-100 pt-5 space-y-3">
                <h4 className="text-sm font-semibold text-ink-600">Change password</h4>
                <input
                  type="password"
                  placeholder="Current password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  className="input"
                />
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  className="input"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="input"
                />
                <div className="flex justify-end">
                  <button type="submit" className="btn-secondary">Update password</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Default Mood Theme */}
      <section className="card">
        <h2 className="font-display text-xl font-semibold text-ink-700">Default mood theme</h2>
        <p className="mt-1 text-sm text-ink-400">
          Choose an ambient theme that sets the tone before you generate a vibe.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOOD_THEMES.map(({ key, label, desc }) => {
            const selected = prefs.defaultTheme === key;
            return (
              <button
                key={key}
                onClick={() => handleThemeSelect(key)}
                className={`rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                  selected ? 'shadow-sm' : 'border-ink-100 bg-white hover:border-ink-200'
                }`}
                style={
                  selected
                    ? { borderColor: MOOD_HEX[key], backgroundColor: MOOD_SOFT[key] }
                    : {}
                }
              >
                <div
                  className="h-6 w-6 rounded-full mb-2 transition-transform duration-150"
                  style={{ backgroundColor: MOOD_HEX[key], transform: selected ? 'scale(1.1)' : 'scale(1)' }}
                />
                <p className="text-sm font-semibold text-ink-700">{label}</p>
                <p className="mt-0.5 text-xs text-ink-400">{desc}</p>
              </button>
            );
          })}
        </div>
        {prefs.defaultTheme && (
          <button
            onClick={() => handleThemeSelect(prefs.defaultTheme)}
            className="mt-3 text-xs text-ink-400 hover:text-rose-500 hover:underline"
          >
            Clear selection
          </button>
        )}
      </section>

      {/* Recommendation Preferences */}
      <section className="card">
        <h2 className="font-display text-xl font-semibold text-ink-700">Recommendation preferences</h2>
        <p className="mt-1 text-sm text-ink-400">
          Personalize what types of content and quality levels appear in your vibes.
        </p>

        <div className="mt-6 divide-y divide-ink-100">
          {Object.entries(REC_PREFS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-3.5">
              <span className="text-sm font-medium text-ink-700">{label}</span>
              <Toggle
                checked={prefs.recPrefs[key]}
                onChange={(val) => handleRecPrefToggle(key, val)}
              />
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-ink-400">
          Preferences are stored locally and applied to your discovery experience.
        </p>
      </section>
    </div>
  );
};

export default ProfilePage;
