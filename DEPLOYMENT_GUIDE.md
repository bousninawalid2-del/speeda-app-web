# Speeda Production Deployment Guide

> **Stack:** Next.js App + n8n + PostgreSQL on AWS EC2 + Namecheap Domain
> **Domains:** `platform.speeda.ai` (web app) + `n8n.speeda.ai` (workflow editor)

---

## Prerequisites

- AWS account with EC2 access
- Namecheap domain (speeda.ai)
- SSH key pair for EC2
- Your `.env` values ready (API keys, secrets, etc.)

---

## STEP 1: Launch AWS EC2 Instance

### 1.1 — Create the Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:
   - **Name:** `speeda-production`
   - **AMI:** Ubuntu 24.04 LTS (HVM, SSD)
   - **Instance type:** `t3.medium` (2 vCPU, 4 GB RAM) — minimum for app + n8n + Postgres
   - **Key pair:** Create new or select existing (download the `.pem` file)
   - **Storage:** 30 GB gp3 (SSD)
3. **Network / Security Group** — create a new security group with these rules:

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Redirect to HTTPS |
| HTTPS | 443 | 0.0.0.0/0 | Web app + n8n |

4. Click **Launch Instance**
5. Note the **Public IP** (e.g., `54.123.45.67`)

### 1.2 — Allocate an Elastic IP (So IP Doesn't Change)

1. Go to **EC2 → Elastic IPs → Allocate**
2. Associate it with your `speeda-production` instance
3. Note this static IP — you'll use it for DNS

---

## STEP 2: Configure DNS on Namecheap

1. Go to **Namecheap → Domain List → speeda.ai → Manage → Advanced DNS**
2. Add these **A Records**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `app` | `YOUR_ELASTIC_IP` | Automatic |
| A Record | `n8n` | `YOUR_ELASTIC_IP` | Automatic |

3. If you also want the root domain `speeda.ai` to work:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `YOUR_ELASTIC_IP` | Automatic |

4. **Wait 5-30 minutes** for DNS propagation
5. Verify: `ping platform.speeda.ai` should resolve to your Elastic IP

---

## STEP 3: Connect to Your VPS via SSH

```bash
# From your local machine
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## STEP 4: Install Docker & Docker Compose on the VPS

Run these commands on the server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Apply group change (or logout/login)
newgrp docker

# Verify
docker --version
docker compose version
```

---

## STEP 5: Install Nginx (Reverse Proxy + SSL)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## STEP 6: Upload Your Project to the Server

### Option A: Git Clone (Recommended)

```bash
# On the server
cd /home/ubuntu
git clone https://YOUR_REPO_URL.git speeda-app
cd speeda-app
```

### Option B: SCP Upload (If No Git Repo)

```bash
# From your LOCAL machine (not the server)
scp -i your-key.pem -r "C:\chamonix\dev\speedav1\Speeda-app" ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/speeda-app
```

---

## STEP 7: Create Production .env File

On the server:

```bash
cd /home/ubuntu/speeda-app
nano .env.production
```

Paste and fill in ALL values:

```env
# ── General ──────────────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://platform.speeda.ai

# ── Database ─────────────────────────────────────────────────
# No need to change — docker-compose uses internal network
DATABASE_URL=postgresql://speeda:YOUR_STRONG_DB_PASSWORD@db:5432/speeda

# ── JWT (GENERATE NEW SECRETS FOR PRODUCTION!) ───────────────
# Generate with: openssl rand -base64 48
JWT_ACCESS_SECRET=GENERATE_A_NEW_RANDOM_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_ANOTHER_RANDOM_SECRET_HERE
JWT_ACCESS_EXPIRES=7d
JWT_REFRESH_EXPIRES=7d

# ── Email ────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@speeda.ai
SMTP_PASS=your-real-google-app-password
EMAIL_FROM=Speeda <noreply@speeda.ai>

# ── Anthropic AI ─────────────────────────────────────────────
ANTHROPIC_API_KEY=your-real-anthropic-key

# ── Ayrshare ─────────────────────────────────────────────────
AYRSHARE_API_KEY=8E853059-B1994A4A-AA3D177F-3D1D41E4
AYRSHARE_DOMAIN=id-9Bl9T
AYRSHARE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
AYRSHARE_WEBHOOK_SECRET=your-ayrshare-webhook-secret

# ── MamoPay ──────────────────────────────────────────────────
MAMOPAY_API_KEY=your-production-mamopay-key
MAMOPAY_WEBHOOK_SECRET=your-mamopay-webhook-secret
MAMOPAY_SANDBOX=false

# ── n8n ──────────────────────────────────────────────────────
# Internal Docker network — DO NOT change
N8N_WEBHOOK_URL=http://n8n:5678/webhook/210b7b4e-4fb5-420b-b219-9a9e66aa8872
N8N_WEBHOOK_URL_PUBLIC=https://n8n.speeda.ai/
N8N_AUTH_USER=admin
N8N_AUTH_PASSWORD=YOUR_STRONG_N8N_PASSWORD

# ── App ──────────────────────────────────────────────────────
FREE_TRIAL_DAYS=14
ADMIN_SECRET=GENERATE_A_NEW_ADMIN_SECRET_HERE
TIMEZONE=Asia/Riyadh
```

Generate the secrets:

```bash
# Run these and paste the output into your .env.production
openssl rand -base64 48   # → JWT_ACCESS_SECRET
openssl rand -base64 48   # → JWT_REFRESH_SECRET
openssl rand -base64 32   # → ADMIN_SECRET
```

---

## STEP 8: Update docker-compose for Production Passwords

```bash
cd /home/ubuntu/speeda-app
nano docker-compose.yml
```

Change the hardcoded Postgres password in **3 places**:

```yaml
# In db service:
POSTGRES_PASSWORD: YOUR_STRONG_DB_PASSWORD

# In app service:
DATABASE_URL: postgresql://speeda:YOUR_STRONG_DB_PASSWORD@db:5432/speeda

# In migrate service:
DATABASE_URL: postgresql://speeda:YOUR_STRONG_DB_PASSWORD@db:5432/speeda

# In n8n service:
DB_POSTGRESDB_PASSWORD: YOUR_STRONG_DB_PASSWORD
```

Also remove the Postgres port exposure (don't expose DB to internet):

```yaml
# REMOVE or comment out in db service:
# ports:
#   - '5432:5432'
```

---

## STEP 9: Build & Launch Everything

```bash
cd /home/ubuntu/speeda-app

# Copy env
cp .env.production .env

# Build and start all services
docker compose up -d --build

# Watch the logs to make sure everything starts
docker compose logs -f
```

Wait until you see:
- `db` → `database system is ready to accept connections`
- `app` → listening on port 3000
- `n8n` → `n8n ready on 0.0.0.0, port 5678`

### Run Database Migration

```bash
docker compose run --rm migrate
```

### Verify Services Are Running

```bash
docker compose ps

# Should show:
# db      running (healthy)
# app     running (healthy)
# n8n     running
```

Test internally:

```bash
curl http://localhost:3000/api/health
# → {"status":"ok"}

curl http://localhost:5678/healthz
# → {"status":"ok"}
```

---

## STEP 10: Configure Nginx Reverse Proxy

### 10.1 — App Config (platform.speeda.ai)

```bash
sudo nano /etc/nginx/sites-available/platform.speeda.ai
```

Paste:

```nginx
server {
    listen 80;
    server_name platform.speeda.ai;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Large file uploads (images, PDFs)
        client_max_body_size 20M;
    }
}
```

### 10.2 — n8n Config (n8n.speeda.ai)

```bash
sudo nano /etc/nginx/sites-available/n8n.speeda.ai
```

Paste:

```nginx
server {
    listen 80;
    server_name n8n.speeda.ai;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # n8n webhook payloads can be large
        client_max_body_size 50M;

        # Longer timeouts for workflow execution
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

### 10.3 — Enable Both Sites

```bash
sudo ln -s /etc/nginx/sites-available/platform.speeda.ai /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/n8n.speeda.ai /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## STEP 11: Install SSL Certificates (HTTPS)

```bash
# Get SSL for both domains in one command
sudo certbot --nginx -d platform.speeda.ai -d n8n.speeda.ai \
  --non-interactive --agree-tos -m your-email@speeda.ai

# Certbot auto-renews. Verify the timer:
sudo systemctl status certbot.timer
```

After this:
- `https://platform.speeda.ai` → your Next.js app
- `https://n8n.speeda.ai` → n8n workflow editor

---

## STEP 12: Import n8n Workflows

1. Open `https://n8n.speeda.ai` in your browser
2. Login with the credentials you set (`N8N_AUTH_USER` / `N8N_AUTH_PASSWORD`)
3. Go to **Workflows → Import from File**
4. Import each workflow JSON from the `n8n/` folder in this order:

```
1. CaptionWorkflow (1).json
2. editCaptionWorkflow (1).json
3. callImageCreateWorkflow (1).json
4. callimageEditedworfklow (1).json
5. callVideoCreateWorkflow.json
6. search_event (1).json
7. workflow_token_valide (1).json
8. blockage_user (1).json
9. social_media_activity (1).json
10. social_media_prefereance (1).json
11. DraftPostcreate19122025 (1).json
12. strategie_social_media (1).json
13. root_versionfinal (1).json        ← LAST (it references all others)
```

5. **Configure credentials** in n8n (Settings → Credentials):
   - **OpenAI** — add your API key
   - **Postgres** — Host: `db`, Port: `5432`, Database: `speeda`, User: `speeda`, Password: your DB password
   - **WhatsApp Business Cloud** — your WhatsApp Business API token
   - **Google Service Account** — upload your service account JSON

6. **Activate** the `root_versionfinal` workflow (toggle it ON)

---

## STEP 13: Configure Webhooks in External Services

### MamoPay Webhooks
Go to MamoPay dashboard → Webhooks → Set URL to:
```
https://platform.speeda.ai/api/webhooks/mamo
```

### Ayrshare Webhooks
Go to Ayrshare dashboard → Webhooks → Set URL to:
```
https://platform.speeda.ai/api/webhooks/ayrshare
```

### WhatsApp Business (if using WhatsApp channel)
In Meta Business Suite → WhatsApp → Configuration → Webhook URL:
```
https://n8n.speeda.ai/webhook/210b7b4e-4fb5-420b-b219-9a9e66aa8872
```

---

## STEP 14: Verify Everything Works

```bash
# 1. Health check
curl https://platform.speeda.ai/api/health

# 2. Check all containers are running
docker compose ps

# 3. Check logs for errors
docker compose logs app --tail 50
docker compose logs n8n --tail 50
docker compose logs db --tail 20
```

Open in browser:
- `https://platform.speeda.ai` → should load the Speeda app
- `https://platform.speeda.ai/api/health` → `{"status":"ok"}`
- `https://n8n.speeda.ai` → n8n login page

---

## Maintenance Commands

```bash
# ── View logs ────────────────────────────────────────────────
docker compose logs -f app          # app logs
docker compose logs -f n8n          # n8n logs
docker compose logs -f db           # database logs

# ── Restart a service ────────────────────────────────────────
docker compose restart app
docker compose restart n8n

# ── Update & redeploy (after code changes) ───────────────────
cd /home/ubuntu/speeda-app
git pull                             # or re-upload files
docker compose up -d --build app     # rebuild only the app
docker compose run --rm migrate      # run new migrations

# ── Database backup ──────────────────────────────────────────
docker compose exec db pg_dump -U speeda speeda > backup_$(date +%Y%m%d).sql

# ── Database restore ─────────────────────────────────────────
cat backup.sql | docker compose exec -T db psql -U speeda speeda

# ── Prisma Studio (DB viewer) — run temporarily ─────────────
docker compose exec app npx prisma studio

# ── Full restart ─────────────────────────────────────────────
docker compose down
docker compose up -d

# ── Check disk space ─────────────────────────────────────────
df -h
docker system df
```

---

## Security Checklist

- [ ] Postgres port (5432) NOT exposed to internet (only Docker internal)
- [ ] Strong passwords for DB, JWT secrets, Admin secret, n8n auth
- [ ] SSL certificates active on both domains
- [ ] `.env` file has `chmod 600` permissions
- [ ] AWS Security Group only allows ports 22, 80, 443
- [ ] n8n has authentication enabled
- [ ] MamoPay sandbox mode is OFF (`MAMOPAY_SANDBOX=false`)
- [ ] Regular database backups scheduled

---

## AWS Cost Estimate

| Resource | Spec | ~Monthly Cost |
|----------|------|---------------|
| EC2 t3.medium | 2 vCPU, 4 GB | ~$30 |
| EBS 30 GB gp3 | Storage | ~$2.40 |
| Elastic IP | Static IP | Free (if attached) |
| Data transfer | ~50 GB/mo | ~$4.50 |
| **Total** | | **~$37/month** |

Consider upgrading to `t3.large` (8 GB RAM) if n8n workflows get heavy with image/video generation.
