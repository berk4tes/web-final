import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { REC_PREFS_DEFAULTS, useUserPreferences } from '../context/UserPreferencesContext';
import api from '../services/api';

const REC_PREF_LABEL_KEYS = {
  showMovies: 'prefMovies',
  showSeries: 'prefSeries',
  showBooks: 'prefBooks',
  showMusic: 'prefMusic',
  showPopular: 'prefPopular',
  showNiche: 'prefNiche',
  highMatchOnly: 'prefHighMatch',
};

const Toggle = ({ checked, onChange }) => (
  <input type="checkbox" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { prefs, savePrefs, t } = useUserPreferences();
  const [form, setForm] = useState({ fullName: '', username: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prefs.fullName || '',
        username: user.username || '',
        avatar: user.avatar || '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
      savePrefs({ ...prefs, fullName: form.fullName.trim() });
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

  const handleRecPrefToggle = (key, val) => {
    savePrefs({ ...prefs, recPrefs: { ...prefs.recPrefs, [key]: val } });
  };

  const initials = useMemo(() => (user?.username?.[0] || 'U').toUpperCase(), [user]);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
      <div>
        <span className="section-eyebrow">{t('account')}</span>
        <h1 className="section-title mt-2">{t('profileTitle')}</h1>
        <p className="mt-1 text-sm text-ink-400">{t('profileCaption')}</p>
      </div>

      {/* Account Info */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink-700 mb-5">{t('accountInfo')}</h2>
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
                <label className="mb-1 block text-sm font-medium text-ink-600">{t('fullName')}</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input"
                  placeholder={t('fullName')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">{t('username')}</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input"
                  placeholder="moodlover"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">{t('email')}</label>
                <input value={user?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-600">{t('language')}</label>
                  <select
                    value={prefs.language}
                    onChange={(e) => savePrefs({ ...prefs, language: e.target.value })}
                    className="input"
                  >
                    <option value="en">English</option>
                    <option value="tr">Türkçe</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-600">{t('theme')}</label>
                  <select
                    value={prefs.appearance}
                    onChange={(e) => savePrefs({ ...prefs, appearance: e.target.value })}
                    className="input"
                  >
                    <option value="light">{t('light')}</option>
                    <option value="dark">{t('dark')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">{t('avatarUrl')}</label>
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
                  {showPwChange ? t('cancelPassword') : t('changePassword')}
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </form>

            {showPwChange && (
              <form onSubmit={handlePasswordChange} className="border-t border-ink-100 pt-5 space-y-3">
                <h4 className="text-sm font-semibold text-ink-600">{t('changePassword')}</h4>
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
                <button type="submit" className="btn-secondary">{t('saveChanges')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Recommendation Preferences */}
      <section className="card">
        <h2 className="font-display text-xl font-semibold text-ink-700">{t('recommendationPrefs')}</h2>
        <p className="mt-1 text-sm text-ink-400">{t('recommendationPrefsBody')}</p>

        <div className="mt-6 divide-y divide-ink-100">
          {Object.entries(REC_PREF_LABEL_KEYS).map(([key, labelKey]) => (
            <div key={key} className="flex items-center justify-between py-3.5">
              <span className="text-sm font-medium text-ink-700">{t(labelKey)}</span>
              <Toggle
                checked={(prefs.recPrefs || REC_PREFS_DEFAULTS)[key]}
                onChange={(val) => handleRecPrefToggle(key, val)}
              />
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-ink-400">
          {t('prefsStored')}
        </p>
      </section>
    </div>
  );
};

export default ProfilePage;
