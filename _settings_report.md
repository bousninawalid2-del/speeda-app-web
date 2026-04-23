# Rapport final — Dynamisation de /dashboard/settings
Date : 2026-04-23
Branche de travail : locale
Backup : [_backup_settings_2026-04-23/](_backup_settings_2026-04-23/)

## Statut par section

| Section | Statut | Source |
|---|---|---|
| **Account → Profile** | ✅ déjà dynamique (avant cette tâche) | `GET/PUT /api/settings/profile` |
| **Account → Security** | ✅ déjà dynamique | routes existantes |
| **Account → Subscription / Plan** | ✅ déjà dynamique | `useSubscription` |
| **Tokens** | ✅ déjà dynamique | `useTokens` |
| **Marketing OS → Connected Platforms** | ✅ Dynamisée | Ayrshare `/user` via `GET /api/settings/connected-platforms` (affiche username, warnings refresh LinkedIn/TikTok) |
| **Marketing OS → RSS Feeds** | ✅ Dynamisée | Ayrshare `/feed` via `/api/settings/rss-feeds` (GET/POST/DELETE) |
| **Marketing OS → Posting Schedule** | ✅ Dynamisée | Ayrshare `/auto-schedule/*` via `/api/settings/posting-schedule` (GET/POST/DELETE) |
| **Marketing OS → DM Auto-Response** (toggle global) | ✅ Dynamisée | Ayrshare `/messages/autoresponse` via `/api/settings/dm-auto-response` (GET/PUT) |
| **AI Preferences → Brand Voice** | ✅ Dynamisée | `GET/PUT /api/settings/brand-voice` (déjà existant) branché au frontend |
| **AI Preferences → Restaurant Menu** (count) | ✅ Dynamisée | `GET /api/settings/menu` (webhook n8n existant) |
| **AI Preferences → Automation Rules** (5 toggles) | ❌ Ignorée | Aucune table / aucun champ DB |
| **AI Preferences → DM Templates** (par sujet) | ❌ Ignorée | Aucune table `DmTemplate` |
| **Notifications** (10+ toggles) | ❌ Ignorée | Aucune table `NotificationPreference` |
| **Language** (persistance côté serveur) | ❌ Ignorée | Aucun champ `User.locale`. Le switch i18n côté client continue de fonctionner (comportement inchangé) |
| **Payment Methods** | ❌ Ignorée | Pas d'intégration Stripe ; Mamopay seulement (`mamoCustomerId`). Pas de table `PaymentMethod` |
| **Support / About / Logout** | ✅ inchangé | — |

## Routes API créées (Phase 3)

| Route | Méthodes | Fichier |
|---|---|---|
| `/api/settings/connected-platforms` | GET | [src/app/api/settings/connected-platforms/route.ts](speeda-app-web/src/app/api/settings/connected-platforms/route.ts) |
| `/api/settings/rss-feeds` | GET / POST / PUT / DELETE | [src/app/api/settings/rss-feeds/route.ts](speeda-app-web/src/app/api/settings/rss-feeds/route.ts) |
| `/api/settings/posting-schedule` | GET / POST / DELETE | [src/app/api/settings/posting-schedule/route.ts](speeda-app-web/src/app/api/settings/posting-schedule/route.ts) |
| `/api/settings/dm-auto-response` | GET / PUT | [src/app/api/settings/dm-auto-response/route.ts](speeda-app-web/src/app/api/settings/dm-auto-response/route.ts) |

Toutes protégées par `requireAuth`, résolution `profileKey` via Prisma (fallback env), cache serveur 60 s, invalidation sur écriture.

## Fichiers créés / modifiés

**Créés :**
- [src/lib/ayrshare-settings.ts](speeda-app-web/src/lib/ayrshare-settings.ts) — cache + resolver
- [src/hooks/useConnectedPlatforms.ts](speeda-app-web/src/hooks/useConnectedPlatforms.ts)
- [src/hooks/useRssFeeds.ts](speeda-app-web/src/hooks/useRssFeeds.ts)
- [src/hooks/usePostingSchedule.ts](speeda-app-web/src/hooks/usePostingSchedule.ts)
- [src/hooks/useDmAutoResponse.ts](speeda-app-web/src/hooks/useDmAutoResponse.ts) (avec optimistic update + rollback)
- 4 route handlers ci-dessus

**Modifiés :**
- [src/lib/ayrshare.ts](speeda-app-web/src/lib/ayrshare.ts) — ajout : `getUserProfile`, `listFeeds`/`addFeed`/`updateFeed`/`deleteFeed`, `listAutoSchedules`/`setAutoSchedule`/`deleteAutoSchedule`, `getAutoResponse`/`setAutoResponse`. `engagementFetch` exporté et méthodes `PUT`/`DELETE` ajoutées.
- [src/screens/SettingsScreen.tsx](speeda-app-web/src/screens/SettingsScreen.tsx) — wiring de toutes les sections dynamisables + états loading/error, suppression des données hardcodées (RSS feed, auto-schedule, tone/languages/keywords, menu count).
- [tsconfig.json](speeda-app-web/tsconfig.json) — exclude `_backup_settings_*`

## Tables / champs DB utilisés

| Section | Table | Champs |
|---|---|---|
| Brand Voice | `Preference` | `tone_of_voice`, `language_preference`, `hashtags`, `resumer`, `text`, `other` |
| Menu count | (via webhook n8n) | — |
| profileKey resolver | `User` | `profileKey` |

**Aucune modification** du schéma Prisma. Aucune migration exécutée.

## Contraintes respectées

- ✅ `requireAuth` sur chaque route
- ✅ Clé API Ayrshare uniquement côté serveur (jamais exposée au client)
- ✅ Cache 60 s côté serveur + invalidation sur écriture (pattern identique à `ayrshare-engagement.ts`)
- ✅ `profileKey` résolu par utilisateur via Prisma (`resolveProfileKey`)
- ✅ Aucune modification du schéma Prisma
- ✅ Aucune régression sur les sections déjà dynamiques (Account, Tokens, Engagement)
- ✅ Design UI/UX préservé
- ✅ États loading (skeleton), erreur (message + retry), vide (message)
- ✅ DM toggle : mise à jour optimiste + rollback via `onMutate`/`onError`

## Erreurs TypeScript

`npx tsc --noEmit` ne rapporte **aucune nouvelle erreur** introduite par cette tâche. Les erreurs pré-existantes listées (chart.tsx, calendar.tsx, resizable.tsx, ProfileScreen, ReferralScreen, QRCodeModal, ligne 672 de SettingsScreen `paymentMethods.map`, les 3 dans `ayrshare.ts` lignes 160-163 du legacy `getConnectedPlatforms`) sont antérieures.

## Recommandations — activation future des sections ignorées

Pour activer les sections ❌, voici les ajouts minimaux au schéma Prisma :

```prisma
// Notifications
model NotificationPreference {
  userId             BigInt  @unique
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  morningCards       Boolean @default(true)
  pendingComments    Boolean @default(true)
  eodSummary         Boolean @default(true)
  perfReport         Boolean @default(true)
  mosUpdate          Boolean @default(true)
  competitorRanking  Boolean @default(false)
  seasonalOpps       Boolean @default(true)
  competitorActivity Boolean @default(true)
  campaignOpt        Boolean @default(true)
  salesSuggestions   Boolean @default(true)
}

// Automation Rules (5 toggles)
model AutomationRule {
  userId      BigInt  @unique
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  autoBoost   Boolean @default(true)
  autoRespond Boolean @default(true)
  autoPublish Boolean @default(true)
  autoPause   Boolean @default(true)
  autoAdjust  Boolean @default(false)
}

// DM Templates par sujet
model DmTemplate {
  id      String  @id @default(cuid())
  userId  BigInt
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic   String  // 'hours' | 'menu' | 'location' | 'reservation' | 'custom'
  title   String
  message String  @db.Text
  enabled Boolean @default(true)
  @@index([userId])
}

// Language (persistance côté serveur)
// Ajouter sur model User :
//   locale String? @default("en")

// Payment Methods (si virage Stripe)
// Ajouter sur model User :
//   stripeCustomerId String?
// + nouvelle table PaymentMethod ou appels directs /customers/{id}/payment_methods
```

Une fois ces tables/champs ajoutés (migration séparée), il suffira de créer :
- `/api/settings/notifications` (GET/PUT)
- `/api/settings/automation-rules` (GET/PUT)
- `/api/settings/dm-templates` (GET/POST/PUT/DELETE)
- `/api/settings/language` (PUT)
- `/api/settings/payment-methods` (GET/POST/DELETE, avec Stripe côté serveur)

et de brancher les sections correspondantes du `SettingsScreen` (les placeholders sont déjà en place, seules les sources de données manquent).

## Prochaines étapes suggérées

1. Tester les routes avec un compte ayant un `profileKey` Ayrshare valide.
2. Ajouter un champ `User.locale` (petite migration non-destructive) pour persister le choix de langue.
3. Décider Stripe vs portail Mamopay pour Payment Methods.
4. Décider si Notifications/AutomationRules/DmTemplates justifient une migration (ou rester purement front/local).
