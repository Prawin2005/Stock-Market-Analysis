## PostgreSQL Native Setup Guide (Windows)

### Step 1 — Download & Install PostgreSQL

1. Go to: **https://www.postgresql.org/download/windows/**
2. Click **"Download the installer"** and download the latest version (e.g., PostgreSQL 16).
3. Run the installer. During setup:
   - **Installation Directory**: Leave as default
   - **Components**: Keep all checked (PostgreSQL Server, pgAdmin 4, Command Line Tools)
   - **Data Directory**: Leave as default
   - **Password**: Set a password for the `postgres` superuser — **remember this!**
   - **Port**: Leave as `5432`
   - Click through until complete. Do NOT install Stack Builder when prompted at the end.

---

### Step 2 — Create the Project Database

Open **pgAdmin 4** (installed with PostgreSQL):

1. In the left sidebar, expand **Servers → PostgreSQL 16 → Databases**
2. Right-click **Databases** → **Create → Database...**
3. Set **Database name**: `stock_market`
4. Click **Save**

OR use the Command Line (`psql`):

```bash
# Open Start Menu → search "psql" → open SQL Shell (psql)
# Login: press Enter for server/database/port/username (use defaults), enter your password
psql -U postgres
CREATE DATABASE stock_market;
\q
```

---

### Step 3 — Run the Initialization SQL Script

In **pgAdmin 4**:

1. Expand **Databases → stock_market**
2. Click the **Query Tool** button (toolbar icon)
3. Click **Open File** → navigate to `database/init.sql`
4. Click the **▶ Execute** button (or press F5)
5. You should see: `Database initialized successfully!`

OR via `psql` command line:

```bash
psql -U postgres -d stock_market -f "C:\Users\sukun\Desktop\Stock Market\database\init.sql"
```

---

### Step 4 — Update the Backend `.env` File

Open `backend/.env` and update your PostgreSQL password:

```
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE   <-- replace with your password set in Step 1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_market
```

---

## Redis Native Setup Guide (Windows)

Redis does not have an official Windows installer, but **Memurai** is an officially supported Redis-compatible server for Windows.

### Option A — Install Memurai (Recommended for Windows)

1. Go to: **https://www.memurai.com/get-memurai**
2. Download and run the installer
3. Memurai installs as a Windows Service and starts automatically
4. It runs on port `6379` by default — same as Redis

### Option B — Use Windows Subsystem for Linux (WSL2)

If you have WSL2:
```bash
wsl
sudo apt update && sudo apt install redis-server
sudo service redis-server start
```

### Option C — Skip Redis (Use Built-in Cache)
The backend already has an automatic **in-memory cache fallback**. If Redis is not running, it silently switches to a fast in-memory Map. For development, this works perfectly fine.

---

## Starting the Project

Once PostgreSQL (and optionally Redis) are running:

### Terminal 1 — Backend API
```bash
cd "C:\Users\sukun\Desktop\Stock Market\backend"
npm run dev
```

### Terminal 2 — Frontend Client
```bash
cd "C:\Users\sukun\Desktop\Stock Market\frontend"
npm run dev
```

Open browser at **http://localhost:5173** and sign up!
