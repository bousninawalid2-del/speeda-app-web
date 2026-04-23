# i18n Migration — Final Report (2026-04-23)

## Approche retenue
Approche **B** : garder `react-i18next` déjà en place, supprimer le hack
`MutationObserver`, migrer toutes les chaînes en dur vers `t('key')`, convertir
les classes Tailwind LTR-biaisées vers les propriétés logiques.

## Résultat

### Dictionnaires
- `src/i18n/en.ts`, `ar.ts`, `fr.ts` — **1408 clés chacun, parité stricte**
- ~30 namespaces (common, nav, home, auth, validation, setup, actionPlan,
  campaigns, activity, analytics, weeklyReport, mosScore, menuManagement,
  socialMedia, subscription, topUp, billingHistory, planComparison, profile,
  referralExtra, postHistoryExtra, linkTracking, quickAd, brandVoice,
  homeExtra, accountHealthExtra, webProduct, analyticsExtra, notificationsEmpty,
  aiBriefingPreview, etc.)
- Arabe : arabe standard moderne, registre adapté (formel/conversationnel)
- Français : « vous », registre business naturel
- Script de vérif : `node scripts/check-i18n-parity.mjs`

### Écrans migrés (Phase 3)
| Écran | Chaînes migrées | Namespaces ajoutés/étendus |
|-------|-----------------|------------------------------|
| ActionPlanScreen | ~40 | actionPlan (pilote) |
| AuthScreen | ~10 | auth, validation |
| BusinessSetupScreen | ~100 | setup (173 clés) |
| CampaignsScreen | ~40 | campaigns |
| AIActivityScreen | ~22 | activity |
| HomeScreen | ~30 | homeExtra |
| WebAppProductPage | ~50 | webProduct |
| NotificationsScreen | 2 | notificationsEmpty |
| AIBriefingPreviewScreen | 11 | aiBriefingPreview |
| MenuManagementScreen | 15 | menuManagement |
| BillingHistoryScreen | 7 | billingHistory |
| TopUpScreen | 14 | topUp |
| SubscriptionScreen | 11 | subscription |
| PlanComparisonScreen | 16 | planComparison |
| SocialMediaScreen | 12 | socialMedia |
| WeeklyReportScreen | 22 | weeklyReport |
| MosScoreScreen | 30 | mosScore |
| ProfileScreen | 12 | profile |
| ReferralScreen | 5 | referralExtra |
| AccountHealthScreen | 5 | accountHealthExtra |
| PostHistoryScreen | 16 | postHistoryExtra |
| LinkTrackingScreen | 24 | linkTracking |
| QuickAdScreen | 28 | quickAd |
| EditBrandVoiceScreen | 16 | brandVoice |

**Total : 24 écrans, ~540 chaînes migrées.**

### Hack supprimé
`src/i18n/index.ts` réduit de 757 → 42 lignes :
- Supprimé : `runtimeDictionaries`, `MutationObserver`, `localizeSubtree`,
  `translateFromSource`, `applyRuntimeLocalization`, et leurs caches.
- Conservé : init `i18next`, `applyDir` pour RTL + font, persistance localStorage.

### RTL (Phase 5)
**62 fichiers** convertis vers les propriétés logiques Tailwind :
- `pl-` / `pr-` → `ps-` / `pe-`
- `ml-` / `mr-` → `ms-` / `me-`
- `text-left` / `text-right` → `text-start` / `text-end`
- `border-l` / `border-r` → `border-s` / `border-e`
- `rounded-l*` / `rounded-r*` → `rounded-s*` / `rounded-e*`
- `left-N` / `right-N` (positioning) → `start-N` / `end-N`

Icônes directionnelles : `rtl:rotate-180` ajouté sur ~30 boutons back/forward et
chevrons (Carousel, Pagination, Calendar, Breadcrumb, plus 15 écrans).

**Volontairement non converti** :
- `src/components/ui/sheet.tsx` — l'API `side="left|right"` est sémantiquement
  physique.
- `src/components/ui/sidebar.tsx` — même raison.
- `_backup_*` dirs — ignorés.

## Erreurs TypeScript
27 erreurs dans `src/` — **toutes pré-existantes** (Prisma schema, types luxon,
typings `recharts`/`react-resizable-panels`, propriétés d'écran mismatch dans
quelques pages dashboard). **Aucune nouvelle erreur introduite par la
migration i18n ou RTL.**

## À faire manuellement (follow-up)

1. **Styles inline RTL** (marginLeft/paddingLeft) non auto-convertis, nécessitent
   revue :
   - `src/app/dashboard/layout.tsx` — `marginLeft`
   - `src/screens/Index.tsx` — `marginLeft`
   - `src/screens/HomeScreen.tsx` — `scrollBy({ left: dir * 340, ... })` : en
     RTL, le signe de `dir` doit être inversé pour que la flèche « suivant »
     défile dans le bon sens.

2. **Écrans volumineux avec reliquats hors scope** (chart labels, PDF
   generator text, demo data) :
   - `AnalyticsScreen.tsx` (885 L) — données de générateur PDF restent
     anglaises. Namespace `analyticsExtra` ajouté pour câblage futur.
   - `CreateScreen.tsx` (1298 L) — templates démo.
   - `AIChatScreen.tsx` (899 L) — historique de conversation démo.

3. **Metadata SEO** : `export const metadata` dans les pages `app/**/page.tsx`
   n'est pas traduit (hors scope Phase 3). Si besoin SEO multilingue sérieux,
   migrer vers `next-intl` avec routing `app/[locale]` (approche A).

4. **Language switcher** : vérifier qu'il est présent et fonctionnel
   (persistance `speeda-lang` via localStorage + `applyDir` sur
   `languageChanged` est en place côté infra).

5. **QA manuelle navigateur** (Phase 6 non exécutée) :
   - Tester chaque écran principal en EN / AR / FR.
   - Vérifier le `dir="rtl"` sur `<html>` en AR.
   - Vérifier l'alignement des inputs / flèches / sidebar.
   - Vérifier qu'aucun reliquat anglais ne reste visible en AR/FR.

## Artéfacts

- `_i18n_audit.md` — audit initial
- `_i18n_migration_report.md` — ce fichier
- `scripts/check-i18n-parity.mjs` — vérif parité clés (exit 0 si OK)
- `src/i18n/index.ts` — init propre sans hack
- `src/i18n/{en,ar,fr}.ts` — dictionnaires complets
