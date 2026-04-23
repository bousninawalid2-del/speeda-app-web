# Audit — Page /dashboard/settings
Date : 2026-04-23
Backup : `_backup_settings_2026-04-23/`

## 1. Résumé du schéma Prisma existant

Tables pertinentes trouvées dans `prisma/schema.prisma` :

| Table | Champs utiles pour Settings |
|---|---|
| **User** | `name`, `email`, `phone`, `profileKey` (Ayrshare), `ayrshareUserId`, `mamoCustomerId`, `tokenBalance`, `referralCode` |
| **Preference** | `tone_of_voice`, `language_preference`, `preferred_platforms`, `hashtags`, `emojis`, `social_media_goals`, `resumer`, `text`, `other`, `action`, `color` — **CSV / texte libre**, pas de booléens, pas de champ `locale` distinct |
| **Activity** | `business_name`, `industry`, `opening_hours`, `audience_target`, etc. (profil business) |
| **Menu** | `id`, `name`, `description`, `url` — **1 ligne par user**, pas de `MenuItem[]`. Les items du menu viennent via webhook n8n (`/api/settings/menu` → `N8N_SETTINGS_MENU_WEBHOOK_URL`) |
| **Payment** | Historique des paiements (Mamopay). **Pas** de table `PaymentMethod`, pas de `stripeCustomerId` |
| **SocialAccount** | Cache local des plateformes Ayrshare connectées |
| **UserSubscription / Plan** | Abonnement (lié à Mamopay, pas Stripe) |

**Aucune** table ni champ pour : `NotificationPreference`, `AutomationRule`, `DmTemplate`, `RssFeed`, `PaymentMethod`, `locale` UI. Aucune intégration Stripe ; facturation = Mamopay (`mamoCustomerId`, `mamoSubscriptionId`).

## 2. Routes API existantes pertinentes

| Route | Méthodes | Source | Réutilisable pour |
|---|---|---|---|
| `/api/settings/profile` | GET/PUT | Prisma.User | Account (déjà dynamisé) |
| `/api/settings/brand-voice` | GET/PUT | Prisma.Preference | AI Preferences → Brand Voice ✅ |
| `/api/settings/menu` | GET | n8n webhook `settings-menu` | AI Preferences → Restaurant Menu ✅ |
| `/api/settings/account-health` | GET | calculé | Account health |
| `/api/social` | GET | Ayrshare `/user` + sync DB | Connected Platforms (existant, à enrichir) |
| `/api/social/connect` | POST | Ayrshare `generateJWT` | Lien de connexion |
| `/api/social/disconnect` | POST | Ayrshare | Déconnexion |
| `/api/billing` | GET | Prisma.Payment | **Historique** uniquement (pas les méthodes de paiement) |
| `/api/tokens` | GET | Prisma | Tokens (dynamisé) |
| `/api/subscriptions/*` | — | Mamopay | Plan (dynamisé) |

Pattern engagement (à répliquer) : `src/lib/ayrshare-engagement.ts` avec `resolveProfileKey(userId)` + cache in-memory 60 s (`withCache`). Toutes les routes utilisent `requireAuth`.

## 3. Matrice par section UI

Légende : ✅ faisable maintenant · ⚠️ partiel · ❌ nécessite changement de schéma (à ignorer)

### 🟦 Marketing OS

| Sous-section | Source | Statut | Action |
|---|---|---|---|
| **3.1 Connected Platforms** | Ayrshare `GET /api/user` | ✅ | Créer proxy `GET /api/settings/connected-platforms` qui retourne `activeSocialAccounts`, `displayNames[]` (incl. `refreshDaysRemaining`, `messagingActive`) — enrichit `/api/social` existant sans le casser |
| **3.2 RSS Feeds** | Ayrshare `/feed` (GET/POST/DELETE/PUT) | ✅ | Créer `GET/POST/DELETE/PUT /api/settings/rss-feeds` (proxy Ayrshare, zéro persistence DB) |
| **3.3 Posting Schedule** | Ayrshare `/auto-schedule/{list,set,delete}` | ✅ | Créer `GET/POST/DELETE /api/settings/posting-schedule` |
| **3.4 DM Auto-Response (toggle global)** | Ayrshare `/messages/autoresponse` | ✅ | Créer `GET/PUT /api/settings/dm-auto-response` |

### 🟣 AI Preferences

| Sous-section | Source | Statut | Action |
|---|---|---|---|
| **4.1a Brand Voice** (tone/languages/keywords/descr.) | `Preference` + route existante | ✅ | Brancher `useBrandVoiceSettings` déjà existant sur la section Marketing OS du SettingsScreen (aujourd'hui valeurs hardcodées "Professional / Fun / Saudi + English / shawarma…") |
| **4.1b Restaurant Menu** | n8n webhook existant | ⚠️ | Afficher le **count** réel via `GET /api/settings/menu` (aujourd'hui `4 items uploaded` hardcodé). Le bouton "Manage" va déjà vers la page menu |
| **4.2 Automation Rules** (5 toggles : autoBoost, autoRespond, autoPublish, autoPause, autoAdjust) | **aucun champ DB** | ❌ | **IGNORÉ** — nécessite table `AutomationRule` ou 5 booléens sur `Preference`/`User` |
| **4.3 DM Auto-Response Templates** (4 sujets + custom, on/off chacun) | **aucun champ DB** | ❌ | **IGNORÉ** — nécessite table `DmTemplate { id, userId, topic, message, enabled }`. *Note* : le toggle global (3.4) reste dynamisable via Ayrshare |

### 🟨 Notifications

| Sous-section | Source | Statut | Action |
|---|---|---|---|
| **4.4 Notification Preferences** (10+ toggles) | **aucun champ DB** | ❌ | **IGNORÉ** — nécessite table `NotificationPreference` ou un JSON sur `User` |

### 🌐 Language

| Sous-section | Source | Statut | Action |
|---|---|---|---|
| **4.5 Language** (EN/AR/FR) | `Preference.language_preference` = CSV des **langues de contenu** (brand voice), **pas** la locale UI. Aucun champ `User.locale` | ❌ | **IGNORÉ pour la persistance** — nécessite un champ dédié (ex. `User.locale`). Le sélecteur fonctionne déjà côté client via `i18n.changeLanguage` + `localStorage` (comportement inchangé) |

### 💳 Payment Methods

| Sous-section | Source | Statut | Action |
|---|---|---|---|
| **4.6 Payment Methods** | Mamopay, pas Stripe. Aucune table `PaymentMethod`. `User.mamoCustomerId` seul | ❌ | **IGNORÉ** — nécessite soit une intégration Stripe (`stripeCustomerId` + SetupIntent + `GET /payment_methods`), soit l'exposition de l'API Mamopay *customer-portal*. Aujourd'hui le composant lit `billingData.paymentMethods` qui est toujours vide → comportement conservé |

## 4. Routes à créer (Phase 3–4 — si l'audit est validé)

1. `GET /api/settings/connected-platforms` — Ayrshare `/user` + warnings refresh
2. `GET/POST/DELETE/PUT /api/settings/rss-feeds` — Ayrshare `/feed`
3. `GET/POST/DELETE /api/settings/posting-schedule` — Ayrshare `/auto-schedule/*`
4. `GET/PUT /api/settings/dm-auto-response` — Ayrshare `/messages/autoresponse`

Toutes côté serveur : `requireAuth` → `resolveProfileKey(userId)` → `fetch` Ayrshare avec header `Profile-Key` → cache 60 s (pattern `withCache` de `ayrshare-engagement.ts`).

## 5. Extensions à `src/lib/ayrshare.ts`

Ajouter (non destructif) :
- `getUserProfile(profileKey)` — wrap de `/user` retournant `activeSocialAccounts`, `displayNames`, `refreshDaysRemaining`
- `listFeeds / addFeed / deleteFeed / updateFeed`
- `listAutoSchedules / setAutoSchedule / deleteAutoSchedule`
- `getAutoResponse / setAutoResponse`

Avec `AyrshareError` et `engagementFetch` déjà en place → factorisation simple.

## 6. Sections à ignorer — recommandations schéma (pour activation future)

```prisma
model NotificationPreference {
  userId BigInt @unique
  user   User   @relation(...)
  // Booleans par catégorie
  morningCards Boolean @default(true)
  pendingComments Boolean @default(true)
  eodSummary Boolean @default(true)
  perfReport Boolean @default(true)
  mosUpdate Boolean @default(true)
  competitorRanking Boolean @default(false)
  seasonalOpps Boolean @default(true)
  competitorActivity Boolean @default(true)
  campaignOpt Boolean @default(true)
  salesSuggestions Boolean @default(true)
}

model AutomationRule {
  userId BigInt @unique
  autoBoost Boolean @default(true)
  autoRespond Boolean @default(true)
  autoPublish Boolean @default(true)
  autoPause Boolean @default(true)
  autoAdjust Boolean @default(false)
}

model DmTemplate {
  id String @id @default(cuid())
  userId BigInt
  topic String   // 'hours' | 'menu' | 'location' | 'reservation' | 'custom'
  title String
  message String @db.Text
  enabled Boolean @default(true)
}

// User.locale String? @default("en")
// User.stripeCustomerId String?   (si virage vers Stripe pour payment methods)
```

---

## ⏸ Attente de validation

Merci de valider :
- (a) Le périmètre dynamisable **3.1–3.4 + 4.1a + 4.1b** (Marketing OS complet + Brand Voice + menu count)
- (b) Les sections **4.2, 4.3, 4.4, 4.5, 4.6** à **ignorer** (signalées ci-dessus)
- (c) Tout changement d'avis (ex. "oui je veux qu'on ajoute `User.locale`" → j'attendrai l'autorisation explicite pour modifier le schéma)

Je ne toucherai **pas** au schéma Prisma sans accord explicite.
