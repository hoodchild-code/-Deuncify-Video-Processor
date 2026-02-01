# Deploy Deuncify on AWS (Free Tier)

Use **AWS EC2 Free Tier**: 750 hours/month of a **t2.micro** instance (1 GB RAM) for **12 months** free. Same app, no code changes—just a different way to create the server.

---

## Part 1: Create an AWS account (if needed)

1. Go to [aws.amazon.com](https://aws.amazon.com) → **Create an AWS Account**.
2. Complete sign-up. You’ll need a card, but **Free Tier** only charges if you use paid resources or exceed free limits.
3. Stay in **Free Tier**: use only **t2.micro** (or t3.micro where free), **Ubuntu**, and don’t add paid services (RDS, etc.) unless you want to pay.

---

## Part 2: Launch an EC2 instance (your “server”)

1. In the AWS Console, open **EC2** (search “EC2” in the top search bar).
2. Choose a **region** (e.g. **us-east-1**). Free tier applies per region.
3. Click **Launch Instance**.
4. Set:
   - **Name:** `deuncify` (optional).
   - **AMI:** **Ubuntu Server 22.04 LTS**.
   - **Instance type:** **t2.micro** (must show “Free tier eligible”).
   - **Key pair:** Click **Create new key pair** → name `deuncify-key` → **.pem** → Download and keep the `.pem` file safe (you need it to SSH).
   - **Network / Security group:** Create a new security group and allow:
     - **SSH** (22) from **My IP** (or 0.0.0.0/0 only if you’re okay with the world being able to try SSH).
     - **HTTP** (80) from **Anywhere** (0.0.0.0/0).
     - **HTTPS** (443) from **Anywhere** (0.0.0.0/0).
   - **Storage:** Leave default (8 GB is fine).
5. Click **Launch instance**.
6. In EC2 → **Instances**, wait until **Instance state** is **Running**. Note the **Public IPv4 address** (e.g. `54.123.45.67`).

---

## Part 3: Connect with SSH

On **Windows (PowerShell)**:

```powershell
# Fix key permissions (only needed once per key)
icacls "C:\path\to\deuncify-key.pem" /inheritance:r
icacls "C:\path\to\deuncify-key.pem" /grant:r "%USERNAME%:R"

# Connect (use your instance’s public IP)
ssh -i "C:\path\to\deuncify-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

On **Mac/Linux**:

```bash
chmod 400 ~/Downloads/deuncify-key.pem
ssh -i ~/Downloads/deuncify-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

You’re in as user **ubuntu** (not root). Use `sudo` when a command needs admin rights.

---

## Part 4: Point deuncify.com to the server

1. Where you manage DNS for **deuncify.com**, add **A** records:
   - **@** → `YOUR_EC2_PUBLIC_IP`
   - **www** → `YOUR_EC2_PUBLIC_IP`
2. Wait for DNS (5–60 min). Check: `ping deuncify.com` (should show the same IP).

**Note:** If the EC2 IP changes (e.g. after stop/start), update the A records or use an **Elastic IP** (free while the instance is running) and point the domain to that instead.

---

## Part 5: Install everything on the server

Run these **on the EC2 instance** (after SSH). All commands are as **ubuntu** with `sudo` where needed.

### 5.1 Update and install basics

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx python3 python3-pip ffmpeg
```

### 5.2 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

### 5.3 Install Python deps for the app

```bash
sudo pip3 install uvicorn fastapi python-multipart moviepy numpy
```

### 5.4 Add swap (required for t2.micro – prevents OOM crashes)

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 5.5 Clone repo and build

**Important:** Clone to a path **without** a leading hyphen. A leading `-` can cause `ERR_MODULE_NOT_FOUND`.

```bash
sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www
cd /var/www
git clone https://github.com/hoodchild-code/-Deuncify-Video-Processor.git Deuncify-Video-Processor
cd Deuncify-Video-Processor
npm install
npm run build
mkdir -p data
```

If `npm run build` runs out of memory, run `npm run build:server` after the client build completes (dist/public exists).

### 5.6 Create .env

```bash
nano .env
```

Copy from `deploy/env.example` and fill in your Supabase values:

```env
NODE_ENV=production
PORT=5000
HOST=127.0.0.1

# Supabase Auth - Get from Supabase Dashboard → Project Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
```

**Important:** Never commit `.env` files to Git! They contain secrets. The `.env` file is already in `.gitignore`.

Save (Ctrl+O, Enter, Ctrl+X).

### 5.7 Install PM2 and start the app

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
Run the command PM2 prints (e.g. `sudo env PATH=... pm2 startup systemd`). Then:

```bash
pm2 status
pm2 logs deuncify
```

You should see “serving on port 5000” and Python starting. Ctrl+C to exit logs.

---

## Part 6: Nginx (reverse proxy)

```bash
sudo nano /etc/nginx/sites-available/deuncify
```

Paste:

```nginx
server {
    listen 80;
    server_name deuncify.com www.deuncify.com;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;
    }
}
```

Save, then:

```bash
sudo ln -s /etc/nginx/sites-available/deuncify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open **http://deuncify.com** (or the EC2 public IP) — the app should load.

---

## Part 7: HTTPS (Let’s Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d deuncify.com -d www.deuncify.com
```

Follow prompts (email, agree). After that, **https://deuncify.com** should work.

---

## Free tier reminders

- **EC2:** Only **t2.micro** (or t3.micro in regions where it’s free) for 750 hours/month, 12 months.
- **Elastic IP:** Free only while the instance is running; otherwise AWS may charge. Optional; use it if you want a fixed IP for DNS.
- **Data transfer:** Small outbound allowance; normal website traffic is usually fine.
- **Storage:** 8 GB default is within free tier.

If you **stop** the instance, you don’t pay for compute, but the public IP will change unless you use an Elastic IP. After **start**, update DNS if needed.

---

## Updating the app

```bash
cd /var/www/Deuncify-Video-Processor
git checkout -- package-lock.json   # if you get merge conflicts
git pull origin main
npm install
npm run build
pm2 restart deuncify
```

If the full build fails (OOM), run `npm run build:server` after dist/public exists.

---

## Summary

1. **AWS account** → EC2 → Launch **Ubuntu 22.04**, **t2.micro**, new key pair, security group with 22, 80, 443.
2. **SSH** with the `.pem`: `ssh -i deuncify-key.pem ubuntu@EC2_IP`.
3. **DNS:** A records for deuncify.com and www → EC2 public IP (or Elastic IP).
4. On the server: install Node, Python, ffmpeg, nginx → clone repo → `npm ci` and `npm run build` → `.env` → PM2 → nginx config → certbot.
5. Use **https://deuncify.com** when DNS and certbot are done.
