# N8N Workflow Modifications Guide

> **For:** n8n Developer
> **Date:** 2026-04-06
> **Purpose:** Adapt existing n8n workflows to work with the Speeda web app chat (in addition to WhatsApp)
> **Priority:** Changes are ordered by importance — do them in sequence

---

## Context

The Speeda backend now sends **enriched payloads** to the n8n webhook with all user state data (activity_exist, preference_exist, user_strategy, etc.) and a new `source: "web"` field. The backend also exposes **callback API endpoints** that n8n should use instead of its own separate Postgres tables.

**App Base URL:** `https://platform.speeda.ai`
**n8n Secret Header:** All callback APIs require `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`

---

## CHANGE 1: Root Workflow — Add "Respond to Webhook" Node

**Workflow:** `root_versionfinal` (ID: `dcowwOcmATp5rKPS`)
**Webhook:** `210b7b4e-4fb5-420b-b219-9a9e66aa8872`

### Problem
The root workflow receives a POST but **never returns a response** to the HTTP caller. The web app chat waits for a JSON reply and gets nothing (or a timeout).

### What to Do

1. **Change the Webhook node (`Webhook1`) response mode** from "Immediately" to **"Using 'Respond to Webhook' Node"** (in the webhook settings, set `responseMode: "responseNode"`).

2. **Add a "Respond to Webhook" node** at the END of each routing branch. This node should return JSON to the web chat:

```json
{
  "reply": "{{AI response text}}",
  "type": "text",
  "sessionId": "{{$json.body.session_id}}",
  "options": []
}
```

For interactive messages (where the user needs to pick an option), return:
```json
{
  "reply": "What would you like to do?",
  "type": "text",
  "sessionId": "{{$json.body.session_id}}",
  "options": [
    { "id": "option_1_id", "title": "Quick Post" },
    { "id": "option_2_id", "title": "8-Week Strategy" }
  ]
}
```

3. **Alternative (if sub-workflows take too long):** Instead of waiting for the full sub-workflow to complete, respond immediately with an acknowledgment:
```json
{
  "reply": "I'm working on that for you...",
  "type": "text",
  "sessionId": "{{$json.body.session_id}}"
}
```
Then have sub-workflows push their actual response via the **async respond endpoint** (see Change 3).

---

## CHANGE 2: Sub-Workflows — Dual Output (WhatsApp + Web)

**Affected Workflows:**
- `blockage_user` (ID: `e9XbFoJVyEWh3NIz`)
- `social_media_activity` (ID: `49w3f57kPuAtiL48`)
- `social_media_prefereance` (ID: `BGrGjZwrJSos0tSk`)
- `strategie_social_media` (ID: `5OtDX7YPzvMXaQAI`)
- `DraftPostcreate19122025` (ID: `CqRAv0d6np4GCLMO`)
- `workflow_token_valide` (ID: `VYYCoSHT0cpaxpzd`)

### Problem
These workflows send responses **only via WhatsApp Business Cloud nodes**. When the user is chatting via the web app, they never receive the response.

### What to Do

In each sub-workflow, **wherever there is a WhatsApp send node**, add a parallel branch that checks the `source` field:

1. Add an **If node** before each WhatsApp send:
   - **Condition:** `{{ $json.source }}` equals `"web"`
   - **True (web):** Route to an HTTP Request node that calls the async respond endpoint
   - **False (whatsapp):** Route to the existing WhatsApp Business Cloud node

2. **HTTP Request node configuration** (for web responses):
   - **Method:** POST
   - **URL:** `https://platform.speeda.ai/api/n8n/respond`
   - **Headers:**
     ```
     Content-Type: application/json
     x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM
     ```
   - **Body (JSON):**
     ```json
     {
       "sessionId": "{{ $json.session_id }}",
       "userId": "{{ $json.user_id }}",
       "reply": "{{ the AI response text }}",
       "type": "text",
       "mediaUrl": "{{ optional image/video URL }}",
       "options": []
     }
     ```

   For interactive messages, include the options array:
   ```json
   {
     "sessionId": "{{ $json.session_id }}",
     "userId": "{{ $json.user_id }}",
     "reply": "Choose an option:",
     "type": "text",
     "options": [
       { "id": "option_id_1", "title": "Option 1 Text" },
       { "id": "option_id_2", "title": "Option 2 Text" }
     ]
   }
   ```

### Important
- The `source` field is passed through from the root webhook payload
- Make sure to propagate `source`, `session_id`, and `user_id` through all Execute Workflow calls
- The `source` field will be `"web"` for web chat and absent/empty for WhatsApp

---

## CHANGE 3: Use App Database Instead of Separate Postgres

**Affected Workflows:**
- `social_media_activity` (ID: `49w3f57kPuAtiL48`) — writes to `activities` table
- `social_media_prefereance` (ID: `BGrGjZwrJSos0tSk`) — writes to `preferences` table (via `n8n_chat_histories_preferenece1`)
- `strategie_social_media` (ID: `5OtDX7YPzvMXaQAI`) — writes to `strategies`, `weekly_plannings`, `draft_posts`

### Problem
These workflows write collected data to n8n's own Postgres tables. The web app has its own database with matching tables but different schemas. Data written by n8n is invisible to the web app.

### What to Do

**Option A (Recommended): Use HTTP callback APIs instead of direct Postgres**

Replace the Postgres insert/update nodes with HTTP Request nodes that call the app's API:

#### For `social_media_activity` — when inserting into `activities`:

Replace the Postgres node with an HTTP Request:
- **Method:** POST
- **URL:** `https://platform.speeda.ai/api/n8n/activity`
- **Headers:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`
- **Body:**
```json
{
  "userId": "{{ $json.user_id }}",
  "business_name": "{{ collected business name }}",
  "industry": "{{ collected industry }}",
  "country": "{{ collected country }}",
  "location": "{{ collected location }}",
  "opening_hours": "{{ collected hours as JSON string }}",
  "business_size": "{{ collected size }}",
  "year_founded": "{{ collected year }}",
  "audience_target": "{{ collected audience }}",
  "unique_selling_point": "{{ collected USP }}",
  "certifications": "{{ collected certifications }}"
}
```

#### For `social_media_prefereance` — when inserting into `preferences`:

- **Method:** POST
- **URL:** `https://platform.speeda.ai/api/n8n/preference`
- **Headers:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`
- **Body:**
```json
{
  "userId": "{{ $json.user_id }}",
  "tone_of_voice": "{{ collected tone }}",
  "language_preference": "{{ collected language }}",
  "business_description": "{{ collected description }}",
  "social_media_goals": "{{ collected goals }}",
  "color_primary": "{{ collected primary color hex }}",
  "color_secondary": "{{ collected secondary color hex }}",
  "preferred_platforms": "{{ collected platforms comma-separated }}",
  "hashtags": "{{ collected hashtags }}",
  "emojis": "{{ collected emoji preference }}",
  "other": "{{ any other text }}"
}
```

#### For `strategie_social_media` — when creating strategy + weeks + posts:

Instead of 3 separate Postgres inserts (strategies → weekly_plannings → draft_posts), use ONE API call:

- **Method:** POST
- **URL:** `https://platform.speeda.ai/api/n8n/strategy`
- **Headers:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`
- **Body:**
```json
{
  "userId": "{{ $json.user_id }}",
  "name": "{{ strategy_name }}",
  "periodStartDate": "{{ period start ISO date }}",
  "periodEndDate": "{{ period end ISO date }}",
  "weekCount": 8,
  "goal": "{{ overall strategy goal }}",
  "platforms": "{{ platforms comma-separated }}",
  "n8nSessionId": "{{ $json.session_id }}",
  "weeks": [
    {
      "weekNumber": 1,
      "weekStartDate": "{{ week 1 start ISO date }}",
      "weekEndDate": "{{ week 1 end ISO date }}",
      "postsCount": 3,
      "weeklyGoal": "{{ week 1 goal text }}",
      "posts": [
        {
          "platform": "instagram",
          "caption": "{{ post caption }}",
          "hashtags": "{{ hashtags }}",
          "mediaUrl": "{{ generated image URL }}",
          "mediaType": "image",
          "postDate": "{{ post date ISO }}",
          "postTime": "14:00",
          "postDetails": "{{ additional context }}",
          "postReminder": "{{ reminder text }}"
        }
      ]
    }
  ]
}
```

This single call creates the strategy, all weekly plannings, and all draft posts in one transaction.

#### For updating individual draft posts (caption edit, image update, status change):

- **Method:** PATCH
- **URL:** `https://platform.speeda.ai/api/n8n/draft-posts`
- **Headers:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`
- **Body:**
```json
{
  "id": "{{ draft post ID from strategy creation response }}",
  "caption": "{{ updated caption }}",
  "mediaUrl": "{{ new image URL }}",
  "status": "approved"
}
```

**Option B (Simpler but less ideal): Point Postgres nodes to the app database**

Update the Postgres credential (ID: `DiTwLAVoEusVzNco`) connection string to:
```
postgresql://postgres:postgres@localhost:5432/speeda
```
But beware: the column names and table structure may differ slightly from what the n8n SQL queries expect. Option A is safer.

---

## CHANGE 4: Fetch User Brand Images via API

**Affected Workflows:**
- `strategie_social_media` (ID: `5OtDX7YPzvMXaQAI`) — `getLogo` Postgres node
- `callImageCreateWorkflow` (ID: `vqjCP1j5QlkR8eA5`) — needs logo for image generation
- `DraftPostcreate19122025` (ID: `CqRAv0d6np4GCLMO`) — `getLogo` Postgres node

### What to Do

Replace the `getLogo` Postgres query nodes with an HTTP Request:

- **Method:** GET
- **URL:** `https://platform.speeda.ai/api/n8n/images?userId={{ $json.user_id }}&type=logo`
- **Headers:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`

**Response format:**
```json
{
  "images": [
    {
      "id": "clxx...",
      "filename": "logo.png",
      "mimetype": "image/png",
      "size": 54321,
      "createdAt": "2026-04-01T...",
      "dataBase64": "iVBORw0KGgo..."
    }
  ]
}
```

For the image generation workflows, you can use the base64 data directly, or fetch the raw binary via:
`GET https://platform.speeda.ai/api/chat/upload?id={{ image_id }}`

To get only metadata (without heavy base64 data), add `&metadataOnly=true`.

---

## CHANGE 5: Read User State via API (Optional but Recommended)

**Affected Workflow:** `root_versionfinal` (ID: `dcowwOcmATp5rKPS`)

### Current Behavior
The root workflow relies entirely on flags sent in the webhook payload (`user_exist`, `activity_exist`, etc.). The backend now sends these flags correctly.

### Optional Enhancement
If you want n8n to independently verify user state (for WhatsApp messages that don't come through the web app), add an HTTP Request node at the start:

- **Method:** GET
- **URL:** `https://platform.speeda.ai/api/n8n/user?userId={{ $json.body.user_id }}`
- **Headers:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`

**Response:**
```json
{
  "user": { "id": "...", "name": "...", "email": "...", "tokenBalance": 50 },
  "activity": { ... },
  "preference": { ... },
  "strategy": { ... },
  "images": [ ... ],
  "flags": {
    "user_exist": true,
    "token_valide": true,
    "activity_exist": true,
    "preference_exist": false,
    "user_strategy": false
  }
}
```

This makes n8n self-sufficient for both web and WhatsApp channels.

---

## CHANGE 6: Propagate `source` Field Through All Execute Workflow Calls

**Workflow:** `root_versionfinal` (ID: `dcowwOcmATp5rKPS`)

### What to Do

In EVERY Execute Workflow node in the root workflow, add the `source` field to the parameters being passed:

```
source: {{ $json.body.source }}
```

This must be added to all these nodes:
- "social media acitvity" Execute Workflow
- "Execute Workflow_preference"
- "Execute Workflow authentifier"
- "Call 'strategie_social_media'"
- "Call 'strategie_social_media'1"

And similarly, in `strategie_social_media`, propagate `source` to:
- `callCaptionWorkflow`
- `CalleditCaptionWorkflow`
- `callImageCreateWorkflow`
- `callImageEditWorkflow`
- `callVideoCreateWorkflow`

---

## CHANGE 7: Handle Web Chat Media (Images/Voice from Web)

**Affected Workflows:**
- `social_media_activity` (ID: `49w3f57kPuAtiL48`)
- `social_media_prefereance` (ID: `BGrGjZwrJSos0tSk`)
- `strategie_social_media` (ID: `5OtDX7YPzvMXaQAI`)

### Problem
These workflows download media from WhatsApp using WhatsApp Business Cloud nodes (get media URL → HTTP download). When `source` is `"web"`, media IDs are **Speeda DataImage IDs** (e.g., `clxx1abc123...`), not WhatsApp media IDs.

### How It Works Now (Consistent with WhatsApp)

The backend sends **raw IDs** in `image_media_id`, `voice_media_id`, `pdf_media_id` — exactly like WhatsApp sends its media IDs. The only difference is how to **resolve the download URL** based on `source`:

| Field | WhatsApp | Web |
|-------|----------|-----|
| `image_media_id` | WhatsApp media ID | Speeda DataImage ID |
| `voice_media_id` | WhatsApp media ID | Speeda DataImage ID |
| `source` | absent or empty | `"web"` |

### What to Do

In the **Switch nodes** that route by input type (is_voice, is_image, etc.), add an **If node** to check `source`:

For **images/voice/pdf** when `source === "web"`:
- Skip the WhatsApp Business Cloud media download nodes
- Build the download URL: `https://platform.speeda.ai/api/chat/upload?id={{ $json.image_media_id }}`
- Download with a simple **HTTP Request GET** to that URL (no auth header needed)
- Continue with the rest of the pipeline (same as WhatsApp flow — e.g., send to Whisper for voice)

For **images/voice/pdf** when `source !== "web"`:
- Use the existing WhatsApp Business Cloud media download flow (unchanged)

---

## Summary Checklist

| # | Change | Workflow(s) | Effort |
|---|--------|-------------|--------|
| 1 | Add "Respond to Webhook" node | root_versionfinal | Small |
| 2 | Dual output (WhatsApp + Web) | All 6 sub-workflows | Medium |
| 3 | Use app API instead of direct Postgres | activity, preference, strategy | Medium |
| 4 | Fetch images via API | strategy, image workflows | Small |
| 5 | Read user state via API (optional) | root_versionfinal | Small |
| 6 | Propagate `source` field | root + strategy | Small |
| 7 | Handle web media downloads | activity, preference, strategy | Small |

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/n8n/user?userId=xxx` | GET | Full user state + routing flags |
| `POST /api/n8n/activity` | POST | Upsert business activity |
| `GET /api/n8n/activity?userId=xxx` | GET | Read activity |
| `POST /api/n8n/preference` | POST | Upsert brand preferences |
| `GET /api/n8n/preference?userId=xxx` | GET | Read preferences |
| `POST /api/n8n/strategy` | POST | Create strategy + weeks + posts |
| `GET /api/n8n/strategy?userId=xxx` | GET | Read active strategy |
| `POST /api/n8n/draft-posts` | POST | Create a draft post |
| `PATCH /api/n8n/draft-posts` | PATCH | Update a draft post |
| `GET /api/n8n/draft-posts?strategyId=xxx` | GET | List posts by strategy |
| `GET /api/n8n/images?userId=xxx` | GET | Get brand images |
| `POST /api/n8n/respond` | POST | Push async response to web chat |
| `GET /api/chat/upload?id=xxx` | GET | Serve uploaded media file |

**All endpoints require header:** `x-n8n-secret: eI1I8if3TYWPTdnHbggg2wdbzi4EgPsj4m4fqefODTM`
(except `GET /api/chat/upload` which is public)

---

## Workflow ID Quick Reference

| Workflow | ID |
|----------|-----|
| root_versionfinal | `dcowwOcmATp5rKPS` |
| blockage_user | `e9XbFoJVyEWh3NIz` |
| social_media_activity | `49w3f57kPuAtiL48` |
| social_media_prefereance | `BGrGjZwrJSos0tSk` |
| strategie_social_media | `5OtDX7YPzvMXaQAI` |
| DraftPostcreate19122025 | `CqRAv0d6np4GCLMO` |
| CaptionWorkflow | `eUyFfb7jgmhzpT3M` |
| editCaptionWorkflow | `O6jfg0Wt6Ddj4sJ3` |
| callImageCreateWorkflow | `vqjCP1j5QlkR8eA5` |
| callimageEditedworfklow | `13o5eUpXWst0VtBK` |
| callVideoCreateWorkflow | `h2DMNqw7vrNNlZ0m` |
| search_event | `lobKJu9b2FCTv9xk` |
| workflow_token_valide | `VYYCoSHT0cpaxpzd` |
