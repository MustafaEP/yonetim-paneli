# Seed Çalıştırma - Production Container

## Sorun
Production container'da `ts-node` yok (devDependency).

## Çözüm 1: Compile Edilmiş Seed'i Çalıştır (Önerilen)

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Seed script'ini compile et (eğer yoksa)
npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --esModuleInterop --resolveJsonModule

# Compile edilmiş seed'i çalıştır
node dist/prisma/seed.js

# Çık
exit
```

## Çözüm 2: Prisma'nın Seed Mekanizmasını Kullan

```bash
# Backend container'a bağlan
docker compose exec backend sh

# Prisma seed'i çalıştır (package.json'da seed script tanımlı olmalı)
npx prisma db seed

# Çık
exit
```

## Çözüm 3: ts-node'u Geçici Olarak Yükle

```bash
# Backend container'a bağlan
docker compose exec backend sh

# ts-node'u global olarak yükle
npm install -g ts-node tsconfig-paths

# Seed'i çalıştır
npm run prisma:seed

# Çık
exit
```

## Çözüm 4: Dockerfile'ı Güncelle (Kalıcı Çözüm)

Dockerfile'a seed script'ini compile etmek için bir adım ekleyebiliriz.

## En Hızlı Çözüm

```bash
# Backend container'a bağlan
docker compose exec backend sh

# ts-node'u yükle ve seed çalıştır
npm install ts-node tsconfig-paths && npm run prisma:seed

# Çık
exit
```

