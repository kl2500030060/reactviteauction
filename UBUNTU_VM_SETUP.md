# AutoAuction — Brand-New Ubuntu Server 24.04 LTS (VMware) + PostgreSQL 16 + 3-Window Windows CMD SSH Showcase Guide

This step-by-step guide walks you from a **brand-new VMware virtual machine** (leaving your older Ubuntu VM completely untouched) all the way to running **AutoAuction on PostgreSQL 16**, connecting your **Windows Laptop + iPhone Pro Max on College Wi-Fi**, and projecting **3 live-updating Windows CMD SSH monitor windows** during your evaluation.

---

## Part 1: VMware New Virtual Machine Wizard (Keep Your Old VM Safe)

1. Download **Ubuntu Server 24.04.x LTS ISO** (`ubuntu-24.04.x-live-server-amd64.iso`) from https://ubuntu.com/download/server.
2. Open **VMware Workstation Pro / Player** on your Windows laptop.
3. Click **File → New Virtual Machine…** (do **not** touch your existing VM).
4. **Configuration Type**: Select **Typical (recommended)** → **Next**.
5. **Guest Operating System Installation**:
   - Choose **I will install the operating system later** → **Next** *(this avoids VMware Easy Install glitches with Ubuntu Server).*
6. **Guest Operating System**:
   - Select **Linux**, Version **Ubuntu 64-bit** → **Next**.
7. **Name & Location**:
   - Virtual machine name: `AutoAuction-Ubuntu24`
   - Location: keep default separate folder (e.g., `C:\Users\Karth\Documents\Virtual Machines\AutoAuction-Ubuntu24`) → **Next**.
8. **Disk Capacity**:
   - Maximum disk size: **25 GB**
   - Select **Split virtual disk into multiple files** → **Next**.
9. **Ready to Create → Click Customize Hardware…**:
   - **Memory**: `2048 MB` (2 GB) or `4096 MB` (4 GB recommended).
   - **Processors**: `2` cores.
   - **New CD/DVD (SATA)**: Select **Use ISO image file** → browse to `ubuntu-24.04.x-live-server-amd64.iso`.
   - **Network Adapter**:
     - Select **Bridged (Connected directly to the physical network)** if your college Wi-Fi allows direct LAN IPs, **OR** keep **NAT** if you prefer **VS Code Remote-SSH + Port 3000 Forwarding** (which works reliably even on restricted college Wi-Fi!).
   - Click **Close** → **Finish**.

---

## Part 2: Installing Ubuntu Server 24.04 LTS

1. Power on `AutoAuction-Ubuntu24` and press Enter on **Try or Install Ubuntu Server**.
2. **Language & Keyboard**: English → Done.
3. **Type of install**: **Ubuntu Server** (default) → Done.
4. **Network connections**: Wait ~5 seconds until an IPv4 address appears (e.g., `192.168.x.x`) → Done.
5. **Proxy / Mirror**: Leave defaults → Done.
6. **Guided Storage Configuration**: Keep **Use an entire disk** → Done → Continue.
7. **Profile Setup**:
   - Your name: `Karthik`
   - Server name: `autoauction-vm`
   - Username: `auction` *(short username makes SSH commands fast to type)*
   - Password: pick a strong password you remember.
8. **SSH Setup (IMPORTANT)**:
   - Press **Spacebar** to check **`[X] Install OpenSSH server`** → Done.
9. **Featured Server Snaps**: Skip (don't select anything; our script installs exact PostgreSQL 16 + Node 22) → Done.
10. Wait for install to complete → select **Reboot Now** → press Enter when prompted to remove ISO.
11. Log into the VM console as `auction` and check your VM IP address:
    ```bash
    hostname -I
    ```
    Write down the first IP address (for example, `192.168.152.128`). We will refer to it as `<VM-IP>` below.

---

## Part 3: Transferring AutoAuction Files to Ubuntu (Choose Method A or Method B)

### Method A: Clone Directly from GitHub (Fastest if pushed to GitHub)

From your Windows laptop, open **Command Prompt (CMD)** and SSH into Ubuntu:
```bat
ssh auction@<VM-IP>
```
Then inside the Ubuntu SSH session:
```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/<your-username>/<your-repo-name>.git ~/autoauction
cd ~/autoauction
```

### Method B: Copy Directly from Your Windows Laptop Using `scp` (No GitHub Required)

1. Export/download the AutoAuction project zip from AI Studio onto Windows (e.g. `C:\Users\Karth\Downloads\autoauction.zip`) and extract it, OR copy the zip directly.
2. Open **Windows Command Prompt (CMD)** on your laptop (NOT inside SSH) and run:
   ```bat
   scp "C:\Users\Karth\Downloads\autoauction.zip" auction@<VM-IP>:~/autoauction.zip
   ```
   *(If you extracted it into a folder like `C:\Users\Karth\Downloads\frontend-project`, delete its `node_modules` folder first so transfer is instant, then run:)*
   ```bat
   scp -r "C:\Users\Karth\Downloads\frontend-project" auction@<VM-IP>:~/autoauction
   ```
3. Now SSH into Ubuntu and unzip (if you copied a `.zip`):
   ```bat
   ssh auction@<VM-IP>
   ```
   ```bash
   sudo apt-get update && sudo apt-get install -y unzip
   mkdir -p ~/autoauction && unzip ~/autoauction.zip -d ~/autoauction
   cd ~/autoauction
   ```

---

## Part 4: One-Command PostgreSQL 16 + Node 22 + Nginx + PM2 Setup

Inside your Ubuntu SSH session in `~/autoauction`, run:

```bash
chmod +x scripts/ubuntu-setup.sh
bash scripts/ubuntu-setup.sh
```

What this script automatically does:
- Installs **Node.js 22 LTS**, **PostgreSQL 16**, **Nginx**, **PM2**, and **UFW Firewall**.
- Creates a dedicated PostgreSQL role (`autoauction_app`) and database (`autoauction`) with a randomly generated password and writes `DATABASE_URL` + random `SESSION_SECRET` to `.env` (`chmod 600`).
- Runs `npm install` and `npm run build`.
- Configures Nginx on port `80` with WebSocket `/ws` upgrade headers and starts `server.ts --prod` under PM2.

Verify PostgreSQL 16 is active:
```bash
curl http://127.0.0.1:3000/api/health
```
Expected output:
```json
{"ok":true,"database":"postgresql","serverTime":1764000000000}
```
Notice `"database":"postgresql"` — every registration, bid, escrow lock, wallet top-up, and active session is now committed in ACID SQL transactions inside PostgreSQL 16!

---

## Part 5: Connecting Laptop + iPhone Pro Max on College Wi-Fi

Pick whichever access path fits your college Wi-Fi best:

### Option 1: VS Code Remote-SSH + Port 3000 Forwarding *(Already Verified on Your College Wi-Fi!)*
1. On your Windows laptop, open **VS Code** → install the **Remote - SSH** extension.
2. Press `Ctrl+Shift+P` → **Remote-SSH: Connect to Host…** → enter `auction@<VM-IP>`.
3. Open the **Ports** tab in VS Code bottom panel → forward port **`3000`** → right-click and set **Port Visibility → Public**.
4. Open that HTTPS forwarded URL on both your **Windows Laptop Chrome** and **iPhone Pro Max Safari**!

### Option 2: Direct LAN IP (When VM is in Bridged Mode on Hotspot / Open Wi-Fi)
- Laptop & iPhone open: `http://<VM-IP>` (or `http://<VM-IP>:3000`).

### Option 3: Instant Public HTTPS Tunnel Directly from Ubuntu (Works on Any Restricted College Wi-Fi)
In an SSH window on Ubuntu:
```bash
cd ~/autoauction && npm run wifi
```
Scan the generated `https://*.trycloudflare.com` URL on your iPhone Pro Max and open the same link on your laptop.

---

## Part 6: The 3-Window Windows CMD SSH Live Monitoring Wall (For Your Live Review!)

On your Windows laptop, press **Win + R → `cmd`** three separate times (or split **Windows Terminal** into 3 panes side-by-side) and connect each window to your Ubuntu Server:

### Window 1 — Live PostgreSQL 16 Tables, Bids & Escrow Locks
```bat
ssh -t auction@<VM-IP> "cd ~/autoauction && npm run monitor:db"
```
**What examiners see live (refreshes every 1.5s directly from PostgreSQL 16):**
- Live row counts for `users`, `auctions`, `bids`, `wallet_transactions`, and `active_sessions` + exact SQL query time in `ms`.
- Most active live lots ordered by latest bid, highest INR amount, leading bidder, and origin device.
- Latest committed bids from the `bids` table.
- Real-time `available_balance` vs `escrow_balance` utilization across all accounts as bids lock and release funds.

### Window 2 — Security & Cryptography Inspector (Salted `scrypt` Hashes + Signed Sessions)
```bat
ssh -t auction@<VM-IP> "cd ~/autoauction && npm run monitor:security"
```
**What examiners see live (refreshes every 2s over loopback `127.0.0.1` only):**
- Password KDF specification: **`scrypt (N=16384, r=8, p=1, dkLen=64B)`**, unique 16-byte random salt per user, `crypto.timingSafeEqual` verification, and **`HMAC-SHA256`** signed session tokens.
- Per-user **Salted Hash Ledger** proving identical passwords never produce matching hashes (safely truncated fingerprints — never exposed to browsers).
- **Active Signed Sessions** table showing each signed-in user's token fingerprint, role, device (`iPhone Safari`, `Windows Chrome`), client IP, and last activity timestamp.
- Live count of connected Mobile vs Desktop WebSocket clients.

### Window 3 — Live Multi-Device Traffic & SQL Commit Latency Stream
```bat
ssh -t auction@<VM-IP> "cd ~/autoauction && npm run monitor:stream"
```
**What examiners see live (instant Server-Sent Events stream):**
- Every tap on your **iPhone Pro Max** appears immediately tagged in bright cyan as **`[iPhone Safari]`** with exact PostgreSQL transaction commit latency (e.g., `(SQL 2.3ms)`).
- Every click on your **Windows Laptop** appears tagged in magenta as **`[Windows Chrome]`**.
- Triggering a **Bidding War Burst** or **2x/5x/10x Auto-Bid Speed** from the Admin panel streams live competing bids and escrow updates across all 3 CMD windows and both devices simultaneously!

---

## Part 7: Bonus — Live `psql` Queries Examiners Love to See

If an evaluator asks to inspect raw PostgreSQL tables directly via `psql`, open a 4th SSH tab and run:

```bash
source ~/autoauction/.env
psql "$DATABASE_URL"
```

Useful SQL queries inside `psql`:
```sql
-- 1. Show all PostgreSQL tables created by AutoAuction
\dt

-- 2. Inspect salted scrypt password hashes & unique salts (proving zero plaintext passwords)
SELECT username, role, hash_algorithm, left(password_salt, 12) AS salt_prefix, left(password_hash, 18) AS scrypt_hash_prefix
FROM users;

-- 3. Inspect live escrow locks & balances
SELECT username, role, available_balance, escrow_balance
FROM users
ORDER BY escrow_balance DESC;

-- 4. Inspect latest bids committed from iPhone Safari & Windows Chrome
SELECT to_timestamp(created_at / 1000) AS bid_time, lot_id, bidder_name, amount, device_label
FROM bids
WHERE bidder_id <> 'system'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Inspect active signed sessions persisted in PostgreSQL
SELECT username, role, device_label, ip_address, token_fingerprint
FROM active_sessions
ORDER BY last_seen_at DESC;
```

---

## Troubleshooting Quick Reference

- **Check PM2 server logs**: `pm2 logs autoauction --lines 50`
- **Restart server after pulling updates**:
  ```bash
  cd ~/autoauction && git pull && npm install && npm run build && pm2 restart autoauction
  ```
- **Verify external browsers cannot access internal monitor routes**:
  Opening `http://<VM-IP>:3000/api/internal/monitor` from your laptop browser intentionally returns **HTTP `403 Local SSH loopback access only`** — demonstrating defense-in-depth security!
