📌 Yönetim Paneli Sistemi – Full Stack Projesi

React + TypeScript + Node.js + Express + Prisma + RBAC (Rol ve Yetki Yönetimi)

Bu proje, kurumsal yapılarda kullanılabilecek kapsamlı bir Yönetim Paneli Sistemidir.
Yetkilendirme, üyelik yönetimi, ürün yönetimi, kullanıcı yönetimi, loglama, filtreleme, PDF/Excel export, yazdırılabilir detay sayfaları gibi full-feature bir admin panel içerir.

🔥 Tech Stack
🖥️ Frontend

React 18 + TypeScript

Material UI (MUI)

Axios

React Router DOM

State Management: Context API (Auth & Config)

Form Validasyonu: Dahili kontrolller + backend zod hataları

PDF & Excel:

xlsx

jspdf + jspdf-autotable

⚙️ Backend

Node.js + Express

TypeScript

Prisma ORM

SQLite (geliştirme için)

JWT Authentication

RBAC (Role-Based Access Control)

Zod Validasyon

Global Error Handler

Activity Logs

Modular Service Architecture

🔐 RBAC (Role & Permission)

Sistem tamamen role & permission tabanlıdır.

Roller

Admin → tüm izinler

Editor → sınırlı izinler

Viewer → sadece görüntüleme izinleri

İzin kategorileri

Kullanıcı Yönetimi

Üye Yönetimi ⭐

Ürün Yönetimi

Sistem Ayarları

Aktivite Logları

Her API endpoint’i checkPermission("PERMISSION_CODE") ile korunur.

🧩 Özellikler
🔹 Üyelik Modülü (Member Management)

Tam kurumsal düzeyde üye yönetimi içerir:

1. Üye Ekle/Düzenle

Üyelik durumu (Bekleme / Aktif / İstifa)

Kimlik bilgileri (Ad, Soyad, TC, vb.)

İl / İlçe seçimi → JSON’dan dinamik doldurma

Öğrenim durumu

Cinsiyet

Kayıt tarihi

Kara defter no

Ayrıntılı validasyon (input bazlı hata mesajları)

2. Üye Listesi

Arama (ad, soyad, tc, kurum…)

Filtreler:

Üyelik durumu

İl

Cinsiyet

Öğrenim durumu

Pagination

Tablo görünümü

Export:

Excel (uyeler.xlsx)

PDF (uyeler.pdf)

3. Üye Detay Sayfası

Tüm bilgilerin ayrı kategoriler halinde gösterimi

Yazdır / PDF Modu:

Sadece detay kartı görünür

Sidebar / navbar otomatik gizlenir (@media print)

📂 Proje Klasör Yapısı
Backend
yonetim-paneli-backend
 ├── prisma
 │    ├── schema.prisma
 │    └── seed.ts
 ├── src
 │    ├── config/
 │    ├── controllers/
 │    ├── middlewares/
 │    ├── routes/
 │    ├── validation/
 │    ├── data/
 │    └── server.ts
 └── package.json

Frontend
yonetim-paneli-frontend
 ├── public/
 ├── src
 │    ├── api/
 │    ├── components/
 │    ├── context/
 │    ├── data/
 │    ├── layouts/
 │    ├── pages/
 │    ├── types/
 │    └── App.tsx
 └── package.json

🚀 Kurulum & Çalıştırma
1️⃣ Backend
cd yonetim-paneli-backend
npm install
npx prisma migrate dev
npm run dev


Backend çalışır:
👉 http://localhost:5000

2️⃣ Frontend
cd yonetim-paneli-frontend
npm install
npm run dev


Frontend:
👉 http://localhost:5173

🔑 Varsayılan Admin Girişi

Seed çalıştırıldığında:

E-posta: admin@example.com
Şifre: admin123
Rol: ADMIN

📘 API Örnekleri

Üye listeleme:

GET /members?page=1&limit=10&search=ahmet&status=AKTİF&province=Bursa


Üye oluşturma:

POST /members
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "AKTİF",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "nationalId": "12345678901"
}

🖨️ Print-Friendly Üye Detay Sayfası

CSS ile:

@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  .print-hidden { display: none !important; }
}


Sadece detay kartı PDF'e döner.

📄 Lisans

Bu proje MIT lisansı altında yayınlanmıştır.

🏁 Yol Haritası (Roadmap)

 Üyelik modülü

 RBAC (Yetkilendirme)

 Activity Logs

 Excel / PDF export

 Yazdırılabilir detay sayfası

 Üyelere belge ekleme sistemi

 Çoklu dil desteği

 Postgres kullanımı

 Deployment (Vercel + Render)

👨‍💻 Geliştirici

Mustafa Erhan Portakal
Bilgisayar Mühendisi
GitHub: https://github.com/MustafaEP

LinkedIn: https://www.linkedin.com/in/mustafa-erhan-portakal-2142101ba