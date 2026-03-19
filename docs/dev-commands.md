# Developer Commands Reference

## PostgreSQL (Docker)

### Start the database
```bash
docker compose up -d
```
Starts the PostgreSQL 17 container in the background. First run takes ~30-60 seconds for initialization (creates user, database, restarts with TCP listening).

### Stop the database
```bash
docker compose down
```
Stops and removes the container. Data is preserved in the `pgdata` volume.

### Stop and wipe all data
```bash
docker compose down -v
```
Stops the container AND removes the volume. Use this to reset the database from scratch.

### Check if Postgres is ready
```bash
docker exec ai-school-postgres pg_isready -h localhost -U ai_school
```
Returns `localhost:5432 - accepting connections` when ready. If it returns `no response`, Postgres is still initializing — wait 10-30 seconds on first run.

### Check Postgres logs
```bash
docker logs ai-school-postgres
```
Look for `database system is ready to accept connections` and `listening on IPv4 address "0.0.0.0", port 5432` to confirm it's fully up.

### Connect to Postgres via psql
```bash
docker exec -it ai-school-postgres psql -U ai_school -d ai_school_dev
```
Opens an interactive psql session inside the container.

### Check container status
```bash
docker ps --filter name=ai-school-postgres --format "{{.Names}} {{.Status}}"
```

---

## Elixir Backend

### Install dependencies
```bash
cd backend && mix deps.get
```

### Compile
```bash
cd backend && mix compile
```
Should complete with zero warnings. If you see errors, check that Postgres is running first.

### Database setup (first time)
```bash
cd backend && mix ecto.setup
```
Runs `ecto.create` + `ecto.migrate`. Requires Postgres to be running.

### Reset database
```bash
cd backend && mix ecto.reset
```
Drops, creates, and migrates the database. Destructive — all data is lost.

### Run migrations only
```bash
cd backend && mix ecto.migrate
```

### Start the Phoenix server
```bash
cd backend && mix phx.server
```
Runs on http://localhost:4000. Requires Postgres to be running.

### Start with interactive shell
```bash
cd backend && iex -S mix phx.server
```
Same as above but with an Elixir REPL for debugging.

### Run tests
```bash
cd backend && mix test
```

### Check code formatting
```bash
cd backend && mix format --check-formatted
```

### Generate a migration
```bash
cd backend && mix ecto.gen.migration migration_name
```
Creates a new migration file in `priv/repo/migrations/`.

---

## SolidJS Frontend

### Install dependencies
```bash
cd frontend && npm install
```

### Start dev server
```bash
cd frontend && npm run dev
```
Runs on http://localhost:5173. Proxies `/api/*` and `/socket/*` to the Phoenix backend on port 4000.

### Build for production
```bash
cd frontend && npm run build
```
Output goes to `frontend/dist/`.

---

## Full Stack (both at once)

### Start everything
```bash
# Terminal 1: Database
docker compose up -d

# Terminal 2: Backend
cd backend && mix phx.server

# Terminal 3: Frontend
cd frontend && npm run dev
```

### Health check
```bash
curl http://localhost:4000/api/health
```
Should return `{"status":"ok"}`.

### Check frontend proxy is working
```bash
curl http://localhost:5173/api/health
```
Should return the same response as above (proxied through Vite).

---

## Troubleshooting

### Postgres "no response" on first start
The official `postgres:17` image takes 30-60 seconds on first run to:
1. Initialize the data directory
2. Create the user and database
3. Shut down and restart with TCP listening enabled

Wait and check logs: `docker logs ai-school-postgres`. Look for `listening on IPv4 address "0.0.0.0"`.

### Postgres connection refused
```bash
# Check if container is running
docker ps --filter name=ai-school-postgres

# Check if port 5432 is in use by something else
lsof -i :5432
```

### Alpine image issues
Do NOT use `postgres:17-alpine` — it has locale issues and slower initialization. Use `postgres:17` (Debian-based).

### Mix ecto.setup fails with "Could not find migrations directory"
```bash
mkdir -p backend/priv/repo/migrations
```
Then rerun `mix ecto.setup`.

### Port already in use
```bash
# Find what's using port 4000 (Phoenix)
lsof -i :4000

# Find what's using port 5173 (Vite)
lsof -i :5173

# Find what's using port 5432 (Postgres)
lsof -i :5432
```
