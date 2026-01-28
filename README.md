# Sendika Yönetim Paneli

Modern, ölçeklenebilir ve güvenli bir sendika yönetim sistemi. Hiyerarşik rol yapısı ile üye yönetimi, mali işler, içerik yönetimi ve raporlama özellikleri sunar.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Stack](#-teknoloji-stack)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [Geliştirme](#-geliştirme)
- [Deployment](#-deployment)
- [Rol Yapısı](#-rol-yapısı)
- [Modüller](#-modüller)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

## ✨ Özellikler

- 🔐 **Güvenli Kimlik Doğrulama**: JWT tabanlı authentication sistemi
- 👥 **Hiyerarşik Rol Yönetimi**: 9 farklı rol seviyesi ile esnek yetkilendirme
- 📊 **Kapsamlı Üye Yönetimi**: Kayıt, onay, güncelleme ve durum takibi
- 💰 **Mali İşler Modülü**: Aidat yönetimi, ödeme takibi ve raporlama
- 📄 **Doküman Yönetimi**: PDF şablonları ve otomatik doküman üretimi
- 📢 **İçerik Yönetimi**: Haber, duyuru ve etkinlik yönetimi
- 🔔 **Bildirim Sistemi**: Email, SMS ve WhatsApp entegrasyonu
- 📈 **Raporlama**: Detaylı istatistikler ve Excel/PDF export
- 🌍 **Bölgesel Yönetim**: İl, ilçe ve şube bazlı organizasyon
- 🔍 **Audit Log**: Tüm işlemlerin kayıt altına alınması

## 🛠️ Teknoloji Stack

### Backend
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 6.x
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Queue**: BullMQ
- **Authentication**: JWT (Passport)
- **Documentation**: Swagger/OpenAPI
- **PDF Generation**: Puppeteer
- **Email**: AWS SES

### Frontend
- **Framework**: React 19.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 7.x
- **UI Library**: Material-UI (MUI) 7.x
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router 7.x
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Excel Export**: xlsx

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Reverse Proxy**: Nginx Proxy Manager

## 📁 Proje Yapısı

```
yonetim-paneli/
├── backend/                 # NestJS backend uygulaması
│   ├── src/
│   │   ├── accounting/     # Mali işler modülü
│   │   ├── approvals/      # Onay süreçleri
│   │   ├── auth/           # Kimlik doğrulama
│   │   ├── content/        # İçerik yönetimi
│   │   ├── documents/      # Doküman yönetimi
│   │   ├── members/        # Üye yönetimi
│   │   ├── notifications/  # Bildirim sistemi
│   │   ├── payments/       # Ödeme yönetimi
│   │   ├── regions/        # Bölgesel yönetim
│   │   ├── roles/          # Rol ve yetki yönetimi
│   │   └── users/          # Kullanıcı yönetimi
│   ├── prisma/             # Prisma schema ve migrations
│   └── scripts/            # Yardımcı scriptler
│
├── panele/                 # React frontend uygulaması
│   ├── src/
│   │   ├── api/           # API client'ları
│   │   ├── components/    # React bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── context/       # Context API
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Yardımcı fonksiyonlar
│   └── public/            # Statik dosyalar
│
├── nginx-proxy-config/    # Nginx konfigürasyonları
├── scripts/               # Deployment scriptleri
└── docker-compose.yml     # Docker Compose konfigürasyonu
```

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+ ve npm/yarn
- Docker ve Docker Compose
- PostgreSQL 16+ (veya Docker ile)
- Redis 7+ (veya Docker ile)

### Yerel Geliştirme Ortamı

1. **Repository'yi klonlayın**
   ```bash
   git clone <repository-url>
   cd yonetim-paneli
   ```

2. **Environment değişkenlerini ayarlayın**
   ```bash
   cp env.example .env
   # .env dosyasını düzenleyin
   ```

3. **Docker container'ları başlatın**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Backend bağımlılıklarını yükleyin**
   ```bash
   cd backend
   npm install
   ```

5. **Database migration'ları çalıştırın**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Backend'i başlatın**
   ```bash
   npm run start:dev
   ```

7. **Frontend bağımlılıklarını yükleyin** (yeni terminal)
   ```bash
   cd panele
   npm install
   ```

8. **Frontend'i başlatın**
   ```bash
   npm run dev
   ```

Backend: `http://localhost:3000`  
Frontend: `http://localhost:5173`  
API Docs: `http://localhost:3000/api`

## 💻 Geliştirme

### Backend Komutları

```bash
# Development modunda çalıştır
npm run start:dev

# Production build
npm run build
npm run start:prod

# Test çalıştır
npm run test
npm run test:e2e

# Linting ve formatlama
npm run lint
npm run format

# Prisma işlemleri
npx prisma studio          # Prisma Studio'yu açar
npx prisma migrate dev     # Yeni migration oluşturur
npx prisma generate        # Prisma Client'ı yeniden oluşturur
```

### Frontend Komutları

```bash
# Development modunda çalıştır
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Kod Standartları

- TypeScript strict mode aktif
- ESLint ve Prettier kullanılıyor
- Commit mesajları için conventional commits önerilir
- Pull request'ler için code review gereklidir

## 🚢 Deployment

### VPS Deployment

1. **Sunucuya bağlanın ve projeyi klonlayın**
   ```bash
   cd /opt
   git clone <repository-url> yonetim
   cd yonetim
   ```

2. **Environment dosyasını oluşturun**
   ```bash
   cp env.example .env
   # .env dosyasını production değerleriyle düzenleyin
   ```

3. **Docker network'ü oluşturun**
   ```bash
   docker network create edge
   ```

4. **Deploy scriptini çalıştırın**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   Veya manuel olarak:
   ```bash
   docker-compose build
   docker-compose up -d
   docker-compose exec backend npx prisma migrate deploy
   ```

5. **Nginx reverse proxy ayarlarını yapın**
   - `nginx-proxy-config/yonetim.conf` dosyasını reverse proxy'nize ekleyin

### Environment Değişkenleri

Önemli environment değişkenleri:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# AWS SES (Email)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_FROM_EMAIL=

# Frontend
VITE_API_BASE_URL=/api
```

## 👑 Rol Yapısı

Sistem hiyerarşik bir rol yapısı kullanır:

```
ADMIN (Süper Kullanıcı)
├── MODERATOR (Operasyon Yöneticisi)
├── GENEL_BASKAN (Genel Başkan)
│   └── GENEL_BASKAN_YRD (Genel Başkan Yardımcısı)
│       └── GENEL_SEKRETER (Genel Sekreter)
│           └── IL_BASKANI (İl Başkanı)
│               └── ILCE_TEMSILCISI (İlçe Temsilcisi)
│                   └── ISYERI_TEMSILCISI (İş Yeri Temsilcisi)
├── ANLASMALI_KURUM_YETKILISI
└── UYE (Üye)
```

### Rol Yetkileri Özeti

| Rol | Kapsam | Ana Yetkiler |
|-----|--------|--------------|
| **ADMIN** | Sistem geneli | Tüm modüllerde sınırsız erişim |
| **MODERATOR** | Sistem geneli | Kullanıcı ve üye yönetimi, içerik yönetimi |
| **GENEL_BASKAN** | Ülke geneli | Üye onayları, il başkanı atama, raporlar |
| **GENEL_BASKAN_YRD** | Alan bazlı | Üye görüntüleme, raporlar, içerik |
| **GENEL_SEKRETER** | Evrak işleri | Doküman üretimi, içerik taslakları |
| **IL_BASKANI** | İl bazlı | İl bazlı üye yönetimi, temsilci atama |
| **ILCE_TEMSILCISI** | İlçe bazlı | İlçe üye listesi, başvuru oluşturma |
| **ISYERI_TEMSILCISI** | İş yeri bazlı | İş yeri üyeleri, başvuru formu |
| **UYE** | Kişisel | Profil görüntüleme, aidat geçmişi |

Detaylı yetki matrisi için [RBAC Dokümantasyonu](README.md#-rol-bazlı-yetki-matrisi) bölümüne bakın.

## 📦 Modüller

### 1. Kullanıcı Yönetimi
- Kullanıcı CRUD operasyonları
- Rol atama ve yönetimi
- Kullanıcı pasifleştirme/aktifleştirme

### 2. Üye Yönetimi
- Üye kayıt başvurusu
- Başvuru onay/red süreçleri
- Üye bilgi güncelleme
- İstifa/ihraç/pasifleştirme işlemleri

### 3. Mali İşler
- Aidat planı tanımlama
- Ödeme kayıt yönetimi
- Borç/gecikme raporları
- Excel/PDF raporlama

### 4. Bölgesel Yönetim
- İl, ilçe ve şube yönetimi
- Temsilci atama
- Bölgesel raporlar

### 5. İçerik Yönetimi
- Haber/duyuru/etkinlik yönetimi
- Yayın durumu kontrolü
- Taslak sistemi

### 6. Doküman Yönetimi
- PDF şablonları
- Otomatik doküman üretimi
- Evrak geçmişi

### 7. Bildirim Sistemi
- Toplu bildirim (Email/SMS/WhatsApp)
- Bölgesel bildirim
- Hedefli mesajlaşma

### 8. Raporlama
- Genel istatistikler
- Bölgesel raporlar
- Grafiksel analizler
- Excel/PDF export

## 📚 API Dokümantasyonu

Backend çalışırken Swagger dokümantasyonuna erişebilirsiniz:

- **Swagger UI**: `http://localhost:3000/api`
- **JSON**: `http://localhost:3000/api-json`

API endpoint'leri JWT authentication gerektirir. Login endpoint'i ile token alabilirsiniz.

## 🔒 Güvenlik

- JWT tabanlı authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- SQL injection koruması (Prisma ORM)
- CORS yapılandırması
- Rate limiting (gelecek versiyon)
- Audit logging

## 🧪 Test

```bash
# Backend unit testleri
cd backend
npm run test

# Backend e2e testleri
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje özel bir projedir. Tüm hakları saklıdır.

## 📞 İletişim

Sorularınız için issue açabilir veya proje yöneticisi ile iletişime geçebilirsiniz.

---

**Versiyon**: 1.0.0  
**Son Güncelleme**: Ocak 2026  
**Geliştirici**: MEP
