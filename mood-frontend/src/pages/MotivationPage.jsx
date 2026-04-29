import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

const GAME_KEY = 'moodflix.gameState';

const MOODS = [
  { id: 'happy', emoji: '😊', label: { en: 'Bright', tr: 'Parlak' }, room: 'Sunlit Watch Room' },
  { id: 'calm', emoji: '😌', label: { en: 'Calm', tr: 'Sakin' }, room: 'Soft Focus Room' },
  { id: 'dreamy', emoji: '🌙', label: { en: 'Dreamy', tr: 'Dalgın' }, room: 'Dreamy Night Room' },
  { id: 'nostalgic', emoji: '🍂', label: { en: 'Nostalgic', tr: 'Nostaljik' }, room: 'Autumn Rewatch Room' },
  { id: 'intense', emoji: '🔥', label: { en: 'Intense', tr: 'Yoğun' }, room: 'High Drama Room' },
];

const DAILY_TASKS = [
  { id: 'checkin', xp: 50, label: { en: 'Mood check-in', tr: 'Mood check-in' } },
  { id: 'film', xp: 80, label: { en: 'Finish a film or series episode', tr: 'Bir film veya dizi bölümü bitir' } },
  { id: 'music', xp: 60, label: { en: 'Discover a new track', tr: 'Yeni bir şarkı keşfet' } },
  { id: 'save', xp: 40, label: { en: 'Save one vibe', tr: 'Bir vibe kaydet' } },
];

const LEVELS = [
  { min: 0, title: 'Mood Hunter' },
  { min: 250, title: 'Vibe Scout' },
  { min: 600, title: 'Mood Curator' },
  { min: 1000, title: 'Vibe Maestro' },
  { min: 1600, title: 'Cinematic Oracle' },
];

const localDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readGameState = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(GAME_KEY) || '{}');
    return {
      xp: stored.xp || 0,
      checkins: Array.isArray(stored.checkins) ? stored.checkins : [],
      tasksByDay: stored.tasksByDay || {},
    };
  } catch {
    return { xp: 0, checkins: [], tasksByDay: {} };
  }
};

const getLevel = (xp) => {
  const current = [...LEVELS].reverse().find((level) => xp >= level.min) || LEVELS[0];
  const next = LEVELS.find((level) => level.min > xp);
  const span = next ? next.min - current.min : 500;
  const progress = next ? Math.min(100, Math.round(((xp - current.min) / span) * 100)) : 100;
  return { current, next, progress };
};

const calculateStreak = (checkins) => {
  const days = new Set(checkins.map((item) => item.date));
  let streak = 0;
  const cursor = new Date();
  while (days.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const MedalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l-2 7h-4L8 2z" />
    <circle cx="12" cy="15" r="5" />
  </svg>
);

const MotivationPage = () => {
  const { user } = useAuth();
  const { prefs, t } = useUserPreferences();
  const tr = prefs.language === 'tr';
  const today = localDateKey();
  const [game, setGame] = useState(readGameState);

  useEffect(() => {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  }, [game]);

  const todayTasks = game.tasksByDay[today] || {};
  const todayCheckin = game.checkins.find((item) => item.date === today);
  const streak = calculateStreak(game.checkins);
  const level = getLevel(game.xp);
  const activeMood = MOODS.find((mood) => mood.id === todayCheckin?.moodId) || MOODS[0];
  const completedCount = DAILY_TASKS.filter((task) => todayTasks[task.id]).length;

  const battle = useMemo(() => {
    const friendXp = 380 + streak * 35;
    const weeklyXp = Math.min(760, game.xp % 900);
    return {
      you: weeklyXp,
      friend: friendXp,
      leading: weeklyXp >= friendXp,
      gap: Math.abs(weeklyXp - friendXp),
    };
  }, [game.xp, streak]);

  const leaderboard = useMemo(() => [
    { name: user?.username || 'You', xp: game.xp, self: true },
    { name: 'Lara', xp: 1380 },
    { name: 'Mert', xp: 1120 },
    { name: 'Selin', xp: 940 },
    { name: 'Deniz', xp: 760 },
  ].sort((a, b) => b.xp - a.xp), [game.xp, user?.username]);

  const awardXp = (amount) => {
    setGame((prev) => ({ ...prev, xp: prev.xp + amount }));
  };

  const handleCheckin = (mood) => {
    if (todayCheckin) {
      setGame((prev) => ({
        ...prev,
        checkins: prev.checkins.map((item) => item.date === today ? { ...item, moodId: mood.id } : item),
      }));
      toast.success(tr ? 'Bugünün moodu güncellendi' : 'Today’s mood updated');
      return;
    }

    setGame((prev) => ({
      ...prev,
      xp: prev.xp + 50,
      checkins: [{ date: today, moodId: mood.id }, ...prev.checkins].slice(0, 60),
      tasksByDay: {
        ...prev.tasksByDay,
        [today]: { ...(prev.tasksByDay[today] || {}), checkin: true },
      },
    }));
    toast.success('+50 XP');
  };

  const handleTaskToggle = (task) => {
    if (todayTasks[task.id]) return;
    setGame((prev) => ({
      ...prev,
      xp: prev.xp + task.xp,
      tasksByDay: {
        ...prev.tasksByDay,
        [today]: { ...(prev.tasksByDay[today] || {}), [task.id]: true },
      },
    }));
    toast.success(`+${task.xp} XP`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-ink-100 bg-white/85 p-5 shadow-soft backdrop-blur sm:p-8 lg:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-rose-300 to-amber-300" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <span className="section-eyebrow">{t('navMotivation')}</span>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink-700 text-balance sm:text-6xl">
              {tr ? 'Moodunu oyuna çevir.' : 'Turn your mood into momentum.'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
              {tr
                ? 'Günlük check-in yap, XP kazan, streak koru ve arkadaşlarınla haftalık vibe yarışına katıl.'
                : 'Check in daily, earn XP, protect your streak, and join a weekly vibe race with friends.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip-accent">{level.current.title}</span>
              <span className="chip">{streak}/7 {tr ? 'gün streak' : 'day streak'}</span>
              <span className="chip">{completedCount}/{DAILY_TASKS.length} {tr ? 'görev' : 'tasks'}</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-ink-100 bg-white/75 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-500">{level.current.title}</p>
                <p className="font-display text-4xl font-semibold text-ink-700">{game.xp} XP</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-accent to-rose-300 text-3xl text-white shadow-glow">
                {activeMood.emoji}
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${level.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-400">
              {level.next
                ? `${level.next.min - game.xp} XP ${tr ? 'sonra' : 'to'} ${level.next.title}`
                : tr ? 'En üst seviyedesin' : 'Top level unlocked'}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="section-eyebrow">{tr ? 'Günlük mood check-in' : 'Daily mood check-in'}</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">
                {tr ? 'Bugün nasıl hissediyorsun?' : 'How are you feeling today?'}
              </h2>
            </div>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-ink">+50 XP</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {MOODS.map((mood) => {
              const selected = todayCheckin?.moodId === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleCheckin(mood)}
                  className={`rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-soft ${
                    selected ? 'border-accent bg-accent/10' : 'border-ink-100 bg-white/70'
                  }`}
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="mt-3 block text-sm font-semibold text-ink-700">{mood.label[prefs.language]}</span>
                  <span className="mt-1 block text-xs text-ink-400">
                    {selected ? (tr ? 'Bugünün moodu' : 'Today’s mood') : (tr ? 'Seç' : 'Choose')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          <span className="section-eyebrow">{tr ? '7 günlük seri' : '7 day streak'}</span>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">{streak}/7</h2>
          <div className="mt-5 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-2xl border ${
                  index < streak ? 'border-orange-300 bg-orange-100' : 'border-ink-100 bg-white/70'
                }`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-400">
            {tr
              ? 'Her gün check-in yaparak rozetleri ve daha yüksek XP çarpanlarını aç.'
              : 'Check in every day to unlock badges and higher XP multipliers.'}
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="section-eyebrow">{tr ? 'Günlük görevler' : 'Daily quests'}</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">
                {tr ? 'Bugünün XP planı' : 'Today’s XP plan'}
              </h2>
            </div>
            <Link to="/vibe" className="btn-secondary">{tr ? 'Keşfe git' : 'Go discover'}</Link>
          </div>

          <div className="mt-6 space-y-3">
            {DAILY_TASKS.map((task) => {
              const done = Boolean(todayTasks[task.id]);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleTaskToggle(task)}
                  disabled={done}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                    done
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-ink-100 bg-white/70 hover:-translate-y-0.5 hover:shadow-soft'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{task.label[prefs.language]}</span>
                    <span className="mt-1 block text-xs text-ink-400">+{task.xp} XP</span>
                  </span>
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                    done ? 'bg-emerald-500 text-white' : 'bg-ink-100 text-ink-400'
                  }`}>
                    {done ? '✓' : '+'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-ink-100 bg-ink-700 p-6 text-white shadow-soft">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              {tr ? 'Mood battle' : 'Mood battle'}
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {battle.leading ? (tr ? 'Öndesin' : 'You are leading') : (tr ? 'Yetişebilirsin' : 'You can catch up')}
            </h2>
            <p className="mt-2 text-sm text-white/65">
              {battle.leading
                ? `${battle.gap} XP ${tr ? 'farkla haftalık yarışta öndesin.' : 'ahead in this weekly race.'}`
                : `${battle.gap} XP ${tr ? 'fark var. Bir görev daha kapat.' : 'behind. Clear one more quest.'}`}
            </p>
            <div className="mt-6 space-y-3">
              {[['You', battle.you], ['Best friend', battle.friend]].map(([name, xp]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs text-white/70">
                    <span>{name}</span>
                    <span>{xp} XP</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (xp / 800) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="section-eyebrow">{tr ? 'Vibe room' : 'Vibe room'}</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">{activeMood.room}</h2>
              <p className="mt-2 max-w-xl text-sm text-ink-400">
                {tr
                  ? 'Aynı mooda sahip kullanıcılarla izleme odasına katıl ve beraber öneri keşfet.'
                  : 'Join users with the same mood and discover watch picks together.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => awardXp(20)}
              className="btn-primary"
            >
              {tr ? 'Odaya katıl' : 'Join room'}
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Live watchlist', 'Mood chat', 'Group picks'].map((item, index) => (
              <div key={item} className="rounded-2xl border border-ink-100 bg-white/70 p-4">
                <p className="text-sm font-semibold text-ink-700">{tr ? ['Canlı izleme listesi', 'Mood sohbeti', 'Grup seçimleri'][index] : item}</p>
                <p className="mt-1 text-xs text-ink-400">{[18, 12, 7][index]} {tr ? 'aktif kullanıcı' : 'active users'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <span className="section-eyebrow">{tr ? 'Liderlik' : 'Leaderboard'}</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink-700">Top XP</h2>
            </div>
            <MedalIcon />
          </div>
          <div className="space-y-2">
            {leaderboard.map((item, index) => (
              <div
                key={item.name}
                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${
                  item.self ? 'bg-accent/10 text-accent-ink' : 'bg-white/70 text-ink-600'
                }`}
              >
                <span className="text-sm font-semibold">{index + 1}. {item.name}</span>
                <span className="text-xs font-bold">{item.xp} XP</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MotivationPage;
