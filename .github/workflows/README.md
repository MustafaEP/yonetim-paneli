# GitHub Actions Workflow Dokümantasyonu

Bu dizin, VPS sunucusuna otomatik deployment için GitHub Actions workflow dosyalarını içerir.

## 📋 Gereksinimler

Workflow'u kullanmadan önce GitHub repository ayarlarında şu secret'ları tanımlamanız gerekir:

### Gerekli Secret'lar

1. **VPS_SSH_HOST**: VPS sunucunuzun IP adresi veya domain adı
   - Örnek: `123.456.789.0` veya `vps.example.com`

2. **VPS_SSH_USER**: SSH bağlantısı için kullanılacak kullanıcı adı
   - Örnek: `root` veya `deploy`

3. **VPS_SSH_PRIVATE_KEY**: VPS'e SSH ile bağlanmak için kullanılacak private key
   - SSH key çifti oluşturma:
     ```bash
     ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy
     ```
   - Public key'i VPS'e ekleme:
     ```bash
     ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@vps-ip
     ```
   - Private key'i GitHub secret olarak ekleme:
     ```bash
     cat ~/.ssh/github_actions_deploy
     ```
     (Çıktıyı tamamen kopyalayın ve GitHub secret olarak ekleyin)

### Opsiyonel Secret'lar

4. **VPS_DEPLOY_PATH**: Projenin VPS'te bulunduğu dizin yolu
   - Varsayılan: `/var/www/yonetim-paneli`
   - Örnek: `/home/user/yonetim-paneli`

5. **VPS_HEALTH_CHECK_URL**: Deployment sonrası kontrol edilecek URL (opsiyonel)
   - Örnek: `https://api.example.com/health`

## 🔧 GitHub Secret'larını Ekleme

1. GitHub repository'nize gidin
2. **Settings** → **Secrets and variables** → **Actions** bölümüne gidin
3. **New repository secret** butonuna tıklayın
4. Yukarıdaki secret'ları tek tek ekleyin

## 🚀 Workflow Nasıl Çalışır?

1. **Tetikleyici**: `main` veya `master` branch'ine push yapıldığında veya manuel olarak tetiklendiğinde
2. **Checkout**: Kod repository'den alınır
3. **SSH Setup**: SSH bağlantısı için gerekli ayarlar yapılır
4. **Deploy**: VPS'e bağlanılır ve şu adımlar gerçekleştirilir:
   - Git'ten son değişiklikler çekilir
   - Backend ve frontend container'ları durdurulur
   - Docker image'ları yeniden build edilir
   - Container'lar başlatılır
   - Loglar kontrol edilir

## 📝 Manuel Deployment

Workflow'u manuel olarak çalıştırmak için:

1. GitHub repository'nize gidin
2. **Actions** sekmesine tıklayın
3. Sol menüden **Deploy to VPS** workflow'unu seçin
4. **Run workflow** butonuna tıklayın
5. Branch seçin ve **Run workflow**'a tıklayın

## 🔍 Sorun Giderme

### SSH Bağlantı Hatası

```
Error: Host key verification failed
```

**Çözüm**: `VPS_SSH_HOST` secret'ının doğru olduğundan emin olun. Public key'in VPS'te ekli olduğunu kontrol edin:

```bash
# VPS'te
cat ~/.ssh/authorized_keys
```

### Permission Denied

```
Permission denied (publickey)
```

**Çözüm**: 
- Private key'in doğru kopyalandığından emin olun (başında `-----BEGIN OPENSSH PRIVATE KEY-----` ve sonunda `-----END OPENSSH PRIVATE KEY-----` olmalı)
- SSH key'in VPS'te doğru kullanıcı için eklendiğinden emin olun

### Git Pull Hatası

```
fatal: could not read Username
```

**Çözüm**: VPS'te git remote URL'inin HTTPS değil SSH kullandığından emin olun:

```bash
# VPS'te
cd /path/to/yonetim-paneli
git remote -v
# Eğer HTTPS ise:
git remote set-url origin git@github.com:username/repo.git
```

### Docker Compose Hatası

```
docker-compose: command not found
```

**Çözüm**: VPS'te Docker ve Docker Compose'un kurulu olduğundan emin olun. Docker Compose V2 kullanılıyorsa `docker compose` (tire olmadan) komutunu kullanın.

## 🔐 Güvenlik Notları

1. **SSH Key Güvenliği**: Private key'i asla commit etmeyin veya paylaşmayın
2. **Secret Rotation**: Düzenli olarak SSH key'leri yenileyin
3. **Limited Permissions**: SSH kullanıcısı için mümkün olduğunca sınırlı yetkiler verin
4. **Firewall**: VPS'inizde gerekli portların açık olduğundan emin olun (SSH portu genellikle 22)

## 📚 Ek Kaynaklar

- [GitHub Actions Dokümantasyonu](https://docs.github.com/en/actions)
- [SSH Key Generation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
- [Docker Compose Dokümantasyonu](https://docs.docker.com/compose/)



