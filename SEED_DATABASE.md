# Database Seed - VPS'te Çalıştırma

## Seed Verilerini Yükle

VPS'te şu komutları çalıştırın:

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Seed script'ini çalıştır
npm run prisma:seed

# Veya direkt olarak
npx prisma db seed

# Container'tan çık
exit
```

## Alternatif: Tek Komut

```bash
docker compose exec backend npm run prisma:seed
```

## Seed İçeriği

Seed script'i şunları oluşturur:
- Admin kullanıcı (admin@sendika.local / 123456)
- Genel Başkan kullanıcı
- İl Başkanı kullanıcıları
- İlçe Başkanı kullanıcıları
- Türkiye'nin tüm şehir ve ilçe verileri
- Sistem ayarları
- Örnek roller ve izinler

## Login Bilgileri

Seed sonrası şu hesaplarla giriş yapabilirsiniz:

1. **Admin:**
   - Email: `admin@sendika.local`
   - Şifre: `123456`

2. **Genel Başkan:**
   - Email: `genel.baskan@sendika.local`
   - Şifre: `123456`

3. **Bursa İl Başkanı:**
   - Email: `bursa.il.baskani@sendika.local`
   - Şifre: `123456`

4. **Ankara İl Başkanı:**
   - Email: `ankara.il.baskani@sendika.local`
   - Şifre: `123456`

5. **Bursa Mudanya İlçe Başkanı:**
   - Email: `bursa.mudanya.ilce.baskani@sendika.local`
   - Şifre: `123456`

6. **Ankara Çankaya İlçe Başkanı:**
   - Email: `ankara.cankaya.ilce.baskani@sendika.local`
   - Şifre: `123456`

## Seed Loglarını Kontrol Et

```bash
docker compose logs -f backend
```

Seed çalışırken logları göreceksiniz.

## Sorun Giderme

### Seed Çalışmıyorsa

```bash
# Container'a bağlan
docker compose exec backend sh

# Prisma Client'ı generate et
npx prisma generate

# Seed'i manuel çalıştır
npx ts-node -r tsconfig-paths/register prisma/seed.ts

# Çık
exit
```

### Seed Zaten Çalıştırılmışsa

Seed script idempotent olmalı (tekrar çalıştırılabilir), ama eğer sorun varsa:

```bash
# Database'i sıfırla (DİKKAT: Tüm veri silinir!)
docker compose exec backend npx prisma migrate reset

# Seed'i tekrar çalıştır
docker compose exec backend npm run prisma:seed
```

