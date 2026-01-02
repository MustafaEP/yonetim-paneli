#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

echo "== docker compose ps =="
docker compose ps || true
echo ""

echo "== backend /health (container) =="
docker compose exec -T backend sh -lc "node -e \"require('http').get('http://localhost:3000/health',(r)=>{console.log('status',r.statusCode);process.exit(r.statusCode===200?0:1)}).on('error',(e)=>{console.error(e.message);process.exit(2)})\""
echo ""

echo "== prisma migrate status =="
docker compose exec -T backend sh -lc "npx prisma migrate status"
echo ""

echo "== basic DB table checks (psql) =="
POSTGRES_DB="${POSTGRES_DB:-yonetim_paneli}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
docker compose exec -T postgres sh -lc "psql -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\" -c \"\\dt\" | head -n 60"
echo ""

echo "== check key tables exist =="
docker compose exec -T postgres sh -lc "psql -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\" -c \"select to_regclass('public.\\\"User\\\"') as user_tbl, to_regclass('public.\\\"Member\\\"') as member_tbl, to_regclass('public.\\\"Branch\\\"') as branch_tbl, to_regclass('public.\\\"Institution\\\"') as inst_tbl, to_regclass('public.\\\"Profession\\\"') as prof_tbl;\""
echo ""

echo "OK: doctor checks completed."


