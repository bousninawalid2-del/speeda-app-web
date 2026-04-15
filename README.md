# Speeda — AI-Powered Social Media Marketing OS

Full-stack Next.js 16 application for managing social media, ad campaigns, and AI-generated content for local businesses. Built with the App Router, Prisma 7, PostgreSQL, and Ayrshare.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Fill in the values in `.env` at the project root (see [Environment Variables](#environment-variables)):

```bash
# Generate strong JWT secrets
openssl rand -base64 64
```

### 3. Set up the database

Requires PostgreSQL 14+. Start locally or use a managed service (Supabase, Neon, Railway).

```bash
# Apply migrations and create all tables
npx prisma migrate dev --name init

# (Re-)generate the Prisma client after any schema change
npx prisma generate

# Explore your data visually
npx prisma studio
```

### 4. Start the development server

```bash
npm run dev       # Turbopack — http://localhost:3000
```

### 5. Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
speeda-app/
├── prisma/
│   ├── schema.prisma          # Data models
│   └── prisma.config.ts       # Prisma 7 adapter config (PrismaPg)
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API routes (see below)
│   │   ├── auth/              # Auth pages (login, register, reset-password…)
│   │   ├── dashboard/         # Authenticated app pages
│   │   └── setup/             # Onboarding / business setup
│   ├── components/            # Shared UI components
│   ├── i18n/                  # Translations (en, ar, fr)
│   ├── lib/
│   │   ├── api-client.ts      # Client-side fetch wrapper with auto-refresh
│   │   ├── auth-guard.ts      # requireAuth() server helper
│   │   ├── ayrshare.ts        # Ayrshare API client (server-only)
│   │   └── db.ts              # Prisma singleton (PrismaPg adapter)
│   └── screens/               # Full-page screen components
```

---

## API Endpoints

All authenticated endpoints require an `Authorization: Bearer <accessToken>` header.
Tokens are obtained via `POST /api/auth/login` and refreshed via `POST /api/auth/refresh`.

### Authentication

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/api/auth/register` | — | Create a new account. Returns `userId`; triggers email verification OTP. |
| `POST` | `/api/auth/login` | — | Email + password login. Returns `accessToken`, `refreshToken`, `user`. |
| `POST` | `/api/auth/verify` | — | Verify email with 6-digit OTP. Returns tokens on success. |
| `PUT`  | `/api/auth/verify` | — | Resend verification OTP for a given `userId`. |
| `POST` | `/api/auth/refresh` | — | Exchange a valid refresh token for a new access token. |
| `POST` | `/api/auth/logout` | — | Revoke the refresh token. |
| `GET`  | `/api/auth/me` | ✓ | Return the current user's profile. |
| `PUT`  | `/api/auth/change-password` | ✓ | Change password (requires current password). |
| `POST` | `/api/auth/reset-password` | — | Send a password-reset link to the given email. |
| `PUT`  | `/api/auth/reset-password` | — | Consume a reset token and set a new password. |
| `POST` | `/api/auth/quick-login` | — | Send a magic-link login email. |

### Business Setup

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET`  | `/api/setup` | ✓ | Load saved business profile (Activity + Preference + image metadata list). |
| `POST` | `/api/setup` | ✓ | Upsert Activity and Preference in a single transaction. Accepts any subset of fields. |
| `POST` | `/api/setup/upload` | ✓ | Upload a brand asset (PNG/JPG/WebP/GIF/PDF, max 10 MB). Multipart form, field name `file`. |
| `DELETE` | `/api/setup/upload?id=<imageId>` | ✓ | Delete a brand asset by ID (ownership-checked). |

### Social Media Sync

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET`  | `/api/social` | ✓ | List connected social platforms, enriched with live Ayrshare follower data. |
| `POST` | `/api/social/connect` | ✓ | Ensure the user has an Ayrshare profile (creates one if absent), then return a **Max social-linking URL** the client opens in a new tab so the user can connect accounts. |
| `POST` | `/api/social/disconnect` | ✓ | Mark a platform as disconnected. Body: `{ platform: string }`. |

### Campaigns & Ads

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET`  | `/api/campaigns` | ✓ | List all campaigns. Campaigns with `ayrsharePostIds` are enriched with live analytics. Returns grouped stats (active/scheduled/completed). |
| `POST` | `/api/campaigns` | ✓ | Create a new campaign record. |
| `PATCH` | `/api/campaigns/:id` | ✓ | Update campaign fields (status, spent, reach, budget, `ayrsharePostIds`…). |
| `DELETE` | `/api/campaigns/:id` | ✓ | Delete a campaign (ownership-checked). |

### Analytics

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET`  | `/api/analytics` | ✓ | MOS score, reach, impressions, engagement, followers, top posts, daily breakdown. Query params: `period` (`7d`/`30d`/`90d`), `platform`. |

### Posts

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET`  | `/api/posts` | ✓ | Paginated post list. Query params: `platform`, `status`, `page`, `limit`. |
| `POST` | `/api/posts` | ✓ | Create/schedule a post. Body: `{ platform, caption, hashtags?, scheduledAt?, mediaUrls? }`. |

### AI Assistant

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/api/ai` | ✓ | Send a message to the AI assistant. Body: `{ message, context?, history? }`. Wire to Anthropic Claude or OpenAI. |

### Tokens (Credit Balance)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `GET`  | `/api/tokens` | ✓ | Return the user's AI token balance (`used` / `remaining` / `total`). |
| `POST` | `/api/tokens` | ✓ | Purchase a token pack. Body: `{ packId, paymentMethodId }`. Wire to Stripe. |

### Webhooks

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| `POST` | `/api/webhooks/ayrshare` | secret | Ayrshare real-time events. Verifies `Authorization: Bearer <AYRSHARE_WEBHOOK_SECRET>`. Handles `platform_connected` (upsert SocialAccount) and `platform_disconnected` (mark as disconnected). |

---

## Environment Variables

Set these in `.env` at the project root. Never commit real secrets to version control.

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✓ | PostgreSQL connection string. Format: `postgresql://user:pass@host:port/dbname` |
| `JWT_ACCESS_SECRET` | ✓ | Signs short-lived access tokens. Min 32 characters. |
| `JWT_REFRESH_SECRET` | ✓ | Signs long-lived refresh tokens. Min 32 characters. Must differ from access secret. |
| `JWT_ACCESS_EXPIRES` | — | Access token lifetime. Default: `7d`. Uses [ms](https://github.com/vercel/ms) format. |
| `JWT_REFRESH_EXPIRES` | — | Refresh token lifetime. Default: `7d`. |
| `SMTP_HOST` | ✓ | SMTP server hostname (`smtp.resend.com`, `smtp.sendgrid.net`, etc.). |
| `SMTP_PORT` | ✓ | SMTP port — `587` (STARTTLS) or `465` (TLS). |
| `SMTP_SECURE` | — | `"true"` for port 465, `"false"` for 587. |
| `SMTP_USER` | ✓ | SMTP authentication username. |
| `SMTP_PASS` | ✓ | SMTP password or API key. |
| `EMAIL_FROM` | — | Sender address for outgoing emails. Default: `Speeda <noreply@speeda.ai>`. |
| `AYRSHARE_API_KEY` | ✓ | Ayrshare Business API key — required for social sync, analytics, and scheduling. Get yours at [ayrshare.com](https://www.ayrshare.com). |
| `AYRSHARE_WEBHOOK_SECRET` | — | When set, webhook requests must include `Authorization: Bearer <secret>`. Configure the same value in your Ayrshare dashboard. |
| `DISCUSSION_CODE_SECRET` | — | Secret used to generate stateless HMAC discussion codes (`disc_...`) for n8n payloads. If missing, engagement APIs return provider-unavailable responses and the UI falls back to local mock data. |
| `N8N_ENGAGEMENT_WEBHOOK_URL` | — | n8n webhook URL used by `/api/dashboard/engagement` and `/api/chat/engagement-feed`. If missing or failing, those APIs return `503` and UI falls back to existing mock engagement data. |
| `NEXT_PUBLIC_APP_URL` | ✓ | Public URL (no trailing slash). Used in email links and as the Ayrshare OAuth redirect domain. E.g. `https://platform.speeda.ai`. |

---

## Database Models

| Model | Description |
|-------|-------------|
| `User` | Core user account. Holds `profileKey` + `ayrshareUserId` for Ayrshare integration. |
| `SocialAccount` | One row per connected platform per user (`@@unique([userId, platform])`). Updated by webhooks. |
| `Activity` | Business profile — name, industry, location, opening hours, size, year founded. One per user. |
| `Preference` | Brand voice & content settings — tone, language, colors, goals, hashtags. One per user. |
| `DataImage` | Brand assets stored as raw bytes (logo, guidelines). Up to 10 MB each. |
| `Campaign` | Ad campaign with performance metrics, optionally enriched via Ayrshare post analytics. |
| `RefreshToken` | Long-lived refresh tokens stored for server-side revocation. |
| `VerifyToken` | 6-digit email verification OTPs. |
| `ResetToken` | Password-reset tokens. |
| `MagicToken` | Magic-link / quick-login tokens. |

---

## Multi-language Support

The app ships with **English** (`en`), **Arabic** (`ar`), and **French** (`fr`) using [i18next](https://www.i18next.com/) + `react-i18next`.

### How it works

- Translation files live in `src/i18n/` — one TypeScript file per locale (`en.ts`, `ar.ts`, `fr.ts`).
- All three export an object with the same key structure. TypeScript infers available keys from `en.ts`, so missing keys in other locales cause build errors.
- The `src/i18n/index.ts` provider initialises i18next and is imported once at the app root.
- In any component: `const { t, i18n } = useTranslation()` → `t('common.save')`, `i18n.changeLanguage('ar')`.
- RTL layout: Arabic sets `dir="rtl"` on `<html>`; Tailwind's `rtl:` variants handle mirrored layouts.
- Persistence: changing language in Settings calls `POST /api/setup` with `{ language_preference: "ar" }` so it survives sessions.

### Adding a new language

**Step 1** — create the translation file:

```ts
// src/i18n/tr.ts
export const tr = {
  common: {
    back: 'Geri',
    save: 'Kaydet',
    cancel: 'İptal',
    // … mirror every key from en.ts
  },
  // …
};
```

**Step 2** — register it in `src/i18n/index.ts`:

```ts
import { tr } from './tr';

i18n.init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
    tr: { translation: tr },   // ← add
  },
  // …
});
```

**Step 3** — add it to the language picker in `SettingsScreen.tsx`:

```ts
const langs = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'tr', label: 'Türkçe',  flag: '🇹🇷' },  // ← add
];
```

**Step 4** — if the language is RTL, add its code to the RTL check in `src/app/layout.tsx`:

```ts
const isRTL = ['ar', 'he', 'ur'].includes(lang);
```

### Adding a new translation key

1. Add the key to `src/i18n/en.ts` under the appropriate namespace.
2. Add the translated value to `ar.ts` and `fr.ts` (and any other locales) under the same key path.
3. Use it in a component: `t('namespace.newKey')`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 14+ |
| Auth | JWT — short-lived access + long-lived refresh token pattern |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion |
| Social API | Ayrshare Business |
| Email | Nodemailer (SMTP) |
| i18n | i18next + react-i18next |
| Validation | Zod v4 |
