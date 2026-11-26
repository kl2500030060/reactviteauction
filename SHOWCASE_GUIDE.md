# AutoAuction — VS Code Laptop & iPhone Pro Max Showcase Guide (College Wi-Fi Ready)

Run AutoAuction directly from **VS Code on your Windows laptop** and demonstrate live real-time bidding on your **iPhone Pro Max** over **College Wi-Fi** (no Personal Hotspot required!).

---

## 1. Prerequisites (One-Time Setup)

- **Node.js 20 or 22 LTS** installed on your Windows laptop (`node -v` in VS Code Terminal).
- Open the project folder in **VS Code**, then open the integrated terminal (`Ctrl + \``).
- Install dependencies once:

```powershell
npm install
```

*(Optional)* Create a `.env` file in the project root with a `SESSION_SECRET` (at least 16 characters) so active logins stay valid across server restarts:

```env
PORT=3000
SESSION_SECRET=change-this-to-your-own-random-secret-key
```

---

## 2. Running on College Wi-Fi (No Personal Hotspot!)

College Wi-Fi networks often enable **Client / AP Isolation**, which blocks your iPhone from reaching your laptop's raw LAN IP (`http://10.x.x.x:3000`). Here are **three ways** to run on College Wi-Fi—use Method A or B if direct LAN is blocked:

### Method A: One-Command HTTPS QR Link (`npm run wifi`) — Easiest!
Builds the production app, starts AutoAuction on port `3000`, and automatically opens an **HTTPS + WebSocket (`wss://`) tunnel** with a **scannable QR code** in your VS Code terminal:

```powershell
npm run wifi
```

- Scan the `https://*.trycloudflare.com` QR code with your **iPhone Camera**.
- Works on **College Wi-Fi, 5G, or any network**—your iPhone and laptop don't even need direct peer-to-peer Wi-Fi access!
- Full **HTTPS PWA** support (tap **Share → Add to Home Screen** on iPhone Safari).

---

### Method B: VS Code Built-In Port Forwarding — Works on 100% of Campus Firewalls!
If your college firewall blocks `trycloudflare.com`, **VS Code's built-in Ports tab** works through standard Microsoft HTTPS (`443`) with zero extra software:

1. In VS Code Terminal, start AutoAuction normally:
   ```powershell
   npm run showcase
   ```
2. Look at the bottom panel next to **TERMINAL** and click the **PORTS** tab *(or press `Ctrl + Shift + P` → type `Focus on Ports View`)*.
3. Click **Forward a Port** → type **`3000`** → press **Enter**.
4. Right-click row **3000** → **Port Visibility** → select **Public** *(sign in with GitHub/Microsoft once if prompted)*.
5. Copy the generated **`https://...-3000.inc1.devtunnels.ms`** link (or hover and click the globe/copy icon) and open it on your **iPhone Pro Max Safari**!
6. Both your **Laptop** and **iPhone** stay synced in real time via `wss://` over College Wi-Fi.

---

### Method C: Direct College Wi-Fi LAN IP (When Campus Wi-Fi Allows Local Traffic)
Run:
```powershell
npm run showcase
```
Scan the printed `http://<Wi-Fi-IP>:3000` QR code with your iPhone Camera. If it loads immediately, you're connected directly over campus LAN! *(Note: On Windows, allow port `3000` once in PowerShell as Admin if needed:)*
```powershell
New-NetFirewallRule -DisplayName "AutoAuction Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## 3. Recommended 5-Minute Live Review Demo Script

Use **Laptop Chrome** (`http://localhost:3000` or your HTTPS link) side-by-side with your **iPhone Pro Max**:

1. **Login, Signup & Validation**:
   - Tap **Sign Up** on iPhone to show inline validation, or use the 1-tap demo accounts (`rahul99` Bidder / `seller1` Seller / `admin` Admin — password `demo123`).
2. **Local Storage Persistence**:
   - Hard-refresh (`Ctrl + R` / pull-to-refresh) to verify session, watchlist, and dark/light theme persist seamlessly.
3. **Kite Web Terminal, 9 Sectors & Real-Time Multi-Device Bidding**:
   - On Laptop, explore the **Terminal** split-screen (**MarketWatch + Live Recharts Price Curve + 5-Level Bid Depth**) and the **9-Sector Heatmap**.
   - Place a bid from your **iPhone** → watch the Laptop chart, Bid Depth ladder, and escrow margin update instantaneously.
   - Sign in as **Admin** (`admin` / `demo123`) on Laptop → set **Auto-Bid Speed** to `5x` or tap **Trigger Bid War** on the lot your iPhone is watching → watch live outbid alerts pop on your iPhone!
   - Open **Portfolio & Vault** → click **Contract Note** on any settled lot to preview and **Print / Save PDF** with itemized brokerage & 18% GST.
