# Docker Kurulum Rehberi - VPS Sunucu

Bu rehber, projeyi VPS sunucunuzda Docker ile çalıştırmak için gerekli adımları içerir.

## Gereksinimler

- Docker (20.10+)
- Docker Compose (2.0+)
- En az 2GB RAM
- En az 10GB disk alanı

## Kurulum Adımları

### 1. Projeyi VPS'e Yükleyin

```bash
git clone https://github.com/MustafaEP/yonetim-paneli.git
cd yonetim-paneli
```

### 2. Environment Variables Dosyası Oluşturun

`.env` dosyası oluşturun ve aşağıdaki değişkenleri doldurun:

```bash
# Database Configuration
POSTGRES_DB=yonetim_paneli
POSTGRES_USER=postgres
POSTGRES_PASSWORD=güçlü-şifre-buraya
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=güçlü-redis-şifresi
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=3000
JWT_SECRET=çok-güvenli-jwt-secret-key-buraya
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_BASE_URL=http://your-domain.com/api

# AWS SES Configuration (E-posta için - opsiyonel)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_FROM_EMAIL=
```

**ÖNEMLİ:** 
- `POSTGRES_PASSWORD` için güçlü bir şifre kullanın
- `JWT_SECRET` için rastgele, uzun bir string kullanın
- `VITE_API_BASE_URL` için VPS'inizin domain adresini veya IP adresini kullanın

### 3. Docker Container'ları Başlatın

```bash
docker-compose up -d
```

Bu komut:
- PostgreSQL veritabanını başlatır
- Redis cache'i başlatır
- Backend'i build eder ve çalıştırır (migration'lar otomatik çalışır)
- Frontend'i build eder ve Nginx ile serve eder

### 4. Logları Kontrol Edin

```bash
# Tüm servislerin loglarını görüntüle
docker-compose logs -f

# Sadece backend logları
docker-compose logs -f backend

# Sadece frontend logları
docker-compose logs -f frontend
```

### 5. Servis Durumunu Kontrol Edin

```bash
docker-compose ps
```

Tüm servislerin `Up` durumunda olduğundan emin olun.

## Yönetim Komutları

### Container'ları Durdurma

```bash
docker-compose down
```

### Container'ları Yeniden Başlatma

```bash
docker-compose restart
```

### Verileri Koruyarak Durdurma

```bash
docker-compose down
```

### Verileri Silerek Durdurma (DİKKAT!)

```bash
docker-compose down -v
```

### Backend Loglarına Bakma

```bash
docker-compose logs -f backend
```

### Frontend Loglarına Bakma

```bash
docker-compose logs -f frontend
```

### Database'e Bağlanma

```bash
docker-compose exec postgres psql -U postgres -d yonetim_paneli
```

### Redis'e Bağlanma

```bash
docker-compose exec redis redis-cli
```

## Güncelleme

Projeyi güncellemek için:

```bash
# Değişiklikleri çek
git pull

# Container'ları yeniden build et ve başlat
docker-compose up -d --build
```

## Sorun Giderme

### Backend Başlamıyor

1. Database bağlantısını kontrol edin:
```bash
docker-compose logs backend
```

2. Environment variable'ları kontrol edin:
```bash
docker-compose config
```

### Frontend API'ye Bağlanamıyor

1. `VITE_API_BASE_URL` değerini kontrol edin
2. Nginx config'i kontrol edin:
```bash
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Migration Hataları

Migration'ları manuel çalıştırabilirsiniz:

```bash
docker-compose exec backend npx prisma migrate deploy
```

### Disk Alanı Sorunu

Eski image'ları temizlemek için:

```bash
docker system prune -a
```

## Güvenlik Notları

1. **Firewall:** Sadece gerekli portları açın (80, 443)
2. **SSL/TLS:** Nginx reverse proxy ile SSL sertifikası ekleyin (Let's Encrypt önerilir)
3. **Şifreler:** Güçlü şifreler kullanın ve `.env` dosyasını asla commit etmeyin
4. **Backup:** Düzenli olarak PostgreSQL veritabanını yedekleyin

## Port Yapılandırması

- **Frontend:** 80 (HTTP)
- **Backend:** 3000 (internal, dışarıdan erişilemez)
- **PostgreSQL:** 5432 (internal, dışarıdan erişilemez)
- **Redis:** 6379 (internal, dışarıdan erişilemez)

Frontend, backend'e `/api` path'i üzerinden proxy ile bağlanır.

## Production İçin Öneriler

1. **Reverse Proxy:** Nginx veya Traefik kullanarak SSL ekleyin
2. **Monitoring:** Container'ları izlemek için monitoring tool'ları kullanın
3. **Backup:** Otomatik backup script'leri oluşturun
4. **Log Rotation:** Log dosyalarının büyümesini önlemek için log rotation yapılandırın

