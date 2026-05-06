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
  { label: { en: 'Mood DNA', tr: 'Mood DNA' }, value: { en: 'Cinematic', tr: 'Sinematik' } },
  { label: { en: 'Mode', tr: 'Mod' }, value: { en: 'Curated', tr: 'Kürasyon' } },
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
  const tr = prefs.language === 'tr';
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
      toast.error(tr ? 'Kullanıcı adı en az 3 karakter olmalı' : 'Username must be at least 3 characters');
      return;
    }
    const avatar = form.avatar.trim();
    if (avatar && !avatar.startsWith('preset:') && !avatar.startsWith('data:image/')) {
      try {
        const url = new URL(avatar);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        toast.error(tr ? 'Avatar geçerli bir görsel linki olmalı' : 'Avatar must be a valid image URL');
        setAvatarError(true);
        return;
      }
    }
    if (avatar.length > 120000) {
      toast.error(tr ? 'Avatar görseli çok büyük. Daha küçük bir fotoğraf dene.' : 'Avatar image is too large. Try a smaller photo.');
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
      toast.success(tr ? 'Profil güncellendi' : 'Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || (tr ? 'Güncellenemedi' : 'Could not update'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error(tr ? '6MB altı bir görsel seç' : 'Choose an image under 6MB');
      return;
    }
    try {
      const avatar = await compressAvatarFile(file);
      if (avatar.length > 120000) {
        toast.error(tr ? 'Bu fotoğraf sıkıştırmadan sonra da büyük kaldı' : 'This photo is still too large after compression');
        return;
      }
      setAvatarError(false);
      setForm((current) => ({ ...current, avatar }));
    } catch (err) {
      toast.error(tr ? 'Bu görsel okunamadı' : (err.message || 'Could not read this image'));
      setAvatarError(true);
    }
  };

  const handlePasswordChange = async (ev) => {
    ev.preventDefault();
    if (pwForm.next.length < 6) { toast.error(tr ? 'Şifre en az 6 karakter olmalı' : 'Password must be at least 6 characters'); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error(tr ? 'Şifreler eşleşmiyor' : 'Passwords do not match'); return; }
    toast(tr ? 'Şifre değişimi için backend desteği yakında.' : 'Password change requires backend support — coming soon.');
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
    <div className="profile-studio profile-studio-v3">
      <form onSubmit={handleProfileSave} className="pv3-shell">

        {/* ── HERO CARD ── */}
        <div className="profile-card pv3-hero-card">

          {/* Left: passport panel */}
          <div className="pv3-passport">
            <span className="pv3-passport-eyebrow">Mood passport</span>
            <div className="pv3-passport-avatar">
              <UserAvatar
                value={form.avatar}
                name={user?.username || initials}
                className="pv3-avatar-hero"
                onError={() => setAvatarError(true)}
              />
            </div>
            <h2 className="pv3-passport-name">{form.fullName || user?.username}</h2>
            <p className="pv3-passport-handle">@{user?.username}</p>
            <p className="pv3-passport-email">{user?.email}</p>
            <div className="pv3-passport-stats">
              {PROFILE_STATS.map((stat) => (
                <div key={stat.label.en}>
                  <em>{stat.label[prefs.language] || stat.label.en}</em>
                  <strong>{stat.value[prefs.language] || stat.value.en}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Right: header + fields + actions */}
          <div className="pv3-hero-body">
            <div className="pv3-hero-top">
              <div className="pv3-hero-copy">
                <span className="pv3-eyebrow">{t('account')}</span>
                <h1 className="pv3-hero-title">{t('profileTitle')}</h1>
                <p className="pv3-hero-desc">
                  {tr
                    ? 'Hesap ayarlarını, görünümü ve öneri tercihlerini tek bir düzenli akışta yönet.'
                    : 'Manage your account details, appearance, and recommendation preferences in one clean space.'}
                </p>
              </div>
              <div className="pv3-hero-actions">
                <button
                  type="button"
                  onClick={() => setShowPwChange((v) => !v)}
                  className="profile-text-button"
                >
                  {showPwChange ? t('cancelPassword') : t('changePassword')}
                </button>
                <button type="submit" disabled={savingProfile} className="btn-primary pv3-save-btn">
                  {savingProfile ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </div>

            <div className="pv3-fields">
              <label className="pv3-field">
                <span>{t('fullName')}</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input"
                  placeholder={t('fullName')}
                />
              </label>
              <label className="pv3-field">
                <span>{t('username')}</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input"
                  placeholder="moodlover"
                />
              </label>
              <label className="pv3-field">
                <span>{t('email')}</span>
                <input value={user?.email || ''} disabled className="input cursor-not-allowed opacity-60" />
              </label>
            </div>
          </div>
        </div>

        {/* ── SECONDARY GRID ── */}
        <div className="pv3-grid">

          {/* Language & Theme */}
          <section className="profile-card pv3-section">
            <div className="pv3-section-head">
              <span className="pv3-eyebrow">{tr ? 'Görünüm' : 'Appearance'}</span>
              <h3>{tr ? 'Language & Theme' : 'Language & Theme'}</h3>
              <p>{tr ? 'Uygulamanın dilini ve genel görünümünü seç.' : 'Choose the app language and the overall look you want to browse in.'}</p>
            </div>

            <div className="pv3-appearance-groups">
              <div className="pv3-appearance-group">
                <span className="pv3-group-label">{t('language')}</span>
                <div className="pv3-theme-btns">
                  {[
                    { value: 'en', label: 'EN', mark: 'A' },
                    { value: 'tr', label: 'TR', mark: 'I' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`pv3-theme-btn${prefs.language === item.value ? ' is-active' : ''}`}
                      onClick={() => savePrefs({ ...prefs, language: item.value })}
                      aria-pressed={prefs.language === item.value}
                    >
                      <strong className="pv3-lang-mark">{item.mark}</strong>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pv3-appearance-group">
                <span className="pv3-group-label">{t('theme')}</span>
                <div className="pv3-theme-btns">
                  {[
                    { value: 'light', label: t('light') },
                    { value: 'dark', label: t('dark') },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`pv3-theme-btn${prefs.appearance === item.value ? ' is-active' : ''}`}
                      onClick={() => savePrefs({ ...prefs, appearance: item.value })}
                      aria-pressed={prefs.appearance === item.value}
                    >
                      <span className={`pv3-theme-dot pv3-theme-dot--${item.value}`} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Avatar lab */}
          <section className="profile-card pv3-section">
            <div className="pv3-section-head">
              <span className="pv3-eyebrow">{tr ? 'Avatar lab' : 'Avatar lab'}</span>
              <h3>{tr ? 'Make it feel like you.' : 'Make it feel like you.'}</h3>
              <p>{tr ? 'Hazır avatar seç ya da kendi fotoğrafını yükle.' : 'Pick a preset avatar or upload a photo for a more personal look.'}</p>
            </div>
            <div className="pv3-avatar-controls">
              <label className="profile-upload-drop pv3-upload">
                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                <strong>{tr ? 'Foto yükle' : 'Upload photo'}</strong>
                <span>{tr ? 'JPG, PNG, WEBP - 6MB altı' : 'JPG, PNG, WEBP under 6MB'}</span>
              </label>
              <div className="profile-avatar-rail">
                {AVATAR_PRESETS.map((preset) => {
                  const value = `preset:${preset.id}`;
                  const selected = form.avatar === value;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => { setAvatarError(false); setForm({ ...form, avatar: value }); }}
                      className={`profile-avatar-option${selected ? ' is-selected' : ''}`}
                      aria-label={tr ? `${preset.name} avatarını kullan` : `Use ${preset.name} avatar`}
                    >
                      <UserAvatar value={value} name={preset.name} className="h-full w-full" />
                    </button>
                  );
                })}
              </div>
              {avatarError && (
                <p className="profile-avatar-help is-error">
                  {tr ? 'Bu görsel yüklenemedi. Başka bir fotoğraf dene.' : 'This image could not be loaded. Try another photo.'}
                </p>
              )}
            </div>
          </section>

          {/* Recommendation preferences — full width */}
          <section className="profile-card pv3-section pv3-rec-section">
            <div className="pv3-section-head">
              <span className="pv3-eyebrow">{tr ? 'Keşif konsolu' : 'Discovery console'}</span>
              <h3>{t('recommendationPrefs')}</h3>
              <p>{tr ? 'Önerilerde ne kadar geniş ya da seçici olmak istediğini ayarla.' : 'Control how broad or selective the recommendation feed should feel.'}</p>
            </div>
            <div className="pv3-pref-grid">
              {REC_PREF_GROUPS.map((group) => (
                <div key={group.id} className="pv3-pref-row">
                  <span>{t(group.labelKey)}</span>
                  <Toggle
                    checked={getGroupChecked(group)}
                    onChange={(val) => handleRecPrefGroupToggle(group, val)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </form>

      {/* ── PASSWORD CHANGE ── */}
      {showPwChange && (
        <form onSubmit={handlePasswordChange} className="profile-card pv3-section pv3-pw-card">
          <div className="pv3-section-head">
            <span className="pv3-eyebrow">{t('changePassword')}</span>
            <h3>{tr ? 'Security' : 'Security'}</h3>
            <p>{tr ? 'Şifreni güncellemek için alanları doldur.' : 'Fill in the fields below to update your password.'}</p>
          </div>
          <div className="pv3-pw-fields">
            <input
              type="password"
              placeholder={tr ? 'Mevcut şifre' : 'Current password'}
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className="input"
            />
            <input
              type="password"
              placeholder={tr ? 'Yeni şifre (en az 6 karakter)' : 'New password (min 6 characters)'}
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              className="input"
            />
            <input
              type="password"
              placeholder={tr ? 'Yeni şifreyi onayla' : 'Confirm new password'}
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="input"
            />
            <button type="submit" className="btn-primary">{t('saveChanges')}</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
