# VPS Kurulum Rehberi

## Docker ve Docker Compose Kurulumu

### 1. Docker Kurulumunu Kontrol Edin

```bash
# Docker versiyonunu kontrol et
docker --version

# Docker Compose versiyonunu kontrol et (yeni format)
docker compose version
```

### 2. Eğer Docker Yüklü Değilse

#### Ubuntu/Debian için:

```bash
# Eski paketleri temizle
sudo apt-get remove docker docker-engine docker.io containerd runc

# Gerekli paketleri yükle
sudo apt-get update
sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Docker'ın resmi GPG key'ini ekle
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker repository'yi ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'ı yükle
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker servisini başlat
sudo systemctl start docker
sudo systemctl enable docker

# Docker'ı root olmadan kullanmak için (opsiyonel)
sudo usermod -aG docker $USER
# Sonra logout/login yapın
```

### 3. Komut Kullanımı

**Modern Docker (Docker Compose Plugin):**
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

**Eski Docker Compose (ayrı paket):**
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## Projeyi VPS'te Çalıştırma

### 1. Projeyi Klonlayın veya Yükleyin

```bash
cd /var/www
git clone https://github.com/MustafaEP/yonetim-paneli.git
cd yonetim-paneli
```

### 2. .env Dosyası Oluşturun

```bash
nano .env
```

Aşağıdaki içeriği ekleyin (değerleri kendi bilgilerinizle değiştirin):

```env
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

# AWS SES Configuration (opsiyonel)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_FROM_EMAIL=
```

### 3. Container'ları Build Edin ve Başlatın

**Modern Docker Compose (önerilen):**
```bash
docker compose build
docker compose up -d
```

**Eski Docker Compose:**
```bash
docker-compose build
docker-compose up -d
```

### 4. Logları Kontrol Edin

```bash
# Modern
docker compose logs -f

# Eski
docker-compose logs -f
```

### 5. Servis Durumunu Kontrol Edin

```bash
# Modern
docker compose ps

# Eski
docker-compose ps
```

## Yaygın Komutlar

### Container'ları Durdurma
```bash
docker compose down
# veya
docker-compose down
```

### Container'ları Yeniden Başlatma
```bash
docker compose restart
# veya
docker-compose restart
```

### Belirli Bir Servisi Yeniden Build Etme
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
# veya
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Logları Görüntüleme
```bash
docker compose logs -f backend
docker compose logs -f frontend
# veya
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Sorun Giderme

### "docker-compose: command not found" Hatası

**Çözüm 1:** Modern Docker Compose kullanın (tire olmadan):
```bash
docker compose --version
```

**Çözüm 2:** Eski docker-compose'u yükleyin:
```bash
sudo apt-get install docker-compose
```

**Çözüm 3:** Alias oluşturun:
```bash
echo 'alias docker-compose="docker compose"' >> ~/.bashrc
source ~/.bashrc
```

### "Permission denied" Hatası

```bash
# Docker grubuna kullanıcı ekle
sudo usermod -aG docker $USER

# Veya root olarak çalıştır
sudo docker compose up -d
```

### Port Zaten Kullanımda

```bash
# Port 80'i kullanan process'i bul
sudo lsof -i :80
# veya
sudo netstat -tulpn | grep :80

# Process'i durdur veya docker-compose.yml'de port'u değiştir
```

## Alias Oluşturma (Opsiyonel)

Eski ve yeni komutları aynı anda kullanmak için:

```bash
# .bashrc veya .bash_profile'a ekle
echo 'alias docker-compose="docker compose"' >> ~/.bashrc
source ~/.bashrc
```

Artık hem `docker-compose` hem de `docker compose` çalışacak.

