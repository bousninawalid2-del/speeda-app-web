# i18n Hardcoded Strings Audit — 2026-04-23

## Context

Projet Next.js App Router. `react-i18next` est déjà installé et configuré dans
[src/i18n/index.ts](src/i18n/index.ts), mais le système actuel utilise un hack
`MutationObserver` côté client qui scanne le DOM et remplace les chaînes
anglaises via regex à partir de dictionnaires inline. Ce rapport recense ce
qui reste codé en dur et doit être migré vers de vrais appels `t('key')`.

## Summary

- **Fichiers sources scannés** : ~195 (src/app, src/components, src/screens, src/contexts)
- **Fichiers contenant des chaînes en dur** : ~35
- **Chaînes en dur identifiées** : ~250+
- **Taux d'adoption `t()` actuel** : ~50% des écrans (mélange incohérent)
- **Déjà traduites dans runtimeDictionaries (`src/i18n/index.ts` L11-L621)** : ~300 clés réutilisables
- **À traduire (nouvelles)** : ~150 clés

## Top 5 fichiers par volume de chaînes en dur

| # | Fichier | Chaînes | Remarques |
|---|---------|---------|-----------|
| 1 | `BusinessSetupScreen.tsx` | ~120 | Tableaux de business types / goals / tones / villes / pays |
| 2 | `AuthScreen.tsx` | ~55 | 38 noms de pays, erreurs de validation, flow auth |
| 3 | `ActionPlanScreen.tsx` | ~40 | 6 cartes action avec titres + descriptions + impact |
| 4 | `CampaignsScreen.tsx` | ~35 | Toasts, statuts, boutons |
| 5 | `AIActivityScreen.tsx` | ~30 | Entrées de log d'activité avec timestamps |

## Catégories de chaînes en dur

### Validation (≥10)
- `Please enter your email address.`
- `Please enter a valid email address.`
- `Please enter your password.`
- `Please enter your full name.`
- `Minimum SAR 10`
- `Maximum 3 goals. Deselect one first.`
- `Maximum N languages`
- `Maximum N files`

### Messages toast / succès / erreur (≥15)
- `Campaign paused` / `Campaign resumed`
- `Report PDF downloading...`
- `Upload failed`
- `Failed to save setup`

### Tableaux de données codés en dur (~150)
- **38 noms de pays** (Saudi Arabia, UAE, Egypt, ...) dans AuthScreen / BusinessSetup
- **Business types** : Restaurant, Café, Cloud Kitchen, Bakery, ...
- **Social goals** : More Followers, More Engagement, More Orders, ...
- **Tones** : Professional, Casual, Fun, Inspiring, Bold, Warm
- **~200 couples ville/région**
- **30+ descriptions de log d'activité**

### Textes JSX directs (≥50)
- Statuts : `Healthy`, `Warning`, `Error`
- Titres/descriptions/impact sur les cartes Action Plan
- Labels et placeholders de formulaires
- En-têtes de sections, textes de boutons

### Déjà traduits (réutilisables)
- Actions communes (save, cancel, delete, send...)
- Navigation (home, create, ai, ads...)
- Noms de plateformes (Instagram, TikTok, Facebook...)
- Les ~300 clés de `runtimeDictionaries` dans `src/i18n/index.ts` (à migrer
  vers les vrais fichiers `en.ts` / `ar.ts` / `fr.ts` puis supprimer le hack)

## Namespaces proposés

| Namespace | Contenu | Volume estimé |
|-----------|---------|---------------|
| `common` | Actions (save, cancel, close, back, send, ...) | ~40 |
| `navigation` | Menu principal, tabs, sidebar | ~20 |
| `auth` | Écrans login / signup / reset / verify, erreurs d'auth | ~40 |
| `validation` | Messages d'erreur de formulaire | ~20 |
| `setup` | Business types, tailles, tones, objectifs | ~50 |
| `locations` | Pays, villes, régions | ~80 |
| `dashboard` | Home, Analytics, widgets | ~60 |
| `campaigns` | Listes, statuts, boutons, toasts | ~40 |
| `content` | Calendar, Quick Post, Strategy, Media | ~50 |
| `engagement` | Comments, DMs, Reviews, IA responses | ~40 |
| `notifications` | Types de notifs, messages | ~30 |
| `activity` | AI Optimization Log, Tokens screen | ~30 |
| `settings` | Profile, RSS, accounts, integrations | ~40 |
| `actions` | ActionPlan cards (titres, descriptions, impact) | ~30 |
| `toasts` | Messages système transitoires | ~20 |
| `errors` | Erreurs système utilisateur (pas validation) | ~15 |
| `metadata` | title / description pages (SEO) | ~10 |

Total cible : **~600 clés** par locale (en / ar / fr).

## Observations structurelles

1. **Adoption mixte** : ~50% des écrans utilisent déjà `useTranslation()`, l'autre
   moitié contient du texte brut — incohérence à corriger dans la Phase 3.
2. **Le hack `MutationObserver`** ([src/i18n/index.ts:623-722](src/i18n/index.ts#L623-L722))
   "maquille" le problème : les chaînes anglaises restent dans le code et sont
   remplacées côté client après render. Invisibilité pour SEO/SSR, fragile sur
   les regex, impossible de gérer pluriels / interpolation correctement.
3. **Données `runtimeDictionaries`** dans `src/i18n/index.ts` : ~300 traductions
   inline, à migrer vers les fichiers `en.ts` / `ar.ts` / `fr.ts` puis supprimer
   le mécanisme de remplacement DOM.
4. **Tableaux en dur pour listes déroulantes** (pays, business types, etc.) :
   à refactoriser pour que le `value` reste stable (anglais / slug) mais que le
   `label` vienne de `t()`.
5. **Validations côté client** : `setFormError('Please enter your email')` —
   à remplacer par `setFormError(t('validation.emailRequired'))`.
6. **Aucun placeholder traduit** dans plusieurs formulaires.
7. **Metadata SEO** (`export const metadata`) : actuellement statique, devrait
   utiliser `generateMetadata` avec traduction.

## Plan de migration recommandé (Phase 3)

Ordre suggéré pour minimiser les risques :

1. **Consolider les fichiers de messages** : migrer `runtimeDictionaries` de
   `src/i18n/index.ts` vers `src/i18n/{en,ar,fr}.ts` en JSON structurés par
   namespace, puis supprimer le MutationObserver.
2. **AuthScreen + validation** — visible dès la première seconde pour tout
   nouvel utilisateur.
3. **BusinessSetupScreen** — gros volume mais patterns répétitifs (tableaux).
4. **CampaignsScreen + toasts** — UX critique.
5. **Sweep du reste** (ActionPlan, AIActivity, dashboard widgets, settings).
6. **Metadata SEO** en dernier (faible impact car app authentifiée).

## Risques identifiés

- Suppression du `MutationObserver` : tout texte en dur non migré deviendra
  visible en anglais même en mode AR/FR. La migration doit être **exhaustive**
  avant suppression du hack, ou l'on garde le hack en filet de sécurité un
  temps.
- Les regex du hack matchent des sous-chaînes arbitraires — il peut masquer
  des bugs (ex: le mot `New` remplacé à l'intérieur d'un nom propre). À
  vérifier pendant la Phase 6.
- Les tableaux de pays/villes utilisés comme valeurs de DB : garder la clé
  stable (slug anglais) et ne traduire que l'affichage.
