# Deploy Deuncify to deuncify.com

Step-by-step guide to run the app on your own server with your domain.

---

## Prerequisites

- A **VPS** (e.g. DigitalOcean Droplet, Linode, Vultr). Use **Ubuntu 22.04**, smallest paid plan (~$6/mo).
- **deuncify.com** DNS managed where you bought the domain (e.g. Namecheap, Cloudflare, GoDaddy).
- Your repo on GitHub: `hoodchild-code/-Deuncify-Video-Processor`.

---

## Part 1: Create the server

1. Create a **Droplet** (or equivalent) with **Ubuntu 22.04**.
2. Choose a **region** close to your users.
3. Pick the **smallest paid plan** (e.g. 1 GB RAM). Video processing needs a bit of memory.
4. Add your **SSH key** (or set a root password and change it after first login).
5. Note the server **IP address** (e.g. `164.92.xxx.xxx`).

---

## Part 2: Point deuncify.com to the server

1. Log in where you manage DNS for **deuncify.com**.
2. Add or edit **A records**:
   - **Name:** `@` (or leave blank for root domain)  
     **Value:** `YOUR_SERVER_IP`  
     **TTL:** 300–3600
   - **Name:** `www`  
     **Value:** `YOUR_SERVER_IP`  
     **TTL:** 300–3600
3. Save. Wait 5–60 minutes for DNS to propagate. Check with:  
   `ping deuncify.com` (should show your server IP).

---

## Part 3: Server setup (SSH in and install everything)

### 3.1 Connect

```bash
ssh root@YOUR_SERVER_IP
```

(Replace with your actual IP.)

### 3.2 Update system and install basics

```bash
apt update && apt upgrade -y
apt install -y curl git nginx
```

### 3.3 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # should show v20.x
```

### 3.4 Install Python 3 and ffmpeg

```bash
apt install -y python3 python3-pip ffmpeg
python3 --version
ffmpeg -version
```

### 3.5 Install Python dependencies for the app

```bash
pip3 install uvicorn fastapi python-multipart moviepy numpy
```

(Or from the repo: `pip3 install -r requirements.txt` if you add one.)

### 3.6 Create app directory and clone repo

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/hoodchild-code/-Deuncify-Video-Processor.git
cd -Deuncify-Video-Processor
```

### 3.7 Install Node deps and build

```bash
npm ci
npm run build
```

### 3.8 Create data directory and set env

```bash
mkdir -p data
nano .env
```

In `.env` add (use a **strong random** value for `SESSION_SECRET`):

```env
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
SESSION_SECRET=your-long-random-secret-at-least-32-chars
```

Save (Ctrl+O, Enter, Ctrl+X).

### 3.9 Install PM2 and start the app

The app loads `.env` automatically when it starts.

```bash
npm install -g pm2
pm2 start dist/index.cjs --name deuncify
pm2 save
pm2 startup
```

Follow the command PM2 prints (e.g. `sudo env PATH=... pm2 startup systemd`).

Check:

```bash
pm2 status
pm2 logs deuncify
```

You should see “serving on port 5000” and Python starting. Ctrl+C to exit logs.

---

## Part 4: Nginx (reverse proxy and SSL)

### 4.1 Add Nginx config for deuncify.com

```bash
nano /etc/nginx/sites-available/deuncify
```

Paste (replace `YOUR_SERVER_IP` with your real IP if you want, or use `server_name` only):

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

Save and enable:

```bash
ln -s /etc/nginx/sites-available/deuncify /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Visit **http://deuncify.com** — you should see the app.

### 4.2 Add HTTPS with Let’s Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d deuncify.com -d www.deuncify.com
```

Follow prompts (email, agree to terms). Certbot will configure HTTPS and redirect HTTP → HTTPS.

Test: **https://deuncify.com**

---

## Part 5: Optional hardening

- **Firewall:**  
  `ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable`
- **Non-root user:** Create a user, deploy app under that user, and run PM2 as that user.
- **Session secret:** Generate one with:  
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`  
  and put it in `.env` as `SESSION_SECRET`.

---

## Updating the app later

```bash
cd /var/www/-Deuncify-Video-Processor
git pull
npm ci
npm run build
pm2 restart deuncify
```

---

## Troubleshooting

- **502 Bad Gateway:** App not running. Check `pm2 status` and `pm2 logs deuncify`. Ensure Node is listening on `127.0.0.1:5000` and Nginx proxies there.
- **Videos not processing:** Check `pm2 logs` for Python/uvicorn errors. Ensure `ffmpeg` is installed (`ffmpeg -version`).
- **DB / uploads:** App uses `data/` in the project directory; ensure the app user can read/write `/var/www/-Deuncify-Video-Processor/data`.

---

## Summary checklist

- [ ] VPS created (Ubuntu 22.04)
- [ ] DNS A records for deuncify.com and www → server IP
- [ ] Node 20, Python 3, ffmpeg, nginx installed
- [ ] Repo cloned, `npm ci` and `npm run build`
- [ ] `.env` with `NODE_ENV`, `PORT`, `HOST`, `SESSION_SECRET`
- [ ] PM2 running `dist/index.cjs`, `pm2 save` and `pm2 startup`
- [ ] Nginx site for deuncify.com proxying to 127.0.0.1:5000
- [ ] Certbot run for deuncify.com and www
- [ ] https://deuncify.com works
