# Speeda ↔ datatest — Sync Bridge Setup

This document describes the steps to activate the bidirectional real-time sync
bridge between the Speeda (Next.js) database and the n8n `datatest` PostgreSQL
database after deploying to the VPS.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  SPEEDA (Next.js) — Docker container            │
│                                                 │
│  POST /api/setup ──────────────────────────┐   │
│  POST /api/n8n/preference ─────────────┐   │   │
│  POST /api/n8n/activity ───────────┐   │   │   │
│                                    ▼   ▼   ▼   │
│                              sync-n8n.ts        │
│                         (writes to datatest)    │
│                                                 │
│  pg-listener.ts ◄── NOTIFY ◄── TRIGGER         │
│  (listens to datatest)    (on datatest tables)  │
│       └──► upsert Prisma Speeda DB              │
└─────────────────────────────────────────────────┘

VPS Host (outside Docker)
└── PostgreSQL :5432  →  datatest  (Java Spring / n8n)
```

### What is — and is NOT — synced

| Table        | Direction              | Notes                                        |
|-------------|------------------------|----------------------------------------------|
| preferences | Speeda ↔ datatest      | Both directions, real-time                   |
| activities  | Speeda ↔ datatest      | Both directions, real-time                   |
| **users**   | **Never synced**       | Incompatible auth (bcrypt/JWT vs Spring Security). `datatest.users` is queried **read-only** solely to resolve email → bigint user_id |

---

## Deployment Steps

### Step 1 — Add `DATABASE_N8N_URL` to `.env` on the VPS

```bash
# On the VPS, in ~/speeda-app-v1.1/.env
DATABASE_N8N_URL=postgresql://postgres@host.docker.internal:5432/datatest
```

> **Note:** The `datatest` database currently has no password for the `postgres`
> user. This is a **temporary** configuration. Before going to production, secure
> the `postgres` account and update `DATABASE_N8N_URL` with the password:
> ```
> DATABASE_N8N_URL=postgresql://postgres:YOUR_PASSWORD@host.docker.internal:5432/datatest
> ```

### Step 2 — Install the triggers on `datatest` (once only)

This creates NOTIFY triggers on `preferences` and `activities` in `datatest`.
The triggers fire automatically whenever n8n writes to those tables, sending a
`speeda_sync` notification that the Next.js listener picks up in real time.

```bash
sudo -u postgres psql -d datatest -f scripts/setup-n8n-triggers.sql
```

Expected output:
```
NOTICE:  speeda_sync triggers created successfully on preferences and activities
```

### Step 3 — Redeploy

```bash
cd ~/speeda-app-v1.1
git pull origin main
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Step 4 — Verify (Optional)

```bash
# Check the app started and listener is active
docker compose logs app --tail 50 | grep pg-listener

# Expected line:
# [pg-listener] Listening on channel speeda_sync
```

---

## Environment Variable Reference

| Variable           | Description                                        | Example                                                    |
|--------------------|----------------------------------------------------|------------------------------------------------------------|
| `DATABASE_N8N_URL` | Connection string to `datatest` from inside Docker | `postgresql://postgres@host.docker.internal:5432/datatest` |

---

## How `host.docker.internal` Works on Linux

On Linux, Docker does not add `host.docker.internal` automatically. The
`docker-compose.yml` includes:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

This maps `host.docker.internal` to the Docker host gateway IP, allowing the
`app` container to reach the PostgreSQL instance running on the VPS host at
`127.0.0.1:5432`.
