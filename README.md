# Yönetim Paneli (Full‑Stack)

Kısa açıklama
----------------

Kurumsal kullanıma yönelik, rol‑tabanlı yetkilendirme (RBAC) destekli bir yönetim paneli örneğidir. Üyelik, kullanıcı, ürün yönetimi ile aktivite loglama, PDF/Excel export ve yazdırılabilir detay sayfaları gibi özellikler içerir.

Özellikler
----------------
- Rol ve izin tabanlı erişim (RBAC)
- Üye yönetimi (listeleme, filtreleme, detay, export)
- Kullanıcı ve ürün yönetimi
- Aktivite logları
- PDF / Excel export (xlsx, jsPDF)
- Zod ile sunucu tarafı validasyon

Teknoloji
----------------

Frontend

- React 18 + TypeScript
- Material UI (MUI)
- Axios, React Router
- Context API (Auth & Config)

Backend

- Node.js + Express + TypeScript
- Prisma ORM (SQLite geliştirirken, prod için Postgres önerilir)
- JWT ile kimlik doğrulama
- Zod ile validasyon

Proje Yapısı (kısaca)
----------------

`yonetim-paneli-backend/`

`├─ prisma/`
`├─ src/ (controllers, routes, middlewares, services, ...)`
`└─ package.json`

`yonetim-paneli-frontend/`

`├─ public/`
`├─ src/ (components, pages, context, api, ...)`
`└─ package.json`

Kurulum & Çalıştırma (Windows PowerShell)
----------------

1) Backend

```powershell
cd yonetim-paneli-backend
npm install
npx prisma migrate dev --name init
npm run dev
```

Varsayılan backend adresi: `http://localhost:5000` (port yapılandırmaya bağlıdır)

2) Frontend

```powershell
cd yonetim-paneli-frontend
npm install
npm run dev
```

Varsayılan frontend adresi: `http://localhost:5173` (Vite varsayılanı)

Seed ve Öntanımlı Admin
----------------

Seed çalıştırıldıysa örnek admin bilgileri:

- E‑posta: `admin@example.com`
- Şifre: `admin123`
- Rol: `ADMIN`

API Örnekleri
----------------

Üyeleri listeleme (örnek):

`GET /members?page=1&limit=10&search=ahmet&status=AKTİF&province=Bursa`

Üye oluşturma (örnek):

`POST /members` (Authorization: Bearer <token>)

Payload örneği:

```json
{
  "status": "AKTİF",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "nationalId": "12345678901"
}
```

Yazdırılabilir (print‑friendly) detay sayfası
----------------

Detay sayfaları için basit bir `@media print` kuralı kullanılır; yazdırma sırasında sadece ilgili detay alanı görünür.

Lisans
----------------

Bu proje MIT lisansı ile lisanslanmıştır.

Yazar
----------------

Mustafa Erhan Portakal

GitHub: https://github.com/MustafaEP

LinkedIn: https://www.linkedin.com/in/mustafa-erhan-portakal-2142101ba