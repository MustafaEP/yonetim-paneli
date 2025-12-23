# Redis Kurulum ve Çalıştırma Kılavuzu

## 🚀 Hızlı Başlangıç

### Yöntem 1: Docker ile (Önerilen)

Redis zaten çalışıyor görünüyor. Eğer sorun devam ediyorsa:

#### 1. Mevcut Redis Container'ını Kontrol Et
```bash
docker ps | findstr redis
```

#### 2. Redis'i Docker Compose ile Başlat
```bash
docker-compose up -d redis
```

#### 3. Redis Durumunu Kontrol Et
```bash
docker exec yonetim-paneli-redis redis-cli ping
```
Çıktı: `PONG` olmalı

#### 4. NestJS Uygulamasını Yeniden Başlat
Redis çalıştıktan sonra backend uygulamanızı yeniden başlatın:
```bash
cd backend
npm run start:dev
```

---

## 🔧 Yapılandırma

Redis varsayılan olarak şu ayarlarla çalışır:
- **Host:** `localhost`
- **Port:** `6379`
- **Password:** Yok (opsiyonel)

Bu ayarları değiştirmek için `.env` dosyası oluşturun:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Opsiyonel, şifre varsa buraya yazın
```

---

## 🐳 Docker Komutları

### Redis'i Başlat
```bash
docker-compose up -d redis
```

### Redis'i Durdur
```bash
docker-compose stop redis
```

### Redis'i Kaldır
```bash
docker-compose down redis
```

### Redis Loglarını Görüntüle
```bash
docker-compose logs -f redis
```

### Redis CLI'ye Bağlan
```bash
docker exec -it yonetim-paneli-redis redis-cli
```

---

## 🔍 Sorun Giderme

### Port 6379 Zaten Kullanılıyor

Eğer port zaten kullanılıyorsa:

1. **Mevcut Redis Container'ını Kullan:**
   ```bash
   docker ps | findstr redis
   ```
   Çalışan container'ı görüyorsanız, onu kullanabilirsiniz.

2. **Farklı Port Kullan:**
   `docker-compose.yml` dosyasında portu değiştirin:
   ```yaml
   ports:
     - "6380:6379"  # Host portunu 6380 yap
   ```
   Ve `.env` dosyasında:
   ```env
   REDIS_PORT=6380
   ```

### Redis Bağlantı Hatası

1. **Redis'in Çalıştığını Kontrol Et:**
   ```bash
   docker ps | findstr redis
   ```

2. **Redis'e Bağlanmayı Test Et:**
   ```bash
   docker exec yonetim-paneli-redis redis-cli ping
   ```

3. **NestJS Uygulamasını Yeniden Başlat:**
   Redis çalışıyorsa, uygulamanızı restart edin.

---

## 📝 Alternatif Yöntemler

### Yöntem 2: WSL2 ile Redis Kurulumu

1. WSL2'yi açın
2. Redis'i kurun:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```
3. Redis'i başlatın:
   ```bash
   sudo service redis-server start
   ```

### Yöntem 3: Memurai (Windows Native)

Windows için native Redis alternatifi:
1. [Memurai](https://www.memurai.com/) indirin
2. Kurulumu tamamlayın
3. Varsayılan ayarlarla çalışır (localhost:6379)

---

## ✅ Başarı Kontrolü

Redis başarıyla çalışıyorsa, NestJS uygulamanız başladığında şu uyarıyı görmemelisiniz:

```
[Nest] WARN [NotificationQueue] Redis connection check: Redis may not be available.
```

Bunun yerine şunu görmelisiniz:
```
[Nest] LOG [NotificationQueue] Notification queue initialized for Redis at localhost:6379
```

---

## 📚 Daha Fazla Bilgi

- [Redis Resmi Dokümantasyon](https://redis.io/docs/)
- [BullMQ Dokümantasyon](https://docs.bullmq.io/)
- [Docker Compose Dokümantasyon](https://docs.docker.com/compose/)

