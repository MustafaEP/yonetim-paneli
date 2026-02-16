#!/bin/bash
#
# Yönetim Paneli - Seed Çalıştırma Scripti (VPS/Docker)
# Kullanım:
#   ./seed.sh --seed 1 --yes
#   ./seed.sh --seed 2 --yes
#
# Notlar:
# - Seed işlemi veritabanını TEMİZLER (deleteMany) -> prod veriniz varsa yedek alın!
# - Varsayılan olarak backend servisini durdurur, seed atar, tekrar başlatır.
#

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Renkli çıktı
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/opt/yonetim"

SEED_NO="1"              # 1 | 2
YES=false                # destructive confirmation
STOP_BACKEND=true
RUN_MODE="ts"            # ts | prod
NO_REBUILD=false

print_help() {
  cat <<'EOF'
Yönetim Paneli - Seed Çalıştırma

Kullanım:
  ./seed.sh --seed 1 --yes
  ./seed.sh --seed 2 --yes

Opsiyonlar:
  --seed <1|2>         Çalıştırılacak seed (default: 1)
  --mode <ts|prod>     ts: ts-node/esm ile prisma/seed*.ts çalıştırır (default)
                       prod: dist/prisma/seed*.js çalıştırır (prisma:seed*:prod)
  --no-stop-backend    Seed sırasında backend'i durdurma
  --no-rebuild         Backend image rebuild etme
  --yes                DİKKAT: veritabanı silinecek, onay
  -h, --help           Yardım

Örnek:
  ./seed.sh --seed 2 --mode ts --yes
EOF
}

fail() {
  echo -e "${RED}❌ $*${NC}" 1>&2
  exit 1
}

info() {
  echo -e "${CYAN}$*${NC}"
}

warn() {
  echo -e "${YELLOW}⚠️  $*${NC}"
}

ok() {
  echo -e "${GREEN}✅ $*${NC}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --seed)
      SEED_NO="${2:-}"; shift 2 ;;
    --mode)
      RUN_MODE="${2:-}"; shift 2 ;;
    --no-stop-backend)
      STOP_BACKEND=false; shift ;;
    --no-rebuild)
      NO_REBUILD=true; shift ;;
    --yes)
      YES=true; shift ;;
    -h|--help)
      print_help; exit 0 ;;
    *)
      fail "Bilinmeyen argüman: $1" ;;
  esac
done

if [ "$SEED_NO" != "1" ] && [ "$SEED_NO" != "2" ]; then
  fail "--seed yalnızca 1 veya 2 olabilir (verilen: $SEED_NO)"
fi

if [ "$RUN_MODE" != "ts" ] && [ "$RUN_MODE" != "prod" ]; then
  fail "--mode yalnızca ts veya prod olabilir (verilen: $RUN_MODE)"
fi

if [ "$YES" != "true" ]; then
  cat <<EOF
${RED}DİKKAT:${NC} Seed işlemi veritabanındaki birçok tabloyu temizler (deleteMany).
Devam etmek için ${YELLOW}--yes${NC} parametresi verin.
Örnek: ./seed.sh --seed ${SEED_NO} --yes
EOF
  exit 2
fi

echo "=============================="
echo "  Yönetim Paneli - Seed"
echo "=============================="
echo -e "Seed: ${CYAN}${SEED_NO}${NC} | Mode: ${CYAN}${RUN_MODE}${NC} | Stop backend: ${CYAN}${STOP_BACKEND}${NC}"

info "📁 Proje dizinine gidiliyor..."
cd "$PROJECT_DIR" || fail "Proje dizinine girilemedi: $PROJECT_DIR"

if [ ! -f .env ]; then
  fail ".env dosyası bulunamadı! (beklenen: $PROJECT_DIR/.env)"
fi
ok ".env dosyası bulundu"

warn "Seed öncesi: DB yedeği almanız önerilir."

info "🌐 Docker network kontrol ediliyor (edge)..."
if ! docker network inspect edge >/dev/null 2>&1; then
  warn "edge network bulunamadı, oluşturuluyor..."
  docker network create edge >/dev/null
  ok "edge network oluşturuldu"
else
  ok "edge network mevcut"
fi

info "🐳 Postgres/Redis başlatılıyor (gerekirse)..."
docker compose up -d postgres redis >/dev/null

info "⏳ Postgres hazır mı kontrol ediliyor..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; then
    ok "Database hazır"
    break
  fi
  if [ "$i" -eq 30 ]; then
    docker compose logs --tail=50 postgres || true
    fail "Database 60 saniyede hazır olmadı"
  fi
  sleep 2
done

if [ "$NO_REBUILD" != "true" ]; then
  info "🔨 Backend image build ediliyor (cache ile)..."
  docker compose build backend
else
  info "🔨 Backend rebuild atlandı (--no-rebuild)"
fi

if [ "$STOP_BACKEND" = "true" ]; then
  info "🛑 Backend durduruluyor (çakışmayı önlemek için)..."
  docker compose stop backend >/dev/null 2>&1 || true
fi

SEED_CMD=""
if [ "$RUN_MODE" = "prod" ]; then
  # dist/prisma/seed*.js gerektirir
  if [ "$SEED_NO" = "1" ]; then
    SEED_CMD="npm run prisma:seed:prod"
  else
    SEED_CMD="npm run prisma:seed2:prod"
  fi
else
  # ts-node/esm ile .ts çalıştır (tsconfig-paths yok, tsconfig zorunlu değil)
  if [ "$SEED_NO" = "1" ]; then
    SEED_CMD="node --loader ts-node/esm prisma/seed.ts"
  else
    SEED_CMD="node --loader ts-node/esm prisma/seed2.ts"
  fi
fi

info "🌱 Seed çalıştırılıyor..."
info "   Komut: $SEED_CMD"

# Seed'i ayrı bir geçici container'da çalıştırmak daha deterministiktir.
# Service entrypoint migration'ları deploy eder, ardından bu komutu çalıştırır.
docker compose run --rm backend sh -lc "$SEED_CMD"
ok "Seed tamamlandı"

if [ "$STOP_BACKEND" = "true" ]; then
  info "🚀 Backend tekrar başlatılıyor..."
  docker compose up -d backend >/dev/null
  ok "Backend başlatıldı"
fi

echo "=============================="
ok "Seed işlemi bitti"
echo "=============================="

