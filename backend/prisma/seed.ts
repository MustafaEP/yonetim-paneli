import { PrismaClient, MemberStatus, MemberSource, ContentType, ContentStatus, DocumentTemplateType, NotificationType, NotificationTargetType, NotificationStatus, NotificationCategory, NotificationChannel, NotificationTypeCategory, SystemSettingCategory, Gender, EducationStatus, PositionTitle, ApprovalStatus, ApprovalEntityType, PaymentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// JSON dosyalarından şehir ve ilçe verilerini yükle
const sehirlerPath = path.join(__dirname, 'sehirler.json');
const ilcelerPath = path.join(__dirname, 'ilceler.json');

interface SehirData {
  sehir_id: string;
  sehir_adi: string;
}

interface IlceData {
  ilce_id: string;
  ilce_adi: string;
  sehir_id: string;
  sehir_adi: string;
}

const sehirlerData: SehirData[] = JSON.parse(fs.readFileSync(sehirlerPath, 'utf-8'));
const ilcelerData: IlceData[] = JSON.parse(fs.readFileSync(ilcelerPath, 'utf-8'));

// Şehir verilerini formatla (plaka kodu sehir_id'den alınır)
const TURKISH_PROVINCES = sehirlerData.map((sehir) => ({
  name: sehir.sehir_adi,
  code: sehir.sehir_id.padStart(2, '0'), // "1" -> "01", "10" -> "10"
  sehirId: sehir.sehir_id,
}));

// İlçe verilerini şehir ID'sine göre grupla
const DISTRICT_NAMES: Record<string, string[]> = {};
const ilceMapBySehirId: Record<string, IlceData[]> = {};

for (const ilce of ilcelerData) {
  if (!ilceMapBySehirId[ilce.sehir_id]) {
    ilceMapBySehirId[ilce.sehir_id] = [];
  }
  ilceMapBySehirId[ilce.sehir_id].push(ilce);
  
  // Şehir adına göre de grupla (geriye dönük uyumluluk için)
  if (!DISTRICT_NAMES[ilce.sehir_adi]) {
    DISTRICT_NAMES[ilce.sehir_adi] = [];
  }
  if (!DISTRICT_NAMES[ilce.sehir_adi].includes(ilce.ilce_adi)) {
    DISTRICT_NAMES[ilce.sehir_adi].push(ilce.ilce_adi);
  }
}

// İsim ve soyisim listeleri
const FIRST_NAMES = [
  'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Hasan', 'Hüseyin', 'İbrahim', 'İsmail',
  'Ayşe', 'Fatma', 'Hatice', 'Zeynep', 'Emine', 'Meryem', 'Elif', 'Şerife',
  'Murat', 'Ömer', 'Yusuf', 'Kemal', 'Recep', 'Burak', 'Can', 'Emre',
  'Selin', 'Derya', 'Gizem', 'Burcu', 'Seda', 'Pınar', 'Esra', 'Ceren',
];

const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk',
  'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara',
  'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Ünal', 'Güneş', 'Bulut',
  'Türk', 'Erdoğan', 'Avcı', 'Köse', 'Özkan', 'Ateş', 'Aktaş', 'Bozkurt',
];

// TC Kimlik No üretici (basit, gerçekçi görünmesi için)
function generateNationalId(): string {
  const base = Math.floor(100000000 + Math.random() * 900000000);
  return base.toString().padStart(11, '0');
}

// Telefon numarası üretici
function generatePhone(): string {
  const prefixes = ['532', '533', '534', '535', '536', '537', '538', '539', '541', '542', '543', '544', '545', '546', '547', '548', '549', '551', '552', '553', '554', '555', '556', '557', '558', '559'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
}

// E-posta üretici
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'sendika.local'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
}

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // İstatistik değişkenleri
  let ilceCount = 0;

  // Temizleme (isteğe bağlı - dikkatli kullanın!)
  // ÖNEMLİ: Foreign key constraint'leri nedeniyle silme sırası önemli!
  // Önce child tabloları, sonra parent tabloları silmeliyiz
  console.log('🗑️  Mevcut veriler temizleniyor...');
  await prisma.memberPayment.deleteMany();
  await prisma.userNotification.deleteMany();
  await prisma.tevkifatFile.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.memberHistory.deleteMany();
  await prisma.memberDocument.deleteMany(); // Member'a bağlı
  await prisma.documentTemplate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.content.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.member.deleteMany(); // Institution'a bağlı, önce silmeliyiz
  await prisma.institution.deleteMany(); // Member'lardan sonra silinebilir
  await prisma.tevkifatCenter.deleteMany();
  await prisma.membershipInfoOption.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.userScope.deleteMany();
  await prisma.customRolePermission.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workplace.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  // 1. İlleri ekle
  console.log('📍 İller ekleniyor...');
  const provinceMap: Record<string, string> = {}; // Şehir adı -> Prisma ID
  const provinceMapBySehirId: Record<string, string> = {}; // Şehir ID -> Prisma ID
  for (const prov of TURKISH_PROVINCES) {
    const created = await prisma.province.create({
      data: {
        name: prov.name,
        code: prov.code,
      },
    });
    provinceMap[prov.name] = created.id;
    provinceMapBySehirId[prov.sehirId] = created.id;
  }
  console.log(`   ✅ ${TURKISH_PROVINCES.length} il eklendi`);

  // 2. İlçeleri ekle (JSON dosyasından tüm ilçeler)
  console.log('🏘️  İlçeler ekleniyor...');
  const districtMap: Record<string, string> = {};
  ilceCount = 0; // Reset counter
  
  // Şehir ID'sine göre ilçeleri ekle
  for (const [sehirId, ilceler] of Object.entries(ilceMapBySehirId)) {
    const provinceId = provinceMapBySehirId[sehirId];
    if (provinceId) {
      for (const ilce of ilceler) {
        // Aynı ilçe birden fazla kez eklenmesin diye kontrol et
        const districtKey = `${sehirId}_${ilce.ilce_adi}`;
        if (!districtMap[districtKey]) {
          const created = await prisma.district.create({
            data: {
              name: ilce.ilce_adi,
              provinceId: provinceId,
            },
          });
          districtMap[districtKey] = created.id;
          // Şehir adı + ilçe adı kombinasyonu için de mapping ekle (geriye dönük uyumluluk)
          const provinceName = TURKISH_PROVINCES.find(p => p.sehirId === sehirId)?.name;
          if (provinceName) {
            districtMap[`${provinceName}_${ilce.ilce_adi}`] = created.id;
          }
          ilceCount++;
        }
      }
    }
  }
  console.log(`   ✅ ${ilceCount} ilçe eklendi`);

  // 3. CustomRole'ler oluştur (Her Role enum değeri için)
  console.log('🎭 Özel roller oluşturuluyor...');
  const rolePermissionMap: Record<string, string[]> = {
    ADMIN: [
      // ADMIN tüm izinlere sahip olmalı (özel kontrol yapılıyor ama bazı temel izinler ekleyelim)
      'USER_LIST', 'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_SOFT_DELETE', 'USER_ASSIGN_ROLE',
      'ROLE_LIST', 'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE', 'ROLE_MANAGE_PERMISSIONS',
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_APPROVE', 'MEMBER_REJECT',
      'MEMBER_UPDATE', 'MEMBER_STATUS_CHANGE', 'MEMBER_LIST_BY_PROVINCE',
      'DUES_PLAN_MANAGE', 'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'DUES_DEBT_LIST_VIEW', 'DUES_EXPORT',
      'REGION_LIST', 'BRANCH_MANAGE', 'BRANCH_ASSIGN_PRESIDENT',
      'WORKPLACE_LIST', 'WORKPLACE_MANAGE', 'WORKPLACE_ASSIGN_REP', 'WORKPLACE_MEMBERS_VIEW',
      'DEALER_LIST', 'DEALER_CREATE', 'DEALER_APPROVE_APPLICATION', 'DEALER_UPDATE', 'DEALER_PERFORMANCE_VIEW',
      'CONTENT_MANAGE', 'CONTENT_PUBLISH',
      'DOCUMENT_TEMPLATE_MANAGE', 'DOCUMENT_MEMBER_HISTORY_VIEW', 'DOCUMENT_GENERATE_PDF',
      'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW', 'REPORT_MEMBER_STATUS_VIEW', 'REPORT_DUES_VIEW',
      'NOTIFY_ALL_MEMBERS', 'NOTIFY_REGION', 'NOTIFY_OWN_SCOPE',
      'SYSTEM_SETTINGS_VIEW', 'SYSTEM_SETTINGS_MANAGE', 'LOG_VIEW_ALL', 'LOG_VIEW_OWN_SCOPE',
    ],
    MODERATOR: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_UPDATE',
      'DUES_REPORT_VIEW', 'REPORT_GLOBAL_VIEW', 'CONTENT_MANAGE', 'CONTENT_PUBLISH',
    ],
    GENEL_BASKAN: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE', 'MEMBER_REJECT', 'MEMBER_UPDATE', 'MEMBER_STATUS_CHANGE',
      'DUES_PLAN_MANAGE', 'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'DUES_DEBT_LIST_VIEW',
      'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW', 'REPORT_MEMBER_STATUS_VIEW', 'REPORT_DUES_VIEW',
      'CONTENT_MANAGE', 'CONTENT_PUBLISH', 'NOTIFY_ALL_MEMBERS', 'NOTIFY_REGION',
      'REGION_LIST', 'BRANCH_MANAGE',
    ],
    GENEL_BASKAN_YRD: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE', 'MEMBER_REJECT', 'MEMBER_UPDATE',
      'DUES_REPORT_VIEW', 'DUES_PAYMENT_ADD', 'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW',
      'CONTENT_MANAGE', 'NOTIFY_REGION',
    ],
    GENEL_SEKRETER: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_UPDATE',
      'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'REPORT_REGION_VIEW',
      'DOCUMENT_TEMPLATE_MANAGE', 'DOCUMENT_GENERATE_PDF', 'NOTIFY_OWN_SCOPE',
    ],
    ISYERI_TEMSILCISI: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_APPROVE',
      'MEMBER_REJECT', 'WORKPLACE_MEMBERS_VIEW', 'NOTIFY_OWN_SCOPE',
    ],
    BAYI_YETKILISI: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'DEALER_LIST', 'DEALER_PERFORMANCE_VIEW', 'NOTIFY_OWN_SCOPE',
    ],
    UYE: [], // Üye için varsayılan olarak hiçbir izin yok
  };

  const customRoleMap: Record<string, string> = {};
  for (const [roleName, permissions] of Object.entries(rolePermissionMap)) {
    const customRole = await prisma.customRole.create({
      data: {
        name: roleName,
        description: `${roleName} rolü için özel yetki seti`,
        isActive: true,
        permissions: {
          create: permissions.map((perm) => ({ permission: perm })),
        },
      },
    });
    customRoleMap[roleName] = customRole.id;
  }

  // 4. Kullanıcılar ekle
  console.log('👥 Kullanıcılar ekleniyor...');
  const passwordHash = await bcrypt.hash('123456', 10); // Varsayılan şifre

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sendika.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      customRoles: {
        connect: { id: customRoleMap['ADMIN'] },
      },
    },
  });

  const genelBaskan = await prisma.user.create({
    data: {
      email: 'genel.baskan@sendika.local',
      passwordHash,
      firstName: 'Genel',
      lastName: 'Başkan',
      customRoles: {
        connect: { id: customRoleMap['GENEL_BASKAN'] },
      },
    },
  });

  // İl Başkanı için özel role oluştur (genel bir il başkanı rolü)
  const ilBaskaniRole = await prisma.customRole.create({
    data: {
      name: 'IL_BASKANI',
      description: 'İl Başkanı - İl bazlı üye yönetimi yapabilir',
      isActive: true,
      permissions: {
        create: [
          { permission: 'MEMBER_LIST_BY_PROVINCE' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
        ],
      },
    },
  });

  // İlçe Temsilcisi için özel role oluştur (genel bir ilçe temsilcisi rolü)
  const ilceTemsilcisiRole = await prisma.customRole.create({
    data: {
      name: 'ILCE_TEMSILCISI',
      description: 'İlçe Temsilcisi - İlçe bazlı üye yönetimi yapabilir',
      isActive: true,
      permissions: {
        create: [
          { permission: 'MEMBER_LIST_BY_PROVINCE' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
        ],
      },
    },
  });

  // İl Başkanı kullanıcısı
  const ilBaskani = await prisma.user.create({
    data: {
      email: 'il.baskani@sendika.local',
      passwordHash,
      firstName: 'İl',
      lastName: 'Başkanı',
      customRoles: {
        connect: { id: ilBaskaniRole.id },
      },
    },
  });

  // İlçe Temsilcisi kullanıcısı
  const ilceTemsilcisi = await prisma.user.create({
    data: {
      email: 'ilce.temsilcisi@sendika.local',
      passwordHash,
      firstName: 'İlçe',
      lastName: 'Temsilcisi',
      customRoles: {
        connect: { id: ilceTemsilcisiRole.id },
      },
    },
  });

  const isyeriTemsilcisi = await prisma.user.create({
    data: {
      email: 'isyeri.temsilcisi@sendika.local',
      passwordHash,
      firstName: 'İşyeri',
      lastName: 'Temsilcisi',
      customRoles: {
        connect: { id: customRoleMap['ISYERI_TEMSILCISI'] },
      },
    },
  });

  // Bursa İl Başkanı için özel role oluştur
  const bursaProvinceId = provinceMap['Bursa'];
  const bursaIlBaskaniRole = await prisma.customRole.create({
    data: {
      name: 'BURSA_IL_BASKANI',
      description: 'Bursa İl Başkanı - Bursa ilindeki üyeleri yönetebilir',
      isActive: true,
      provinceId: bursaProvinceId,
      permissions: {
        create: [
          { permission: 'MEMBER_LIST_BY_PROVINCE' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
        ],
      },
    },
  });

  // Ankara İl Başkanı için özel role oluştur
  const ankaraProvinceId = provinceMap['Ankara'];
  const ankaraIlBaskaniRole = await prisma.customRole.create({
    data: {
      name: 'ANKARA_IL_BASKANI',
      description: 'Ankara İl Başkanı - Ankara ilindeki üyeleri yönetebilir',
      isActive: true,
      provinceId: ankaraProvinceId,
      permissions: {
        create: [
          { permission: 'MEMBER_LIST_BY_PROVINCE' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
        ],
      },
    },
  });

  // Bursa İl Başkanı kullanıcısı
  const bursaIlBaskani = await prisma.user.create({
    data: {
      email: 'bursa.il.baskani@sendika.local',
      passwordHash,
      firstName: 'Mehmet',
      lastName: 'Yılmaz',
      customRoles: {
        connect: { id: bursaIlBaskaniRole.id },
      },
    },
  });

  // Ankara İl Başkanı kullanıcısı
  const ankaraIlBaskani = await prisma.user.create({
    data: {
      email: 'ankara.il.baskani@sendika.local',
      passwordHash,
      firstName: 'Ahmet',
      lastName: 'Kaya',
      customRoles: {
        connect: { id: ankaraIlBaskaniRole.id },
      },
    },
  });

  // Bursa Mudanya İlçe Başkanı için özel role oluştur
  const mudanyaDistrictId = districtMap['Bursa_Mudanya'];
  const bursaMudanyaIlceBaskaniRole = await prisma.customRole.create({
    data: {
      name: 'BURSA_MUDANYA_ILCE_BASKANI',
      description: 'Bursa Mudanya İlçe Başkanı - Mudanya ilçesindeki üyeleri yönetebilir',
      isActive: true,
      provinceId: bursaProvinceId,
      districtId: mudanyaDistrictId,
      permissions: {
        create: [
          { permission: 'MEMBER_LIST_BY_PROVINCE' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
        ],
      },
    },
  });

  // Ankara Çankaya İlçe Başkanı için özel role oluştur
  const cankayaDistrictId = districtMap['Ankara_Çankaya'];
  const ankaraCankayaIlceBaskaniRole = await prisma.customRole.create({
    data: {
      name: 'ANKARA_CANKAYA_ILCE_BASKANI',
      description: 'Ankara Çankaya İlçe Başkanı - Çankaya ilçesindeki üyeleri yönetebilir',
      isActive: true,
      provinceId: ankaraProvinceId,
      districtId: cankayaDistrictId,
      permissions: {
        create: [
          { permission: 'MEMBER_LIST_BY_PROVINCE' },
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
        ],
      },
    },
  });

  // Bursa Mudanya İlçe Başkanı kullanıcısı
  const bursaMudanyaIlceBaskani = await prisma.user.create({
    data: {
      email: 'bursa.mudanya.ilce.baskani@sendika.local',
      passwordHash,
      firstName: 'Ali',
      lastName: 'Demir',
      customRoles: {
        connect: { id: bursaMudanyaIlceBaskaniRole.id },
      },
    },
  });

  // Ankara Çankaya İlçe Başkanı kullanıcısı
  const ankaraCankayaIlceBaskani = await prisma.user.create({
    data: {
      email: 'ankara.cankaya.ilce.baskani@sendika.local',
      passwordHash,
      firstName: 'Zeynep',
      lastName: 'Şahin',
      customRoles: {
        connect: { id: ankaraCankayaIlceBaskaniRole.id },
      },
    },
  });

  // Kullanıcılar dizisi (UYE rolüne sahip kullanıcılar kaldırıldı)
  const users: string[] = [adminUser.id, genelBaskan.id, ilBaskani.id, ilceTemsilcisi.id, isyeriTemsilcisi.id, bursaIlBaskani.id, ankaraIlBaskani.id, bursaMudanyaIlceBaskani.id, ankaraCankayaIlceBaskani.id];

  // 5. İşyerleri ekle
  console.log('🏭 İşyerleri ekleniyor...');
  const workplaceMap: string[] = [];
  const workplaceNames = [
    'Tekstil Fabrikası A.Ş.',
    'Metal İşleme Sanayi',
    'Gıda Üretim Tesisleri',
    'Otomotiv Yan Sanayi',
    'Kimya Endüstrisi',
    'Elektrik Elektronik A.Ş.',
    'Plastik Üretim Ltd.',
    'İnşaat Malzemeleri San.',
    'Kağıt ve Ambalaj Fab.',
    'Enerji Üretim Tesisleri',
  ];

  const provinceIds = Object.values(provinceMap);
  const districtIds = Object.values(districtMap);

  for (let i = 0; i < 20; i++) {
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    
    // Bu ile ait district'leri veritabanından çek
    const districtsInProvince = await prisma.district.findMany({
      where: { provinceId },
      select: { id: true },
    });

    const districtId = districtsInProvince.length > 0 
      ? districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)].id
      : undefined;

    const workplace = await prisma.workplace.create({
      data: {
        name: `${workplaceNames[Math.floor(Math.random() * workplaceNames.length)]} ${i + 1}`,
        address: `Örnek Adres ${i + 1}, Sokak ${i + 1}`,
        provinceId,
        districtId,
      },
    });
    workplaceMap.push(workplace.id);
  }

  // 6. Bayiler ekle
  console.log('🏪 Bayiler ekleniyor...');
  const dealerMap: string[] = [];
  const dealerNames = [
    'Bayi A',
    'Bayi B',
    'Bayi C',
    'Bayi D',
    'Bayi E',
    'Bayi F',
  ];

  for (let i = 0; i < 15; i++) {
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    const dealer = await prisma.dealer.create({
      data: {
        name: `${dealerNames[Math.floor(Math.random() * dealerNames.length)]} ${i + 1}`,
        code: `BAYI${String(i + 1).padStart(3, '0')}`,
        address: `Bayi Adresi ${i + 1}`,
        provinceId,
      },
    });
    dealerMap.push(dealer.id);
  }

  // 7. UserScope ekle (kullanıcılara yetki alanları)
  console.log('🔐 Kullanıcı yetkileri ekleniyor...');
  
  // Not: İl Başkanı ve İlçe Temsilcisi kullanıcıları artık IL_BASKANI ve ILCE_TEMSILCISI rollerine sahip değil
  // Bu kullanıcılar GENEL_SEKRETER rolüne atandı, bu yüzden UserScope eklenmedi

  // İşyeri temsilcisine bir işyeri yetkisi
  if (workplaceMap.length > 0) {
    await prisma.userScope.create({
      data: {
        userId: isyeriTemsilcisi.id,
        workplaceId: workplaceMap[0],
      },
    });
  }

  // 8.5. Şubeler ekle (üyelerden önce - branchId zorunlu)
  console.log('🏢 Şubeler ekleniyor...');
  const provincesForBranches = await prisma.province.findMany({ take: 10 });
  const districtsForBranches = await prisma.district.findMany({ take: 20 });
  const allBranchesForMembers: any[] = [];

  // Üye oluşturma için gerekli yardımcı veriler (şimdiden hazırla)
  const positionTitlesForMembers: PositionTitle[] = [
    PositionTitle.KADRO_657,
    PositionTitle.SOZLESMELI_4B,
    PositionTitle.KADRO_663,
    PositionTitle.AILE_HEKIMLIGI,
    PositionTitle.UNVAN_4924,
    PositionTitle.DIGER_SAGLIK_PERSONELI,
  ];
  // Tevkifat merkezleri ve kurumlar daha sonra oluşturulacak, o yüzden şimdilik boş bırakıyoruz
  
  // Kullanıcıları al (şube başkanları için)
  const activeUsersForBranches = users.length > 0 
    ? await prisma.user.findMany({ 
        where: { id: { in: users } },
        select: { id: true }
      })
    : [];
  
  if (provincesForBranches.length > 0 && activeUsersForBranches.length > 0) {
    for (let i = 0; i < Math.min(5, provincesForBranches.length); i++) {
      const province = provincesForBranches[i];
      const provinceDistricts = districtsForBranches.filter(d => d.provinceId === province.id);
      const district = provinceDistricts.length > 0 ? provinceDistricts[0] : null;
      
      const branch = await prisma.branch.create({
        data: {
          name: `${province.name} Şubesi`,
          code: `SUB-${province.code || String(i + 1).padStart(2, '0')}`,
          provinceId: province.id,
          districtId: district?.id,
          presidentId: activeUsersForBranches[i % activeUsersForBranches.length].id,
          address: `${province.name} Merkez`,
          phone: `0${500 + i}${100 + i}${100 + i}${100 + i}`,
          email: `sube${i + 1}@sendika.org`,
          isActive: true,
        },
      });
      allBranchesForMembers.push(branch);
    }
    console.log(`   - ${allBranchesForMembers.length} şube eklendi`);
  }

  // Şubeleri al (branchId için gerekli)
  const allBranches = allBranchesForMembers.length > 0 
    ? allBranchesForMembers 
    : await prisma.branch.findMany({ take: 5 });
  const defaultBranchId = allBranches.length > 0 ? allBranches[0].id : null;

  if (!defaultBranchId) {
    console.error('⚠️  Şube bulunamadı! Lütfen önce şubeleri oluşturun.');
    return;
  }

  // 8.6. Kurumlar (Institutions) - Üyelerden ÖNCE oluşturulmalı (institutionId zorunlu)
  console.log('🏢 Kurumlar ekleniyor...');
  const allBranchesForInstitutions = allBranches.length > 0 ? allBranches : await prisma.branch.findMany({ take: 10 });
  
  // Şubeleri provinceId'ye göre bul
  const istanbulProvinceIdForInstitutions = provinceMap['İstanbul'];
  const ankaraProvinceIdForInstitutions = provinceMap['Ankara'];
  const bursaProvinceIdForInstitutions = provinceMap['Bursa'];
  const izmirProvinceIdForInstitutions = provinceMap['İzmir'];
  
  let istanbulBranch = istanbulProvinceIdForInstitutions 
    ? await prisma.branch.findFirst({ 
        where: { provinceId: istanbulProvinceIdForInstitutions },
        select: { id: true },
      })
    : null;
  
  // İstanbul şubesi yoksa, mevcut şubelerden birini kullan
  if (!istanbulBranch && allBranchesForInstitutions.length > 0) {
    istanbulBranch = { id: allBranchesForInstitutions[0].id };
  }
  
  let ankaraBranch = ankaraProvinceIdForInstitutions
    ? await prisma.branch.findFirst({ 
        where: { provinceId: ankaraProvinceIdForInstitutions },
        select: { id: true },
      })
    : null;
  
  // Ankara şubesi yoksa, mevcut şubelerden birini kullan
  if (!ankaraBranch && allBranchesForInstitutions.length > 0) {
    ankaraBranch = { id: allBranchesForInstitutions[allBranchesForInstitutions.length > 1 ? 1 : 0].id };
  }

  // İlçeleri bul
  let istanbulKadikoyId: string | undefined = districtMap['İstanbul_Kadıköy'];
  let ankaraCankayaId: string | undefined = districtMap['Ankara_Çankaya'];
  let bursaNiluferId: string | undefined = districtMap['Bursa_Nilüfer'];
  let izmirKonakId: string | undefined = districtMap['İzmir_Konak'];
  
  // Eğer map'te yoksa veritabanından ara
  if (!istanbulKadikoyId && istanbulProvinceIdForInstitutions) {
    const kadikoy = await prisma.district.findFirst({
      where: { 
        provinceId: istanbulProvinceIdForInstitutions,
        name: 'Kadıköy'
      },
      select: { id: true }
    });
    istanbulKadikoyId = kadikoy?.id;
  }
  
  if (!ankaraCankayaId && ankaraProvinceIdForInstitutions) {
    const cankaya = await prisma.district.findFirst({
      where: { 
        provinceId: ankaraProvinceIdForInstitutions,
        name: 'Çankaya'
      },
      select: { id: true }
    });
    ankaraCankayaId = cankaya?.id;
  }

  if (!bursaNiluferId && bursaProvinceIdForInstitutions) {
    const nilufer = await prisma.district.findFirst({
      where: { 
        provinceId: bursaProvinceIdForInstitutions,
        name: 'Nilüfer'
      },
      select: { id: true }
    });
    bursaNiluferId = nilufer?.id;
  }

  if (!izmirKonakId && izmirProvinceIdForInstitutions) {
    const konak = await prisma.district.findFirst({
      where: { 
        provinceId: izmirProvinceIdForInstitutions,
        name: 'Konak'
      },
      select: { id: true }
    });
    izmirKonakId = konak?.id;
  }

  // Daha fazla institution oluştur (tüm üyeler için yeterli olsun)
  const institutionData: any[] = [];
  
  // İstanbul için institutions
  if (istanbulBranch && istanbulProvinceIdForInstitutions && istanbulKadikoyId) {
    institutionData.push({
      name: 'İstanbul Devlet Hastanesi',
      provinceId: istanbulProvinceIdForInstitutions,
      districtId: istanbulKadikoyId,
      branchId: istanbulBranch.id,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
    institutionData.push({
      name: 'İstanbul Üniversitesi Hastanesi',
      provinceId: istanbulProvinceIdForInstitutions,
      districtId: istanbulKadikoyId,
      branchId: istanbulBranch.id,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
  }
  
  // Ankara için institutions
  if (ankaraBranch && ankaraProvinceIdForInstitutions && ankaraCankayaId) {
    institutionData.push({
      name: 'Ankara Şehir Hastanesi',
      provinceId: ankaraProvinceIdForInstitutions,
      districtId: ankaraCankayaId,
      branchId: ankaraBranch.id,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
    institutionData.push({
      name: 'Ankara Üniversitesi Hastanesi',
      provinceId: ankaraProvinceIdForInstitutions,
      districtId: ankaraCankayaId,
      branchId: ankaraBranch.id,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
  }

  // Bursa için institutions
  if (bursaProvinceIdForInstitutions && bursaNiluferId && allBranchesForInstitutions.length > 0) {
    const bursaBranch = await prisma.branch.findFirst({ 
      where: { provinceId: bursaProvinceIdForInstitutions },
      select: { id: true },
    }) || { id: allBranchesForInstitutions[0].id };
    
    institutionData.push({
      name: 'Bursa Devlet Hastanesi',
      provinceId: bursaProvinceIdForInstitutions,
      districtId: bursaNiluferId,
      branchId: bursaBranch.id,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
  }

  // İzmir için institutions
  if (izmirProvinceIdForInstitutions && izmirKonakId && allBranchesForInstitutions.length > 0) {
    const izmirBranch = await prisma.branch.findFirst({ 
      where: { provinceId: izmirProvinceIdForInstitutions },
      select: { id: true },
    }) || { id: allBranchesForInstitutions[0].id };
    
    institutionData.push({
      name: 'İzmir Devlet Hastanesi',
      provinceId: izmirProvinceIdForInstitutions,
      districtId: izmirKonakId,
      branchId: izmirBranch.id,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
  }

  // Diğer iller için genel institutions oluştur
  const otherProvinces = Object.entries(provinceMap).filter(([name]) => 
    !['İstanbul', 'Ankara', 'Bursa', 'İzmir'].includes(name)
  ).slice(0, 10); // İlk 10 il için

  for (const [provinceName, provinceId] of otherProvinces) {
    const districts = await prisma.district.findMany({
      where: { provinceId },
      take: 1,
      select: { id: true },
    });
    
    if (districts.length > 0 && allBranchesForInstitutions.length > 0) {
      const branch = await prisma.branch.findFirst({ 
        where: { provinceId },
        select: { id: true },
      }) || { id: allBranchesForInstitutions[0].id };
      
      institutionData.push({
        name: `${provinceName} Devlet Hastanesi`,
        provinceId,
        districtId: districts[0].id,
        branchId: branch.id,
        isActive: true,
        approvedAt: new Date(),
        approvedBy: adminUser.id,
        createdBy: adminUser.id,
      });
    }
  }

  if (institutionData.length > 0) {
    const institutions = await prisma.institution.createMany({
      data: institutionData,
    });
    console.log(`   - ${institutions.count} kurum eklendi`);
  } else {
    console.log(`   ⚠️  Kurum eklenemedi (şube veya ilçe bulunamadı)`);
  }

  // 9. Üyeler ekle
  console.log('👤 Üyeler ekleniyor...');
  const memberIds: string[] = [];
  const statuses: MemberStatus[] = [
    MemberStatus.PENDING,
    MemberStatus.ACTIVE,
    MemberStatus.ACTIVE,
    MemberStatus.ACTIVE,
    MemberStatus.ACTIVE,
    MemberStatus.ACTIVE,
    MemberStatus.INACTIVE,
    MemberStatus.REJECTED,
    MemberStatus.REJECTED,
  ];
  const sources: MemberSource[] = [
    MemberSource.DIRECT,
    MemberSource.WORKPLACE,
    MemberSource.DEALER,
    MemberSource.DIRECT,
  ];

  // Şu anki tarih
  const now = new Date();
  
  // Özel üye: Burcu Doğan - Haziran 2025'te kayıt olmuş, Haziran'da ödeme yapmış
  const burcuCreatedAt = new Date(2025, 5, 1); // 1 Haziran 2025

  // İlk önce Burcu Doğan'ı oluştur
  const burcuProvinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
  const burcuDistricts = await prisma.district.findMany({
    where: { provinceId: burcuProvinceId },
    select: { id: true },
  });
  const burcuDistrictId = burcuDistricts.length > 0 
    ? burcuDistricts[Math.floor(Math.random() * burcuDistricts.length)].id 
    : undefined;

  // Üye sayacı (kayıt numarası için)
  let memberRegistrationCounter = 1;

  // Burcu için çalışma bilgileri (zorunlu alanlar)
  const burcuWorkingProvinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
  const burcuWorkingDistricts = await prisma.district.findMany({
    where: { provinceId: burcuWorkingProvinceId },
    select: { id: true },
  });
  const burcuWorkingDistrictId = burcuWorkingDistricts.length > 0 
    ? burcuWorkingDistricts[Math.floor(Math.random() * burcuWorkingDistricts.length)].id 
    : burcuDistrictId || burcuProvinceId; // Fallback
  
  // Institution seç (zorunlu) - institutions üyelerden önce oluşturuldu
  const institutionsForBurcu = await prisma.institution.findMany({ take: 10 });
  const burcuInstitutionId = institutionsForBurcu.length > 0 
    ? institutionsForBurcu[Math.floor(Math.random() * institutionsForBurcu.length)].id 
    : null;

  if (!burcuInstitutionId) {
    console.error('⚠️  Institution bulunamadı! Lütfen önce institution oluşturun.');
    return;
  }

  const burcuMember = await prisma.member.create({
    data: {
      firstName: 'Burcu',
      lastName: 'Doğan',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Burcu', 'Doğan'),
      status: MemberStatus.ACTIVE,
      source: MemberSource.DIRECT,
      provinceId: burcuProvinceId,
      districtId: burcuDistrictId,
      branchId: defaultBranchId, // Zorunlu
      registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
      positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
      // Çalışma bilgileri (zorunlu)
      workingProvinceId: burcuWorkingProvinceId,
      workingDistrictId: burcuWorkingDistrictId,
      institutionId: burcuInstitutionId,
      createdByUserId: users[0],
      approvedByUserId: users[0],
      approvedAt: burcuCreatedAt,
      createdAt: burcuCreatedAt, // Haziran 2025'te kayıt olmuş
      updatedAt: burcuCreatedAt,
    },
  });
  memberIds.push(burcuMember.id);
  memberRegistrationCounter++;
  console.log(`   - Özel üye: ${burcuMember.firstName} ${burcuMember.lastName} (Haziran 2025'te kayıt)`);

  // Diğer üyeleri oluştur (gerçekçi kayıt tarihleri ile)
  // 40 aktif/pasif üye + 10 PENDING başvuru + 5 REJECTED üye
  for (let i = 0; i < 40; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Aynı isimdeki Burcu Doğan'ı atla
    if (firstName === 'Burcu' && lastName === 'Doğan') {
      continue;
    }
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    
    // Bu ile ait district'leri veritabanından çek
    const districtsInProvince = await prisma.district.findMany({
      where: { provinceId },
      select: { id: true },
    });
    
    // İle ait bir ilçe seç (varsa)
    let districtId: string | undefined;
    if (districtsInProvince.length > 0) {
      districtId = districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)].id;
    }
    

    // Gerçekçi kayıt tarihi: 6-12 ay önce (bazıları bu ay içinde onaylanmış olabilir)
    const monthsAgo = 6 + Math.floor(Math.random() * 6); // 6-12 ay önce
    const memberCreatedAt = new Date(now);
    memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
    memberCreatedAt.setDate(1); // Ayın ilk günü

    // %20 şansla bu ay içinde onaylanmış olabilir (bu ay gelen üye)
    const isThisMonthNew = status === MemberStatus.ACTIVE && Math.random() < 0.2;
    let approvedAt: Date | null = null;
    
    if (status === MemberStatus.ACTIVE) {
      if (isThisMonthNew) {
        // Bu ay içinde onaylanmış
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        // Ayın son gününü kontrol et
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const thisMonthDay = 1 + Math.floor(Math.random() * Math.min(28, daysInMonth));
        approvedAt = new Date(currentYear, currentMonth, thisMonthDay);
        // Gelecekteki tarih olmamalı
        if (approvedAt > now) {
          approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // Bugünden 0-7 gün önce
        }
      } else {
        // Geçmişte onaylanmış - kayıt tarihinden sonra ama bugünden önce
        approvedAt = new Date(memberCreatedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // Kayıttan 7 gün sonra onaylanmış
        // Eğer gelecekteyse, bugünden önce bir tarih yap
        if (approvedAt > now) {
          approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Bugünden 0-30 gün önce
        }
      }
    }

    // Şube seç (zorunlu)
    const branchId = allBranches.length > 0 
      ? allBranches[Math.floor(Math.random() * allBranches.length)].id
      : defaultBranchId;

    // Çalışma bilgileri (zorunlu alanlar)
    const workingProvinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    const workingDistricts = await prisma.district.findMany({
      where: { provinceId: workingProvinceId },
      select: { id: true },
    });
    const workingDistrictId = workingDistricts.length > 0 
      ? workingDistricts[Math.floor(Math.random() * workingDistricts.length)].id 
      : districtId || provinceId; // Fallback

    // Institution seç (zorunlu) - institutions üyelerden önce oluşturuldu
    const institutionsList = await prisma.institution.findMany({ take: 20 });
    const institutionId = institutionsList.length > 0 
      ? institutionsList[Math.floor(Math.random() * institutionsList.length)].id 
      : null;

    // Eğer institution yoksa, oluşturma işlemini atla
    if (!institutionId) {
      console.warn(`⚠️  Institution bulunamadı, üye ${firstName} ${lastName} atlanıyor`);
      continue;
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId: generateNationalId(),
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        status,
        source,
        provinceId,
        districtId,
        branchId, // Zorunlu
        registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
        positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
        // Çalışma bilgileri (zorunlu)
        workingProvinceId,
        workingDistrictId,
        institutionId,
        createdByUserId: users[Math.floor(Math.random() * users.length)],
        approvedByUserId: status === MemberStatus.ACTIVE 
          ? users[Math.floor(Math.random() * users.length)]
          : null,
        approvedAt,
        createdAt: memberCreatedAt,
        updatedAt: memberCreatedAt,
      },
    });
    memberIds.push(member.id);
    memberRegistrationCounter++;
  }

  // Bekleyen başvurular (PENDING) ekle
  console.log('⏳ Bekleyen üye başvuruları ekleniyor...');
  for (let i = 0; i < 10; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Aynı isimdeki Burcu Doğan'ı atla
    if (firstName === 'Burcu' && lastName === 'Doğan') {
      continue;
    }
    
    const source = sources[Math.floor(Math.random() * sources.length)];
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    
    const districtsInProvince = await prisma.district.findMany({
      where: { provinceId },
      select: { id: true },
    });
    
    let districtId: string | undefined;
    if (districtsInProvince.length > 0) {
      districtId = districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)].id;
    }
    

    // Son 1-3 ay içinde başvuru yapmış
    const monthsAgo = 1 + Math.floor(Math.random() * 3);
    const memberCreatedAt = new Date(now);
    memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
    memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28)); // Ayın rastgele bir günü

    const branchIdForPending = allBranches.length > 0 
      ? allBranches[Math.floor(Math.random() * allBranches.length)].id
      : defaultBranchId;

    // Çalışma bilgileri (zorunlu alanlar)
    const pendingWorkingProvinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    const pendingWorkingDistricts = await prisma.district.findMany({
      where: { provinceId: pendingWorkingProvinceId },
      select: { id: true },
    });
    const pendingWorkingDistrictId = pendingWorkingDistricts.length > 0 
      ? pendingWorkingDistricts[Math.floor(Math.random() * pendingWorkingDistricts.length)].id 
      : districtId || provinceId; // Fallback

    const pendingInstitutionsList = await prisma.institution.findMany({ take: 20 });
    const pendingInstitutionId = pendingInstitutionsList.length > 0 
      ? pendingInstitutionsList[Math.floor(Math.random() * pendingInstitutionsList.length)].id 
      : null;

    if (!pendingInstitutionId) {
      console.warn(`⚠️  Institution bulunamadı, PENDING üye ${firstName} ${lastName} atlanıyor`);
      continue;
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId: generateNationalId(),
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        status: MemberStatus.PENDING,
        source,
        provinceId,
        districtId,
        branchId: branchIdForPending, // Zorunlu
        registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
        positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
        // Çalışma bilgileri (zorunlu)
        workingProvinceId: pendingWorkingProvinceId,
        workingDistrictId: pendingWorkingDistrictId,
        institutionId: pendingInstitutionId,
        createdByUserId: users[Math.floor(Math.random() * users.length)],
        createdAt: memberCreatedAt,
        updatedAt: memberCreatedAt,
      },
    });
    memberIds.push(member.id);
    memberRegistrationCounter++;
  }
  console.log(`   - 10 bekleyen başvuru eklendi`);

  // Reddedilen üyeler (REJECTED) ekle
  console.log('❌ Reddedilen üyeler ekleniyor...');
  for (let i = 0; i < 5; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Aynı isimdeki Burcu Doğan'ı atla
    if (firstName === 'Burcu' && lastName === 'Doğan') {
      continue;
    }
    
    const source = sources[Math.floor(Math.random() * sources.length)];
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    
    const districtsInProvince = await prisma.district.findMany({
      where: { provinceId },
      select: { id: true },
    });
    
    // Reddedilen üyeler için ilçe her zaman olmalı
    let districtId: string;
    if (districtsInProvince.length > 0) {
      districtId = districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)].id;
    } else {
      // Eğer bu ile ait ilçe yoksa, başka bir ilden ilçe bul
      const anyDistrict = await prisma.district.findFirst({
        select: { id: true },
      });
      if (anyDistrict) {
        districtId = anyDistrict.id;
      } else {
        // Hiç ilçe yoksa, ilk ilçeyi oluştur veya hata ver
        throw new Error('Reddedilen üye için ilçe bulunamadı. Lütfen önce ilçeleri oluşturun.');
      }
    }
    

    // 2-6 ay önce başvuru yapmış, 1-2 ay önce reddedilmiş
    const monthsAgo = 2 + Math.floor(Math.random() * 5);
    const memberCreatedAt = new Date(now);
    memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
    memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28));

    const rejectedAt = new Date(memberCreatedAt);
    rejectedAt.setMonth(rejectedAt.getMonth() + 1 + Math.floor(Math.random() * 2)); // Başvurudan 1-2 ay sonra reddedilmiş
    // Gelecekteki tarih olmamalı
    if (rejectedAt > now) {
      rejectedAt.setTime(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // Bugünden 0-7 gün önce
    }

    // Reddedilen üyeler için tüm alanlar dolu olmalı
    const phone = generatePhone();
    const email = generateEmail(firstName, lastName);
    const nationalId = generateNationalId();
    
    // Çalışma bilgileri (zorunlu alanlar)
    const rejectedWorkingProvinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    const rejectedWorkingDistricts = await prisma.district.findMany({
      where: { provinceId: rejectedWorkingProvinceId },
      select: { id: true },
    });
    const rejectedWorkingDistrictId = rejectedWorkingDistricts.length > 0 
      ? rejectedWorkingDistricts[Math.floor(Math.random() * rejectedWorkingDistricts.length)].id 
      : districtId; // Fallback

    const rejectedInstitutionsList = await prisma.institution.findMany({ take: 20 });
    const rejectedInstitutionId = rejectedInstitutionsList.length > 0 
      ? rejectedInstitutionsList[Math.floor(Math.random() * rejectedInstitutionsList.length)].id 
      : null;

    if (!rejectedInstitutionId) {
      console.warn(`⚠️  Institution bulunamadı, REJECTED üye ${firstName} ${lastName} atlanıyor`);
      continue;
    }

    // Şube seç (zorunlu)
    const branchIdForRejected = allBranches.length > 0 
      ? allBranches[Math.floor(Math.random() * allBranches.length)].id
      : defaultBranchId;
    
    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId: nationalId, // Her zaman dolu (zorunlu)
        phone: phone, // Her zaman dolu
        email: email, // Her zaman dolu
        status: MemberStatus.REJECTED,
        source,
        provinceId: provinceId, // İl her zaman olmalı
        districtId: districtId, // İlçe her zaman olmalı
        branchId: branchIdForRejected, // Zorunlu
        registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`, // Zorunlu
        positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)], // Zorunlu
        // Çalışma bilgileri (zorunlu)
        workingProvinceId: rejectedWorkingProvinceId,
        workingDistrictId: rejectedWorkingDistrictId,
        institutionId: rejectedInstitutionId,
        createdByUserId: users[Math.floor(Math.random() * users.length)],
        approvedByUserId: users[Math.floor(Math.random() * users.length)], // Reddeden kullanıcı
        approvedAt: rejectedAt, // Reddedilme tarihi
        createdAt: memberCreatedAt,
        updatedAt: rejectedAt,
      },
    });
    memberIds.push(member.id);
    memberRegistrationCounter++;
  }
  console.log(`   - 5 reddedilen üye eklendi`);

  // 40 yeni aktif üye ekle
  console.log('✅ 40 yeni aktif üye ekleniyor...');
  for (let i = 0; i < 40; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Aynı isimdeki Burcu Doğan'ı atla
    if (firstName === 'Burcu' && lastName === 'Doğan') {
      continue;
    }
    
    const source = sources[Math.floor(Math.random() * sources.length)];
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    
    // Bu ile ait district'leri veritabanından çek
    const districtsInProvince = await prisma.district.findMany({
      where: { provinceId },
      select: { id: true },
    });
    
    // İle ait bir ilçe seç (varsa)
    let districtId: string | undefined;
    if (districtsInProvince.length > 0) {
      districtId = districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)].id;
    }

    // Gerçekçi kayıt tarihi: Son 3-6 ay içinde
    const monthsAgo = 3 + Math.floor(Math.random() * 4); // 3-6 ay önce
    const memberCreatedAt = new Date(now);
    memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
    memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28)); // Ayın rastgele bir günü

    // Aktif üyeler için onay tarihi: kayıt tarihinden 1-7 gün sonra
    const approvedAt = new Date(memberCreatedAt);
    approvedAt.setDate(approvedAt.getDate() + 1 + Math.floor(Math.random() * 7));
    // Gelecekteki tarih olmamalı
    if (approvedAt > now) {
      approvedAt.setTime(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // Bugünden 0-7 gün önce
    }

    // Şube seç (zorunlu)
    const branchId = allBranches.length > 0 
      ? allBranches[Math.floor(Math.random() * allBranches.length)].id
      : defaultBranchId;

    // Çalışma bilgileri (zorunlu alanlar)
    const workingProvinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    const workingDistricts = await prisma.district.findMany({
      where: { provinceId: workingProvinceId },
      select: { id: true },
    });
    const workingDistrictId = workingDistricts.length > 0 
      ? workingDistricts[Math.floor(Math.random() * workingDistricts.length)].id 
      : districtId || provinceId; // Fallback

    // Institution seç (zorunlu)
    const institutionsList = await prisma.institution.findMany({ take: 20 });
    const institutionId = institutionsList.length > 0 
      ? institutionsList[Math.floor(Math.random() * institutionsList.length)].id 
      : null;

    // Eğer institution yoksa, oluşturma işlemini atla
    if (!institutionId) {
      console.warn(`⚠️  Institution bulunamadı, aktif üye ${firstName} ${lastName} atlanıyor`);
      continue;
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId: generateNationalId(),
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        status: MemberStatus.ACTIVE,
        source,
        provinceId,
        districtId,
        branchId, // Zorunlu
        registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
        positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
        // Çalışma bilgileri (zorunlu)
        workingProvinceId,
        workingDistrictId,
        institutionId,
        createdByUserId: users[Math.floor(Math.random() * users.length)],
        approvedByUserId: users[Math.floor(Math.random() * users.length)],
        approvedAt,
        createdAt: memberCreatedAt,
        updatedAt: memberCreatedAt,
      },
    });
    memberIds.push(member.id);
    memberRegistrationCounter++;
  }
  console.log(`   - 40 yeni aktif üye eklendi`);

  // Ankara ili için özel üyeler ekle
  console.log('🏛️  Ankara ili için üyeler ekleniyor...');
  const ankaraProvinceIdForMembers = provinceMap['Ankara'];
  if (ankaraProvinceIdForMembers) {
    // Ankara'nın ilçelerini al
    const ankaraDistricts = await prisma.district.findMany({
      where: { provinceId: ankaraProvinceIdForMembers },
      select: { id: true, name: true },
    });

    // Ankara için 10 farklı üye oluştur
    const ankaraMemberStatuses: MemberStatus[] = [
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.PENDING,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.INACTIVE,
      MemberStatus.ACTIVE,
    ];

    for (let i = 0; i < 10; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      
      // Aynı isimdeki Burcu Doğan'ı atla
      if (firstName === 'Burcu' && lastName === 'Doğan') {
        continue;
      }
      
      const status = ankaraMemberStatuses[i];
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      // Ankara'nın ilçelerinden rastgele birini seç
      let districtId: string | undefined;
      if (ankaraDistricts.length > 0) {
        districtId = ankaraDistricts[Math.floor(Math.random() * ankaraDistricts.length)].id;
      }

      // Gerçekçi kayıt tarihi: 1-8 ay önce
      const monthsAgo = 1 + Math.floor(Math.random() * 8);
      const memberCreatedAt = new Date(now);
      memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
      memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28));

      let approvedAt: Date | null = null;
      if (status === MemberStatus.ACTIVE) {
        // Kayıttan 3-10 gün sonra onaylanmış
        approvedAt = new Date(memberCreatedAt);
        approvedAt.setDate(approvedAt.getDate() + 3 + Math.floor(Math.random() * 8));
        // Gelecekteki tarih olmamalı
        if (approvedAt > now) {
          approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
        }
      }

      const branchIdForAnkara = allBranches.length > 0 
        ? allBranches[Math.floor(Math.random() * allBranches.length)].id
        : defaultBranchId;

      // Çalışma bilgileri (zorunlu alanlar)
      const ankaraWorkingProvinceId = ankaraProvinceIdForMembers;
      // districtId undefined olabilir ama workingDistrictId zorunlu, fallback kullan
      let ankaraWorkingDistrictId = districtId;
      if (!ankaraWorkingDistrictId && ankaraDistricts.length > 0) {
        ankaraWorkingDistrictId = ankaraDistricts[0].id;
      }
      if (!ankaraWorkingDistrictId) {
        console.warn(`⚠️  Çalışma ilçesi bulunamadı, Ankara üyesi ${firstName} ${lastName} atlanıyor`);
        continue;
      }

      const ankaraInstitutionsList = await prisma.institution.findMany({ take: 20 });
      const ankaraInstitutionId = ankaraInstitutionsList.length > 0 
        ? ankaraInstitutionsList[Math.floor(Math.random() * ankaraInstitutionsList.length)].id 
        : null;

      if (!ankaraInstitutionId) {
        console.warn(`⚠️  Institution bulunamadı, Ankara üyesi ${firstName} ${lastName} atlanıyor`);
        continue;
      }

      const member = await prisma.member.create({
        data: {
          firstName,
          lastName,
          nationalId: generateNationalId(),
          phone: generatePhone(),
          email: generateEmail(firstName, lastName),
          status,
          source,
          provinceId: ankaraProvinceIdForMembers,
          districtId,
          branchId: branchIdForAnkara, // Zorunlu
          registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
          positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
          // Çalışma bilgileri (zorunlu)
          workingProvinceId: ankaraWorkingProvinceId,
          workingDistrictId: ankaraWorkingDistrictId,
          institutionId: ankaraInstitutionId,
          createdByUserId: users[Math.floor(Math.random() * users.length)],
          approvedByUserId: status === MemberStatus.ACTIVE
            ? users[Math.floor(Math.random() * users.length)]
            : null,
          approvedAt,
          createdAt: memberCreatedAt,
          updatedAt: memberCreatedAt,
        },
      });
      memberIds.push(member.id);
      memberRegistrationCounter++;
    }
    console.log(`   - Ankara ili için 10 üye eklendi`);
  } else {
    console.log(`   ⚠️  Ankara ili bulunamadı, üye eklenemedi`);
  }

  // Bursa ili için özel üyeler ekle
  console.log('🏛️  Bursa ili için üyeler ekleniyor...');
  if (bursaProvinceId) {
    // Bursa'nın ilçelerini al
    const bursaDistricts = await prisma.district.findMany({
      where: { provinceId: bursaProvinceId },
      select: { id: true, name: true },
    });

    // Bursa için 10 farklı üye oluştur
    const bursaMemberStatuses: MemberStatus[] = [
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.PENDING,
      MemberStatus.ACTIVE,
      MemberStatus.ACTIVE,
      MemberStatus.INACTIVE,
      MemberStatus.ACTIVE,
    ];

    for (let i = 0; i < 10; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      
      // Aynı isimdeki Burcu Doğan'ı atla
      if (firstName === 'Burcu' && lastName === 'Doğan') {
        continue;
      }
      
      const status = bursaMemberStatuses[i];
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      // Bursa'nın ilçelerinden rastgele birini seç
      let districtId: string | undefined;
      if (bursaDistricts.length > 0) {
        districtId = bursaDistricts[Math.floor(Math.random() * bursaDistricts.length)].id;
      }

      // Gerçekçi kayıt tarihi: 1-8 ay önce
      const monthsAgo = 1 + Math.floor(Math.random() * 8);
      const memberCreatedAt = new Date(now);
      memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
      memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28));

      let approvedAt: Date | null = null;
      if (status === MemberStatus.ACTIVE) {
        // Kayıttan 3-10 gün sonra onaylanmış
        approvedAt = new Date(memberCreatedAt);
        approvedAt.setDate(approvedAt.getDate() + 3 + Math.floor(Math.random() * 8));
        // Gelecekteki tarih olmamalı
        if (approvedAt > now) {
          approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
        }
      }

      const branchIdForBursa = allBranches.length > 0 
        ? allBranches[Math.floor(Math.random() * allBranches.length)].id
        : defaultBranchId;

      // Çalışma bilgileri (zorunlu alanlar)
      const bursaWorkingProvinceId = bursaProvinceId;
      // districtId undefined olabilir ama workingDistrictId zorunlu, fallback kullan
      let bursaWorkingDistrictId = districtId;
      if (!bursaWorkingDistrictId && bursaDistricts.length > 0) {
        bursaWorkingDistrictId = bursaDistricts[0].id;
      }
      if (!bursaWorkingDistrictId) {
        console.warn(`⚠️  Çalışma ilçesi bulunamadı, Bursa üyesi ${firstName} ${lastName} atlanıyor`);
        continue;
      }

      const bursaInstitutionsList = await prisma.institution.findMany({ take: 20 });
      const bursaInstitutionId = bursaInstitutionsList.length > 0 
        ? bursaInstitutionsList[Math.floor(Math.random() * bursaInstitutionsList.length)].id 
        : null;

      if (!bursaInstitutionId) {
        console.warn(`⚠️  Institution bulunamadı, Bursa üyesi ${firstName} ${lastName} atlanıyor`);
        continue;
      }

      const member = await prisma.member.create({
        data: {
          firstName,
          lastName,
          nationalId: generateNationalId(),
          phone: generatePhone(),
          email: generateEmail(firstName, lastName),
          status,
          source,
          provinceId: bursaProvinceId,
          districtId,
          branchId: branchIdForBursa, // Zorunlu
          registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
          positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
          // Çalışma bilgileri (zorunlu)
          workingProvinceId: bursaWorkingProvinceId,
          workingDistrictId: bursaWorkingDistrictId,
          institutionId: bursaInstitutionId,
          createdByUserId: users[Math.floor(Math.random() * users.length)],
          approvedByUserId: status === MemberStatus.ACTIVE
            ? users[Math.floor(Math.random() * users.length)]
            : null,
          approvedAt,
          createdAt: memberCreatedAt,
          updatedAt: memberCreatedAt,
        },
      });
      memberIds.push(member.id);
      memberRegistrationCounter++;
    }
    console.log(`   - Bursa ili için 10 üye eklendi`);
  } else {
    console.log(`   ⚠️  Bursa ili bulunamadı, üye eklenemedi`);
  }

  // 10. Üyeler için gerekli güncellemeler tamamlandı

  // 11. Mevcut üyelere ilçe ataması (eğer ilçeleri yoksa)
  console.log('📍 Mevcut üyelere ilçe atanıyor...');
  const membersWithoutDistrict = await prisma.member.findMany({
    where: {
      districtId: null,
      provinceId: { not: null },
      deletedAt: null,
    },
    select: {
      id: true,
      provinceId: true,
    },
  });

  let districtUpdateCount = 0;
  for (const member of membersWithoutDistrict) {
    if (member.provinceId) {
      // Bu ile ait district'leri bul
      const districtsInProvince = await prisma.district.findMany({
        where: { provinceId: member.provinceId },
        select: { id: true },
      });

      if (districtsInProvince.length > 0) {
        // Rastgele bir ilçe seç
        const randomDistrict = districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)];
        
        await prisma.member.update({
          where: { id: member.id },
          data: { districtId: randomDistrict.id },
        });
        districtUpdateCount++;
      }
    }
  }
  if (districtUpdateCount > 0) {
    console.log(`   - ${districtUpdateCount} üyeye ilçe atandı`);
  }

  console.log('✅ Seed işlemi tamamlandı!');
  console.log(`   - ${TURKISH_PROVINCES.length} il eklendi`);
  console.log(`   - ${ilceCount} ilçe eklendi`);
  console.log(`   - ${Object.keys(customRoleMap).length} özel rol eklendi`);
  console.log(`   - ${users.length} kullanıcı eklendi`);
  console.log(`   - ${workplaceMap.length} işyeri eklendi`);
  console.log(`   - ${dealerMap.length} bayi eklendi`);
  console.log(`   - ${memberIds.length} üye eklendi`);
  
  const pendingCount = await prisma.member.count({ where: { status: MemberStatus.PENDING } });
  const rejectedCount = await prisma.member.count({ where: { status: MemberStatus.REJECTED } });
  const activeCount = await prisma.member.count({ where: { status: MemberStatus.ACTIVE } });
  
  console.log(`   - ${activeCount} aktif üye`);
  console.log(`   - ${pendingCount} bekleyen başvuru`);
  console.log(`   - ${rejectedCount} reddedilen üye`);
  

  // 11. Bu ay gelen üyeler ve bu ay iptal edilen üyeler oluştur
  console.log('📅 Bu ay gelen ve iptal edilen üyeler ayarlanıyor...');
  
  // Aktif üyeleri al
  const allActiveMembers = await prisma.member.findMany({
    where: {
      status: MemberStatus.ACTIVE,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });

  if (allActiveMembers.length > 0) {
    // Bu ay gelen üyeler: 3-5 üyeyi bu ay içinde onaylanmış olarak işaretle
    const thisMonthNewCount = Math.min(3 + Math.floor(Math.random() * 3), allActiveMembers.length);
    const thisMonthNewMembers = allActiveMembers.slice(0, thisMonthNewCount);
    
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthDay = 1 + Math.floor(Math.random() * 28); // Ayın rastgele bir günü
    const thisMonthDate = new Date(currentYear, currentMonth, thisMonthDay);

    for (const member of thisMonthNewMembers) {
      await prisma.member.update({
        where: { id: member.id },
        data: {
          approvedAt: thisMonthDate,
          updatedAt: thisMonthDate,
        },
      });
    }
    console.log(`   - ${thisMonthNewMembers.length} üye bu ay içinde onaylanmış olarak işaretlendi`);

    // Bu ay iptal edilen üyeler: 2-4 üyeyi iptal et
    const remainingMembers = allActiveMembers.slice(thisMonthNewCount);
    let thisMonthCancelledCount = 0;
    if (remainingMembers.length > 0) {
      thisMonthCancelledCount = Math.min(2 + Math.floor(Math.random() * 3), remainingMembers.length);
      const thisMonthCancelledMembers = remainingMembers.slice(0, thisMonthCancelledCount);
      
      const cancellationReasons = [
        'İstifa talebi',
        'Üyelik aidatını ödememe',
        'Sendika tüzüğüne aykırı davranış',
        'Kendi isteği ile ayrılma',
        'İşyerinden ayrılma',
        'Üyelik şartlarını yerine getirememe',
      ];
      
      const cancellationStatuses: MemberStatus[] = [
        MemberStatus.RESIGNED,
        MemberStatus.EXPELLED,
        MemberStatus.INACTIVE,
      ];

      for (const member of thisMonthCancelledMembers) {
        const cancellationReason = cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)];
        const cancellationStatus = cancellationStatuses[Math.floor(Math.random() * cancellationStatuses.length)];
        let cancelledAt = new Date(currentYear, currentMonth, thisMonthDay + Math.floor(Math.random() * 10)); // Bu ay içinde rastgele bir gün
        // Gelecekteki tarih olmamalı
        if (cancelledAt > now) {
          cancelledAt = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // Bugünden 0-7 gün önce
        }
        
        const cancellingUser = users[Math.floor(Math.random() * users.length)];
        await prisma.member.update({
          where: { id: member.id },
          data: {
            status: cancellationStatus,
            cancellationReason,
            cancelledAt,
            cancelledByUserId: cancellingUser,
            updatedAt: cancelledAt,
          },
        });
      }
      console.log(`   - ${thisMonthCancelledMembers.length} üye bu ay içinde iptal edildi`);
    }

    // Geçmiş aylarda iptal edilmiş üyeler: 5-8 üyeyi geçmiş aylarda iptal et
    const remainingForPastCancellation = allActiveMembers.slice(thisMonthNewCount + (remainingMembers.length > 0 ? thisMonthCancelledCount : 0));
    if (remainingForPastCancellation.length > 0) {
      const pastCancelledCount = Math.min(5 + Math.floor(Math.random() * 4), remainingForPastCancellation.length);
      const pastCancelledMembers = remainingForPastCancellation.slice(0, pastCancelledCount);
      
      const cancellationReasons = [
        'İstifa talebi',
        'Üyelik aidatını ödememe',
        'Sendika tüzüğüne aykırı davranış',
        'Kendi isteği ile ayrılma',
        'İşyerinden ayrılma',
        'Üyelik şartlarını yerine getirememe',
      ];
      
      const cancellationStatuses: MemberStatus[] = [
        MemberStatus.RESIGNED,
        MemberStatus.EXPELLED,
        MemberStatus.INACTIVE,
      ];

      for (const member of pastCancelledMembers) {
        const cancellationReason = cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)];
        const cancellationStatus = cancellationStatuses[Math.floor(Math.random() * cancellationStatuses.length)];
        
        // 1-5 ay önce iptal edilmiş
        const monthsAgo = 1 + Math.floor(Math.random() * 5);
        let cancelledAt = new Date(now);
        cancelledAt.setMonth(cancelledAt.getMonth() - monthsAgo);
        cancelledAt.setDate(1 + Math.floor(Math.random() * 28));
        // Gelecekteki tarih olmamalı
        if (cancelledAt > now) {
          cancelledAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Bugünden 0-30 gün önce
        }
        
        const cancellingUser = users[Math.floor(Math.random() * users.length)];
        await prisma.member.update({
          where: { id: member.id },
          data: {
            status: cancellationStatus,
            cancellationReason,
            cancelledAt,
            cancelledByUserId: cancellingUser,
            updatedAt: cancelledAt,
          },
        });
      }
      console.log(`   - ${pastCancelledMembers.length} üye geçmiş aylarda iptal edildi`);
    }
  }

  // 12. Yeniden üye olan üyeler oluştur (iptal edilmiş üyelerden bazıları yeniden üye olmuş)
  console.log('🔄 Yeniden üye olan üyeler oluşturuluyor...');
  
  // İptal edilmiş üyeleri al (TC kimlik numarası olanlar)
  const cancelledMembers = await prisma.member.findMany({
    where: {
      status: {
        in: [MemberStatus.RESIGNED, MemberStatus.EXPELLED, MemberStatus.INACTIVE],
      },
      // nationalId artık zorunlu olduğu için filtrelemeye gerek yok
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nationalId: true,
      phone: true,
      email: true,
      provinceId: true,
      districtId: true,
      workingProvinceId: true,
      workingDistrictId: true,
      institutionId: true,
      source: true,
      cancelledAt: true,
    },
    orderBy: {
      cancelledAt: 'desc',
    },
  });

  if (cancelledMembers.length > 0) {
    // 3-5 iptal edilmiş üyeyi yeniden üye yap
    const reRegisterCount = Math.min(3 + Math.floor(Math.random() * 3), cancelledMembers.length);
    const membersToReRegister = cancelledMembers.slice(0, reRegisterCount);

    for (const cancelledMember of membersToReRegister) {
      // İptal edilme tarihinden sonra yeniden üye olmuş (1-6 ay sonra)
      const cancelledDate = cancelledMember.cancelledAt || new Date(now);
      const monthsAfterCancellation = 1 + Math.floor(Math.random() * 6);
      const reRegisteredAt = new Date(cancelledDate);
      reRegisteredAt.setMonth(reRegisteredAt.getMonth() + monthsAfterCancellation);
      reRegisteredAt.setDate(1 + Math.floor(Math.random() * 28));
      // Gelecekteki tarih olmamalı
      if (reRegisteredAt > now) {
        reRegisteredAt.setTime(now.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000); // Bugünden 0-90 gün önce
      }

      // Üyeyi onayla (ACTIVE yap)
      let approvedAt = new Date(reRegisteredAt);
      approvedAt.setDate(approvedAt.getDate() + 3 + Math.floor(Math.random() * 5)); // 3-7 gün sonra onaylanmış
      // Gelecekteki tarih olmamalı
      if (approvedAt > now) {
        approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Bugünden 0-30 gün önce
      }

      // İptal edilmiş üyeyi güncelle - yeniden aktif yap
      // Önceki iptal kaydını kendisine bağla (previousCancelledMemberId = kendi id'si)
      // Ama bu mantıklı değil, bu yüzden yeni bir kayıt oluşturmak yerine mevcut kaydı güncelleyelim
      // Ancak nationalId unique olduğu için, yeni bir kayıt oluşturamayız
      // Çözüm: İptal edilmiş üyenin TC'sini geçici olarak değiştir, yeni kayıt oluştur, sonra eski kaydı sil
      
      // Geçici olarak TC'yi değiştir (unique constraint'i bypass etmek için)
      // nationalId artık zorunlu, bu yüzden cancelledMember.nationalId her zaman olmalı
      if (!cancelledMember.nationalId) {
        console.warn(`⚠️  İptal edilmiş üyenin TC'si yok, atlanıyor: ${cancelledMember.id}`);
        continue;
      }
      const tempNationalId = `${cancelledMember.nationalId}_temp_${Date.now()}`;
      
      await prisma.member.update({
        where: { id: cancelledMember.id },
        data: {
          nationalId: tempNationalId, // Geçici olarak değiştir
        },
      });

      // Yeni üye kaydı oluştur (PENDING durumunda)
      const branchIdForReRegister = allBranches.length > 0 
        ? allBranches[Math.floor(Math.random() * allBranches.length)].id
        : defaultBranchId;

      // Çalışma bilgileri (zorunlu) - cancelledMember'dan al veya fallback
      const reRegisterWorkingProvinceId = cancelledMember.workingProvinceId || cancelledMember.provinceId || provinceIds[0];
      let reRegisterWorkingDistrictId = cancelledMember.workingDistrictId || cancelledMember.districtId;
      if (!reRegisterWorkingDistrictId) {
        const fallbackDistrict = await prisma.district.findFirst({ 
          where: { provinceId: reRegisterWorkingProvinceId },
          select: { id: true } 
        });
        if (!fallbackDistrict) {
          console.warn(`⚠️  Çalışma ilçesi bulunamadı, yeniden üye kaydı atlanıyor: ${cancelledMember.id}`);
          continue;
        }
        reRegisterWorkingDistrictId = fallbackDistrict.id;
      }
      
      let reRegisterInstitutionId = cancelledMember.institutionId;
      if (!reRegisterInstitutionId) {
        const fallbackInstitution = await prisma.institution.findFirst({ select: { id: true } });
        if (!fallbackInstitution) {
          console.warn(`⚠️  Institution bulunamadı, yeniden üye kaydı atlanıyor: ${cancelledMember.id}`);
          continue;
        }
        reRegisterInstitutionId = fallbackInstitution.id;
      }

      const newMember = await prisma.member.create({
        data: {
          firstName: cancelledMember.firstName,
          lastName: cancelledMember.lastName,
          nationalId: cancelledMember.nationalId, // Orijinal TC'yi kullan
          phone: cancelledMember.phone,
          email: cancelledMember.email,
          source: cancelledMember.source || MemberSource.DIRECT,
          status: MemberStatus.PENDING,
          provinceId: cancelledMember.provinceId,
          districtId: cancelledMember.districtId,
          branchId: branchIdForReRegister, // Zorunlu
          previousCancelledMemberId: cancelledMember.id, // Önceki iptal kaydına bağla
          registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
          positionTitle: positionTitlesForMembers[Math.floor(Math.random() * positionTitlesForMembers.length)],
          // Çalışma bilgileri (zorunlu)
          workingProvinceId: reRegisterWorkingProvinceId,
          workingDistrictId: reRegisterWorkingDistrictId,
          institutionId: reRegisterInstitutionId,
          createdByUserId: users[Math.floor(Math.random() * users.length)],
          createdAt: reRegisteredAt,
          updatedAt: reRegisteredAt,
        },
      });
      memberRegistrationCounter++;

      // Üyeyi onayla (ACTIVE yap)
      const approvingUser = users[Math.floor(Math.random() * users.length)];
      await prisma.member.update({
        where: { id: newMember.id },
        data: {
          status: MemberStatus.ACTIVE,
          approvedAt,
          approvedByUserId: approvingUser,
          updatedAt: approvedAt,
        },
      });

      // Eski iptal edilmiş kaydı sil (soft delete veya hard delete)
      // Soft delete yapalım - verileri koruyalım ama listede görünmesin
      await prisma.member.update({
        where: { id: cancelledMember.id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });
    }
    console.log(`   - ${membersToReRegister.length} iptal edilmiş üye yeniden üye olarak kaydedildi`);
  }

  // 🔹 İçerik Yönetimi - Örnek içerikler
  console.log('📰 İçerikler ekleniyor...');
  const activeUsers = await prisma.user.findMany({ where: { isActive: true }, take: 5 });
  if (activeUsers.length > 0) {
    const contents = [
      {
        title: 'Yeni Üyelik Kampanyası Başladı',
        content: '2025 yılı için özel üyelik kampanyamız başlamıştır. Tüm üyelerimize özel avantajlar sunulmaktadır.',
        type: ContentType.ANNOUNCEMENT,
        status: ContentStatus.PUBLISHED,
        authorId: activeUsers[0].id,
        publishedAt: new Date(),
      },
      {
        title: 'Genel Kurul Toplantısı',
        content: '2025 yılı genel kurul toplantımız 15 Mart tarihinde yapılacaktır. Tüm üyelerimiz davetlidir.',
        type: ContentType.EVENT,
        status: ContentStatus.PUBLISHED,
        authorId: activeUsers[0].id,
        publishedAt: new Date(),
      },
      {
        title: 'Sektördeki Gelişmeler',
        content: 'Sektörümüzdeki son gelişmeler ve yeni düzenlemeler hakkında bilgilendirme yazısı.',
        type: ContentType.NEWS,
        status: ContentStatus.DRAFT,
        authorId: activeUsers[1]?.id || activeUsers[0].id,
      },
      {
        title: 'Aidat Ödemeleri Hakkında',
        content: 'Aidat ödemelerinizi zamanında yapmanız önemlidir. Ödeme tarihleri ve yöntemleri hakkında bilgi.',
        type: ContentType.ANNOUNCEMENT,
        status: ContentStatus.PUBLISHED,
        authorId: activeUsers[0].id,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
      },
    ];

    for (const content of contents) {
      await prisma.content.create({ data: content });
    }
    console.log(`   - ${contents.length} içerik eklendi`);
  }

  // 🔹 Doküman Şablonları
  console.log('📄 Doküman şablonları ekleniyor...');
  const templates = [
    {
      name: 'Üye Sertifikası',
      description: 'Üyelik sertifikası için standart şablon - Detaylı format',
      template: `═══════════════════════════════════════════════════════════
                    ÜYE SERTİFİKASI
═══════════════════════════════════════════════════════════

Bu sertifika, {{firstName}} {{lastName}} adlı kişinin sendikamıza 
üye olduğunu ve sendika üyeliğinin aktif olduğunu belgeler.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
TC Kimlik No      : {{nationalId}}
Üyelik Tarihi     : {{joinDate}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}
Telefon           : {{phone}}
E-posta           : {{email}}

═══════════════════════════════════════════════════════════

Bu sertifika {{date}} tarihinde düzenlenmiştir.

Saygılarımızla,
Sendika Yönetimi

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.MEMBER_CERTIFICATE,
      isActive: true,
    },
    {
      name: 'Üye Kartı',
      description: 'Üye kimlik kartı şablonu - Profesyonel format',
      template: `┌─────────────────────────────────────────┐
│         SENDİKA ÜYE KARTI              │
├─────────────────────────────────────────┤
│                                         │
│  AD SOYAD                               │
│  {{firstName}} {{lastName}}            │
│                                         │
│  ÜYE NO: {{memberNumber}}              │
│  TC KİMLİK: {{nationalId}}             │
│                                         │
│  İL: {{province}}                      │
│  İLÇE: {{district}}                    │
│  KURUM: {{institution}}                │
│                                         │
│  ÜYELİK TARİHİ: {{joinDate}}           │
│  GEÇERLİLİK: {{validUntil}}            │
│                                         │
│  [Fotoğraf Alanı]                      │
│                                         │
│  Bu kart, sendika üyeliğini belgeler.  │
│                                         │
└─────────────────────────────────────────┘`,
      type: DocumentTemplateType.MEMBER_CARD,
      isActive: true,
    },
    {
      name: 'Genel Mektup',
      description: 'Genel amaçlı mektup şablonu - Resmi format',
      template: `═══════════════════════════════════════════════════════════
                    RESMİ YAZIŞMA
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

{{content}}

Yukarıda belirtilen konu hakkında bilgilerinize sunulur.

Saygılarımızla,

Sendika Yönetimi
{{date}}

═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.LETTER,
      isActive: true,
    },
    {
      name: 'İstifa Belgesi',
      description: 'Üye istifa belgesi şablonu',
      template: `═══════════════════════════════════════════════════════════
                    İSTİFA BELGESİ
═══════════════════════════════════════════════════════════

Sayın Sendika Yönetimi,

{{firstName}} {{lastName}} (Üye No: {{memberNumber}}, TC: {{nationalId}})
adlı üyemiz, {{date}} tarihinde sendikamızdan istifa etmiştir.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
TC Kimlik No      : {{nationalId}}
Üyelik Tarihi     : {{joinDate}}
İstifa Tarihi     : {{date}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}

═══════════════════════════════════════════════════════════

İstifa nedeni: {{resignationReason}}

Bu belge {{date}} tarihinde düzenlenmiştir.

Saygılarımızla,
Sendika Yönetimi

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.RESIGNATION_LETTER,
      isActive: true,
    },
    {
      name: 'İhraç Belgesi',
      description: 'Üye ihraç belgesi şablonu',
      template: `═══════════════════════════════════════════════════════════
                    İHRAÇ BELGESİ
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

Sendika tüzüğü ve yönetmeliklerine aykırı davranışlarınız nedeniyle,
sendika yönetim kurulu kararı ile sendikamızdan ihraç edilmiş bulunmaktasınız.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
TC Kimlik No      : {{nationalId}}
Üyelik Tarihi     : {{joinDate}}
İhraç Tarihi      : {{date}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}

═══════════════════════════════════════════════════════════
                    İHRAÇ NEDENİ
═══════════════════════════════════════════════════════════

{{expulsionReason}}

═══════════════════════════════════════════════════════════

Bu karar {{date}} tarihinde alınmış olup, itiraz hakkınız saklıdır.

Saygılarımızla,
Sendika Yönetim Kurulu
{{date}}

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.EXPULSION_LETTER,
      isActive: true,
    },
    {
      name: 'Onay Belgesi',
      description: 'Üyelik onay belgesi şablonu',
      template: `═══════════════════════════════════════════════════════════
                    ÜYELİK ONAY BELGESİ
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

Üyelik başvurunuz incelenmiş ve sendika yönetim kurulu tarafından 
onaylanmıştır. Sendikamıza hoş geldiniz.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
TC Kimlik No      : {{nationalId}}
Başvuru Tarihi    : {{applicationDate}}
Onay Tarihi       : {{date}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}
Telefon           : {{phone}}
E-posta           : {{email}}

═══════════════════════════════════════════════════════════

Üyelik hak ve yükümlülükleriniz hakkında bilgi almak için 
sendika merkezimizle iletişime geçebilirsiniz.

Bu belge {{date}} tarihinde düzenlenmiştir.

Saygılarımızla,
Sendika Yönetim Kurulu
{{date}}

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.APPROVAL_CERTIFICATE,
      isActive: true,
    },
    {
      name: 'Davet Mektubu',
      description: 'Etkinlik ve toplantı davet mektubu şablonu',
      template: `═══════════════════════════════════════════════════════════
                    DAVET MEKTUBU
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

Sendikamız tarafından düzenlenecek olan etkinliğimize katılımınızı 
rica ederiz.

═══════════════════════════════════════════════════════════
                    ETKİNLİK BİLGİLERİ
═══════════════════════════════════════════════════════════

Etkinlik Adı      : {{eventName}}
Tarih             : {{eventDate}}
Saat              : {{eventTime}}
Yer               : {{eventLocation}}
Adres             : {{eventAddress}}

═══════════════════════════════════════════════════════════

{{eventDescription}}

Katılımınızı bekler, saygılarımızı sunarız.

Saygılarımızla,
Sendika Yönetimi
{{date}}

Not: Katılım durumunuzu {{confirmationDate}} tarihine kadar 
bildirmenizi rica ederiz.
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.INVITATION_LETTER,
      isActive: true,
    },
    {
      name: 'Tebrik Mektubu',
      description: 'Başarı ve özel günler için tebrik mektubu şablonu',
      template: `═══════════════════════════════════════════════════════════
                    TEBRİK MEKTUBU
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

{{congratulationReason}}

Bu başarınızdan dolayı sizi tebrik eder, başarılarınızın devamını dileriz.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}

═══════════════════════════════════════════════════════════

Sendikamız adına sizlere teşekkür eder, çalışmalarınızda başarılar dileriz.

Saygılarımızla,
Sendika Yönetimi
{{date}}

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.CONGRATULATION_LETTER,
      isActive: true,
    },
    {
      name: 'Uyarı Mektubu',
      description: 'Üye uyarı mektubu şablonu',
      template: `═══════════════════════════════════════════════════════════
                    UYARI MEKTUBU
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

Sendika tüzüğü ve yönetmeliklerine uygun davranmanız gerektiği 
konusunda sizi uyarmak zorundayız.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
TC Kimlik No      : {{nationalId}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}

═══════════════════════════════════════════════════════════
                    UYARI NEDENİ
═══════════════════════════════════════════════════════════

{{warningReason}}

═══════════════════════════════════════════════════════════

Bu uyarıyı dikkate almanız ve gerekli düzenlemeleri yapmanız 
beklenmektedir. Aksi takdirde sendika yönetim kurulu gerekli 
yasal işlemleri başlatacaktır.

Bu uyarı {{date}} tarihinde yapılmıştır.

Saygılarımızla,
Sendika Yönetim Kurulu
{{date}}

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.WARNING_LETTER,
      isActive: true,
    },
    {
      name: 'Bildirim Mektubu',
      description: 'Genel bildirim mektubu şablonu',
      template: `═══════════════════════════════════════════════════════════
                    BİLDİRİM MEKTUBU
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

Aşağıda belirtilen konu hakkında bilgilerinize sunulur.

═══════════════════════════════════════════════════════════
                    BİLDİRİM KONUSU
═══════════════════════════════════════════════════════════

{{notificationSubject}}

═══════════════════════════════════════════════════════════
                    BİLDİRİM İÇERİĞİ
═══════════════════════════════════════════════════════════

{{notificationContent}}

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}

═══════════════════════════════════════════════════════════

Bu bildirim {{date}} tarihinde yapılmıştır.

Saygılarımızla,
Sendika Yönetimi
{{date}}

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.NOTIFICATION_LETTER,
      isActive: true,
    },
    {
      name: 'Üyelik Başvuru Formu',
      description: 'Yeni üyelik başvuru formu şablonu',
      template: `═══════════════════════════════════════════════════════════
                    ÜYELİK BAŞVURU FORMU
═══════════════════════════════════════════════════════════

Bu form, sendikamıza üyelik başvurusu yapmak isteyen adaylar 
için doldurulacaktır.

═══════════════════════════════════════════════════════════
                    KİŞİSEL BİLGİLER
═══════════════════════════════════════════════════════════

Ad                : {{firstName}}
Soyad             : {{lastName}}
TC Kimlik No      : {{nationalId}}
Doğum Tarihi      : {{birthDate}}
Doğum Yeri        : {{birthPlace}}
Cinsiyet          : {{gender}}
Medeni Durum      : {{maritalStatus}}
Telefon           : {{phone}}
E-posta           : {{email}}
Adres             : {{address}}

═══════════════════════════════════════════════════════════
                    İŞ BİLGİLERİ
═══════════════════════════════════════════════════════════

İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}
Pozisyon          : {{position}}
İşe Başlama Tarihi: {{employmentDate}}

═══════════════════════════════════════════════════════════
                    EĞİTİM BİLGİLERİ
═══════════════════════════════════════════════════════════

Eğitim Durumu     : {{educationStatus}}
Mezun Olduğu Okul : {{schoolName}}
Bölüm             : {{department}}

═══════════════════════════════════════════════════════════

Başvuru Tarihi    : {{applicationDate}}
Başvuru Durumu    : {{applicationStatus}}

Yukarıdaki bilgilerin doğruluğunu taahhüt ederim.

Başvuranın İmzası: _________________

Tarih: {{date}}
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.MEMBERSHIP_APPLICATION,
      isActive: true,
    },
    {
      name: 'Nakil Belgesi',
      description: 'Üye nakil belgesi şablonu',
      template: `═══════════════════════════════════════════════════════════
                    ÜYE NAKİL BELGESİ
═══════════════════════════════════════════════════════════

Sayın {{firstName}} {{lastName}},

Üyemiz {{firstName}} {{lastName}} (Üye No: {{memberNumber}}) 
adlı üyemizin nakil işlemi aşağıdaki bilgiler doğrultusunda 
gerçekleştirilmiştir.

═══════════════════════════════════════════════════════════
                    ÜYE BİLGİLERİ
═══════════════════════════════════════════════════════════

Ad Soyad          : {{firstName}} {{lastName}}
Üye Numarası      : {{memberNumber}}
TC Kimlik No      : {{nationalId}}
Üyelik Tarihi     : {{joinDate}}
Nakil Tarihi      : {{date}}

═══════════════════════════════════════════════════════════
                    NAKİL BİLGİLERİ
═══════════════════════════════════════════════════════════

ESKİ BİLGİLER:
İl                : {{oldProvince}}
İlçe              : {{oldDistrict}}
Kurum             : {{oldInstitution}}
Şube              : {{oldBranch}}

YENİ BİLGİLER:
İl                : {{province}}
İlçe              : {{district}}
Kurum             : {{institution}}
Şube              : {{branch}}

Nakil Nedeni      : {{transferReason}}

═══════════════════════════════════════════════════════════

Bu nakil işlemi {{date}} tarihinde gerçekleştirilmiştir.

Saygılarımızla,
Sendika Yönetimi
{{date}}

[İmza Alanı]
═══════════════════════════════════════════════════════════`,
      type: DocumentTemplateType.TRANSFER_CERTIFICATE,
      isActive: true,
    },
  ];

  for (const template of templates) {
    await prisma.documentTemplate.create({ data: template });
  }
  console.log(`   - ${templates.length} doküman şablonu eklendi`);

  // 🔹 Sistem Ayarları
  console.log('⚙️  Sistem ayarları ekleniyor...');
  const settings = [
    // GENEL AYARLAR
    {
      key: 'SITE_NAME',
      value: 'Sendika Yönetim Sistemi',
      description: 'Site adı',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'SITE_LOGO_URL',
      value: '/logo.png',
      description: 'Site logo URL',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'DEFAULT_LANGUAGE',
      value: 'tr',
      description: 'Varsayılan dil (tr, en)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'TIMEZONE',
      value: 'Europe/Istanbul',
      description: 'Zaman dilimi',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'DATE_FORMAT',
      value: 'DD.MM.YYYY',
      description: 'Tarih formatı',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'PAGINATION_SIZE',
      value: '25',
      description: 'Varsayılan sayfalama boyutu',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'SESSION_TIMEOUT',
      value: '1440',
      description: 'Oturum süresi (dakika)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'MAX_FILE_SIZE',
      value: '10485760',
      description: 'Maksimum dosya boyutu (byte)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'Bakım modu (true/false)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'MAINTENANCE_MESSAGE',
      value: 'Sistem bakımda. Lütfen daha sonra tekrar deneyin.',
      description: 'Bakım modu mesajı',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    // E-POSTA AYARLARI
    {
      key: 'EMAIL_ENABLED',
      value: 'true',
      description: 'E-posta gönderimi aktif/pasif',
      category: SystemSettingCategory.EMAIL,
      isEditable: true,
    },
    {
      key: 'EMAIL_FROM_ADDRESS',
      value: 'noreply@sendika.org',
      description: 'Varsayılan gönderen e-posta adresi',
      category: SystemSettingCategory.EMAIL,
      isEditable: true,
    },
    {
      key: 'EMAIL_FROM_NAME',
      value: 'Sendika Yönetim Sistemi',
      description: 'Varsayılan gönderen adı',
      category: SystemSettingCategory.EMAIL,
      isEditable: true,
    },
    {
      key: 'EMAIL_AWS_REGION',
      value: 'us-east-1',
      description: 'AWS SES bölgesi',
      category: SystemSettingCategory.EMAIL,
      isEditable: true,
    },
    {
      key: 'EMAIL_AWS_ACCESS_KEY_ID',
      value: '',
      description: 'AWS SES Access Key ID (boş bırakılırsa environment variable kullanılır)',
      category: SystemSettingCategory.EMAIL,
      isEditable: true,
    },
    {
      key: 'EMAIL_AWS_SECRET_ACCESS_KEY',
      value: '',
      description: 'AWS SES Secret Access Key (boş bırakılırsa environment variable kullanılır)',
      category: SystemSettingCategory.EMAIL,
      isEditable: true,
    },
    // SMS AYARLARI
    {
      key: 'SMS_ENABLED',
      value: 'true',
      description: 'SMS gönderimi aktif/pasif',
      category: SystemSettingCategory.SMS,
      isEditable: true,
    },
    {
      key: 'SMS_NETGSM_USERNAME',
      value: '',
      description: 'NetGSM kullanıcı adı (boş bırakılırsa environment variable kullanılır)',
      category: SystemSettingCategory.SMS,
      isEditable: true,
    },
    {
      key: 'SMS_NETGSM_PASSWORD',
      value: '',
      description: 'NetGSM şifre (boş bırakılırsa environment variable kullanılır)',
      category: SystemSettingCategory.SMS,
      isEditable: true,
    },
    {
      key: 'SMS_NETGSM_MSG_HEADER',
      value: '',
      description: 'NetGSM mesaj başlığı (boş bırakılırsa environment variable kullanılır)',
      category: SystemSettingCategory.SMS,
      isEditable: true,
    },
    {
      key: 'SMS_NETGSM_API_URL',
      value: 'https://api.netgsm.com.tr/sms/send/get',
      description: 'NetGSM API URL',
      category: SystemSettingCategory.SMS,
      isEditable: true,
    },
    // ÜYELİK AYARLARI
    {
      key: 'MEMBERSHIP_AUTO_APPROVE',
      value: 'false',
      description: 'Üyelik başvurularını otomatik onayla',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_DEFAULT_STATUS',
      value: 'PENDING',
      description: 'Varsayılan üyelik durumu (PENDING, ACTIVE)',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_APPROVAL',
      value: 'true',
      description: 'Üyelik onayı zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_MIN_AGE',
      value: '18',
      description: 'Minimum üyelik yaşı',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    // AİDAT AYARLARI
    {
      key: 'DUES_DEFAULT_AMOUNT',
      value: '100',
      description: 'Varsayılan aidat tutarı (TL)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    {
      key: 'DUES_DEFAULT_PERIOD',
      value: 'MONTHLY',
      description: 'Varsayılan ödeme periyodu (MONTHLY, YEARLY)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    {
      key: 'DUES_LATE_FEE_RATE',
      value: '0.05',
      description: 'Gecikme cezası oranı (0.05 = %5)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    {
      key: 'DUES_REMINDER_DAYS',
      value: '7',
      description: 'Borç hatırlatma gün sayısı (ödeme tarihinden önce)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    {
      key: 'DUES_GRACE_PERIOD_DAYS',
      value: '15',
      description: 'Ödeme erteleme süresi (gün)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    // GÜVENLİK AYARLARI
    {
      key: 'SECURITY_PASSWORD_MIN_LENGTH',
      value: '8',
      description: 'Minimum şifre uzunluğu',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_PASSWORD_REQUIRE_UPPERCASE',
      value: 'true',
      description: 'Şifrede büyük harf zorunlu mu?',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_PASSWORD_REQUIRE_LOWERCASE',
      value: 'true',
      description: 'Şifrede küçük harf zorunlu mu?',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_PASSWORD_REQUIRE_NUMBER',
      value: 'true',
      description: 'Şifrede rakam zorunlu mu?',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_PASSWORD_REQUIRE_SPECIAL',
      value: 'false',
      description: 'Şifrede özel karakter zorunlu mu?',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_SESSION_TIMEOUT',
      value: '1440',
      description: 'Oturum zaman aşımı (dakika)',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_MAX_LOGIN_ATTEMPTS',
      value: '5',
      description: 'Maksimum giriş denemesi',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_LOCKOUT_DURATION',
      value: '30',
      description: 'Hesap kilitlenme süresi (dakika)',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    {
      key: 'SECURITY_2FA_ENABLED',
      value: 'false',
      description: 'İki faktörlü kimlik doğrulama aktif mi?',
      category: SystemSettingCategory.SECURITY,
      isEditable: true,
    },
    // BİLDİRİM AYARLARI
    {
      key: 'NOTIFICATION_EMAIL_ENABLED',
      value: 'true',
      description: 'E-posta bildirimleri aktif mi?',
      category: SystemSettingCategory.NOTIFICATION,
      isEditable: true,
    },
    {
      key: 'NOTIFICATION_SMS_ENABLED',
      value: 'true',
      description: 'SMS bildirimleri aktif mi?',
      category: SystemSettingCategory.NOTIFICATION,
      isEditable: true,
    },
    {
      key: 'NOTIFICATION_IN_APP_ENABLED',
      value: 'true',
      description: 'Uygulama içi bildirimler aktif mi?',
      category: SystemSettingCategory.NOTIFICATION,
      isEditable: true,
    },
    {
      key: 'NOTIFICATION_DUES_REMINDER_ENABLED',
      value: 'true',
      description: 'Aidat hatırlatma bildirimleri aktif mi?',
      category: SystemSettingCategory.NOTIFICATION,
      isEditable: true,
    },
    {
      key: 'NOTIFICATION_MEMBERSHIP_APPROVAL_ENABLED',
      value: 'true',
      description: 'Üyelik onay bildirimleri aktif mi?',
      category: SystemSettingCategory.NOTIFICATION,
      isEditable: true,
    },
    // UI AYARLARI
    {
      key: 'UI_THEME',
      value: 'light',
      description: 'Varsayılan tema (light, dark, auto)',
      category: SystemSettingCategory.UI,
      isEditable: true,
    },
    {
      key: 'UI_PRIMARY_COLOR',
      value: '#1976d2',
      description: 'Birincil renk (hex)',
      category: SystemSettingCategory.UI,
      isEditable: true,
    },
    {
      key: 'UI_SHOW_BREADCRUMBS',
      value: 'true',
      description: 'Breadcrumb göster',
      category: SystemSettingCategory.UI,
      isEditable: true,
    },
    {
      key: 'UI_SHOW_NOTIFICATIONS',
      value: 'true',
      description: 'Bildirim ikonu göster',
      category: SystemSettingCategory.UI,
      isEditable: true,
    },
    // ENTEGRASYON AYARLARI
    {
      key: 'PAYMENT_GATEWAY',
      value: 'iyzico',
      description: 'Ödeme gateway',
      category: SystemSettingCategory.INTEGRATION,
      isEditable: true,
    },
    {
      key: 'PAYMENT_GATEWAY_API_KEY',
      value: '',
      description: 'Ödeme gateway API anahtarı',
      category: SystemSettingCategory.INTEGRATION,
      isEditable: true,
    },
    {
      key: 'PAYMENT_GATEWAY_SECRET_KEY',
      value: '',
      description: 'Ödeme gateway gizli anahtarı',
      category: SystemSettingCategory.INTEGRATION,
      isEditable: true,
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`   - ${settings.length} sistem ayarı eklendi`);

  // 🔹 Şubeler (zaten üyelerden önce eklendi, burada tekrar eklemeye gerek yok)

  // 🔹 Örnek Bildirimler
  console.log('📢 Bildirimler ekleniyor...');
  const provincesForNotifications = await prisma.province.findMany({ take: 1 });
  if (activeUsers.length > 0 && provincesForNotifications.length > 0) {
    const notifications = [
      // Genel bildirimler
      {
        title: 'Hoş Geldiniz',
        message: 'Sendika yönetim sistemine hoş geldiniz. Tüm üyelerimize başarılar dileriz.',
        category: NotificationCategory.ANNOUNCEMENT,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.ALL_MEMBERS,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 gün önce
        sentBy: activeUsers[0].id,
        recipientCount: 100,
        successCount: 95,
        failedCount: 5,
      },
      {
        title: 'Aidat Hatırlatması',
        message: 'Aidat ödemelerinizi zamanında yapmanızı rica ederiz.',
        category: NotificationCategory.FINANCIAL,
        typeCategory: NotificationTypeCategory.DUES_OVERDUE,
        channels: [NotificationChannel.EMAIL],
        targetType: NotificationTargetType.REGION,
        targetId: provincesForNotifications[0].id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
        sentBy: activeUsers[0].id,
        recipientCount: 25,
        successCount: 23,
        failedCount: 2,
      },
      // Admin kullanıcısına özel bildirimler
      {
        title: 'Yeni Üye Başvurusu Bekliyor',
        message: 'Sistemde onay bekleyen 5 yeni üye başvurusu bulunmaktadır. Lütfen kontrol ediniz.',
        category: NotificationCategory.SYSTEM,
        typeCategory: NotificationTypeCategory.MEMBER_APPLICATION_NEW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
        actionUrl: '/members?status=PENDING',
        actionLabel: 'Başvuruları Görüntüle',
      },
      {
        title: 'Muhasebe Onayı Bekliyor',
        message: 'Tevkifat dosyaları için muhasebe onayı bekleyen 3 işlem bulunmaktadır.',
        category: NotificationCategory.FINANCIAL,
        typeCategory: NotificationTypeCategory.ACCOUNTING_APPROVAL_PENDING,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 saat önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
        actionUrl: '/accounting/approvals',
        actionLabel: 'Onayları Görüntüle',
      },
      {
        title: 'Sistem Güncellemesi Tamamlandı',
        message: 'Sistem güncellemesi başarıyla tamamlandı. Yeni özellikler ve iyileştirmeler aktif edildi.',
        category: NotificationCategory.SYSTEM,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 gün önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
      },
      {
        title: 'Aylık Rapor Hazır',
        message: 'Aralık 2024 ayı için detaylı rapor hazırlanmıştır. Raporu görüntülemek için tıklayınız.',
        category: NotificationCategory.FINANCIAL,
        typeCategory: NotificationTypeCategory.DUES_BULK_REPORT_READY,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 gün önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
        actionUrl: '/reports/monthly?month=12&year=2024',
        actionLabel: 'Raporu Görüntüle',
      },
      {
        title: 'Kritik Güvenlik Uyarısı',
        message: 'Sistemde olağandışı aktivite tespit edildi. Lütfen güvenlik loglarını kontrol ediniz.',
        category: NotificationCategory.SYSTEM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 30 * 60 * 1000), // 30 dakika önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
        actionUrl: '/security/logs',
        actionLabel: 'Güvenlik Loglarını İncele',
      },
      {
        title: 'Yedekleme Başarılı',
        message: 'Veritabanı yedekleme işlemi başarıyla tamamlandı. Yedek dosyası güvenli bir şekilde saklanmıştır.',
        category: NotificationCategory.SYSTEM,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 saat önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
      },
      {
        title: 'Toplu Bildirim Gönderildi',
        message: 'Tüm üyelere gönderilen "Aidat Hatırlatması" bildirimi başarıyla tamamlandı. 95 üyeye ulaşıldı.',
        category: NotificationCategory.ANNOUNCEMENT,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 gün önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
      },
      {
        title: 'Yeni Rol Ataması Yapıldı',
        message: 'Sistemde yeni bir kullanıcıya rol ataması yapıldı. Detayları görüntülemek için tıklayınız.',
        category: NotificationCategory.SYSTEM,
        typeCategory: NotificationTypeCategory.ROLE_CHANGED,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 gün önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
        actionUrl: '/users',
        actionLabel: 'Kullanıcıları Görüntüle',
      },
      {
        title: 'Borçlu Üye Hatırlatması',
        message: '3 aydan fazla süredir aidat ödemesi yapmayan 15 üye bulunmaktadır. Lütfen takip ediniz.',
        category: NotificationCategory.FINANCIAL,
        typeCategory: NotificationTypeCategory.DUES_OVERDUE,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 gün önce
        sentBy: adminUser.id,
        recipientCount: 1,
        successCount: 1,
        failedCount: 0,
        actionUrl: '/dues/debts',
        actionLabel: 'Borçlu Üyeleri Görüntüle',
      },
    ];

    for (const notification of notifications) {
      // Migration'da type field'ı NOT NULL, channels array'inin ilk elemanını type olarak kullan
      const channelToTypeMap: Record<NotificationChannel, NotificationType> = {
        [NotificationChannel.IN_APP]: NotificationType.IN_APP,
        [NotificationChannel.EMAIL]: NotificationType.EMAIL,
        [NotificationChannel.SMS]: NotificationType.SMS,
        [NotificationChannel.WHATSAPP]: NotificationType.WHATSAPP,
      };
      
      const notificationData = {
        ...notification,
        type: channelToTypeMap[notification.channels[0]], // channels array'inin ilk elemanı type olarak kullanılıyor
      };
      await prisma.notification.create({ data: notificationData });
    }
    console.log(`   - ${notifications.length} bildirim eklendi (${notifications.filter(n => n.targetId === adminUser.id).length} admin kullanıcısına özel)`);
    
    // Admin kullanıcısına gönderilen bildirimler için UserNotification kayıtları oluştur
    console.log('📬 Admin kullanıcısı için bildirim kayıtları oluşturuluyor...');
    const adminNotifications = await prisma.notification.findMany({
      where: {
        targetType: NotificationTargetType.USER,
        targetId: adminUser.id,
      },
    });
    
    let readCount = 0;
    let unreadCount = 0;
    
    for (let i = 0; i < adminNotifications.length; i++) {
      const notification = adminNotifications[i];
      const isRead = i < Math.floor(adminNotifications.length * 0.4); // İlk %40'ı okunmuş olarak işaretle
      const readAt = isRead && notification.sentAt 
        ? new Date(notification.sentAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) 
        : null; // Okunma zamanı gönderimden sonra rastgele bir saat içinde
      
      await prisma.userNotification.create({
        data: {
          userId: adminUser.id,
          notificationId: notification.id,
          isRead,
          readAt,
        },
      });
      
      if (isRead) {
        readCount++;
      } else {
        unreadCount++;
      }
    }
    
    console.log(`   - ${adminNotifications.length} bildirim admin kullanıcısına eklendi (${readCount} okunmuş, ${unreadCount} okunmamış)`);
  }

  // 🔹 Tevkifat Merkezleri
  console.log('🏛️  Tevkifat merkezleri ekleniyor...');
  const tevkifatCenters = [
    { name: 'Ankara Sağlık Bakanlığı Tevkifat Merkezi', code: 'ANK-SBM', description: 'Ankara bölgesi sağlık bakanlığı tevkifat merkezi' },
    { name: 'İstanbul Sağlık Müdürlüğü Tevkifat Merkezi', code: 'IST-SM', description: 'İstanbul il sağlık müdürlüğü tevkifat merkezi' },
    { name: 'İzmir Ege Bölgesi Tevkifat Merkezi', code: 'IZM-EGB', description: 'İzmir ve Ege bölgesi tevkifat merkezi' },
    { name: 'Bursa Marmara Tevkifat Merkezi', code: 'BRS-MRM', description: 'Bursa ve Marmara bölgesi tevkifat merkezi' },
    { name: 'Antalya Akdeniz Tevkifat Merkezi', code: 'ANT-AKD', description: 'Antalya ve Akdeniz bölgesi tevkifat merkezi' },
    { name: 'Konya İç Anadolu Tevkifat Merkezi', code: 'KNY-ICA', description: 'Konya ve İç Anadolu bölgesi tevkifat merkezi' },
    { name: 'Gaziantep Güneydoğu Tevkifat Merkezi', code: 'GAZ-GDA', description: 'Gaziantep ve Güneydoğu bölgesi tevkifat merkezi' },
    { name: 'Trabzon Karadeniz Tevkifat Merkezi', code: 'TRB-KRD', description: 'Trabzon ve Karadeniz bölgesi tevkifat merkezi' },
    { name: 'Kayseri Orta Anadolu Tevkifat Merkezi', code: 'KYS-ORT', description: 'Kayseri ve Orta Anadolu bölgesi tevkifat merkezi' },
    { name: 'Adana Çukurova Tevkifat Merkezi', code: 'ADA-CKR', description: 'Adana ve Çukurova bölgesi tevkifat merkezi' },
    { name: 'Eskişehir Batı Anadolu Tevkifat Merkezi', code: 'ESK-BAT', description: 'Eskişehir ve Batı Anadolu bölgesi tevkifat merkezi' },
    { name: 'Samsun Orta Karadeniz Tevkifat Merkezi', code: 'SAM-OKR', description: 'Samsun ve Orta Karadeniz bölgesi tevkifat merkezi' },
  ];
  const tevkifatCenterMap: Record<string, string> = {};
  for (const center of tevkifatCenters) {
    const created = await prisma.tevkifatCenter.create({
      data: center,
    });
    tevkifatCenterMap[center.name] = created.id;
  }
  console.log(`   - ${tevkifatCenters.length} tevkifat merkezi eklendi`);

  // 🔹 Üyelik Bilgisi Seçenekleri
  console.log('📋 Üyelik bilgisi seçenekleri ekleniyor...');
  const membershipInfoOptions = [
    { label: 'Normal Üye', value: 'NORMAL', description: 'Normal üyelik', order: 1 },
    { label: 'Fahri Üye', value: 'FAHRI', description: 'Fahri üyelik', order: 2 },
    { label: 'Onursal Üye', value: 'ONURSAL', description: 'Onursal üyelik', order: 3 },
  ];
  for (const option of membershipInfoOptions) {
    await prisma.membershipInfoOption.create({
      data: option,
    });
  }
  console.log(`   - ${membershipInfoOptions.length} üyelik bilgisi seçeneği eklendi`);

  // 🔹 Kurumlar (Institutions) - Zaten üyelerden önce oluşturuldu (8.6. bölümünde)

  // 🔹 Üyelere ek alanları ekle (institutionId, tevkifatCenterId, vs.)
  console.log('👤 Üyelere ek alanlar ekleniyor...');
  const allMembersForUpdate = await prisma.member.findMany();
  const genders: Gender[] = [Gender.MALE, Gender.FEMALE];
  const educationStatuses: EducationStatus[] = [EducationStatus.PRIMARY, EducationStatus.HIGH_SCHOOL, EducationStatus.COLLEGE];
  const institutionsList = await prisma.institution.findMany();
  const tevkifatCenterIds = Object.values(tevkifatCenterMap);
  const provinceNames = Object.keys(provinceMap);

  let memberUpdateCount = 0;
  for (let i = 0; i < allMembersForUpdate.length; i++) {
    const member = allMembersForUpdate[i];
    const updateData: any = {
      gender: genders[Math.floor(Math.random() * genders.length)],
      educationStatus: educationStatuses[Math.floor(Math.random() * educationStatuses.length)],
      motherName: `Anne ${member.firstName}`,
      fatherName: `Baba ${member.firstName}`,
    };

    // institutionId atanmamışsa ekle
    if (!member.institutionId && institutionsList.length > 0) {
      updateData.institutionId = institutionsList[i % institutionsList.length].id;
    }
    
    // tevkifatCenterId her zaman atanmalı (boş olmamalı)
    if (tevkifatCenterIds.length > 0) {
      updateData.tevkifatCenterId = tevkifatCenterIds[i % tevkifatCenterIds.length];
    }
    
    // workingProvinceId atanmamışsa ekle
    if (!member.workingProvinceId && provinceNames.length > 0) {
      const provinceName = provinceNames[i % provinceNames.length];
      if (provinceMap[provinceName]) {
        updateData.workingProvinceId = provinceMap[provinceName];
      }
    }
    
    // birthplace atanmamışsa ekle
    if (!member.birthplace && provinceNames.length > 0) {
      updateData.birthplace = provinceNames[i % provinceNames.length];
    }

    try {
      await prisma.member.update({
        where: { id: member.id },
        data: updateData,
      });
      memberUpdateCount++;
    } catch (e) {
      console.error(`   ⚠️  Üye ${member.id} güncellenirken hata:`, e);
    }
  }
  console.log(`   - ${memberUpdateCount} üyeye ek alanlar eklendi`);

  // 🔹 Üye Ödemeleri
  console.log('💳 Üye ödemeleri ekleniyor...');
  const activeMembers = await prisma.member.findMany({
    where: {
      status: MemberStatus.ACTIVE,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      registrationNumber: true,
      tevkifatCenterId: true,
    },
  });

  if (activeMembers.length > 0 && activeUsers.length > 0) {
    const muhasebeUser = activeUsers.find(u => u.email.includes('muhasebe') || u.email.includes('accounting'));
    const createdByUserId = muhasebeUser?.id || activeUsers[0].id;
    const approvedByUserId = adminUser?.id || activeUsers[0].id;

    const payments: Array<{
      memberId: string;
      registrationNumber: string | null;
      paymentDate: Date;
      paymentPeriodMonth: number;
      paymentPeriodYear: number;
      amount: string;
      paymentType: PaymentType;
      tevkifatCenterId: string | null;
      tevkifatFileId: string | null;
      description: string | null;
      documentUrl: string | null;
      isApproved: boolean;
      approvedByUserId: string | null;
      approvedAt: Date | null;
      createdByUserId: string;
      ipAddress: string;
      userAgent: string;
    }> = [];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Her aktif üye için son 6-12 ay arası rastgele ödemeler oluştur
    activeMembers.forEach((member, index) => {
      // Üye başına 3-8 arası ödeme oluştur
      const paymentCount = 3 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < paymentCount; i++) {
        // Geçmiş 12 ay içinde rastgele bir ay seç
        const monthsAgo = Math.floor(Math.random() * 12);
        let paymentYear = currentYear;
        let paymentMonth = currentMonth - monthsAgo;
        
        // Ay negatif olursa bir önceki yıla geç
        while (paymentMonth <= 0) {
          paymentMonth += 12;
          paymentYear -= 1;
        }

        // Ödeme türü seç (TEVKIFAT %60, ELDEN %30, HAVALE %10)
        const paymentTypeRandom = Math.random();
        let paymentType: PaymentType;
        let tevkifatCenterId: string | null = null;
        let description: string | null = null;

        if (paymentTypeRandom < 0.6 && member.tevkifatCenterId) {
          // Tevkifat ödemesi
          paymentType = PaymentType.TEVKIFAT;
          tevkifatCenterId = member.tevkifatCenterId;
          description = `${paymentMonth}/${paymentYear} tevkifat ödemesi`;
        } else if (paymentTypeRandom < 0.9) {
          // Elden ödeme
          paymentType = PaymentType.ELDEN;
          description = `${paymentMonth}/${paymentYear} elden ödeme`;
        } else {
          // Havale ödemesi
          paymentType = PaymentType.HAVALE;
          description = `${paymentMonth}/${paymentYear} havale/EFT ödemesi`;
        }

        // Tutar (200-500 TL arası)
        const amount = (200 + Math.random() * 300).toFixed(2);

        // Ödeme tarihi (dönem ayının rastgele bir günü)
        const paymentDate = new Date(paymentYear, paymentMonth - 1, 1 + Math.floor(Math.random() * 28));

        // %80 onaylı, %20 onaysız
        const isApproved = Math.random() < 0.8;

        payments.push({
          memberId: member.id,
          registrationNumber: member.registrationNumber,
          paymentDate,
          paymentPeriodMonth: paymentMonth,
          paymentPeriodYear: paymentYear,
          amount,
          paymentType,
          tevkifatCenterId,
          tevkifatFileId: null,
          description,
          documentUrl: isApproved ? `uploads/payments/payment-${member.id}-${paymentYear}-${paymentMonth}.pdf` : null,
          isApproved,
          approvedByUserId: isApproved ? approvedByUserId : null,
          approvedAt: isApproved ? new Date(paymentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null, // Ödeme tarihinden sonraki 7 gün içinde onaylandı
          createdByUserId,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        });
      }
    });

    // Ödemeleri gruplara ayırıp toplu ekleme yap (performans için)
    const batchSize = 100;
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      await prisma.memberPayment.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    console.log(`   - ${payments.length} ödeme kaydı eklendi`);
    console.log(`   - Onaylı: ${payments.filter(p => p.isApproved).length}`);
    console.log(`   - Onaysız: ${payments.filter(p => !p.isApproved).length}`);
    console.log(`   - Tevkifat: ${payments.filter(p => p.paymentType === PaymentType.TEVKIFAT).length}`);
    console.log(`   - Elden: ${payments.filter(p => p.paymentType === PaymentType.ELDEN).length}`);
    console.log(`   - Havale: ${payments.filter(p => p.paymentType === PaymentType.HAVALE).length}`);

    // 🔹 Tevkifat Dosyaları Oluştur (Son Tevkifat Ayı için)
    console.log('📁 Tevkifat dosyaları oluşturuluyor...');
    const tevkifatCenterIdsForFiles = Object.values(tevkifatCenterMap);
    const fileCurrentYear = new Date().getFullYear();
    const fileCurrentMonth = new Date().getMonth() + 1;
    
    if (tevkifatCenterIdsForFiles.length > 0 && activeUsers.length > 0) {
      const muhasebeUser = activeUsers.find(u => u.email.includes('muhasebe') || u.email.includes('accounting'));
      const uploadedByUserId = muhasebeUser?.id || activeUsers[0].id;
      const approvedByUserId = adminUser?.id || activeUsers[0].id;
      
      // Her tevkifat merkezi için son 3 ayın dosyalarını oluştur
      for (const centerId of tevkifatCenterIdsForFiles) {
        // Son 3 ay için dosya oluştur
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
          let fileYear = fileCurrentYear;
          let fileMonth = fileCurrentMonth - monthOffset;
          
          // Ay negatif olursa bir önceki yıla geç
          if (fileMonth <= 0) {
            fileMonth += 12;
            fileYear -= 1;
          }
          
          // Bu merkeze ait tevkifat ödemelerini veritabanından bul
          const centerPayments = await prisma.memberPayment.findMany({
            where: {
              tevkifatCenterId: centerId,
              paymentPeriodYear: fileYear,
              paymentPeriodMonth: fileMonth,
              paymentType: PaymentType.TEVKIFAT,
            },
          });
          
          if (centerPayments.length > 0) {
            const totalAmount = centerPayments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);
            const memberCount = new Set(centerPayments.map(p => p.memberId)).size;
            
            // Dosya oluştur
            const tevkifatFile = await prisma.tevkifatFile.create({
              data: {
                tevkifatCenterId: centerId,
                totalAmount: totalAmount,
                memberCount: memberCount,
                month: fileMonth,
                year: fileYear,
                fileName: `tevkifat_${centerId}_${fileYear}_${fileMonth}.xlsx`,
                fileUrl: `uploads/tevkifat/tevkifat_${centerId}_${fileYear}_${fileMonth}.xlsx`,
                fileSize: Math.floor(50000 + Math.random() * 200000), // 50-250 KB arası
                status: monthOffset === 0 ? ApprovalStatus.APPROVED : (Math.random() > 0.3 ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING),
                uploadedBy: uploadedByUserId,
                approvedBy: monthOffset === 0 ? approvedByUserId : (Math.random() > 0.3 ? approvedByUserId : null),
                approvedAt: monthOffset === 0 ? new Date() : (Math.random() > 0.3 ? new Date() : null),
              },
            });
            
            // Bu dosyaya ait ödemeleri güncelle
            await prisma.memberPayment.updateMany({
              where: {
                id: { in: centerPayments.map(p => p.id) },
              },
              data: {
                tevkifatFileId: tevkifatFile.id,
              },
            });
          }
        }
      }
      
      const tevkifatFileCount = await prisma.tevkifatFile.count();
      console.log(`   - ${tevkifatFileCount} tevkifat dosyası oluşturuldu`);
    } else {
      console.log('   ⚠️  Tevkifat dosyası eklenemedi (tevkifat merkezi veya kullanıcı bulunamadı)');
    }
  } else {
    console.log('   ⚠️  Ödeme eklenemedi (aktif üye veya kullanıcı bulunamadı)');
  }

  // 🔹 Örnek Sistem Logları
  console.log('📋 Sistem logları ekleniyor...');
  if (activeUsers.length > 0) {
    const logActions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT'];
    const entityTypes = ['USER', 'MEMBER', 'ROLE', 'DUES', 'CONTENT', 'DOCUMENT'];
    
    const logs: Array<{
      action: string;
      entityType: string;
      entityId: string;
      userId: string;
      details: { description: string; timestamp: string };
      ipAddress: string;
      userAgent: string;
      createdAt: Date;
    }> = [];
    for (let i = 0; i < 50; i++) {
      logs.push({
        action: logActions[Math.floor(Math.random() * logActions.length)],
        entityType: entityTypes[Math.floor(Math.random() * entityTypes.length)],
        entityId: `entity-${i}`,
        userId: activeUsers[Math.floor(Math.random() * activeUsers.length)].id,
        details: {
          description: `Örnek log kaydı ${i + 1}`,
          timestamp: new Date().toISOString(),
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Son 30 gün içinde
      });
    }

    await prisma.systemLog.createMany({ data: logs });
    console.log(`   - ${logs.length} sistem logu eklendi`);
  }

  // 🔹 Her üye için üye kayıt PDF dosyası oluştur
  console.log('📄 Üye kayıt PDF dosyaları oluşturuluyor...');
  const sourcePdfPath = path.join(__dirname, 'UyeKayidi.pdf');
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
  
  // Uploads klasörünü oluştur (yoksa)
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Kaynak PDF dosyasının var olup olmadığını kontrol et
  if (!fs.existsSync(sourcePdfPath)) {
    console.warn(`   ⚠️  Kaynak PDF dosyası bulunamadı: ${sourcePdfPath}`);
    console.warn(`   ⚠️  Üye kayıt PDF dosyaları oluşturulamadı`);
  } else {
    // Tüm aktif üyeleri al
    const allMembersForDocuments = await prisma.member.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nationalId: true,
        registrationNumber: true,
        createdByUserId: true,
      },
    });

    if (allMembersForDocuments.length > 0 && activeUsers.length > 0) {
      let documentCount = 0;
      const defaultGeneratedBy = activeUsers[0].id;

      for (const member of allMembersForDocuments) {
        try {
          // Dosya adını oluştur: UyeKayidi_TC_AdSoyad.pdf
          // Türkçe karakterleri ve boşlukları temizle, sadece harf ve rakam bırak
          const safeFirstName = (member.firstName || '')
            .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '')
            .trim();
          const safeLastName = (member.lastName || '')
            .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '')
            .trim();
          const nationalId = member.nationalId || member.id.substring(0, 11); // TC veya ID'nin ilk 11 karakteri
          const fileName = `UyeKayidi_${nationalId}_${safeFirstName}${safeLastName}.pdf`;
          const targetFilePath = path.join(uploadsDir, fileName);
          const fileUrl = `/uploads/documents/${fileName}`;

          // PDF dosyasını kopyala
          fs.copyFileSync(sourcePdfPath, targetFilePath);

          // MemberDocument kaydı oluştur
          await prisma.memberDocument.create({
            data: {
              memberId: member.id,
              templateId: null, // Şablon yok, direkt PDF
              documentType: 'MEMBER_REGISTRATION', // Özel tip
              fileName,
              fileUrl,
              generatedBy: member.createdByUserId || defaultGeneratedBy,
              generatedAt: new Date(), // Şu anki tarih
            },
          });

          documentCount++;
        } catch (error) {
          console.error(`   ⚠️  Üye ${member.firstName} ${member.lastName} için PDF oluşturulurken hata:`, error);
        }
      }

      console.log(`   - ${documentCount} üye kayıt PDF dosyası oluşturuldu`);
    } else {
      console.log('   ⚠️  Üye kayıt PDF dosyaları oluşturulamadı (üye veya kullanıcı bulunamadı)');
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed işlemi başarısız:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

