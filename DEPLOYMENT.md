# CorridorX — Production Deployment Guide

This guide covers deploying CorridorX to cloud environments (Vercel, Render, Railway, DigitalOcean, AWS).

---

## 1. Architecture Overview for Production

* **Frontend:** Deployed as a static SPA on **Vercel**, **Cloudflare Pages**, or **Netlify**.
* **Backend:** Deployed as a stateful, long-running Node.js process on **Render**, **Railway**, **Fly.io**, or an **Ubuntu VPS** (required for persistent Socket.IO WebSocket connections).
* **Database:** SQLite initially on a persistent disk volume; architectural schema is ready for zero-downtime **PostgreSQL** migration.

---

## 2. Deploying the Backend (Render / Railway)

1. Create a **New Web Service** pointing to the `backend/` directory of your repository.
2. **Build Command:** `npm install`
3. **Start Command:** `node src/server.js`
4. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://your-frontend.vercel.app
   JWT_SECRET=your_long_production_jwt_secret_here
   DATABASE_URL=./data/database.json
   GOOGLE_MAPS_API_KEY=AIzaSy...
   GOOGLE_ROUTES_API_KEY=AIzaSy...
   GOOGLE_PLACES_API_KEY=AIzaSy...
   GOOGLE_ROADS_API_KEY=AIzaSy...
   ```
5. **Health Check Path:** `/health` (returns `200 OK`)

---

## 3. Deploying the Frontend (Vercel)

1. Import the repository into **Vercel**.
2. **Root Directory:** Set to `frontend`.
3. **Framework Preset:** Vite.
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variables:**
   ```bash
   VITE_BACKEND_URL=https://your-backend-service.onrender.com
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```
7. Click **Deploy**.

---

## 4. PostgreSQL Migration Roadmap

The database collection API in `backend/src/db/index.js` mirrors SQL tables (`find`, `findOne`, `findById`, `insert`, `update`, `delete`).

To migrate to PostgreSQL:
1. Provision a PostgreSQL instance (e.g. Supabase, Neon, AWS RDS).
2. Create tables matching the schema defined in `CORRIDORX_ARCHITECTURE.md`.
3. Set `DATABASE_URL=postgres://user:pass@host:5432/corridorx` in `backend/.env`.
4. Replace the collection methods in `backend/src/db/index.js` with `pg` or `knex` pool queries.
