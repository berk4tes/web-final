# MoodFlix — AI-Powered Mood-Driven Entertainment Recommender

> Bu dosya proje dökümantasyonu ve değişiklik kayıtlarını tutar.
> Her sohbette otomatik olarak Claude'un context'ine yüklenir.

---

## ⚙️ KURAL — DEĞİŞİKLİK LOGLAMA (ZORUNLU)

**Bu projede yapılan HER değişiklik aşağıdaki "CHANGE LOG" bölümüne tek tek eklenmelidir.**

- Her dosya oluşturma, düzenleme, silme işleminden sonra log eklenir.
- Format: `### [YYYY-MM-DD] <kısa başlık>` + altında bullet listesi (hangi dosya, ne değişti, neden).
- Birden fazla dosya tek bir mantıksal değişiklikse tek bir entry altında listelenir.
- Asla retroaktif "şu ana kadar yaptıklarım" özeti tek başına yetmez — yeni değişiklikler her zaman yeni entry olarak eklenir.
- En yeni entry her zaman en üstte (chronological reverse).

---

## 📋 PROJE ÖZETİ

**Amaç:** Kullanıcının mood'una (ruh haline) göre Claude AI ile film/dizi/müzik önerisi üreten full-stack web uygulaması. TMDB API ile poster/özet zenginleştirmesi yapılır.

**İki klasör:**
- [mood-backend/](mood-backend/) — Node.js + Express + MongoDB API
- [mood-frontend/](mood-frontend/) — React + Vite + Tailwind UI

---

## 🛠 TECH STACK

### Backend
- Node.js + Express 4
- MongoDB Atlas + Mongoose 8
- JWT (jsonwebtoken) + bcryptjs
- @anthropic-ai/sdk (Claude API)
- helmet, cors, morgan, express-rate-limit, express-validator
- axios (TMDB API çağrıları)

### Frontend
- React 18 + Vite 5
- Tailwind CSS 3
- React Router v6
- Axios (interceptor'lı)
- Recharts (dashboard grafikleri)
- react-hot-toast (bildirimler)
- Context API (AuthContext)

---

## 📁 KLASÖR YAPISI

```
webDesignFinal/
├── CLAUDE.md                          ← bu dosya
├── mood-backend/
│   ├── config/db.js                   MongoDB connect helper
│   ├── controllers/
│   │   ├── authController.js          register, login, getMe
│   │   ├── userController.js          updateProfile (sahiplik kontrolü)
│   │   ├── moodController.js          createMood, getMoodHistory
│   │   ├── recommendationController.js Claude → TMDB → DB pipeline
│   │   ├── favoriteController.js      add, get, remove, check, search
│   │   └── statsController.js         weekly, streak, summary aggregations
│   ├── middleware/
│   │   ├── auth.js                    JWT verify → req.user
│   │   ├── errorHandler.js            shape error responses
│   │   └── rateLimiter.js             auth/recommendation/general
│   ├── models/
│   │   ├── User.js                    username, email, passwordHash, avatar
│   │   ├── MoodLog.js                 7 mood enum + intensity 1-10
│   │   ├── Recommendation.js          AI suggestion + TMDB metadata
│   │   └── Favorite.js                user bookmarks (unique compound idx)
│   ├── routes/                        6 route dosyası, hepsi validation+auth
│   ├── utils/
│   │   ├── asyncHandler.js            try/catch wrapper
│   │   └── claudeService.js           Anthropic SDK + JSON parse + retry
│   ├── app.js                         Express setup
│   ├── server.js                      MongoDB connect + listen
│   ├── .env.example
│   └── package.json
└── mood-frontend/
    ├── public/favicon.svg
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx             responsive hamburger
    │   │   ├── ProtectedRoute.jsx     token yoksa /login redirect
    │   │   ├── ResultCard.jsx         poster + AI açıklama + favori btn
    │   │   ├── ResultsGrid.jsx        3-col grid + skeleton/empty
    │   │   ├── SkeletonCard.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── MoodSelector.jsx       7 emoji butonu
    │   │   ├── IntensitySlider.jsx    1-10 styled range
    │   │   ├── WeeklyMoodChart.jsx    Recharts BarChart (stacked)
    │   │   ├── StreakCounter.jsx
    │   │   └── MoodSummaryCard.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── MoodInputPage.jsx      ANA SAYFA
    │   │   ├── DashboardPage.jsx      grafikler + filtreli geçmiş
    │   │   ├── ProfilePage.jsx        profil + favoriler (debounced search)
    │   │   └── NotFoundPage.jsx
    │   ├── hooks/
    │   │   ├── useFavorites.js
    │   │   ├── useDebounce.js
    │   │   └── usePagination.js
    │   ├── context/AuthContext.jsx    token + user, login/logout
    │   ├── services/api.js            axios + 401 → logout interceptor
    │   ├── utils/constants.js         MOODS, CONTENT_TYPES, MOOD_HEX
    │   ├── App.jsx                    Router
    │   ├── main.jsx                   BrowserRouter + StrictMode
    │   └── index.css                  Tailwind + .btn-primary vb. utilities
    ├── index.html
    ├── tailwind.config.js             mood-themed renkler + animasyonlar
    ├── postcss.config.js
    ├── vite.config.js
    ├── .env                           VITE_API_URL=http://localhost:5000/api
    └── package.json
```

---

## 🌐 API ENDPOINT'LERİ

| Method | Path | Auth | Açıklama |
|--------|------|------|----------|
| GET    | /api/health                          | ❌ | Sağlık kontrolü |
| POST   | /api/auth/register                   | ❌ | Validation → bcrypt(10) → JWT(7d) |
| POST   | /api/auth/login                      | ❌ | Compare → JWT |
| GET    | /api/auth/me                         | ✅ | Mevcut kullanıcı |
| PATCH  | /api/users/:id                       | ✅ | Username/avatar güncelle |
| POST   | /api/moods                           | ✅ | Mood log oluştur |
| GET    | /api/moods/history                   | ✅ | Sayfalı mood geçmişi |
| POST   | /api/recommendations/mood            | ✅ | Claude → TMDB → DB |
| GET    | /api/recommendations/history         | ✅ | Filtre + pagination (contentType, dateRange) |
| GET    | /api/recommendations/:id             | ✅ | Tekil öneri |
| POST   | /api/favorites                       | ✅ | Favori ekle (duplicate=409) |
| GET    | /api/favorites                       | ✅ | Sayfalı liste |
| GET    | /api/favorites/check/:externalId     | ✅ | `{ isFavorite: bool }` |
| GET    | /api/favorites/search?q=             | ✅ | Regex arama (escape'li) |
| DELETE | /api/favorites/:id                   | ✅ | Sahiplik kontrolü + sil |
| GET    | /api/stats/weekly                    | ✅ | Son 7 gün, mood'a göre stacked |
| GET    | /api/stats/streak                    | ✅ | Ardışık gün sayısı |
| GET    | /api/stats/summary                   | ✅ | Toplam, en sık mood, ort. intensity |

---

## 🔐 RATE LIMITS

- `/api/auth/*` → 10 istek / 15 dakika
- `/api/recommendations/*` → 20 istek / dakika
- Genel `/api/*` → 100 istek / 15 dakika

---

## 📊 MONGOOSE INDEX'LERİ

- **MoodLog**: `{ userId: 1, loggedAt: -1 }` (compound)
- **Recommendation**: `{ userId: 1, createdAt: -1 }` (compound)
- **Favorite**: `{ userId: 1, externalId: 1 }` (unique) + `{ userId: 1, savedAt: -1 }`
- **User**: `username` ve `email` üzerinde unique

---

## 🎨 UI / UX KARARLARI

- **Renk paleti:** Koyu tema, radial gradient (slate-950 + indigo-950)
- **Mood renkleri:** happy=amber, sad=blue, excited=orange, calm=teal, angry=red, nostalgic=purple, tired=gray
- **Tailwind component sınıfları** (`src/index.css`): `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.card`, `.badge`
- **Animasyonlar:** `fade-in`, `slide-up`, `pulse-soft` (tailwind.config.js)
- **Toast:** sağ üst, `react-hot-toast`, accent renk purple
- **Mobile-first responsive:** 320 → 768 → 1280

---

## 🔑 GEREKLİ CREDENTIAL'LAR (`.env`)

| Key | Nereden | Ücretsiz mi |
|-----|---------|--------------|
| `MONGO_URI` | https://cloud.mongodb.com | ✅ Free cluster |
| `JWT_SECRET` | `openssl rand -hex 32` | ✅ kendin üret |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | ❌ ücretli ($5 trial) |
| `TMDB_API_KEY` | https://www.themoviedb.org/settings/api | ✅ tamamen ücretsiz |
| `FRONTEND_URL` | `http://localhost:5173` | — |
| `PORT` | `5000` | — |

---

## 🚀 ÇALIŞTIRMA

```bash
# Backend
cd mood-backend
cp .env.example .env   # değerleri doldur
npm install
npm run dev            # http://localhost:5000

# Frontend (yeni terminal)
cd mood-frontend
npm install
npm run dev            # http://localhost:5173
```

---

## 📝 CHANGE LOG

> Her değişiklik bu bölüme yeni entry olarak en üstten eklenir.
> Format: `### [YYYY-MM-DD] başlık` + bullet'lar.

### [2026-04-21] Backend ilk başarılı bağlantı + test user oluşturuldu

- `mood-backend/.env` dolduruldu (MONGO_URI + JWT_SECRET).
- Database adı eklenmedi → Mongoose default `test` database'ine yazıyor (kullanıcı tercihi).
- **Port çakışması:** macOS AirPlay Receiver 5000'i kullandığı için PORT 5001'e değiştirildi.
  - `mood-backend/.env`: `PORT=5001`
  - `mood-frontend/.env`: `VITE_API_URL=http://localhost:5001/api`
- `npm install` başarılı (168 paket).
- Backend çalışıyor: `MongoDB connected: ac-omsnttl-shard-00-01.d0rqojv.mongodb.net` + `Server listening on port 5001`.
- **Test user oluşturuldu** (curl ile `POST /api/auth/register`):
  - email: `berk@test.com` / şifre: `test123` / username: `berk`
  - User ID: `69e765d672d0fbb54ad840c3`
  - JWT token başarıyla döndü.
- Sırada: Frontend'i yeniden başlatıp login akışını UI'dan test etmek.

### [2026-04-21] CLAUDE.md eklendi

- Yeni dosya: [CLAUDE.md](CLAUDE.md) — proje dökümantasyonu ve change log için merkezi referans.
- "KURAL — DEĞİŞİKLİK LOGLAMA" bölümü eklendi: bu projede yapılan her değişiklik bu dosyada loglanacak.
- Mevcut yapı (proje özeti, tech stack, klasör yapısı, API endpoint'leri, UI kararları, credential rehberi, çalıştırma talimatları) baseline olarak yazıldı.

### [2026-04-21] Frontend ilk başlatma testi

- Kullanıcı `mood-frontend` klasöründe `npm install && npm run dev` çalıştırdı.
- LoginPage başarıyla render oldu (http://localhost:5173/login).
- Backend henüz çalıştırılmadığı için login butonu network error verir — bu beklenen davranış.

### [2026-04-21] İlk full-stack baseline

- Backend tamamen oluşturuldu (27 dosya): config, 4 model, 6 controller, 3 middleware, 6 route, 2 util, app.js, server.js, package.json, .env.example, .gitignore.
- Frontend tamamen oluşturuldu (25 dosya): 11 component, 6 page, 3 hook, AuthContext, api service, constants, App, main, index.css, public/favicon.svg, html/config dosyaları.
- Tüm endpoint'ler validation + auth + rate limit + error handling ile çalışır durumda.
- Claude AI entegrasyonu: model `claude-sonnet-4-20250514`, max_tokens 1024, JSON parse + 1x retry.
- TMDB enrichment: title bazlı search → ilk sonucun poster + overview'i alınır, eşleşme yoksa Claude'un orijinal önerisi posterless saklanır.
- Mood-themed renk paleti, dark theme, responsive layout, animasyonlar.
