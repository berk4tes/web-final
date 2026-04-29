import { getAvatarPreset } from '../utils/avatarPresets';

const AvatarFace = ({ preset, className = '' }) => (
  <span
    className={`grid place-items-center overflow-hidden rounded-full ${className}`}
    style={{ background: preset.bg }}
  >
    <svg viewBox="0 0 80 80" className="h-full w-full" aria-hidden="true">
      <circle cx="40" cy="38" r="22" fill={preset.face} opacity="0.96" />
      <circle cx="31" cy="35" r="3" fill={preset.accent} />
      <circle cx="49" cy="35" r="3" fill={preset.accent} />
      <path d="M30 48c6 6 14 6 20 0" fill="none" stroke={preset.accent} strokeWidth="4" strokeLinecap="round" />
      <path d="M20 28c7-12 32-16 43 2" fill="none" stroke={preset.accent} strokeWidth="5" strokeLinecap="round" opacity="0.55" />
    </svg>
  </span>
);

const InitialAvatar = ({ name, className = '' }) => (
  <span className={`grid place-items-center rounded-full bg-gradient-to-br from-accent via-rose-300 to-amber-200 font-bold text-white ${className}`}>
    {(name?.[0] || 'U').toUpperCase()}
  </span>
);

const UserAvatar = ({ value, name, className = 'h-10 w-10', onError }) => {
  const preset = getAvatarPreset(value);
  if (preset) return <AvatarFace preset={preset} className={className} />;

  if (value) {
    return (
      <img
        src={value}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover ${className}`}
        onError={onError}
      />
    );
  }

  return <InitialAvatar name={name} className={className} />;
};

export default UserAvatar;
