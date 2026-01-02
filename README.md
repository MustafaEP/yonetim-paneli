# Sendika Yönetim Sistemi - RBAC Dokümantasyonu

## 🚀 Kurulum / VPS Deploy

- **Docker Compose ile VPS kurulumu**: `DEPLOYMENT.md`

## 🏗️ Teknoloji Stack
- **Frontend:** React + TypeScript + Material-UI (MUI)
- **Backend:** Node.js + NestJS + TypeScript
- **Database:** Prisma ORM

---

## 👥 Roller (Hierarchical Structure)

```
ADMIN
├── MODERATOR
├── GENEL_BASKAN
│   └── GENEL_BASKAN_YRD
│       └── GENEL_SEKRETER
│           └── IL_BASKANI
│               └── ILCE_TEMSILCISI
│                   └── ISYERI_TEMSILCISI
├── ANLASMALI_KURUM_YETKILISI
└── UYE
```

---

## 🔧 Sistem Modülleri

### 1. Kullanıcı Yönetimi (User Management)
- Kullanıcı CRUD operasyonları
- Kullanıcı detay görüntüleme
- Kullanıcı pasifleştirme/aktifleştirme
- Rol atama ve yönetimi

### 2. Rol & Yetki Yönetimi (Role & Permission Management)
- Rol tanımlama ve düzenleme
- İzin seti yönetimi
- Rol silme ve güncelleme

### 3. Üye Yönetimi (Member Management)
- Üye kayıt başvurusu
- Başvuru onay/red süreçleri
- Üye bilgi güncelleme
- İstifa/ihraç/pasifleştirme işlemleri

### 4. Aidat & Mali İşler (Dues & Finance)
- Aidat planı tanımlama
- Ödeme kayıt yönetimi
- Borç/gecikme raporları
- Excel/PDF raporlama

### 5. Şube/İl/İlçe Yönetimi (Branch & Region Management)
- Bölgesel yapı yönetimi
- Şube CRUD operasyonları
- Başkan/temsilci atama

### 6. İş Yeri Yönetimi (Workplace Management)
- İş yeri kayıt ve güncelleme
- Temsilci atama
- İş yeri üye listesi

### 7. İçerik Yönetimi (Content Management)
- Haber/duyuru/etkinlik yönetimi
- Yayın durumu kontrolü
- Taslak sistemi

### 8. Evrak & Doküman (Document Management)
- Şablon oluşturma
- Evrak geçmişi
- PDF üretimi

### 9. Raporlar & Dashboard
- Genel istatistikler
- Bölgesel raporlar
- Grafiksel analizler

### 10. Bildirim & İletişim (Notifications)
- Toplu bildirim (Email/SMS/WhatsApp)
- Bölgesel bildirim
- Hedefli mesajlaşma

### 11. Sistem Ayarları & Loglar
- Genel konfigürasyon
- Entegrasyon ayarları
- Audit log görüntüleme

---

## 👑 Rol Bazlı Yetki Matrisi

### 🔴 ADMIN (Süper Kullanıcı)
**Kapsam:** Sistem geneli - Sınırsız erişim

**Yetkiler:**
- ✅ Tüm modüllerde CREATE, READ, UPDATE, DELETE, APPROVE
- ✅ Sınırsız kullanıcı ve rol yönetimi
- ✅ Yeni rol tanımlama ve izin seti düzenleme
- ✅ Sistem ayarları (SMTP, SMS, Logo, Entegrasyonlar)
- ✅ Tam audit log erişimi
- ⚠️ Silinemez ve rolü değiştirilemez

---

### 🟠 MODERATOR (Operasyon Yöneticisi)
**Kapsam:** Sistem geneli - Yönetimsel yetkiler

**Kullanıcı Yönetimi:**
- ✅ Kullanıcı listeleme, oluşturma, pasifleştirme
- ✅ Rol atama (ADMIN hariç tüm roller)
- ❌ ADMIN rolü atayamaz
- ❌ Kullanıcı silme

**Üye & Organizasyon:**
- ✅ Tüm üyeleri yönetme
- ✅ Üye onay/red işlemleri
- ✅ Aidat planı ve ödeme yönetimi
- ✅ Şube/il/ilçe yönetimi

**İçerik & İletişim:**
- ✅ Haber/duyuru CRUD
- ✅ Sistem geneli bildirim gönderme
- ✅ Tüm raporlara erişim

**Sınırlamalar:**
- 👁️ Rol izinlerini görür, değiştiremez
- 👁️ Sistem ayarlarını görür, sınırlı değiştirir

---

### 🟡 GENEL_BASKAN (Genel Başkan)
**Kapsam:** Politik üst yönetim - Onay mercii

**Yetkiler:**
- ✅ Tüm üye ve bölge verilerini görüntüleme
- ✅ Üye kayıt onay/reddi (ülke geneli)
- ✅ İhraç/istifa süreçlerini onaylama
- ✅ İl başkanı atama onayı
- ✅ Haber/duyuru yayınlama
- ✅ Tüm raporlar ve istatistikler

**Sınırlamalar:**
- 👁️ Teknik sistem ayarlarına erişim yok
- 👁️ Log görüntüleme (sadece okuma)

---

### 🟢 GENEL_BASKAN_YRD (Genel Başkan Yardımcısı)
**Kapsam:** Alan bazlı yönetim (Mali, Eğitim vb.)

**Yetkiler:**
- ✅ Tüm üye ve şube görüntüleme
- ✅ Üye onay/red (opsiyonel alan kısıtı)
- ✅ Aidat raporları görüntüleme
- ✅ Haber/duyuru oluşturma

**Sınırlamalar:**
- ⚠️ Aidat planı değiştirme (opsiyonel)
- ❌ Rol atama yetkisi sınırlı
- ❌ Sistem ayarlarına erişim yok

---

### 🔵 GENEL_SEKRETER (Genel Sekreter)
**Kapsam:** Evrak, yazışma ve kayıt işlemleri

**Yetkiler:**
- ✅ Evrak şablonu oluşturma
- ✅ Doküman üretimi (PDF)
- ✅ Haber/duyuru taslağı hazırlama
- ✅ Üye ve temsilci temel bilgilerini görme
- ✅ İstatistik raporları görüntüleme

**Sınırlamalar:**
- ⚠️ Üye onayında sadece öneri hakkı
- ❌ Mali işlem yetkisi yok

---

### 🟣 IL_BASKANI (İl Başkanı)
**Kapsam:** İl bazlı tam yetki

**Yetkiler:**
- ✅ İl bazlı üye yönetimi (onay/red/güncelleme)
- ✅ İlçe temsilcisi atama
- ✅ İş yeri temsilcisi atama
- ✅ İl bazlı aidat yönetimi ve raporlama
- ✅ İl bazlı haber/etkinlik yayınlama
- ✅ İl geneli toplu bildirim

**Sınırlamalar:**
- 🔒 Sadece kendi ili kapsamında yetki
- ❌ Sistem geneli işlemlere erişim yok

---

### 🟤 ILCE_TEMSILCISI (İlçe Temsilcisi)
**Kapsam:** İlçe bazlı operasyonel yetki

**Yetkiler:**
- ✅ İlçe bazlı üye listeleme ve görüntüleme
- ✅ Üye başvuru formu oluşturma
- ✅ Üye bilgi güncelleme talebi
- ✅ İş yeri temsilcisi atama önerisi
- ✅ İlçe istatistikleri
- ✅ İlçe geneli bildirim

**Sınırlamalar:**
- 🔒 Sadece kendi ilçesi
- ⚠️ Onay yetkisi üst kademede

---

### ⚫ ISYERI_TEMSILCISI (İş Yeri Temsilcisi)
**Kapsam:** Tek iş yeri bazlı

**Yetkiler:**
- ✅ İş yeri üyelerini listeleme
- ✅ Yeni üye başvuru formu oluşturma
- ✅ İstifa/sorun bildirimi
- ✅ İş yeri raporu görüntüleme
- ✅ İş yeri bazlı bildirim

**Sınırlamalar:**
- 🔒 Sadece kendi iş yeri
- ❌ Rol/sistem/bölge yetkisi yok

---

### ⚪ UYE (Üye)
**Kapsam:** Kişisel hesap yönetimi

**Yetkiler:**
- ✅ Kendi profil görüntüleme ve düzenleme
- ✅ Kendi aidat geçmişi
- ✅ Evrak talebi oluşturma
- ✅ İstifa talebi açma
- ✅ Şikayet/öneri bildirimi

**Sınırlamalar:**
- 🔒 Sadece kendi verileri
- ❌ Başka üyelere erişim yok

---

## 📊 Yetki Matrisi Özeti

| Modül | ADMIN | MOD | GB | GBY | GS | ILB | IT | IYT | BY | UYE |
|-------|-------|-----|----|----|----|----|----|----|----|----|
| Kullanıcı Yönetimi | ✅ | ✅¹ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rol Yönetimi | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Üye Yönetimi | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅² | ✅³ | ✅⁴ | ✅⁵ | 👁️⁵ |
| Aidat Yönetimi | ✅ | ✅ | 👁️ | 👁️ | ❌ | ✅² | 👁️³ | 👁️⁴ | ⚠️⁵ | 👁️⁵ |
| Bölge Yönetimi | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅² | ⚠️³ | ❌ | ❌ | ❌ |
| İş Yeri Yönetimi | ✅ | ✅ | ✅ | ✅ | 👁️ | ✅² | ✅³ | ✅⁴ | ❌ | ❌ |
| İçerik Yönetimi | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅² | ✅³ | ✅⁴ | ⚠️⁵ | ❌ |
| Evrak Yönetimi | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Raporlar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅² | ✅³ | ✅⁴ | ✅⁵ | ❌ |
| Bildirim | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅² | ✅³ | ✅⁴ | ✅⁵ | ❌ |
| Sistem Ayarları | ✅ | ⚠️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Loglar | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Semboller:**
- ✅ Tam yetki (CRUD + Onay)
- ⚠️ Kısıtlı yetki (Oluşturma/Görüntüleme, Onay yok)
- 👁️ Sadece görüntüleme
- ❌ Erişim yok

**Notlar:**
1. ADMIN rolü atayamaz
2. Sadece kendi ili
3. Sadece kendi ilçesi
4. Sadece kendi iş yeri
5. Sadece kendi verileri

## 📚 Referanslar

- [NestJS RBAC](https://docs.nestjs.com/security/authorization)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Authorization](https://blog.logrocket.com/authentication-react-router-v6/)
- [Material-UI](https://mui.com/material-ui/getting-started/)

---

**📌 Not:** Bu dokümantasyon dinamik bir yapıdır. Sistem gereksinimleri değiştikçe güncellenmelidir.

**Versiyon:** 1.0.0  
**Son Güncelleme:** Aralık 2024  
**Hazırlayan:** MEP