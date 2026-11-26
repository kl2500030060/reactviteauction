#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# AutoAuction — Automated Ubuntu Server 24.04 LTS + PostgreSQL 16 Setup Script
# Run from inside your project folder:  bash scripts/ubuntu-setup.sh
# ==============================================================================

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="autoauction"
DB_USER="autoauction_app"
APP_PORT="${PORT:-3000}"

echo "================================================================"
echo " AutoAuction Ubuntu Server 24.04 + PostgreSQL 16 Installer"
echo " Project directory: ${APP_DIR}"
echo "================================================================"

if [[ $EUID -eq 0 ]]; then
  echo "Please run this script as your normal Ubuntu user (with sudo), not as root."
  exit 1
fi

echo "[1/7] Updating Ubuntu apt index and installing base tools..."
sudo apt-get update -y
sudo apt-get install -y curl ca-certificates gnupg git ufw nginx postgresql postgresql-contrib openssl

echo "[2/7] Installing Node.js 22 LTS (if not already v22+)..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node version: $(node -v) | npm version: $(npm -v)"

echo "[3/7] Installing PM2 process manager globally..."
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "[4/7] Configuring PostgreSQL 16 database & role..."
sudo systemctl enable --now postgresql

if [[ ! -f "${APP_DIR}/.env" ]]; then
  DB_PASS="$(openssl rand -hex 16)"
  SESSION_SECRET="$(openssl rand -hex 32)"

  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL

  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
  fi

  sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" >/dev/null
  sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" >/dev/null

  cat > "${APP_DIR}/.env" <<EOF
PORT=${APP_PORT}
NODE_ENV=production
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
SESSION_SECRET=${SESSION_SECRET}
EOF
  chmod 600 "${APP_DIR}/.env"
  echo "Created ${APP_DIR}/.env with generated PostgreSQL credentials & SESSION_SECRET."
else
  echo "Existing ${APP_DIR}/.env found — preserving current credentials."
fi

echo "[5/7] Installing npm packages and building production frontend..."
cd "${APP_DIR}"
npm install
npm run build

echo "[6/7] Configuring Nginx reverse proxy with WebSocket (/ws) support..."
sudo tee /etc/nginx/sites-available/autoauction >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/autoauction /etc/nginx/sites-enabled/autoauction
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

echo "[7/7] Configuring UFW firewall and starting AutoAuction via PM2..."
sudo ufw allow OpenSSH >/dev/null 2>&1 || true
sudo ufw allow 80/tcp >/dev/null 2>&1 || true
sudo ufw allow "${APP_PORT}/tcp" >/dev/null 2>&1 || true
sudo ufw --force enable >/dev/null 2>&1 || true

pm2 delete autoauction >/dev/null 2>&1 || true
pm2 start npx --name autoauction -- tsx server.ts --prod
pm2 save

VM_IP="$(hostname -I | awk '{print $1}')"
echo ""
echo "================================================================"
echo " AutoAuction is LIVE on Ubuntu Server + PostgreSQL 16!"
echo "----------------------------------------------------------------"
echo " Web UI (Nginx Port 80):   http://${VM_IP}"
echo " Direct Node Port 3000:    http://${VM_IP}:${APP_PORT}"
echo " Health Check:             curl http://127.0.0.1:${APP_PORT}/api/health"
echo ""
echo " Open 3 Windows CMD SSH windows and run:"
echo "   Window 1: cd ${APP_DIR} && npm run monitor:db"
echo "   Window 2: cd ${APP_DIR} && npm run monitor:security"
echo "   Window 3: cd ${APP_DIR} && npm run monitor:stream"
echo "================================================================"
