import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { REC_PREFS_DEFAULTS, useUserPreferences } from '../context/UserPreferencesContext';
import api from '../services/api';
import { AVATAR_PRESETS } from '../utils/avatarPresets';

const REC_PREF_GROUPS = [
  { id: 'watch', keys: ['showMovies', 'showSeries'], labelKey: 'prefWatch' },
  { id: 'books', key: 'showBooks', labelKey: 'prefBooks' },
  { id: 'music', key: 'showMusic', labelKey: 'prefMusic' },
  { id: 'popular', key: 'showPopular', labelKey: 'prefPopular' },
  { id: 'niche', key: 'showNiche', labelKey: 'prefNiche' },
  { id: 'match', key: 'highMatchOnly', labelKey: 'prefHighMatch' },
];

const PROFILE_STATS = [
  { label: 'Mood DNA', value: 'Cinematic' },
  { label: 'Discovery mode', value: 'Curated' },
  { label: 'Vibe rank', value: 'Level 03' },
];

const Toggle = ({ checked, onChange }) => (
  <input type="checkbox" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { prefs, savePrefs, t } = useUserPreferences();
  const [form, setForm] = useState({ fullName: '', username: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
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
    const avatar = form.avatar.trim();
    if (avatar && !avatar.startsWith('preset:')) {
      try {
        const url = new URL(avatar);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        toast.error('Avatar must be a valid image URL');
        setAvatarError(true);
        return;
      }
    }
    setSavingProfile(true);
    try {
      const { data } = await api.patch(`/users/${user._id}`, {
        username: form.username.trim(),
        avatar,
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

  const handleRecPrefGroupToggle = (group, val) => {
    if (group.keys) {
      savePrefs({
        ...prefs,
        recPrefs: {
          ...prefs.recPrefs,
          ...Object.fromEntries(group.keys.map((key) => [key, val])),
        },
      });
      return;
    }
    handleRecPrefToggle(group.key, val);
  };

  const getGroupChecked = (group) => {
    const recPrefs = prefs.recPrefs || REC_PREFS_DEFAULTS;
    if (group.keys) return group.keys.some((key) => recPrefs[key]);
    return recPrefs[group.key];
  };

  const initials = useMemo(() => (user?.username?.[0] || 'U').toUpperCase(), [user]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-ink-100 bg-white/85 p-5 shadow-soft backdrop-blur sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-rose-300 to-amber-300" />
        <div className="grid gap-7 lg:grid-cols-[330px_1fr]">
          <aside className="relative overflow-hidden rounded-[1.75rem] bg-ink-700 p-6 text-white shadow-soft">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/35 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Mood passport</span>
              <div className="mt-6 flex items-center gap-4">
                <UserAvatar
                  value={form.avatar}
                  name={user?.username || initials}
                  className="h-24 w-24 text-3xl ring-4 ring-white/15"
                  onError={() => setAvatarError(true)}
                />
                <div className="min-w-0">
                  <h1 className="font-display text-3xl font-semibold leading-tight">{form.fullName || user?.username}</h1>
                  <p className="mt-1 truncate text-sm text-white/60">@{user?.username}</p>
                  <p className="truncate text-xs text-white/40">{user?.email}</p>
                </div>
              </div>

              <div className="mt-7 grid gap-2">
                {PROFILE_STATS.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur">
                    <span className="text-xs font-medium text-white/55">{stat.label}</span>
                    <span className="text-xs font-semibold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Profile signal</p>
                <p className="mt-2 font-display text-xl leading-tight">
                  Your profile shapes the mood lens, not just account details.
                </p>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div>
              <span className="section-eyebrow">{t('account')}</span>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-700 sm:text-4xl">
                {t('profileTitle')}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-400">{t('profileCaption')}</p>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-600">{t('email')}</label>
                  <input value={user?.email || ''} disabled className="input cursor-not-allowed opacity-60" />
                </div>
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

              <div className="rounded-[1.5rem] border border-ink-100 bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700">{t('avatarStyle')}</label>
                    <p className="mt-1 text-xs text-ink-400">Choose a profile face that feels like your watch mood.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarError(false);
                      setForm({ ...form, avatar: '' });
                    }}
                    className="btn-pill"
                  >
                    Baş harf
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarError(false);
                      setForm({ ...form, avatar: '' });
                    }}
                    className={`grid aspect-square place-items-center rounded-2xl border text-sm font-bold transition hover:-translate-y-0.5 ${
                      !form.avatar ? 'border-accent bg-accent/10 text-accent-ink' : 'border-ink-100 bg-white text-ink-500'
                    }`}
                    aria-label="Use initial avatar"
                  >
                    {initials}
                  </button>
                  {AVATAR_PRESETS.map((preset) => {
                    const value = `preset:${preset.id}`;
                    const selected = form.avatar === value;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatarError(false);
                          setForm({ ...form, avatar: value });
                        }}
                        className={`rounded-2xl border p-1 transition hover:-translate-y-0.5 ${
                          selected ? 'border-accent bg-accent/10' : 'border-ink-100 bg-white'
                        }`}
                        aria-label={`Use ${preset.name} avatar`}
                      >
                        <UserAvatar value={value} name={preset.name} className="h-full w-full" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-ink-100 bg-white/70 p-4">
                <label className="mb-1 block text-sm font-medium text-ink-600">{t('avatarUrl')}</label>
                <input
                  value={form.avatar.startsWith('preset:') ? '' : form.avatar}
                  onChange={(e) => {
                    setAvatarError(false);
                    setForm({ ...form, avatar: e.target.value });
                  }}
                  placeholder="https://..."
                  className="input"
                />
                <p className={`mt-1 text-xs ${avatarError ? 'text-rose-500' : 'text-ink-400'}`}>
                  {avatarError
                    ? 'Bu görsel yüklenemedi. Direkt açılan bir .jpg, .png veya .webp linki dene.'
                    : 'İnternette herkese açık, direkt görsel linki olmalı.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
              <form onSubmit={handlePasswordChange} className="space-y-3 rounded-[1.5rem] border border-ink-100 bg-white/70 p-4">
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
      <section className="rounded-[2rem] border border-ink-100 bg-white/85 p-5 shadow-soft backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="section-eyebrow">Discovery console</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">{t('recommendationPrefs')}</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-400">{t('recommendationPrefsBody')}</p>
          </div>
          <span className="chip-accent">MoodFlix tuning</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REC_PREF_GROUPS.map((group) => (
            <div key={group.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
              <span className="text-sm font-semibold text-ink-700">{t(group.labelKey)}</span>
              <Toggle
                checked={getGroupChecked(group)}
                onChange={(val) => handleRecPrefGroupToggle(group, val)}
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
