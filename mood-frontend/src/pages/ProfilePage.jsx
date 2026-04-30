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
];

const compressAvatarFile = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Please choose an image file'));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const size = 320;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const edge = Math.min(image.width, image.height);
      const sx = (image.width - edge) / 2;
      const sy = (image.height - edge) / 2;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(image, sx, sy, edge, edge, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.onerror = () => reject(new Error('This image could not be read'));
    image.src = reader.result;
  };
  reader.onerror = () => reject(new Error('This image could not be read'));
  reader.readAsDataURL(file);
});

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
    if (avatar && !avatar.startsWith('preset:') && !avatar.startsWith('data:image/')) {
      try {
        const url = new URL(avatar);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        toast.error('Avatar must be a valid image URL');
        setAvatarError(true);
        return;
      }
    }
    if (avatar.length > 120000) {
      toast.error('Avatar image is too large. Try a smaller photo.');
      setAvatarError(true);
      return;
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

  const handleAvatarUpload = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Choose an image under 6MB');
      return;
    }
    try {
      const avatar = await compressAvatarFile(file);
      if (avatar.length > 120000) {
        toast.error('This photo is still too large after compression');
        return;
      }
      setAvatarError(false);
      setForm((current) => ({ ...current, avatar }));
    } catch (err) {
      toast.error(err.message || 'Could not read this image');
      setAvatarError(true);
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
    <div className="profile-studio profile-studio-v2">
      <form onSubmit={handleProfileSave} className="profile-flow">
        <section className="profile-hero-band">
          <div className="profile-passport-slim">
            <span className="profile-kicker">Mood passport</span>
            <div className="profile-persona">
              <UserAvatar
                value={form.avatar}
                name={user?.username || initials}
                className="profile-avatar"
                onError={() => setAvatarError(true)}
              />
              <div className="min-w-0">
                <h1>{form.fullName || user?.username}</h1>
                <p>@{user?.username}</p>
                <p>{user?.email}</p>
              </div>
            </div>
            <div className="profile-stats-line">
              {PROFILE_STATS.map((stat) => (
                <span key={stat.label}>
                  <em>{stat.label}</em>
                  <strong>{stat.value}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="profile-title-area">
            <span>{t('account')}</span>
            <h2>{t('profileTitle')}</h2>
            <p>{t('profileCaption')}</p>
          </div>

          <div className="profile-symbol-controls" aria-label="Display controls">
            <div className="profile-symbol-group">
              <span>{t('language')}</span>
              <div>
                {[
                  { value: 'en', label: 'EN', mark: 'A' },
                  { value: 'tr', label: 'TR', mark: 'I' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={prefs.language === item.value ? 'is-active' : ''}
                    onClick={() => savePrefs({ ...prefs, language: item.value })}
                    aria-pressed={prefs.language === item.value}
                  >
                    <strong>{item.mark}</strong>
                    <em>{item.label}</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="profile-symbol-group">
              <span>{t('theme')}</span>
              <div>
                {[
                  { value: 'light', label: t('light'), mark: 'sun' },
                  { value: 'dark', label: t('dark'), mark: 'moon' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={prefs.appearance === item.value ? 'is-active' : ''}
                    onClick={() => savePrefs({ ...prefs, appearance: item.value })}
                    aria-pressed={prefs.appearance === item.value}
                  >
                    <strong className={`profile-theme-mark ${item.value}`} />
                    <em>{item.label}</em>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="profile-edit-stream">
          <div className="profile-line-fields">
            <label>
              <span>{t('fullName')}</span>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input"
                placeholder={t('fullName')}
              />
            </label>
            <label>
              <span>{t('username')}</span>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input"
                placeholder="moodlover"
              />
            </label>
            <label>
              <span>{t('email')}</span>
              <input value={user?.email || ''} disabled className="input cursor-not-allowed opacity-60" />
            </label>
          </div>

          <div className="profile-avatar-lab">
            <div className="profile-avatar-preview">
              <UserAvatar
                value={form.avatar}
                name={user?.username || initials}
                className="profile-avatar-large"
                onError={() => setAvatarError(true)}
              />
              <div>
                <span>Avatar lab</span>
                <h3>Make it feel like you.</h3>
                <p>Upload a photo from your computer, choose a Luma face, or paste a direct image link.</p>
              </div>
            </div>

            <div className="profile-upload-row">
              <label className="profile-upload-drop">
                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                <strong>Upload photo</strong>
                <span>JPG, PNG, WEBP under 6MB</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setAvatarError(false);
                  setForm({ ...form, avatar: '' });
                }}
                className="profile-soft-button"
              >
                Use initials
              </button>
            </div>

            <div className="profile-avatar-rail">
              <button
                type="button"
                onClick={() => {
                  setAvatarError(false);
                  setForm({ ...form, avatar: '' });
                }}
                className={`profile-avatar-option profile-initial-option ${!form.avatar ? 'is-selected' : ''}`}
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
                    className={`profile-avatar-option ${selected ? 'is-selected' : ''}`}
                    aria-label={`Use ${preset.name} avatar`}
                  >
                    <UserAvatar value={value} name={preset.name} className="h-full w-full" />
                  </button>
                );
              })}
            </div>

            <label className="profile-url-line">
              <span>{t('avatarUrl')}</span>
              <input
                value={form.avatar.startsWith('preset:') || form.avatar.startsWith('data:image/') ? '' : form.avatar}
                onChange={(e) => {
                  setAvatarError(false);
                  setForm({ ...form, avatar: e.target.value });
                }}
                placeholder="https://..."
                className="input"
              />
            </label>
            <p className={`profile-avatar-help ${avatarError ? 'is-error' : ''}`}>
              {avatarError
                ? 'Bu görsel yüklenemedi. Başka bir fotoğraf ya da direkt görsel linki dene.'
                : 'Uploaded photos are cropped and compressed before saving.'}
            </p>
          </div>

          <div className="profile-save-ribbon">
            <button
              type="button"
              onClick={() => setShowPwChange((v) => !v)}
              className="profile-text-button"
            >
              {showPwChange ? t('cancelPassword') : t('changePassword')}
            </button>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </section>
      </form>

      {showPwChange && (
        <form onSubmit={handlePasswordChange} className="profile-password-ribbon">
          <h4>{t('changePassword')}</h4>
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
          <button type="submit" className="btn-secondary">{t('saveChanges')}</button>
        </form>
      )}

      <section className="profile-discovery-stream">
        <div className="profile-discovery-head">
          <span>Discovery console</span>
          <h2>{t('recommendationPrefs')}</h2>
          <p>{t('recommendationPrefsBody')}</p>
        </div>

        <div className="profile-pref-lanes">
          {REC_PREF_GROUPS.map((group, index) => (
            <div key={group.id} className="profile-pref-lane" style={{ '--i': index }}>
              <span>{t(group.labelKey)}</span>
              <Toggle
                checked={getGroupChecked(group)}
                onChange={(val) => handleRecPrefGroupToggle(group, val)}
              />
            </div>
          ))}
        </div>

        <p className="profile-pref-note">
          {t('prefsStored')}
        </p>
      </section>
    </div>
  );
};

export default ProfilePage;
