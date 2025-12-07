# Backend API Detaylı Raporu

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Teknik Altyapı](#teknik-altyapı)
3. [API Base URL ve Port](#api-base-url-ve-port)
4. [Kimlik Doğrulama (Authentication)](#kimlik-doğrulama-authentication)
5. [Yetkilendirme (Authorization)](#yetkilendirme-authorization)
6. [API Endpoint'leri](#api-endpointleri)
7. [Veritabanı Yapısı](#veritabanı-yapısı)
8. [Rol ve İzin Sistemi](#rol-ve-izin-sistemi)
9. [Hata Yönetimi](#hata-yönetimi)
10. [CORS Ayarları](#cors-ayarları)

---

## Genel Bakış

Bu backend API, bir yönetim paneli için geliştirilmiş NestJS tabanlı bir RESTful API'dir. Sistem, üye yönetimi, aidat takibi, bölgesel yapı yönetimi ve kullanıcı yetkilendirmesi gibi özellikler sunmaktadır.

### Ana Özellikler
- JWT tabanlı kimlik doğrulama
- Rol ve izin bazlı yetkilendirme sistemi
- Hiyerarşik bölge yapısı (İl → İlçe → İşyeri → Bayi)
- Üye başvuru ve onay süreçleri
- Aidat planı ve ödeme yönetimi
- Scope bazlı veri filtreleme

---

## Teknik Altyapı

### Kullanılan Teknolojiler
- **Framework**: NestJS 11.0.1
- **Veritabanı**: PostgreSQL (Prisma ORM)
- **Kimlik Doğrulama**: JWT (Passport)
- **Şifreleme**: bcrypt
- **Dil**: TypeScript
- **Validasyon**: class-validator

### Proje Yapısı
```
backend/
├── src/
│   ├── auth/              # Kimlik doğrulama ve yetkilendirme
│   ├── users/             # Kullanıcı yönetimi
│   ├── members/           # Üye yönetimi
│   ├── regions/           # Bölge yönetimi (İl, İlçe, İşyeri, Bayi)
│   ├── dues/              # Aidat yönetimi
│   ├── prisma/            # Prisma servisi
│   └── main.ts            # Uygulama giriş noktası
├── prisma/
│   ├── schema.prisma      # Veritabanı şeması
│   └── migrations/        # Veritabanı migrasyonları
└── package.json
```

---

## API Base URL ve Port

### Sunucu Bilgileri
- **Base URL**: `http://localhost:3000`
- **Port**: `3000` (varsayılan, `process.env.PORT` ile değiştirilebilir)
- **CORS Origin**: `http://localhost:5173` (React dev server)

### Test Endpoint
- **URL**: `GET http://localhost:3000/`
- **Açıklama**: Sunucunun çalışıp çalışmadığını kontrol eder
- **Yanıt**: `"Hello World!"`
- **Kimlik Doğrulama**: Gerekli değil

---

## Kimlik Doğrulama (Authentication)

### JWT Token Sistemi
API, JWT (JSON Web Token) tabanlı kimlik doğrulama kullanmaktadır. Tüm endpoint'ler (Public olarak işaretlenenler hariç) JWT token gerektirir.

### Token Formatı
Token, HTTP isteklerinde `Authorization` header'ında gönderilmelidir:
```
Authorization: Bearer <token>
```

### Token İçeriği
JWT token içinde şu bilgiler bulunur:
- `sub`: Kullanıcı ID
- `email`: Kullanıcı e-posta adresi
- `roles`: Kullanıcı rolleri (array)
- `permissions`: Kullanıcının sahip olduğu izinler (array)

---

## Yetkilendirme (Authorization)

### Guard Sistemi
Uygulama iki seviyeli guard sistemi kullanır:

1. **JwtAuthGuard**: Tüm isteklerde JWT token kontrolü yapar
2. **PermissionsGuard**: Endpoint bazlı izin kontrolü yapar

### Public Endpoint'ler
`@Public()` decorator'ü ile işaretlenen endpoint'ler kimlik doğrulama gerektirmez.

### İzin Kontrolü
Her endpoint, `@Permissions()` decorator'ü ile gerekli izinleri belirtir. Kullanıcının en az bir izne sahip olması gerekir.

---

## API Endpoint'leri

### 1. Authentication Endpoints

#### 1.1. Kullanıcı Girişi
- **URL**: `POST http://localhost:3000/auth/login`
- **Açıklama**: Kullanıcı girişi yapar ve JWT token döner
- **Kimlik Doğrulama**: Gerekli değil (Public)
- **İstek Gövdesi (Request Body)**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Başarılı Yanıt (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "roles": ["ADMIN"],
    "permissions": ["USER_LIST", "USER_VIEW", ...]
  }
}
```
- **Hata Yanıtları**:
  - `401 Unauthorized`: Geçersiz e-posta veya şifre
- **Kullanım Senaryosu**: Kullanıcı giriş yapmak için e-posta ve şifresini gönderir, sistem token ve kullanıcı bilgilerini döner.

---

### 2. Users Endpoints

#### 2.1. Mevcut Kullanıcı Bilgilerini Getir
- **URL**: `GET http://localhost:3000/users/me`
- **Açıklama**: Giriş yapmış kullanıcının kendi bilgilerini getirir
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: Gerekli değil (tüm giriş yapmış kullanıcılar)
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx123...",
  "email": "user@example.com",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "roles": ["ADMIN"]
}
```
- **Hata Yanıtları**:
  - `404 Not Found`: Kullanıcı bulunamadı
- **Kullanım Senaryosu**: Kullanıcı profil sayfasında kendi bilgilerini görüntülemek için kullanılır.

#### 2.2. Tüm Kullanıcıları Listele
- **URL**: `GET http://localhost:3000/users`
- **Açıklama**: Sistemdeki tüm aktif kullanıcıları listeler (soft delete edilenler hariç)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `USER_LIST`
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx123...",
    "email": "user1@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "roles": ["ADMIN"],
    "isActive": true
  },
  {
    "id": "clx456...",
    "email": "user2@example.com",
    "firstName": "Mehmet",
    "lastName": "Demir",
    "roles": ["MODERATOR"],
    "isActive": true
  }
]
```
- **Kullanım Senaryosu**: Admin veya moderator kullanıcıları yönetmek için kullanıcı listesini görüntüler.

#### 2.3. Kullanıcı Detayını Getir
- **URL**: `GET http://localhost:3000/users/:id`
- **Açıklama**: Belirli bir kullanıcının detaylı bilgilerini getirir
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `USER_VIEW`
- **URL Parametreleri**:
  - `id` (string): Kullanıcı ID'si
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx123...",
  "email": "user@example.com",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "roles": ["ADMIN"],
  "isActive": true
}
```
- **Hata Yanıtları**:
  - `404 Not Found`: Kullanıcı bulunamadı
- **Kullanım Senaryosu**: Kullanıcı detay sayfasında belirli bir kullanıcının bilgilerini görüntülemek için kullanılır.

---

### 3. Members Endpoints

#### 3.1. Üye Başvurusu Oluştur
- **URL**: `POST http://localhost:3000/members/applications`
- **Açıklama**: Yeni bir üye başvurusu oluşturur (durum: PENDING)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_CREATE_APPLICATION`
- **İstek Gövdesi (Request Body)**:
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "nationalId": "12345678901",
  "phone": "05551234567",
  "email": "ahmet@example.com",
  "source": "DIRECT"
}
```
- **Alan Açıklamaları**:
  - `firstName` (string, zorunlu): Üyenin adı
  - `lastName` (string, zorunlu): Üyenin soyadı
  - `nationalId` (string, opsiyonel): TC Kimlik No
  - `phone` (string, opsiyonel): Telefon numarası
  - `email` (string, opsiyonel): E-posta adresi
  - `source` (enum, opsiyonel): Başvuru kaynağı (DIRECT, WORKPLACE, DEALER, OTHER)
- **Başarılı Yanıt (201 Created)**:
```json
{
  "id": "clx789...",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "status": "PENDING",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```
- **Kullanım Senaryosu**: Yeni bir üye başvurusu yapıldığında, başvuru PENDING durumunda oluşturulur ve onay bekler.

#### 3.2. Üye Başvurularını Listele
- **URL**: `GET http://localhost:3000/members/applications`
- **Açıklama**: Onay bekleyen üye başvurularını listeler (scope bazlı filtreleme uygulanır)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_LIST` veya `MEMBER_APPROVE`
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx789...",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "status": "PENDING",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```
- **Kullanım Senaryosu**: İl başkanı veya yetkili kişiler, kendi bölgelerindeki bekleyen başvuruları görüntüler ve onaylayabilir.

#### 3.3. Aktif Üyeleri Listele
- **URL**: `GET http://localhost:3000/members`
- **Açıklama**: Aktif üyeleri listeler (scope bazlı filtreleme uygulanır)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_LIST`
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx789...",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "status": "ACTIVE",
    "province": { "id": "...", "name": "İstanbul" },
    "district": { "id": "...", "name": "Kadıköy" }
  }
]
```
- **Kullanım Senaryosu**: Kullanıcılar, yetkili oldukları bölgelerdeki aktif üyeleri görüntüler.

#### 3.4. Üye Detayını Getir
- **URL**: `GET http://localhost:3000/members/:id`
- **Açıklama**: Belirli bir üyenin detaylı bilgilerini getirir
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_VIEW`
- **URL Parametreleri**:
  - `id` (string): Üye ID'si
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx789...",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "nationalId": "12345678901",
  "phone": "05551234567",
  "email": "ahmet@example.com",
  "status": "ACTIVE",
  "province": { "id": "...", "name": "İstanbul" },
  "district": { "id": "...", "name": "Kadıköy" },
  "duesPlan": { "id": "...", "name": "Aylık Aidat", "amount": "100.00" }
}
```
- **Kullanım Senaryosu**: Üye detay sayfasında üyenin tüm bilgileri, aidat durumu ve bölge bilgileri görüntülenir.

#### 3.5. Üye Başvurusunu Onayla
- **URL**: `POST http://localhost:3000/members/:id/approve`
- **Açıklama**: PENDING durumundaki üye başvurusunu onaylar (durum: ACTIVE)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_APPROVE`
- **URL Parametreleri**:
  - `id` (string): Üye ID'si
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx789...",
  "status": "ACTIVE",
  "approvedAt": "2025-01-15T11:00:00.000Z",
  "approvedByUserId": "clx123..."
}
```
- **Kullanım Senaryosu**: Yetkili kişi, başvuruyu inceledikten sonra onaylar ve üye aktif hale gelir.

#### 3.6. Üye Başvurusunu Reddet
- **URL**: `POST http://localhost:3000/members/:id/reject`
- **Açıklama**: PENDING durumundaki üye başvurusunu reddeder (durum: REJECTED)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_REJECT`
- **URL Parametreleri**:
  - `id` (string): Üye ID'si
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx789...",
  "status": "REJECTED"
}
```
- **Kullanım Senaryosu**: Başvuru uygun görülmediğinde reddedilir.

#### 3.7. Üyeyi Soft Delete Et
- **URL**: `DELETE http://localhost:3000/members/:id`
- **Açıklama**: Üyeyi soft delete eder (deletedAt alanı doldurulur)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `MEMBER_STATUS_CHANGE`
- **URL Parametreleri**:
  - `id` (string): Üye ID'si
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx789...",
  "deletedAt": "2025-01-15T12:00:00.000Z"
}
```
- **Kullanım Senaryosu**: Üye istifa ettiğinde veya ihraç edildiğinde soft delete yapılır.

---

### 4. Regions Endpoints

Bölge yönetimi için hiyerarşik yapı: İl → İlçe → İşyeri → Bayi

#### 4.1. İl (Province) Endpoints

##### 4.1.1. İlleri Listele
- **URL**: `GET http://localhost:3000/regions/provinces`
- **Açıklama**: Tüm illeri listeler
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `REGION_LIST`
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx111...",
    "name": "İstanbul",
    "code": "34"
  },
  {
    "id": "clx222...",
    "name": "Ankara",
    "code": "06"
  }
]
```
- **Kullanım Senaryosu**: Dropdown listelerde veya bölge seçimlerinde kullanılır.

##### 4.1.2. İl Oluştur
- **URL**: `POST http://localhost:3000/regions/provinces`
- **Açıklama**: Yeni bir il oluşturur
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `BRANCH_MANAGE`
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "İzmir",
  "code": "35"
}
```
- **Başarılı Yanıt (201 Created)**:
```json
{
  "id": "clx333...",
  "name": "İzmir",
  "code": "35"
}
```
- **Kullanım Senaryosu**: Yeni bir il eklendiğinde kullanılır.

##### 4.1.3. İl Güncelle
- **URL**: `PUT http://localhost:3000/regions/provinces/:id`
- **Açıklama**: Mevcut bir ili günceller
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `BRANCH_MANAGE`
- **URL Parametreleri**:
  - `id` (string): İl ID'si
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "İzmir (Güncellenmiş)",
  "code": "35"
}
```
- **Başarılı Yanıt (200 OK)**: Güncellenmiş il bilgileri
- **Kullanım Senaryosu**: İl bilgileri düzeltildiğinde kullanılır.

#### 4.2. İlçe (District) Endpoints

##### 4.2.1. İlçeleri Listele
- **URL**: `GET http://localhost:3000/regions/districts?provinceId=clx111...`
- **Açıklama**: Tüm ilçeleri veya belirli bir ile ait ilçeleri listeler
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `REGION_LIST`
- **Query Parametreleri**:
  - `provinceId` (string, opsiyonel): İl ID'si (filtreleme için)
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx444...",
    "name": "Kadıköy",
    "provinceId": "clx111...",
    "province": { "id": "clx111...", "name": "İstanbul" }
  }
]
```
- **Kullanım Senaryosu**: İl seçildikten sonra ilçe listesini göstermek için kullanılır.

##### 4.2.2. İlçe Oluştur
- **URL**: `POST http://localhost:3000/regions/districts`
- **Açıklama**: Yeni bir ilçe oluşturur
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `BRANCH_MANAGE`
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "Kadıköy",
  "provinceId": "clx111..."
}
```
- **Başarılı Yanıt (201 Created)**: Oluşturulan ilçe bilgileri
- **Kullanım Senaryosu**: Yeni bir ilçe eklendiğinde kullanılır.

##### 4.2.3. İlçe Güncelle
- **URL**: `PUT http://localhost:3000/regions/districts/:id`
- **Açıklama**: Mevcut bir ilçeyi günceller
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `BRANCH_MANAGE`
- **URL Parametreleri**:
  - `id` (string): İlçe ID'si
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "Kadıköy (Güncellenmiş)",
  "provinceId": "clx111..."
}
```
- **Başarılı Yanıt (200 OK)**: Güncellenmiş ilçe bilgileri

#### 4.3. İşyeri (Workplace) Endpoints

##### 4.3.1. İşyerlerini Listele
- **URL**: `GET http://localhost:3000/regions/workplaces?provinceId=clx111...&districtId=clx444...`
- **Açıklama**: Tüm işyerlerini veya filtrelenmiş işyerlerini listeler
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `WORKPLACE_LIST`
- **Query Parametreleri**:
  - `provinceId` (string, opsiyonel): İl ID'si
  - `districtId` (string, opsiyonel): İlçe ID'si
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx555...",
    "name": "ABC Şirketi",
    "address": "Kadıköy, İstanbul",
    "province": { "id": "clx111...", "name": "İstanbul" },
    "district": { "id": "clx444...", "name": "Kadıköy" }
  }
]
```
- **Kullanım Senaryosu**: İşyeri listesi görüntülenir, filtreleme ile belirli bölgelerdeki işyerleri gösterilir.

##### 4.3.2. İşyeri Oluştur
- **URL**: `POST http://localhost:3000/regions/workplaces`
- **Açıklama**: Yeni bir işyeri oluşturur
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `WORKPLACE_MANAGE`
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "ABC Şirketi",
  "address": "Kadıköy, İstanbul",
  "provinceId": "clx111...",
  "districtId": "clx444..."
}
```
- **Başarılı Yanıt (201 Created)**: Oluşturulan işyeri bilgileri

##### 4.3.3. İşyeri Güncelle
- **URL**: `PUT http://localhost:3000/regions/workplaces/:id`
- **Açıklama**: Mevcut bir işyerini günceller
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `WORKPLACE_MANAGE`
- **URL Parametreleri**:
  - `id` (string): İşyeri ID'si
- **İstek Gövdesi (Request Body)**: İşyeri bilgileri
- **Başarılı Yanıt (200 OK)**: Güncellenmiş işyeri bilgileri

#### 4.4. Bayi (Dealer) Endpoints

##### 4.4.1. Bayileri Listele
- **URL**: `GET http://localhost:3000/regions/dealers?provinceId=clx111...&districtId=clx444...`
- **Açıklama**: Tüm bayileri veya filtrelenmiş bayileri listeler
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DEALER_LIST`
- **Query Parametreleri**:
  - `provinceId` (string, opsiyonel): İl ID'si
  - `districtId` (string, opsiyonel): İlçe ID'si
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx666...",
    "name": "XYZ Bayi",
    "code": "BAYI001",
    "address": "Kadıköy, İstanbul",
    "province": { "id": "clx111...", "name": "İstanbul" },
    "district": { "id": "clx444...", "name": "Kadıköy" }
  }
]
```
- **Kullanım Senaryosu**: Bayi listesi görüntülenir.

##### 4.4.2. Bayi Oluştur
- **URL**: `POST http://localhost:3000/regions/dealers`
- **Açıklama**: Yeni bir bayi oluşturur
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DEALER_CREATE`
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "XYZ Bayi",
  "code": "BAYI001",
  "address": "Kadıköy, İstanbul",
  "provinceId": "clx111...",
  "districtId": "clx444..."
}
```
- **Başarılı Yanıt (201 Created)**: Oluşturulan bayi bilgileri

##### 4.4.3. Bayi Güncelle
- **URL**: `PUT http://localhost:3000/regions/dealers/:id`
- **Açıklama**: Mevcut bir bayiyi günceller
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DEALER_UPDATE`
- **URL Parametreleri**:
  - `id` (string): Bayi ID'si
- **İstek Gövdesi (Request Body)**: Bayi bilgileri
- **Başarılı Yanıt (200 OK)**: Güncellenmiş bayi bilgileri

#### 4.5. Kullanıcı Scope (Yetki Alanı) Endpoints

##### 4.5.1. Kullanıcıya Scope Ata
- **URL**: `POST http://localhost:3000/regions/user-scope`
- **Açıklama**: Kullanıcıya il, ilçe, işyeri veya bayi yetkisi atar
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `BRANCH_MANAGE`
- **İstek Gövdesi (Request Body)**:
```json
{
  "userId": "clx123...",
  "provinceId": "clx111...",
  "districtId": "clx444...",
  "workplaceId": "clx555...",
  "dealerId": "clx666..."
}
```
- **Açıklama**: En az bir scope alanı (provinceId, districtId, workplaceId, dealerId) doldurulmalıdır.
- **Başarılı Yanıt (201 Created)**:
```json
{
  "id": "clx777...",
  "userId": "clx123...",
  "provinceId": "clx111...",
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```
- **Kullanım Senaryosu**: Bir kullanıcıya belirli bir bölge, ilçe, işyeri veya bayi üzerinde yetki verilir. Bu sayede kullanıcı sadece yetkili olduğu alanlardaki verileri görebilir.

##### 4.5.2. Kullanıcı Scope'unu Getir
- **URL**: `GET http://localhost:3000/regions/user-scope/:userId`
- **Açıklama**: Belirli bir kullanıcının scope'larını (yetki alanlarını) getirir
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `BRANCH_MANAGE`
- **URL Parametreleri**:
  - `userId` (string): Kullanıcı ID'si
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx777...",
    "province": { "id": "clx111...", "name": "İstanbul" },
    "district": { "id": "clx444...", "name": "Kadıköy" },
    "workplace": null,
    "dealer": null
  }
]
```
- **Kullanım Senaryosu**: Kullanıcının hangi bölgelerde yetkisi olduğunu görüntülemek için kullanılır.

---

### 5. Dues (Aidat) Endpoints

#### 5.1. Aidat Planı Endpoints

##### 5.1.1. Aidat Planlarını Listele
- **URL**: `GET http://localhost:3000/dues/plans?includeInactive=false`
- **Açıklama**: Tüm aidat planlarını listeler
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_REPORT_VIEW` veya `DUES_PLAN_MANAGE`
- **Query Parametreleri**:
  - `includeInactive` (boolean, opsiyonel, default: false): Pasif planları da dahil et
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clx888...",
    "name": "Aylık Aidat",
    "description": "Her ay ödenen aidat",
    "amount": "100.00",
    "period": "MONTHLY",
    "isActive": true
  },
  {
    "id": "clx999...",
    "name": "Yıllık Aidat",
    "description": "Yıllık ödeme",
    "amount": "1000.00",
    "period": "YEARLY",
    "isActive": true
  }
]
```
- **Kullanım Senaryosu**: Aidat planları listelenir, üyelere atanabilir veya ödeme yapılırken kullanılır.

##### 5.1.2. Aidat Planı Oluştur
- **URL**: `POST http://localhost:3000/dues/plans`
- **Açıklama**: Yeni bir aidat planı oluşturur
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_PLAN_MANAGE`
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "Aylık Aidat",
  "description": "Her ay ödenen aidat",
  "amount": 100.00,
  "period": "MONTHLY"
}
```
- **Alan Açıklamaları**:
  - `name` (string, zorunlu): Plan adı
  - `description` (string, opsiyonel): Plan açıklaması
  - `amount` (number, zorunlu): Aidat tutarı (TL)
  - `period` (enum, zorunlu): Ödeme periyodu (MONTHLY veya YEARLY)
- **Başarılı Yanıt (201 Created)**: Oluşturulan plan bilgileri
- **Kullanım Senaryosu**: Yeni bir aidat planı tanımlandığında kullanılır.

##### 5.1.3. Aidat Planı Güncelle
- **URL**: `PUT http://localhost:3000/dues/plans/:id`
- **Açıklama**: Mevcut bir aidat planını günceller
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_PLAN_MANAGE`
- **URL Parametreleri**:
  - `id` (string): Plan ID'si
- **İstek Gövdesi (Request Body)**:
```json
{
  "name": "Aylık Aidat (Güncellenmiş)",
  "description": "Güncellenmiş açıklama",
  "amount": 150.00,
  "period": "MONTHLY",
  "isActive": true
}
```
- **Başarılı Yanıt (200 OK)**: Güncellenmiş plan bilgileri
- **Kullanım Senaryosu**: Aidat tutarı veya plan bilgileri değiştirildiğinde kullanılır.

##### 5.1.4. Aidat Planını Sil (Soft Delete)
- **URL**: `DELETE http://localhost:3000/dues/plans/:id`
- **Açıklama**: Bir aidat planını soft delete eder (deletedAt alanı doldurulur)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_PLAN_MANAGE`
- **URL Parametreleri**:
  - `id` (string): Plan ID'si
- **Başarılı Yanıt (200 OK)**:
```json
{
  "id": "clx888...",
  "deletedAt": "2025-01-15T12:00:00.000Z"
}
```
- **Kullanım Senaryosu**: Artık kullanılmayan planlar silinir (soft delete).

#### 5.2. Aidat Ödeme Endpoints

##### 5.2.1. Aidat Ödemesi Ekle
- **URL**: `POST http://localhost:3000/dues/payments`
- **Açıklama**: Bir üye için aidat ödemesi kaydeder
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_PAYMENT_ADD`
- **İstek Gövdesi (Request Body)**:
```json
{
  "memberId": "clx789...",
  "planId": "clx888...",
  "amount": 100.00,
  "periodYear": 2025,
  "periodMonth": 1,
  "note": "Ocak ayı ödemesi"
}
```
- **Alan Açıklamaları**:
  - `memberId` (string, zorunlu): Üye ID'si
  - `planId` (string, opsiyonel): Aidat planı ID'si
  - `amount` (number, zorunlu): Ödenen tutar
  - `periodYear` (number, opsiyonel): Hangi yıl için ödeme (örn: 2025)
  - `periodMonth` (number, opsiyonel): Hangi ay için ödeme (1-12)
  - `note` (string, opsiyonel): Ödeme notu
- **Başarılı Yanıt (201 Created)**:
```json
{
  "id": "clxaaa...",
  "memberId": "clx789...",
  "planId": "clx888...",
  "amount": "100.00",
  "paidAt": "2025-01-15T10:00:00.000Z",
  "periodYear": 2025,
  "periodMonth": 1,
  "note": "Ocak ayı ödemesi",
  "createdByUserId": "clx123..."
}
```
- **Kullanım Senaryosu**: Üye aidat ödemesi yaptığında kayıt oluşturulur.

##### 5.2.2. Üye Ödemelerini Getir
- **URL**: `GET http://localhost:3000/dues/members/:memberId/payments`
- **Açıklama**: Belirli bir üyenin tüm ödemelerini getirir (scope bazlı filtreleme uygulanır)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_REPORT_VIEW`
- **URL Parametreleri**:
  - `memberId` (string): Üye ID'si
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "id": "clxaaa...",
    "amount": "100.00",
    "paidAt": "2025-01-15T10:00:00.000Z",
    "periodYear": 2025,
    "periodMonth": 1,
    "plan": { "id": "clx888...", "name": "Aylık Aidat" }
  }
]
```
- **Kullanım Senaryosu**: Üye ödeme geçmişi görüntülenir.

##### 5.2.3. Ödeme Özeti (Summary)
- **URL**: `GET http://localhost:3000/dues/reports/summary`
- **Açıklama**: Kullanıcının yetkili olduğu bölgelerdeki ödeme özetini getirir
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_REPORT_VIEW`
- **Başarılı Yanıt (200 OK)**:
```json
{
  "totalPayments": 50000.00,
  "totalMembers": 150,
  "paidMembers": 120,
  "unpaidMembers": 30,
  "byMonth": [
    {
      "month": 1,
      "year": 2025,
      "total": 12000.00,
      "count": 120
    }
  ]
}
```
- **Kullanım Senaryosu**: Dashboard'da ödeme istatistikleri gösterilir.

##### 5.2.4. Borçlu Üyeleri Listele
- **URL**: `GET http://localhost:3000/dues/reports/debts?since=2024-10-15`
- **Açıklama**: Belirli bir tarihten beri ödeme yapmayan üyeleri listeler (scope bazlı filtreleme uygulanır)
- **Kimlik Doğrulama**: Gerekli (JWT Token)
- **İzin**: `DUES_DEBT_LIST_VIEW`
- **Query Parametreleri**:
  - `since` (string, opsiyonel): Başlangıç tarihi (ISO format, default: 3 ay öncesi)
- **Başarılı Yanıt (200 OK)**:
```json
[
  {
    "memberId": "clx789...",
    "member": {
      "id": "clx789...",
      "firstName": "Ahmet",
      "lastName": "Yılmaz"
    },
    "lastPaymentDate": "2024-10-15T10:00:00.000Z",
    "monthsOverdue": 3,
    "totalDebt": 300.00
  }
]
```
- **Kullanım Senaryosu**: Borçlu üyeler listelenir, takip edilir.

---

## Veritabanı Yapısı

### Ana Modeller

#### User (Kullanıcı)
- `id`: Benzersiz kullanıcı ID'si
- `email`: E-posta adresi (unique)
- `passwordHash`: Şifre hash'i (bcrypt)
- `firstName`: Ad
- `lastName`: Soyad
- `roles`: Roller (array: ADMIN, MODERATOR, vb.)
- `isActive`: Aktif durumu
- `deletedAt`: Soft delete tarihi
- `createdAt`, `updatedAt`: Zaman damgaları

#### Member (Üye)
- `id`: Benzersiz üye ID'si
- `firstName`, `lastName`: Ad ve soyad
- `nationalId`: TC Kimlik No (unique, opsiyonel)
- `phone`, `email`: İletişim bilgileri
- `status`: Durum (PENDING, ACTIVE, PASIF, ISTIFA, IHRAC, REJECTED)
- `source`: Kaynak (DIRECT, WORKPLACE, DEALER, OTHER)
- `provinceId`, `districtId`, `workplaceId`, `dealerId`: Bölge ilişkileri
- `duesPlanId`: Atanan aidat planı
- `createdByUserId`, `approvedByUserId`: Oluşturan ve onaylayan kullanıcılar
- `isActive`, `deletedAt`: Soft delete

#### Province (İl)
- `id`: Benzersiz il ID'si
- `name`: İl adı
- `code`: İl plaka kodu (unique, opsiyonel)

#### District (İlçe)
- `id`: Benzersiz ilçe ID'si
- `name`: İlçe adı
- `provinceId`: Bağlı olduğu il

#### Workplace (İşyeri)
- `id`: Benzersiz işyeri ID'si
- `name`: İşyeri adı
- `address`: Adres
- `provinceId`, `districtId`: Bölge ilişkileri

#### Dealer (Bayi)
- `id`: Benzersiz bayi ID'si
- `name`: Bayi adı
- `code`: Bayi kodu (opsiyonel)
- `address`: Adres
- `provinceId`, `districtId`: Bölge ilişkileri

#### UserScope (Kullanıcı Yetki Alanı)
- `id`: Benzersiz scope ID'si
- `userId`: Kullanıcı ID'si
- `provinceId`, `districtId`, `workplaceId`, `dealerId`: Yetki alanları

#### DuesPlan (Aidat Planı)
- `id`: Benzersiz plan ID'si
- `name`: Plan adı
- `description`: Açıklama
- `amount`: Tutar (Decimal)
- `period`: Periyot (MONTHLY, YEARLY)
- `isActive`: Aktif durumu
- `deletedAt`: Soft delete

#### DuesPayment (Aidat Ödemesi)
- `id`: Benzersiz ödeme ID'si
- `memberId`: Üye ID'si
- `planId`: Plan ID'si (opsiyonel)
- `amount`: Ödenen tutar
- `paidAt`: Ödeme tarihi
- `periodYear`, `periodMonth`: Hangi dönem için ödeme
- `note`: Not
- `createdByUserId`: Oluşturan kullanıcı
- `isActive`, `deletedAt`: Soft delete

---

## Rol ve İzin Sistemi

### Roller (Roles)

1. **ADMIN**: Tüm yetkilere sahip
2. **MODERATOR**: Geniş yönetim yetkileri
3. **GENEL_BASKAN**: Genel başkan yetkileri
4. **GENEL_BASKAN_YRD**: Genel başkan yardımcısı
5. **GENEL_SEKRETER**: Genel sekreter
6. **IL_BASKANI**: İl başkanı (kendi ili için)
7. **ILCE_TEMSILCISI**: İlçe temsilcisi (kendi ilçesi için)
8. **ISYERI_TEMSILCISI**: İşyeri temsilcisi (kendi işyeri için)
9. **BAYI_YETKILISI**: Bayi yetkilisi (kendi bayisi için)
10. **UYE**: Üye (sınırlı yetkiler)

### İzinler (Permissions)

#### Kullanıcı Yönetimi
- `USER_LIST`: Kullanıcıları listeleme
- `USER_VIEW`: Kullanıcı detayını görüntüleme
- `USER_CREATE`: Kullanıcı oluşturma
- `USER_UPDATE`: Kullanıcı güncelleme
- `USER_SOFT_DELETE`: Kullanıcı silme (soft delete)
- `USER_ASSIGN_ROLE`: Kullanıcıya rol atama

#### Üye Yönetimi
- `MEMBER_LIST`: Üyeleri listeleme
- `MEMBER_VIEW`: Üye detayını görüntüleme
- `MEMBER_CREATE_APPLICATION`: Üye başvurusu oluşturma
- `MEMBER_APPROVE`: Üye başvurusunu onaylama
- `MEMBER_REJECT`: Üye başvurusunu reddetme
- `MEMBER_UPDATE`: Üye bilgilerini güncelleme
- `MEMBER_STATUS_CHANGE`: Üye durumunu değiştirme

#### Aidat Yönetimi
- `DUES_PLAN_MANAGE`: Aidat planı yönetimi (CRUD)
- `DUES_PAYMENT_ADD`: Aidat ödemesi ekleme
- `DUES_REPORT_VIEW`: Aidat raporlarını görüntüleme
- `DUES_DEBT_LIST_VIEW`: Borçlu üyeleri görüntüleme
- `DUES_EXPORT`: Aidat verilerini dışa aktarma

#### Bölge Yönetimi
- `REGION_LIST`: Bölgeleri listeleme
- `BRANCH_MANAGE`: Şube/İl/İlçe yönetimi
- `WORKPLACE_LIST`: İşyerlerini listeleme
- `WORKPLACE_MANAGE`: İşyeri yönetimi
- `DEALER_LIST`: Bayileri listeleme
- `DEALER_CREATE`: Bayi oluşturma
- `DEALER_UPDATE`: Bayi güncelleme

### Scope Bazlı Filtreleme

Kullanıcılar, `UserScope` tablosunda tanımlı yetki alanlarına göre veri görüntüler:
- İl başkanı sadece kendi ilindeki üyeleri görür
- İlçe temsilcisi sadece kendi ilçesindeki üyeleri görür
- İşyeri temsilcisi sadece kendi işyerindeki üyeleri görür
- Bayi yetkilisi sadece kendi bayisindeki üyeleri görür

---

## Hata Yönetimi

### HTTP Durum Kodları

- **200 OK**: İstek başarılı
- **201 Created**: Kayıt başarıyla oluşturuldu
- **400 Bad Request**: Geçersiz istek (validasyon hatası)
- **401 Unauthorized**: Kimlik doğrulama başarısız
- **403 Forbidden**: Yetki yetersiz
- **404 Not Found**: Kayıt bulunamadı
- **500 Internal Server Error**: Sunucu hatası

### Hata Yanıt Formatı

```json
{
  "statusCode": 404,
  "message": "Kullanıcı bulunamadı",
  "error": "Not Found"
}
```

---

## CORS Ayarları

Backend, sadece belirli origin'den gelen isteklere izin verir:

```typescript
app.enableCors({
  origin: 'http://localhost:5173',  // React dev server
  credentials: false,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
});
```

### Production İçin Not
Production ortamında `origin` değeri environment variable'dan alınmalı ve birden fazla origin'e izin verilebilir.

---

## Örnek İstekler

### 1. Kullanıcı Girişi
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 2. Üye Listesi (Token ile)
```bash
curl -X GET http://localhost:3000/members \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Aidat Ödemesi Ekleme
```bash
curl -X POST http://localhost:3000/dues/payments \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "clx789...",
    "planId": "clx888...",
    "amount": 100.00,
    "periodYear": 2025,
    "periodMonth": 1
  }'
```

---

## Güvenlik Notları

1. **Şifre Hash'leme**: Tüm şifreler bcrypt ile hash'lenir
2. **JWT Token**: Token'lar expire olabilir (yapılandırma gerekli)
3. **Soft Delete**: Veriler fiziksel olarak silinmez, `deletedAt` alanı doldurulur
4. **Scope Filtreleme**: Kullanıcılar sadece yetkili oldukları bölgelerdeki verileri görebilir
5. **İzin Kontrolü**: Her endpoint izin kontrolünden geçer

---

## Geliştirme Notları

### Environment Variables
Aşağıdaki environment variable'lar gerekebilir:
- `DATABASE_URL`: PostgreSQL bağlantı string'i
- `JWT_SECRET`: JWT token imzalama için secret key
- `PORT`: Sunucu portu (default: 3000)

### Veritabanı Migrasyonları
```bash
# Migrasyon oluştur
npx prisma migrate dev --name migration_name

# Production'a uygula
npx prisma migrate deploy
```

### Seed (Test Verisi)
```bash
npm run prisma:seed
```

---

## Sonuç

Bu backend API, hiyerarşik bir yapı içinde üye yönetimi, aidat takibi ve bölgesel yetkilendirme sağlayan kapsamlı bir sistemdir. Tüm endpoint'ler JWT tabanlı kimlik doğrulama ve izin bazlı yetkilendirme ile korunmaktadır. Scope bazlı filtreleme sayesinde kullanıcılar sadece yetkili oldukları bölgelerdeki verileri görebilir.

---

**Rapor Tarihi**: 2025-01-15  
**Backend Versiyonu**: 0.0.1  
**NestJS Versiyonu**: 11.0.1

