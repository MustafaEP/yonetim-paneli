# Veritabanı Dokümantasyonu

Bu dokümantasyon, Yönetim Paneli projesinin veritabanı yapısını, tablolarını ve ilişkilerini açıklamaktadır.

## 📊 Genel Bakış

Veritabanı **PostgreSQL** kullanılarak oluşturulmuştur ve **Prisma ORM** ile yönetilmektedir. Sistem, bir dernek/oda yönetim sistemi için tasarlanmıştır ve şu ana bileşenleri içerir:

- **Kullanıcı Yönetimi**: Sistem kullanıcıları ve roller
- **Üye Yönetimi**: Dernek üyeleri ve başvuru süreçleri
- **Bölge Yönetimi**: İl, İlçe, İş Yeri ve Bayi yapısı
- **Aidat Yönetimi**: Aidat planları ve ödemeler

---

## 📋 Tablolar ve Modeller

### 1. User (Kullanıcılar)

**Amaç**: Sistem kullanıcılarını (yöneticiler, temsilciler, vb.) saklar.

**Alanlar**:
- `id` (String, PK): Benzersiz kullanıcı ID'si (CUID)
- `email` (String, Unique): Kullanıcı e-posta adresi (login için)
- `passwordHash` (String): Şifrelenmiş parola (bcrypt)
- `firstName` (String): Kullanıcı adı
- `lastName` (String): Kullanıcı soyadı
- `roles` (Role[]): Kullanıcının rolleri (PostgreSQL array)
- `isActive` (Boolean): Kullanıcı aktif mi? (default: true)
- `deletedAt` (DateTime?): Soft delete için silme tarihi
- `createdAt` (DateTime): Kayıt oluşturulma tarihi
- `updatedAt` (DateTime): Son güncelleme tarihi

**İlişkiler**:
- `scopes` → UserScope[]: Kullanıcının yetki alanları (scope'ları)

**Kullanım Senaryoları**:
- Sistem girişi ve kimlik doğrulama
- Rol bazlı yetkilendirme
- Kullanıcı profil yönetimi

---

### 2. Member (Üyeler)

**Amaç**: Dernek üyelerini ve başvuru süreçlerini yönetir.

**Alanlar**:
- `id` (String, PK): Benzersiz üye ID'si
- `firstName` (String): Üye adı
- `lastName` (String): Üye soyadı
- `nationalId` (String?, Unique): TC Kimlik Numarası (opsiyonel, unique)
- `phone` (String?): Telefon numarası
- `email` (String?): E-posta adresi
- `status` (MemberStatus): Üyelik durumu (default: PENDING)
- `source` (MemberSource): Üyelik kaynağı (default: DIRECT)
- `provinceId` (String?): Bağlı olduğu il ID'si
- `districtId` (String?): Bağlı olduğu ilçe ID'si
- `workplaceId` (String?): Bağlı olduğu iş yeri ID'si
- `dealerId` (String?): Bağlı olduğu bayi ID'si
- `createdByUserId` (String?): Başvuruyu oluşturan kullanıcı ID'si
- `approvedByUserId` (String?): Başvuruyu onaylayan kullanıcı ID'si
- `approvedAt` (DateTime?): Onaylanma tarihi
- `duesPlanId` (String?): Atanmış aidat planı ID'si
- `isActive` (Boolean): Aktif mi? (default: true)
- `deletedAt` (DateTime?): Soft delete tarihi
- `createdAt` (DateTime): Kayıt oluşturulma tarihi
- `updatedAt` (DateTime): Son güncelleme tarihi

**İlişkiler**:
- `province` → Province?: Üyenin bağlı olduğu il
- `district` → District?: Üyenin bağlı olduğu ilçe
- `workplace` → Workplace?: Üyenin bağlı olduğu iş yeri
- `dealer` → Dealer?: Üyenin bağlı olduğu bayi
- `duesPlan` → DuesPlan?: Üyenin aidat planı
- `duesPayments` → DuesPayment[]: Üyenin yaptığı ödemeler

**Kullanım Senaryoları**:
- Üyelik başvuruları
- Üye onay/red süreçleri
- Üye durum yönetimi (aktif, pasif, istifa, ihraç)
- Üye-bölge ilişkilendirmesi
- Aidat takibi

---

### 3. Province (İller)

**Amaç**: İl bilgilerini saklar ve hiyerarşik yapının en üst seviyesini oluşturur.

**Alanlar**:
- `id` (String, PK): Benzersiz il ID'si
- `name` (String): İl adı
- `code` (String?, Unique): İl plaka kodu (opsiyonel, unique)

**İlişkiler**:
- `districts` → District[]: İle bağlı ilçeler
- `workplaces` → Workplace[]: İlde bulunan iş yerleri
- `dealers` → Dealer[]: İlde bulunan bayiler
- `members` → Member[]: İle bağlı üyeler
- `userScopes` → UserScope[]: İl bazlı kullanıcı yetkileri

**Kullanım Senaryoları**:
- Bölgesel organizasyon yapısı
- İl bazlı raporlama
- İl başkanı yetkilendirmesi

---

### 4. District (İlçeler)

**Amaç**: İlçe bilgilerini saklar ve il-altı organizasyon yapısını oluşturur.

**Alanlar**:
- `id` (String, PK): Benzersiz ilçe ID'si
- `name` (String): İlçe adı
- `provinceId` (String, FK): Bağlı olduğu il ID'si

**İlişkiler**:
- `province` → Province: İlçenin bağlı olduğu il
- `workplaces` → Workplace[]: İlçede bulunan iş yerleri
- `dealers` → Dealer[]: İlçede bulunan bayiler
- `members` → Member[]: İlçeye bağlı üyeler
- `userScopes` → UserScope[]: İlçe bazlı kullanıcı yetkileri

**Kullanım Senaryoları**:
- İlçe bazlı organizasyon
- İlçe temsilcisi yetkilendirmesi
- İlçe bazlı raporlama

---

### 5. Workplace (İş Yerleri)

**Amaç**: İş yeri bilgilerini saklar ve iş yeri bazlı üye yönetimini sağlar.

**Alanlar**:
- `id` (String, PK): Benzersiz iş yeri ID'si
- `name` (String): İş yeri adı
- `address` (String?): İş yeri adresi
- `provinceId` (String?): Bağlı olduğu il ID'si
- `districtId` (String?): Bağlı olduğu ilçe ID'si

**İlişkiler**:
- `province` → Province?: İş yerinin bulunduğu il
- `district` → District?: İş yerinin bulunduğu ilçe
- `members` → Member[]: İş yerine bağlı üyeler
- `userScopes` → UserScope[]: İş yeri bazlı kullanıcı yetkileri

**Kullanım Senaryoları**:
- İş yeri bazlı üye gruplandırması
- İş yeri temsilcisi yetkilendirmesi
- İş yeri bazlı raporlama

---

### 6. Dealer (Bayiler)

**Amaç**: Bayi bilgilerini saklar ve bayi bazlı üye yönetimini sağlar.

**Alanlar**:
- `id` (String, PK): Benzersiz bayi ID'si
- `name` (String): Bayi adı
- `code` (String?): Bayi kodu
- `address` (String?): Bayi adresi
- `provinceId` (String?): Bağlı olduğu il ID'si
- `districtId` (String?): Bağlı olduğu ilçe ID'si

**İlişkiler**:
- `province` → Province?: Bayinin bulunduğu il
- `district` → District?: Bayinin bulunduğu ilçe
- `members` → Member[]: Bayiye bağlı üyeler
- `userScopes` → UserScope[]: Bayi bazlı kullanıcı yetkileri

**Kullanım Senaryoları**:
- Bayi bazlı üye yönetimi
- Bayi yetkilisi atama
- Bayi performans takibi

---

### 7. UserScope (Kullanıcı Yetki Alanları)

**Amaç**: Kullanıcılara bölgesel yetki alanları (scope) atar. Bu sayede kullanıcılar sadece yetkili oldukları bölgelerdeki üyeleri görebilir/yönetebilir.

**Alanlar**:
- `id` (String, PK): Benzersiz scope ID'si
- `userId` (String, FK): Kullanıcı ID'si
- `provinceId` (String?): İl bazlı yetki
- `districtId` (String?): İlçe bazlı yetki
- `workplaceId` (String?): İş yeri bazlı yetki
- `dealerId` (String?): Bayi bazlı yetki
- `createdAt` (DateTime): Oluşturulma tarihi

**İlişkiler**:
- `user` → User: Yetki alanı atanan kullanıcı
- `province` → Province?: İl bazlı yetki
- `district` → District?: İlçe bazlı yetki
- `workplace` → Workplace?: İş yeri bazlı yetki
- `dealer` → Dealer?: Bayi bazlı yetki

**Kullanım Senaryoları**:
- İl Başkanı → Sadece kendi ilindeki üyeleri görür
- İlçe Temsilcisi → Sadece kendi ilçesindeki üyeleri görür
- İş Yeri Temsilcisi → Sadece kendi iş yerindeki üyeleri görür
- Bayi Yetkilisi → Sadece kendi bayisindeki üyeleri görür

**Örnek Senaryo**:
```
Kullanıcı: Ahmet Yılmaz (İl Başkanı)
UserScope: provinceId = "istanbul-id"
→ Ahmet sadece İstanbul'daki üyeleri görebilir ve yönetebilir
```

---

### 8. DuesPlan (Aidat Planları)

**Amaç**: Aidat planlarını (aylık/yıllık) tanımlar ve üyelere atanabilir.

**Alanlar**:
- `id` (String, PK): Benzersiz plan ID'si
- `name` (String): Plan adı (örn: "Aylık Aidat 2025")
- `description` (String?): Plan açıklaması
- `amount` (Decimal): Aidat tutarı (10,2 precision)
- `period` (DuesPeriod): Dönem tipi (MONTHLY/YEARLY, default: MONTHLY)
- `isActive` (Boolean): Plan aktif mi? (default: true)
- `deletedAt` (DateTime?): Soft delete tarihi
- `createdAt` (DateTime): Oluşturulma tarihi
- `updatedAt` (DateTime): Son güncelleme tarihi

**İlişkiler**:
- `payments` → DuesPayment[]: Bu plana ait ödemeler
- `members` → Member[]: Bu plana atanmış üyeler

**Kullanım Senaryoları**:
- Aylık/yıllık aidat planları oluşturma
- Üyelere plan atama
- Plan bazlı ödeme takibi

---

### 9. DuesPayment (Aidat Ödemeleri)

**Amaç**: Üyelerin yaptığı aidat ödemelerini kaydeder.

**Alanlar**:
- `id` (String, PK): Benzersiz ödeme ID'si
- `memberId` (String, FK): Ödeme yapan üye ID'si
- `planId` (String?): İlgili aidat planı ID'si
- `amount` (Decimal): Ödenen tutar
- `paidAt` (DateTime): Ödeme tarihi (default: now())
- `periodYear` (Int?): Ödeme yılı (örn: 2025)
- `periodMonth` (Int?): Ödeme ayı (1-12)
- `note` (String?): Ödeme notu
- `createdByUserId` (String?): Ödemeyi kaydeden kullanıcı ID'si
- `isActive` (Boolean): Aktif mi? (default: true)
- `deletedAt` (DateTime?): Soft delete tarihi
- `createdAt` (DateTime): Oluşturulma tarihi
- `updatedAt` (DateTime): Son güncelleme tarihi

**İlişkiler**:
- `member` → Member: Ödeme yapan üye
- `plan` → DuesPlan?: İlgili aidat planı

**Kullanım Senaryoları**:
- Üye ödemelerini kaydetme
- Ödeme geçmişi takibi
- Borçlu üye tespiti
- Ödeme raporları

---

## 🔢 Enum'lar

### Role (Kullanıcı Rolleri)

Sistemdeki kullanıcı rolleri ve hiyerarşisi:

- `ADMIN`: Sistem yöneticisi - Tüm yetkilere sahip
- `MODERATOR`: Moderatör - Çoğu yönetim yetkisine sahip
- `GENEL_BASKAN`: Genel Başkan - Ülke çapında yetki
- `GENEL_BASKAN_YRD`: Genel Başkan Yardımcısı
- `GENEL_SEKRETER`: Genel Sekreter
- `IL_BASKANI`: İl Başkanı - İl bazlı yetki
- `ILCE_TEMSILCISI`: İlçe Temsilcisi - İlçe bazlı yetki
- `ISYERI_TEMSILCISI`: İş Yeri Temsilcisi - İş yeri bazlı yetki
- `BAYI_YETKILISI`: Bayi Yetkilisi - Bayi bazlı yetki
- `UYE`: Üye - Sadece kendi bilgilerini görür

### MemberStatus (Üyelik Durumları)

- `PENDING`: Başvuru yapıldı, onay bekliyor
- `ACTIVE`: Aktif üye
- `PASIF`: Pasif üye
- `ISTIFA`: İstifa etmiş
- `IHRAC`: İhraç edilmiş
- `REJECTED`: Başvuru reddedildi

### MemberSource (Üyelik Kaynağı)

- `DIRECT`: Panelden direkt başvuru
- `WORKPLACE`: İş yeri temsilcisi üzerinden
- `DEALER`: Bayi üzerinden
- `OTHER`: Diğer

### DuesPeriod (Aidat Dönemi)

- `MONTHLY`: Aylık
- `YEARLY`: Yıllık

---

## 🔗 İlişki Diyagramı

```
User
  ├── UserScope (1:N)
  │     ├── Province (N:1)
  │     ├── District (N:1)
  │     ├── Workplace (N:1)
  │     └── Dealer (N:1)
  │
Member
  ├── Province (N:1)
  ├── District (N:1)
  ├── Workplace (N:1)
  ├── Dealer (N:1)
  ├── DuesPlan (N:1)
  └── DuesPayment (1:N)

Province
  ├── District (1:N)
  ├── Workplace (1:N)
  ├── Dealer (1:N)
  ├── Member (1:N)
  └── UserScope (1:N)

District
  ├── Workplace (1:N)
  ├── Dealer (1:N)
  ├── Member (1:N)
  └── UserScope (1:N)

Workplace
  ├── Member (1:N)
  └── UserScope (1:N)

Dealer
  ├── Member (1:N)
  └── UserScope (1:N)

DuesPlan
  ├── Member (1:N)
  └── DuesPayment (1:N)

DuesPayment
  ├── Member (N:1)
  └── DuesPlan (N:1)
```

---

## 🎯 Önemli Tasarım Kararları

### 1. Soft Delete
Çoğu tabloda `deletedAt` alanı bulunur. Bu sayede veriler fiziksel olarak silinmez, sadece işaretlenir. Geri getirme ve audit trail için önemlidir.

### 2. Hiyerarşik Bölge Yapısı
```
Province (İl)
  └── District (İlçe)
        └── Workplace (İş Yeri)
        └── Dealer (Bayi)
```

### 3. Scope-Based Access Control
`UserScope` tablosu sayesinde kullanıcılar sadece yetkili oldukları bölgelerdeki verileri görebilir. Bu, güvenlik ve veri izolasyonu sağlar.

### 4. Flexible Member Assignment
Üyeler birden fazla bölge seviyesine bağlanabilir (il, ilçe, iş yeri, bayi). Bu esneklik, farklı organizasyon yapılarına uyum sağlar.

### 5. Decimal for Money
Aidat tutarları `Decimal(10,2)` tipinde saklanır. Bu, para birimi hesaplamalarında hassasiyet sağlar.

---

## 📊 Veri Akışı Örnekleri

### Üyelik Başvuru Süreci

1. **Başvuru Oluşturma**
   - `Member` kaydı oluşturulur (`status: PENDING`)
   - `createdByUserId` set edilir
   - İlgili bölge bilgileri (`provinceId`, `districtId`, vb.) atanır

2. **Onay Süreci**
   - Yetkili kullanıcı başvuruyu onaylar
   - `status: ACTIVE` olur
   - `approvedByUserId` ve `approvedAt` set edilir

3. **Aidat Atama**
   - Üyeye `DuesPlan` atanır (`duesPlanId`)

### Ödeme Kayıt Süreci

1. **Ödeme Kaydı**
   - `DuesPayment` kaydı oluşturulur
   - `memberId`, `amount`, `paidAt` set edilir
   - İsteğe bağlı: `periodYear`, `periodMonth`, `planId`

2. **Raporlama**
   - Üye bazlı ödeme geçmişi
   - Bölge bazlı özet raporlar
   - Borçlu üye tespiti

---

## 🔒 Güvenlik Notları

1. **Password Hashing**: Şifreler `bcrypt` ile hash'lenir, düz metin saklanmaz.
2. **Soft Delete**: Kritik veriler fiziksel olarak silinmez.
3. **Scope Isolation**: Kullanıcılar sadece yetkili oldukları verileri görebilir.
4. **Audit Trail**: `createdAt`, `updatedAt`, `createdByUserId`, `approvedByUserId` gibi alanlar audit için kullanılır.

---

## 📝 Notlar

- Tüm ID'ler `cuid()` ile oluşturulur (Collision-resistant Unique IDentifier)
- Timestamp alanları (`createdAt`, `updatedAt`) otomatik yönetilir
- Foreign key ilişkileri Prisma tarafından yönetilir
- Enum'lar PostgreSQL native enum tipi olarak saklanır

---

## 🔄 Migration ve Güncellemeler

Veritabanı değişiklikleri Prisma migrations ile yönetilir:

```bash
# Yeni migration oluştur
npx prisma migrate dev --name migration_name

# Production'a uygula
npx prisma migrate deploy
```

---

**Son Güncelleme**: 2025-01-XX
**Versiyon**: 1.0.0

