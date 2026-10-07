# WhatsApp ↔ Web Chat — parité entrée/sortie n8n

> Branche : `deploy/n8n-webhook` · Commit app : `Unify WhatsApp and web chat payloads to n8n; clean web replies`
> Les workflows n8n modifiés sont dans `n8n/updated_workflows/` (non versionnés, à importer à la main dans n8n).

## 1. Constat

WhatsApp n'arrive **pas** directement dans n8n : Meta appelle `/api/webhooks/whatsapp` (app), qui extrait le message
imbriqué `entry[0].changes[0].value.messages[0]` et le transmet au même webhook n8n que le chat web (`/api/chat`).
Le vrai problème était que ces deux routes construisaient **deux payloads différents** :

| Champ | WhatsApp (avant) | Web (avant) | Maintenant (les deux) |
|---|---|---|---|
| `token_valide` (« s'est connecté ») | `false` en dur → tout inscrit bloqué sur « connecte-toi » | `tokenBalance > 0` (crédits !) | web : `true` · WhatsApp : session web active |
| `user_strategy` | `false` en dur | stratégie active | stratégie active |
| `restapiRegister` (bienvenue unique) | absent | `isVerified` → bienvenue à chaque message | `false` (voir §5) |
| `user_exist` | mot de passe défini | toujours `true` | mot de passe défini **ou** email vérifié |
| `preference_text` | résumé texte | dump JSON brut | résumé texte |
| `interactive_title` / `interactive_id` | titre + id | **id** envoyé comme titre | titre + id |
| `discu_code` / `discu_key` | table `UserDiscussionCode` | HMAC calculé | table `UserDiscussionCode` |
| `channel` / `source` | absent | `source: "web"` | `"whatsapp"` / `"web"` |

Côté sortie, la branche web de `strategie_social_media` renvoyait l'objet complet de l'API WhatsApp
(`messaging_product`, `interactive`…) → **JSON brut affiché dans le chat web**.

## 2. Changements app (commités)

| Fichier | Rôle |
|---|---|
| `src/lib/n8n-payload.ts` *(nouveau)* | `buildN8nPayload()` : payload unique pour les deux canaux + bloc `normalized`. `computeUserFlags()` : drapeaux de routage identiques. |
| `src/lib/n8n-reply.ts` *(nouveau)* | `normalizeN8nReply()` : réduit toute réponse n8n (texte, JSON d'agent, payload WhatsApp Cloud API) en `{ reply, type, mediaUrl, options }`. Les réactions 👍 sont ignorées côté web. |
| `src/app/api/chat/route.ts` | Utilise `buildN8nPayload` (canal `web`) et `normalizeN8nReply` pour la réponse synchrone. Accepte `interactiveId`. |
| `src/app/api/webhooks/whatsapp/route.ts` | Utilise `buildN8nPayload` (canal `whatsapp`). L'extraction du message Meta est inchangée. |
| `src/app/api/n8n/respond/route.ts` | Passe chaque réponse asynchrone par `normalizeN8nReply` avant de la mettre en file. |
| `src/app/api/n8n/user/route.ts` | Réutilise `computeUserFlags` ; ne sélectionne plus le hash du mot de passe dans la réponse. |
| `src/screens/AIChatScreen.tsx` | Clic sur une option → envoie le titre **et** l'id ; rendu du formatage WhatsApp (`*gras*`, `_italique_`, `~barré~`, ```` ```mono``` ````). |

Bloc normalisé envoyé à n8n (en plus des champs historiques, conservés pour les workflows existants) :

```json
{
  "channel": "whatsapp | web",
  "userId": "string",
  "sessionId": "string",
  "messageText": "string",
  "metadata": { "phoneNumber": "string | null", "webSessionId": "string | null" }
}
```

> Écart volontaire avec le prompt : pas de `webSessionToken` (on n'envoie pas le jeton de connexion de l'utilisateur à n8n) ;
> `webSessionId` à la place.

## 3. Changements n8n (`n8n/updated_workflows/`)

### `root_versionfinal.json`
- **Nouveau nœud `Normalize Input`** entre `Webhook1` et `If3` : force les drapeaux en vrais booléens (les nœuds `If`
  utilisent une validation stricte), fixe `channel`/`source`, construit `normalized` si absent.
- Les 11 références `$('Webhook1').item.json.body` lisent désormais `$('Normalize Input').item.json.body`.
- (Déjà fait avant) mode `Respond to Webhook`, accusés de réception, propagation de `source`, et reconnexion de
  `If5` → `Execute Workflow2` (stratégie existante) / `Execute Workflow5` (nouvelle stratégie).

### `strategie_social_media.json`
- `Code3` : le destinataire WhatsApp venait d'un **numéro de test codé en dur** (`21695875964`) → tous les messages
  interactifs partaient vers ce numéro. Il utilise maintenant `Phone_Number` reçu du workflow racine.
- `Code3` produit aussi `web: { reply, options }` (même message, sans enveloppe WhatsApp).
- `Respond to Web Chat - message` envoie `Code3.web.reply` + `Code3.web.options` au lieu de l'objet WhatsApp.
- Suppression de `Respond to Web Chat - reaction` (une réaction 👍 n'a pas d'équivalent web).

### `social_media_prefereance.json`
- 4 nœuds de téléchargement média (`HTTP Request`, `HTTP Request1`, `HTTP Request4`, `HTTP Request5`) avaient un
  **jeton Meta en clair** dans l'en-tête `Authorization` → remplacé par `{{ 'Bearer ' + $env.WHATSAPP_GRAPH_API_TOKEN }}`.

## 4. Import dans n8n

1. Variables d'environnement de l'instance n8n :
   - `WHATSAPP_GRAPH_API_TOKEN` — jeton Meta (nouveau, après révocation de l'ancien)
   - `ADMIN_SECRET` — même valeur que côté app (en-tête `x-n8n-secret`)
2. Importer et remplacer : `root_versionfinal`, `strategie_social_media`, `social_media_prefereance`
   (et les autres fichiers du dossier s'ils ne sont pas déjà à jour).
3. Vérifier que les IDs des sous-workflows appelés par la racine correspondent à ceux de l'instance.
4. Tester d'abord sur un webhook de staging : un message web et un message WhatsApp, puis une option interactive.

## 5. Points ouverts

- 🔴 **Révoquer le jeton Meta** présent en clair dans l'export original de `registerWorkflow` et dans l'ancienne
  version de `social_media_prefereance`, puis en générer un nouveau.
- `token_valide` côté WhatsApp = « a une session web active » : un utilisateur déconnecté du web sera de nouveau
  invité à se connecter sur WhatsApp jusqu'à sa prochaine connexion.
- `restapiRegister` = `false` partout : le message de bienvenue n'est plus déclenché depuis le chat (c'était déjà le
  cas sur WhatsApp). Il faut un vrai marqueur « bienvenue envoyée » pour le réactiver.
- Le numéro de test `21695875964` reste codé en dur dans d'anciens exports non modifiés (`triggerImageGeneration`,
  `Create_strategy_VF`, `stratigyconfirmed`, `My workflow 2`, `root`) et dans `workflow_token_valide`
  (appelé par aucun workflow exporté).
- Rien n'a été testé contre l'instance n8n réelle ni la base de production.
