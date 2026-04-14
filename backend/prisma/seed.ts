import { PrismaClient, MemberStatus, MemberSource, ContentType, ContentStatus, DocumentTemplateType, NotificationType, NotificationTargetType, NotificationStatus, NotificationCategory, NotificationChannel, NotificationTypeCategory, SystemSettingCategory, Gender, EducationStatus, PositionTitle, ApprovalStatus, ApprovalEntityType, PaymentType, PanelUserApplicationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// JSON dosyalarından şehir ve ilçe verilerini yükle
// Production'da (dist/prisma/) veya development'da (prisma/) çalışabilmesi için
const isProduction = __dirname.includes('dist');
const prismaDir = isProduction ? path.join(__dirname, '..', '..', 'prisma') : __dirname;
const sehirlerPath = path.join(prismaDir, 'sehirler.json');
const ilcelerPath = path.join(prismaDir, 'ilceler.json');

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

function normalizeEmailPart(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');
}

function buildPanelUserSeedEmail(
  firstName: string,
  lastName: string,
  memberId: string,
): string {
  const base = `${normalizeEmailPart(firstName)}.${normalizeEmailPart(lastName)}`.replace(
    /^\.+|\.+$/g,
    '',
  );
  return `${base || 'panel.user'}.${memberId.slice(-6)}@sendika.local`;
}

// Doğum tarihi üretici (25-60 yaş arası)
function generateBirthDate(): Date {
  const now = new Date();
  const age = 25 + Math.floor(Math.random() * 35); // 25-60 yaş arası
  const birthYear = now.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = 1 + Math.floor(Math.random() * 28);
  return new Date(birthYear, birthMonth, birthDay);
}

// Anne/Baba adı üretici
function generateParentName(): string {
  const names = ['Ali', 'Mehmet', 'Ahmet', 'Hasan', 'Hüseyin', 'Mustafa', 'İbrahim', 'Ömer', 'Ayşe', 'Fatma', 'Hatice', 'Zeynep', 'Emine'];
  return names[Math.floor(Math.random() * names.length)];
}

// Doğum yeri üretici
const BIRTHPLACES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 
  'Gaziantep', 'Şanlıurfa', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir',
  'Trabzon', 'Samsun', 'Manisa', 'Balıkesir', 'Kocaeli', 'Malatya', 'Denizli'
];

function generateBirthplace(): string {
  return BIRTHPLACES[Math.floor(Math.random() * BIRTHPLACES.length)];
}

// Cinsiyet üretici
function generateGender(firstName: string): Gender {
  const femaleNames = ['Ayşe', 'Fatma', 'Hatice', 'Zeynep', 'Emine', 'Meryem', 'Elif', 'Şerife', 'Selin', 'Derya', 'Gizem', 'Burcu', 'Seda', 'Pınar', 'Esra', 'Ceren'];
  return femaleNames.includes(firstName) ? Gender.FEMALE : Gender.MALE;
}

// Eğitim durumu üretici
function generateEducationStatus(): EducationStatus {
  const statuses = [EducationStatus.PRIMARY, EducationStatus.HIGH_SCHOOL, EducationStatus.COLLEGE];
  const weights = [0.2, 0.3, 0.5]; // %20 ilkokul, %30 lise, %50 üniversite
  const random = Math.random();
  if (random < weights[0]) return statuses[0];
  if (random < weights[0] + weights[1]) return statuses[1];
  return statuses[2];
}

// Yönetim kurulu karar tarihi üretici (üyelik tarihinden önce)
function generateBoardDecisionDate(createdAt: Date): Date {
  const beforeDays = 3 + Math.floor(Math.random() * 14); // 3-16 gün önce
  const decisionDate = new Date(createdAt);
  decisionDate.setDate(decisionDate.getDate() - beforeDays);
  return decisionDate;
}

// Yönetim kurulu karar defter no üretici
function generateBoardDecisionBookNo(): string {
  const year = new Date().getFullYear();
  const no = 1 + Math.floor(Math.random() * 150);
  return `${year}/${no}`;
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
  // MemberAdvance tablosu henüz migrate edilmemiş olabilir, o yüzden güvenli şekilde sil
  try {
    await prisma.memberAdvance.deleteMany();
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('MemberAdvance')) {
      console.log('   ⚠️  MemberAdvance tablosu bulunamadı, atlanıyor...');
    } else {
      throw error;
    }
  }
  await prisma.userNotification.deleteMany();
  await prisma.notificationRecipient.deleteMany(); // Notification'a bağlı
  await prisma.notificationLog.deleteMany(); // Notification'a bağlı
  await prisma.userNotificationSettings.deleteMany(); // User'a bağlı
  await prisma.tevkifatFile.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.memberHistory.deleteMany();
  await prisma.memberDocument.deleteMany(); // Member'a bağlı
  await prisma.documentTemplate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.content.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.panelUserApplicationScope.deleteMany(); // PanelUserApplication'a bağlı
  await prisma.panelUserApplication.deleteMany(); // Member'a bağlı, Member'dan önce silinmeli
  await prisma.member.deleteMany(); // Institution'a bağlı, önce silmeliyiz
  await prisma.institution.deleteMany(); // Member'lardan sonra silinebilir
  await prisma.tevkifatTitle.deleteMany();
  await prisma.tevkifatCenter.deleteMany();
  await prisma.membershipInfoOption.deleteMany();
  await prisma.memberGroup.deleteMany();
  await prisma.profession.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.userScope.deleteMany();
  await prisma.customRoleScope.deleteMany(); // CustomRole'a bağlı
  await prisma.customRolePermission.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.user.deleteMany();
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
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_APPLICATIONS_VIEW', 'MEMBER_APPROVE', 'MEMBER_REJECT', 'MEMBER_HISTORY_VIEW',
      'MEMBER_UPDATE', 'MEMBER_STATUS_CHANGE',
      'DUES_PLAN_MANAGE', 'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'DUES_DEBT_LIST_VIEW', 'DUES_EXPORT',
      'REGION_LIST', 'BRANCH_MANAGE', 'BRANCH_ASSIGN_PRESIDENT',
      'CONTENT_MANAGE', 'CONTENT_PUBLISH',
      'DOCUMENT_TEMPLATE_MANAGE', 'DOCUMENT_MEMBER_HISTORY_VIEW', 'DOCUMENT_GENERATE_PDF',
      'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW', 'REPORT_MEMBER_STATUS_VIEW', 'REPORT_DUES_VIEW',
      'WHATSAPP_ACCESS', 'NOTIFY_ALL_MEMBERS', 'NOTIFY_REGION', 'NOTIFY_OWN_SCOPE',
      'SYSTEM_SETTINGS_VIEW', 'SYSTEM_SETTINGS_MANAGE', 'LOG_VIEW_ALL', 'LOG_VIEW_OWN_SCOPE',
    ],
    MODERATOR: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_HISTORY_VIEW', 'MEMBER_UPDATE',
      'DUES_REPORT_VIEW', 'REPORT_GLOBAL_VIEW', 'CONTENT_MANAGE', 'CONTENT_PUBLISH',
    ],
    GENEL_BASKAN: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE', 'MEMBER_REJECT', 'MEMBER_UPDATE', 'MEMBER_STATUS_CHANGE', 'MEMBER_HISTORY_VIEW',
      'DUES_PLAN_MANAGE', 'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'DUES_DEBT_LIST_VIEW',
      'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW', 'REPORT_MEMBER_STATUS_VIEW', 'REPORT_DUES_VIEW',
      'CONTENT_MANAGE', 'CONTENT_PUBLISH', 'WHATSAPP_ACCESS', 'NOTIFY_ALL_MEMBERS', 'NOTIFY_REGION',
      'REGION_LIST', 'BRANCH_MANAGE',
      'INSTITUTION_LIST', 'INSTITUTION_VIEW',
    ],
    GENEL_BASKAN_YRD: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE', 'MEMBER_REJECT', 'MEMBER_UPDATE', 'MEMBER_HISTORY_VIEW',
      'DUES_REPORT_VIEW', 'DUES_PAYMENT_ADD', 'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW',
      'CONTENT_MANAGE', 'NOTIFY_REGION',
      'INSTITUTION_LIST', 'INSTITUTION_VIEW',
    ],
    GENEL_SEKRETER: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_UPDATE', 'MEMBER_HISTORY_VIEW',
      'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'REPORT_REGION_VIEW',
      'DOCUMENT_TEMPLATE_MANAGE', 'DOCUMENT_GENERATE_PDF', 'NOTIFY_OWN_SCOPE',
      'INSTITUTION_LIST', 'INSTITUTION_VIEW',
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
      description: 'İl Başkanı - İl bazlı üye yönetimi yapabilir (Yetki alanı gerektirir)',
      isActive: true,
      hasScopeRestriction: true,
      permissions: {
        create: [
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_HISTORY_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
          { permission: 'INSTITUTION_LIST' },
          { permission: 'INSTITUTION_VIEW' },
        ],
      },
    },
  });

  // İlçe Temsilcisi için özel role oluştur (genel bir ilçe temsilcisi rolü)
  const ilceTemsilcisiRole = await prisma.customRole.create({
    data: {
      name: 'ILCE_TEMSILCISI',
      description: 'İlçe Temsilcisi - İlçe bazlı üye yönetimi yapabilir (Yetki alanı gerektirir)',
      isActive: true,
      hasScopeRestriction: true,
      permissions: {
        create: [
          { permission: 'MEMBER_VIEW' },
          { permission: 'MEMBER_HISTORY_VIEW' },
          { permission: 'MEMBER_CREATE_APPLICATION' },
          { permission: 'MEMBER_APPROVE' },
          { permission: 'MEMBER_REJECT' },
          { permission: 'MEMBER_UPDATE' },
          { permission: 'DUES_PAYMENT_ADD' },
          { permission: 'DUES_REPORT_VIEW' },
          { permission: 'REPORT_REGION_VIEW' },
          { permission: 'NOTIFY_OWN_SCOPE' },
          { permission: 'INSTITUTION_LIST' },
          { permission: 'INSTITUTION_VIEW' },
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

  // Kullanıcılar dizisi (UYE rolüne sahip kullanıcılar kaldırıldı)
  const users: string[] = [adminUser.id, genelBaskan.id, ilBaskani.id, ilceTemsilcisi.id];

  // Province IDs array (üye oluşturma için kullanılacak)
  const provinceIds = Object.values(provinceMap);

  // 5. Anlaşmalı Kurumlar ekle
  // 🏪 Anlaşmalı Kurumlar - REMOVED (model doesn't exist in schema)
  console.log('🏪 Anlaşmalı Kurumlar atlanıyor (model mevcut değil)...');
  const contractedInstitutionMap: string[] = [];
  
  // Disabled: contractedInstitution model removed from schema
  /*
  const contractedInstitutionNames = [
    'Anlaşmalı Kurum A',
    'Anlaşmalı Kurum B',
    'Anlaşmalı Kurum C',
    'Anlaşmalı Kurum D',
    'Anlaşmalı Kurum E',
    'Anlaşmalı Kurum F',
  ];

  for (let i = 0; i < 15; i++) {
    const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
    const contractedInstitution = await prisma.contractedInstitution.create({
      data: {
        name: `${contractedInstitutionNames[Math.floor(Math.random() * contractedInstitutionNames.length)]} ${i + 1}`,
        code: `AK${String(i + 1).padStart(3, '0')}`,
        address: `Anlaşmalı Kurum Adresi ${i + 1}`,
        provinceId,
      },
    });
    contractedInstitutionMap.push(contractedInstitution.id);
  }
  */

  // 6. UserScope ekle (kullanıcılara yetki alanları)
  console.log('🔐 Kullanıcı yetkileri ekleniyor...');
  
  // İl Başkanı ve İlçe Temsilcisi kullanıcılarına yetki alanları ekle
  const ilBaskaniUser = await prisma.user.findFirst({
    where: { email: 'il.baskani@sendika.local' },
  });
  const ilceTemsilcisiUser = await prisma.user.findFirst({
    where: { email: 'ilce.temsilcisi@sendika.local' },
  });
  
  if (ilBaskaniUser) {
    // İl Başkanı için bir ile yetki alanı ekle
    const sampleProvince = await prisma.province.findFirst();
    if (sampleProvince) {
      await prisma.userScope.create({
        data: {
          userId: ilBaskaniUser.id,
          provinceId: sampleProvince.id,
        },
      });
      console.log(`   - İl Başkanı için yetki alanı eklendi: ${sampleProvince.name}`);
    }
  }
  
  if (ilceTemsilcisiUser) {
    // İlçe Temsilcisi için bir ilçeye yetki alanı ekle
    const sampleDistrict = await prisma.district.findFirst();
    if (sampleDistrict) {
      await prisma.userScope.create({
        data: {
          userId: ilceTemsilcisiUser.id,
          provinceId: sampleDistrict.provinceId,
          districtId: sampleDistrict.id,
        },
      });
      console.log(`   - İlçe Temsilcisi için yetki alanı eklendi: ${sampleDistrict.name}`);
    }
  }

  // 6.1. CustomRoleScope ekle (roller için yetki alanları)
  console.log('🎭 Rol yetki alanları ekleniyor...');
  const ilBaskaniRoleForScope = await prisma.customRole.findFirst({
    where: { name: 'IL_BASKANI' },
  });
  const ilceTemsilcisiRoleForScope = await prisma.customRole.findFirst({
    where: { name: 'ILCE_TEMSILCISI' },
  });
  
  if (ilBaskaniRoleForScope) {
    // İl Başkanı rolü için bir ile yetki alanı ekle
    const sampleProvinceForRole = await prisma.province.findFirst();
    if (sampleProvinceForRole) {
      await prisma.customRoleScope.create({
        data: {
          roleId: ilBaskaniRoleForScope.id,
          provinceId: sampleProvinceForRole.id,
        },
      });
      console.log(`   - İl Başkanı rolü için yetki alanı eklendi: ${sampleProvinceForRole.name}`);
    }
  }
  
  if (ilceTemsilcisiRoleForScope) {
    // İlçe Temsilcisi rolü için bir ilçeye yetki alanı ekle
    const sampleDistrictForRole = await prisma.district.findFirst();
    if (sampleDistrictForRole) {
      await prisma.customRoleScope.create({
        data: {
          roleId: ilceTemsilcisiRoleForScope.id,
          provinceId: sampleDistrictForRole.provinceId,
          districtId: sampleDistrictForRole.id,
        },
      });
      console.log(`   - İlçe Temsilcisi rolü için yetki alanı eklendi: ${sampleDistrictForRole.name}`);
    }
  }

  // 7. Şubeler ekle (üyelerden önce - branchId zorunlu)
  console.log('🏢 Şubeler ekleniyor...');
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
  
  // Merkezi/Genel Şubeler (il/ilçeye bağlı olmayan) - Sadece 3 merkezi şube
  let branchCounter = 1;
  const centralBranches = [
    {
      name: 'Merkez Genel Başkanlık Şubesi',
    },
    {
      name: 'Yurtdışı Temsilcilik Şubesi',
    },
    {
      name: 'Merkez Eğitim ve Araştırma Şubesi',
    },
  ];

  for (const centralBranch of centralBranches) {
    const branch = await prisma.branch.create({
      data: {
        name: centralBranch.name,
        presidentId: activeUsersForBranches.length > 0 
          ? activeUsersForBranches[branchCounter % activeUsersForBranches.length].id 
          : null,
        isActive: true,
        provinceId: null,
        districtId: null,
      },
    });
    allBranchesForMembers.push(branch);
    branchCounter++;
  }

  if (allBranchesForMembers.length > 0) {
    console.log(`   - ${allBranchesForMembers.length} şube eklendi (${centralBranches.length} merkezi şube dahil)`);
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
  
  // Sadece 3 merkezi kurum oluştur
  const institutionData: any[] = [];
  
  // Merkezi/Genel Kurumlar (il/ilçeye bağlı olmayan)
  const centralInstitutions = [
    {
      name: 'Sağlık Bakanlığı Genel Müdürlüğü',
      kurumSicilNo: 'KUR-MRK-001',
      gorevBirimi: 'Genel Müdürlük',
      kurumAdresi: 'Ankara Merkez',
    },
    {
      name: 'Türkiye Kamu Hastaneleri Kurumu',
      kurumSicilNo: 'KUR-MRK-002',
      gorevBirimi: 'Kamu Hastaneleri Kurumu',
      kurumAdresi: 'Ankara Merkez',
    },
    {
      name: 'Türkiye Halk Sağlığı Genel Müdürlüğü',
      kurumSicilNo: 'KUR-MRK-003',
      gorevBirimi: 'Genel Müdürlük',
      kurumAdresi: 'Ankara Merkez',
    },
  ];

  // Merkezi kurumları ekle
  for (const centralInst of centralInstitutions) {
    institutionData.push({
      name: centralInst.name,
      provinceId: null,
      districtId: null,
      isActive: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      createdBy: adminUser.id,
    });
  }

  if (institutionData.length > 0) {
    const institutions = await prisma.institution.createMany({
      data: institutionData,
    });
    console.log(`   - ${institutions.count} kurum eklendi (${centralInstitutions.length} merkezi kurum dahil)`);
  } else {
    console.log(`   ⚠️  Kurum eklenemedi (şube veya ilçe bulunamadı)`);
  }

  // 9. Üyeler ekle
  console.log('👤 Üyeler ekleniyor...');
  const memberIds: string[] = [];
  const sources: MemberSource[] = [
    MemberSource.DIRECT,
    MemberSource.OTHER,
  ];

  // Şu anki tarih
  const now = new Date();
  
  // Özel üye: Burcu Doğan - Haziran 2025'te kayıt olmuş, Haziran'da Kesinti yapmış
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
  const institutionsForBurcu = await prisma.institution.findMany({ take: 3 });
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
      districtId: burcuDistrictId!,
      branchId: defaultBranchId, // Zorunlu
      registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
      institutionId: burcuInstitutionId,
      motherName: generateParentName(),
      fatherName: generateParentName(),
      birthDate: generateBirthDate(),
      birthplace: generateBirthplace(),
      gender: generateGender('Burcu'),
      educationStatus: generateEducationStatus(),
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

  // Her status'tan en az 20 üye (7 status × 21 = 147; Burcu atlanırsa bile her status'tan 20+ kalır)
  const totalMembersToCreate = 147;
  const statusDistribution = [
    { status: MemberStatus.PENDING, count: 21 },
    { status: MemberStatus.APPROVED, count: 21 },
    { status: MemberStatus.ACTIVE, count: 21 },
    { status: MemberStatus.INACTIVE, count: 21 },
    { status: MemberStatus.REJECTED, count: 21 },
    { status: MemberStatus.RESIGNED, count: 21 },
    { status: MemberStatus.EXPELLED, count: 21 },
  ];
  
  // Status listesi oluştur
  const statusList: MemberStatus[] = [];
  for (const dist of statusDistribution) {
    for (let i = 0; i < dist.count; i++) {
      statusList.push(dist.status);
    }
  }
  // Listeyi karıştır
  for (let i = statusList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [statusList[i], statusList[j]] = [statusList[j], statusList[i]];
  }

  // Institution listesini önceden al (performans için)
  const institutionsList = await prisma.institution.findMany({ take: 3 });
  if (institutionsList.length === 0) {
    console.error('⚠️  Institution bulunamadı! Lütfen önce institution oluşturun.');
    return;
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < totalMembersToCreate; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Aynı isimdeki Burcu Doğan'ı atla
    if (firstName === 'Burcu' && lastName === 'Doğan') {
      skippedCount++;
      continue;
    }
    
    const status = statusList[i] || statusList[Math.floor(Math.random() * statusList.length)];
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

    // Gerçekçi kayıt tarihi: 1-24 ay önce arası rastgele
    const monthsAgo = 1 + Math.floor(Math.random() * 24); // 1-24 ay önce
    const memberCreatedAt = new Date(now);
    memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
    memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28)); // Ayın rastgele bir günü

    // Onay tarihi belirleme
    let approvedAt: Date | null = null;
    let cancelledAt: Date | null = null;
    let cancellationReason: string | null = null;
    let cancelledByUserId: string | null = null;
    
    if (status === MemberStatus.ACTIVE || status === MemberStatus.APPROVED) {
      // Aktif veya onaylı üyeler için onay tarihi
      const isThisMonthNew = Math.random() < 0.15; // %15 şansla bu ay içinde onaylanmış
      if (isThisMonthNew) {
        // Bu ay içinde onaylanmış
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const thisMonthDay = 1 + Math.floor(Math.random() * Math.min(28, daysInMonth));
        approvedAt = new Date(currentYear, currentMonth, thisMonthDay);
        if (approvedAt > now) {
          approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000);
        }
      } else {
        // Geçmişte onaylanmış - kayıt tarihinden sonra ama bugünden önce
        const daysAfterCreation = 3 + Math.floor(Math.random() * 14); // 3-16 gün sonra
        approvedAt = new Date(memberCreatedAt.getTime() + daysAfterCreation * 24 * 60 * 60 * 1000);
        if (approvedAt > now) {
          approvedAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        }
      }
    } else if (status === MemberStatus.REJECTED) {
      // Reddedilen üyeler için red tarihi
      const daysAfterCreation = 3 + Math.floor(Math.random() * 10); // 3-12 gün sonra reddedilmiş
      const rejectedAt = new Date(memberCreatedAt.getTime() + daysAfterCreation * 24 * 60 * 60 * 1000);
      if (rejectedAt > now) {
        approvedAt = null;
      }
    } else if (status === MemberStatus.RESIGNED || status === MemberStatus.EXPELLED || status === MemberStatus.INACTIVE) {
      // İptal edilmiş üyeler için iptal tarihi
      // Önce onaylanmış olmalı (eğer aktif olmuşsa)
      const wasActive = Math.random() < 0.8; // %80 şansla önce aktif olmuş
      if (wasActive) {
        const daysAfterCreation = 3 + Math.floor(Math.random() * 14);
        approvedAt = new Date(memberCreatedAt.getTime() + daysAfterCreation * 24 * 60 * 60 * 1000);
        
        // İptal tarihi onay tarihinden sonra
        const monthsAfterApproval = 1 + Math.floor(Math.random() * 12); // 1-12 ay sonra iptal edilmiş
        cancelledAt = new Date(approvedAt.getTime());
        cancelledAt.setMonth(cancelledAt.getMonth() + monthsAfterApproval);
        cancelledAt.setDate(1 + Math.floor(Math.random() * 28));
        
        if (cancelledAt > now) {
          cancelledAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        }
        
        const cancellationReasons = [
          'İstifa talebi',
          'Üyelik Kesintiını Kesintime',
          'Sendika tüzüğüne aykırı davranış',
          'Kendi isteği ile ayrılma',
          'İşyerinden ayrılma',
          'Üyelik şartlarını yerine getirememe',
        ];
        cancellationReason = cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)];
        cancelledByUserId = users[Math.floor(Math.random() * users.length)];
      }
    }

    // Şube seç (zorunlu)
    const branchId = allBranches.length > 0 
      ? allBranches[Math.floor(Math.random() * allBranches.length)].id
      : defaultBranchId;

    // Institution seç (zorunlu)
    const institutionId = institutionsList[Math.floor(Math.random() * institutionsList.length)].id;

    try {
      // districtId zorunlu, eğer yoksa bir ilçe seç
      let finalDistrictId = districtId;
      if (!finalDistrictId && provinceId) {
        const districtsInProvince = await prisma.district.findMany({
          where: { provinceId },
          take: 1,
        });
        if (districtsInProvince.length > 0) {
          finalDistrictId = districtsInProvince[0].id;
        }
      }
      if (!finalDistrictId) {
        console.warn(`⚠️  İlçe bulunamadı, üye atlanıyor: ${firstName} ${lastName}`);
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
          districtId: finalDistrictId,
          branchId, // Zorunlu
          registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
          institutionId,
          motherName: generateParentName(),
          fatherName: generateParentName(),
          birthDate: generateBirthDate(),
          birthplace: generateBirthplace(),
          gender: generateGender(firstName),
          educationStatus: generateEducationStatus(),
          createdByUserId: users[Math.floor(Math.random() * users.length)],
          approvedByUserId: (status === MemberStatus.ACTIVE || status === MemberStatus.APPROVED)
            ? users[Math.floor(Math.random() * users.length)]
            : (status === MemberStatus.REJECTED ? users[Math.floor(Math.random() * users.length)] : null),
          approvedAt,
          cancelledAt,
          cancellationReason,
          cancelledByUserId,
          createdAt: memberCreatedAt,
          updatedAt: cancelledAt || approvedAt || memberCreatedAt,
        },
      });
      memberIds.push(member.id);
      memberRegistrationCounter++;
      createdCount++;
    } catch (error) {
      console.error(`   ⚠️  Üye ${firstName} ${lastName} oluşturulurken hata:`, error);
      skippedCount++;
    }
  }
  console.log(`   - ${createdCount} üye eklendi (toplam ${memberIds.length} üye, ${skippedCount} atlandı)`);

  // Tüm diğer üye oluşturma döngüleri kaldırıldı - sadece 3 üye oluşturuluyor

  // 10. Üyeler için gerekli güncellemeler tamamlandı

  // 11. Mevcut üyelere ilçe ataması (eğer ilçeleri yoksa)
  // Not: districtId artık zorunlu olduğu için bu kod artık çalışmayacak
  // Eski veriler için gerekirse migration ile düzeltilmeli
  console.log('📍 Mevcut üyelere ilçe atanıyor...');
  // districtId artık zorunlu olduğu için bu sorgu artık sonuç döndürmeyecek
  // Bu kısım artık gerekli değil çünkü districtId zorunlu
  console.log('   - districtId artık zorunlu olduğu için ilçe atama işlemi atlandı');

  console.log('✅ Seed işlemi tamamlandı!');
  console.log(`   - ${TURKISH_PROVINCES.length} il eklendi`);
  console.log(`   - ${ilceCount} ilçe eklendi`);
  console.log(`   - ${Object.keys(customRoleMap).length} özel rol eklendi`);
  console.log(`   - ${users.length} kullanıcı eklendi`);
  console.log(`   - ${contractedInstitutionMap.length} anlaşmalı kurum eklendi`);
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
    // Bu ay gelen üyeler: Aktif üyelerin %10-15'i bu ay içinde onaylanmış olabilir
    const thisMonthNewPercentage = 0.10 + Math.random() * 0.05; // %10-15
    const thisMonthNewCount = Math.max(1, Math.floor(allActiveMembers.length * thisMonthNewPercentage));
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

    // Bu ay iptal edilen üyeler: Aktif üyelerin %2-5'i bu ay içinde iptal edilmiş olabilir
    const remainingMembers = allActiveMembers.slice(thisMonthNewCount);
    let thisMonthCancelledCount = 0;
    if (remainingMembers.length > 0) {
      const thisMonthCancelledPercentage = 0.02 + Math.random() * 0.03; // %2-5
      thisMonthCancelledCount = Math.max(0, Math.floor(remainingMembers.length * thisMonthCancelledPercentage));
      const thisMonthCancelledMembers = remainingMembers.slice(0, thisMonthCancelledCount);
      
      const cancellationReasons = [
        'İstifa talebi',
        'Üyelik Kesintiını Kesintime',
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

    // Geçmiş aylarda iptal edilmiş üyeler: Aktif üyelerin %5-10'u geçmiş aylarda iptal edilmiş olabilir
    const remainingForPastCancellation = allActiveMembers.slice(thisMonthNewCount + (remainingMembers.length > 0 ? thisMonthCancelledCount : 0));
    if (remainingForPastCancellation.length > 0) {
      const pastCancelledPercentage = 0.05 + Math.random() * 0.05; // %5-10
      const pastCancelledCount = Math.max(0, Math.floor(remainingForPastCancellation.length * pastCancelledPercentage));
      const pastCancelledMembers = remainingForPastCancellation.slice(0, pastCancelledCount);
      
      const cancellationReasons = [
        'İstifa talebi',
        'Üyelik Kesintiını Kesintime',
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
      institutionId: true,
      source: true,
      cancelledAt: true,
      motherName: true,
      fatherName: true,
      birthDate: true,
      birthplace: true,
      gender: true,
      educationStatus: true,
    },
    orderBy: {
      cancelledAt: 'desc',
    },
  });

  if (cancelledMembers.length > 0) {
    // İptal edilmiş üyelerin %10-20'si yeniden üye olmuş olabilir
    const reRegisterPercentage = 0.10 + Math.random() * 0.10; // %10-20
    const reRegisterCount = Math.max(0, Math.min(Math.floor(cancelledMembers.length * reRegisterPercentage), cancelledMembers.length));
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
      let reRegisterInstitutionId = cancelledMember.institutionId;
      if (!reRegisterInstitutionId) {
        const fallbackInstitution = await prisma.institution.findFirst({ select: { id: true } });
        if (!fallbackInstitution) {
          console.warn(`⚠️  Institution bulunamadı, yeniden üye kaydı atlanıyor: ${cancelledMember.id}`);
          continue;
        }
        reRegisterInstitutionId = fallbackInstitution.id;
      }

      // districtId zorunlu
      if (!cancelledMember.districtId) {
        console.warn(`⚠️  İlçe bilgisi yok, yeniden üye kaydı atlanıyor: ${cancelledMember.id}`);
        continue;
      }

      const newMember = await prisma.member.create({
        data: {
          firstName: cancelledMember.firstName,
          lastName: cancelledMember.lastName,
          nationalId: cancelledMember.nationalId, // Orijinal TC'yi kullan
          phone: cancelledMember.phone || generatePhone(),
          email: cancelledMember.email,
          source: cancelledMember.source || MemberSource.DIRECT,
          status: MemberStatus.PENDING,
          provinceId: cancelledMember.provinceId!,
          districtId: cancelledMember.districtId,
          branchId: branchIdForReRegister, // Zorunlu
          previousCancelledMemberId: cancelledMember.id, // Önceki iptal kaydına bağla
          registrationNumber: `UYE-${String(memberRegistrationCounter).padStart(5, '0')}`,
          institutionId: reRegisterInstitutionId,
          motherName: cancelledMember.motherName || generateParentName(),
          fatherName: cancelledMember.fatherName || generateParentName(),
          birthDate: cancelledMember.birthDate || generateBirthDate(),
          birthplace: cancelledMember.birthplace || generateBirthplace(),
          gender: cancelledMember.gender || generateGender(cancelledMember.firstName),
          educationStatus: cancelledMember.educationStatus || generateEducationStatus(),
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
        title: 'Kesinti Kesintileri Hakkında',
        content: 'Kesinti Kesintilerinizi zamanında yapmanız önemlidir. Kesinti tarihleri ve yöntemleri hakkında bilgi.',
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
      description: 'Kurumsal üyelik sertifikası (A4, resmi format)',
      template: `
<div style="text-align:center;">
  <div style="font-size:16pt;font-weight:800;letter-spacing:.5px;">ÜYE SERTİFİKASI</div>
  <div style="margin-top:6px;font-size:10pt;color:#444;">Bu belge sendika üyeliğini resmî olarak teyit eder.</div>
</div>

<div style="border-top:1px solid #111;margin:14px 0 16px;"></div>

<div style="font-size:11pt;">
  Bu sertifika, <b>{{firstName}} {{lastName}}</b> adlı kişinin sendikamıza üye olduğunu ve üyeliğinin aktif olduğunu belgeler.
</div>

<div style="margin-top:14px;">
  <div style="font-size:12pt;font-weight:700;margin-bottom:8px;">Üye Bilgileri</div>
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
    <tbody>
      <tr><td style="width:34%;padding:6px 0;color:#333;">Ad Soyad</td><td style="padding:6px 0;">: <b>{{firstName}} {{lastName}}</b></td></tr>
      <tr><td style="padding:6px 0;color:#333;">Üye Numarası</td><td style="padding:6px 0;">: {{memberNumber}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">T.C. Kimlik No</td><td style="padding:6px 0;">: {{nationalId}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Üyelik Tarihi</td><td style="padding:6px 0;">: {{joinDate}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">İl / İlçe</td><td style="padding:6px 0;">: {{province}} / {{district}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Kurum</td><td style="padding:6px 0;">: {{institution}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Şube</td><td style="padding:6px 0;">: {{branch}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Telefon</td><td style="padding:6px 0;">: {{phone}}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">E-posta</td><td style="padding:6px 0;">: {{email}}</td></tr>
    </tbody>
  </table>
</div>

<div style="border-top:1px solid #ddd;margin:18px 0 12px;"></div>

<table style="width:100%;font-size:10.5pt;">
  <tr>
    <td style="width:50%;vertical-align:top;color:#555;">Düzenlenme Tarihi: <b>{{date}}</b></td>
    <td style="width:50%;text-align:right;vertical-align:top;">
      <div style="font-weight:700;">Sendika Yönetimi</div>
      <div style="margin-top:38px;">İmza / Kaşe</div>
    </td>
  </tr>
</table>`,
      type: DocumentTemplateType.MEMBER_CERTIFICATE,
      isActive: true,
    },
    {
      name: 'Üye Kartı',
      description: 'Üye kartı (modern kart tasarımı, A4 üzerinde ortalanmış)',
      template: `
<style>
  .card-doc { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Helvetica Neue", sans-serif; color: #0f172a; }
  .card-page { display:flex; align-items:center; justify-content:center; min-height: 297mm; padding: 18mm 16mm; box-sizing: border-box; }
  body[data-header-paper="true"] .card-page { padding: 0 !important; min-height: auto !important; }

  .member-card {
    width: 88mm;
    border-radius: 14px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(2, 6, 23, .14);
    border: 1px solid rgba(15, 23, 42, .10);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .member-card__top {
    position: relative;
    padding: 12px 14px 10px 14px;
    background: linear-gradient(135deg, #0b3a7a 0%, #1556b6 55%, #0ea5e9 120%);
    color: #fff;
  }
  .member-card__top:after {
    content:"";
    position:absolute;
    inset: 0;
    background:
      radial-gradient(600px 180px at 20% -30%, rgba(255,255,255,.22), transparent 60%),
      radial-gradient(420px 220px at 110% 10%, rgba(255,255,255,.18), transparent 60%),
      linear-gradient(180deg, rgba(2,6,23,.06), transparent 40%);
    pointer-events:none;
  }
  .brand-title { position: relative; z-index:1; letter-spacing: .9px; font-weight: 800; font-size: 10.2pt; }
  .brand-sub  { position: relative; z-index:1; margin-top: 2px; font-size: 8.5pt; opacity: .92; }
  .member-card__body { padding: 12px 14px 10px; }

  .identity-row { display:flex; gap: 10px; align-items: flex-start; }
  .photo {
    width: 26mm; height: 32mm;
    border-radius: 10px;
    overflow: hidden;
    background: #f1f5f9;
    border: 1px solid rgba(15, 23, 42, .12);
    flex: 0 0 auto;
  }
  .photo img { width:100%; height:100%; object-fit: cover; display:block; }
  .name { font-size: 12.2pt; font-weight: 900; letter-spacing: .2px; margin: 2px 0 6px; }
  .meta { font-size: 8.9pt; color: #334155; line-height: 1.45; }
  .meta b { color:#0f172a; }

  .grid { margin-top: 10px; display:grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
  .kv { border: 1px solid rgba(15, 23, 42, .08); background: rgba(241,245,249,.65); border-radius: 10px; padding: 7px 9px; }
  .k { font-size: 7.7pt; letter-spacing:.35px; text-transform: uppercase; color:#64748b; }
  .v { margin-top: 2px; font-size: 9.1pt; font-weight: 700; color:#0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .member-card__footer {
    display:flex; justify-content: space-between; gap: 10px;
    padding: 9px 14px;
    border-top: 1px solid rgba(15, 23, 42, .08);
    font-size: 8.2pt; color:#475569;
    background: #fff;
  }
  .chip { display:inline-block; padding: 3px 8px; border-radius: 999px; background: rgba(14,165,233,.12); color:#075985; font-weight: 700; }
</style>

<div class="card-doc">
  <div class="card-page">
    <div class="member-card">
      <div class="member-card__top">
        <div class="brand-title">SENDİKA ÜYE KARTI</div>
        <div class="brand-sub">Resmî üyelik kimliği</div>
      </div>

      <div class="member-card__body">
        <div class="identity-row">
          <div class="photo">
            <img src="{{photoDataUrl}}" alt="Fotoğraf" />
          </div>
          <div style="flex:1; min-width: 0;">
            <div class="name">{{firstName}} {{lastName}}</div>
            <div class="meta">
              <div><span style="color:#64748b;">Üye No:</span> <b>{{memberNumber}}</b></div>
              <div><span style="color:#64748b;">T.C.:</span> <b>{{nationalId}}</b></div>
              <div><span style="color:#64748b;">İl/İlçe:</span> <b>{{province}}</b> / <b>{{district}}</b></div>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="kv">
            <div class="k">Kurum</div>
            <div class="v">{{institution}}</div>
          </div>
          <div class="kv">
            <div class="k">Şube</div>
            <div class="v">{{branch}}</div>
          </div>
          <div class="kv">
            <div class="k">Üyelik Tarihi</div>
            <div class="v">{{joinDate}}</div>
          </div>
          <div class="kv">
            <div class="k">Geçerlilik</div>
            <div class="v">{{validUntil}}</div>
          </div>
        </div>
      </div>

      <div class="member-card__footer">
        <div>Bu kart sendika üyeliğini belgeler.</div>
        <div class="chip">AKTİF</div>
      </div>
    </div>
  </div>
</div>`,
      type: DocumentTemplateType.MEMBER_CARD,
      isActive: true,
    },
    {
      name: 'Genel Mektup',
      description: 'Resmî yazışma şablonu (konu + içerik)',
      template: `
<div style="text-align:right;font-size:10.5pt;color:#444;">
  Tarih: <b>{{date}}</b>
</div>

<div style="margin-top:10px;font-size:11pt;">
  <div style="font-weight:700;">Sayın {{firstName}} {{lastName}},</div>
</div>

<div style="margin-top:10px;border:1px solid #ddd;border-radius:8px;padding:10px 12px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Konu:</b> {{subject}}</div>
  <div style="font-size:11pt;white-space:pre-wrap;">{{content}}</div>
</div>

<div style="margin-top:16px;font-size:11pt;">
  Bilgilerinize sunar, gereğini rica ederiz.
</div>

<div style="margin-top:22px;text-align:right;">
  <div style="font-weight:700;">Sendika Yönetimi</div>
  <div style="margin-top:40px;">İmza / Kaşe</div>
</div>`,
      type: DocumentTemplateType.LETTER,
      isActive: true,
    },
    {
      name: 'İstifa Belgesi',
      description: 'İstifa belgesi (minimal, resmî format)',
      template: `
<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5pt;color:#444;">
  <div>İstifa Belgesi</div>
  <div>Tarih: <b>{{date}}</b></div>
</div>
<div style="border-top:1px solid #ddd;margin:10px 0 14px;"></div>

<div style="font-size:11pt;">
  <div style="font-weight:700;">Sayın Sendika Yönetimi,</div>
  <div style="margin-top:10px;">
    <b>{{firstName}} {{lastName}}</b> (Üye No: <b>{{memberNumber}}</b>, T.C.: <b>{{nationalId}}</b>) adlı üyemiz, <b>{{date}}</b> tarihinde sendikamızdan istifa etmiştir.
  </div>
</div>

<div style="margin-top:14px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>İstifa Nedeni</b></div>
  <div style="white-space:pre-wrap;font-size:11pt;">{{resignationReason}}</div>
</div>

<div style="margin-top:14px;border-top:1px solid #eee;padding-top:10px;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
    <tr>
      <td style="width:50%;color:#555;">
        İl/İlçe: <b>{{province}}</b> / <b>{{district}}</b><br/>
        Kurum: <b>{{institution}}</b><br/>
        Şube: <b>{{branch}}</b>
      </td>
      <td style="width:50%;text-align:right;">
        <div style="font-weight:700;">Sendika Yönetimi</div>
        <div style="margin-top:34px;color:#666;">İmza / Kaşe</div>
      </td>
    </tr>
  </table>
</div>`,
      type: DocumentTemplateType.RESIGNATION_LETTER,
      isActive: true,
    },
    {
      name: 'İhraç Belgesi',
      description: 'İhraç belgesi (minimal, resmî format)',
      template: `
<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5pt;color:#444;">
  <div>İhraç Bildirimi</div>
  <div>Tarih: <b>{{date}}</b></div>
</div>
<div style="border-top:1px solid #ddd;margin:10px 0 14px;"></div>

<div style="font-size:11pt;">
  <div style="font-weight:700;">Sayın {{firstName}} {{lastName}},</div>
  <div style="margin-top:10px;">
    Sendika tüzüğü ve ilgili mevzuata aykırı davranışlarınız nedeniyle, Sendika Yönetim Kurulu kararı ile sendikamızdan ihraç edilmiş bulunmaktasınız.
  </div>
</div>

<div style="margin-top:14px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>İhraç Nedeni</b></div>
  <div style="white-space:pre-wrap;font-size:11pt;">{{expulsionReason}}</div>
</div>

<div style="margin-top:14px;font-size:10.5pt;color:#555;">
  Bu karar <b>{{date}}</b> tarihinde alınmış olup, itiraz hakkınız saklıdır.
</div>

<div style="margin-top:16px;border-top:1px solid #eee;padding-top:10px;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
    <tr>
      <td style="width:60%;color:#555;">
        Üye No: <b>{{memberNumber}}</b> &nbsp;•&nbsp; T.C.: <b>{{nationalId}}</b><br/>
        Kurum/Şube: <b>{{institution}}</b> / <b>{{branch}}</b><br/>
        İl/İlçe: <b>{{province}}</b> / <b>{{district}}</b>
      </td>
      <td style="width:40%;text-align:right;">
        <div style="font-weight:700;">Sendika Yönetim Kurulu</div>
        <div style="margin-top:34px;color:#666;">İmza / Kaşe</div>
      </td>
    </tr>
  </table>
</div>`,
      type: DocumentTemplateType.EXPULSION_LETTER,
      isActive: true,
    },
    {
      name: 'Onay Belgesi',
      description: 'Üyelik onay belgesi (minimal, resmî format)',
      template: `
<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5pt;color:#444;">
  <div>Üyelik Onayı</div>
  <div>Tarih: <b>{{date}}</b></div>
</div>
<div style="border-top:1px solid #ddd;margin:10px 0 14px;"></div>

<div style="font-size:11pt;">
  <div style="font-weight:700;">Sayın {{firstName}} {{lastName}},</div>
  <div style="margin-top:10px;">
    Üyelik başvurunuz değerlendirilmiş ve Sendika Yönetim Kurulu tarafından <b>onaylanmıştır</b>. Sendikamıza hoş geldiniz.
  </div>
</div>

<div style="margin-top:14px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Başvuru Bilgileri</b></div>
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
    <tr><td style="width:34%;padding:4px 0;color:#333;">Başvuru Tarihi</td><td style="padding:4px 0;">: {{applicationDate}}</td></tr>
    <tr><td style="padding:4px 0;color:#333;">Y.K. Karar Tarihi</td><td style="padding:4px 0;">: {{boardDecisionDate}}</td></tr>
    <tr><td style="padding:4px 0;color:#333;">Y.K. Defter No</td><td style="padding:4px 0;">: {{boardDecisionBookNo}}</td></tr>
  </table>
</div>

<div style="margin-top:14px;border-top:1px solid #eee;padding-top:10px;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
    <tr>
      <td style="width:60%;color:#555;">
        Üye No: <b>{{memberNumber}}</b> &nbsp;•&nbsp; T.C.: <b>{{nationalId}}</b><br/>
        Kurum/Şube: <b>{{institution}}</b> / <b>{{branch}}</b><br/>
        İl/İlçe: <b>{{province}}</b> / <b>{{district}}</b>
      </td>
      <td style="width:40%;text-align:right;">
        <div style="font-weight:700;">Sendika Yönetim Kurulu</div>
        <div style="margin-top:34px;color:#666;">İmza / Kaşe</div>
      </td>
    </tr>
  </table>
</div>`,
      type: DocumentTemplateType.APPROVAL_CERTIFICATE,
      isActive: true,
    },
    {
      name: 'Davet Mektubu',
      description: 'Etkinlik / toplantı davet mektubu (modern, kurumsal)',
      template: `
<style>
  .doc { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Helvetica Neue", sans-serif; color:#0f172a; }
  .doc { padding: 18mm 16mm; box-sizing: border-box; }
  body[data-header-paper="true"] .doc { padding: 0 !important; }
  .muted { color:#475569; }
  .topbar { display:flex; align-items:flex-start; justify-content:space-between; gap: 14px; }
  .badge { display:inline-block; padding: 4px 10px; border-radius: 999px; font-size: 8.5pt; font-weight: 800; letter-spacing:.55px; background: rgba(14,165,233,.12); color:#075985; }
  .date { font-size: 10pt; color:#475569; }
  .title { margin-top: 10px; font-size: 16pt; font-weight: 900; letter-spacing:.4px; }
  .subtitle { margin-top: 2px; font-size: 10pt; color:#64748b; }
  .hr { height: 1px; background: rgba(15, 23, 42, .10); margin: 12px 0 14px; }
  .salute { font-size: 11.5pt; font-weight: 700; }
  .p { margin-top: 10px; font-size: 11pt; line-height: 1.55; color:#0f172a; }
  .card { margin-top: 12px; border: 1px solid rgba(15, 23, 42, .10); background: rgba(241,245,249,.60); border-radius: 14px; padding: 12px 14px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
  .kv .k { font-size: 8.2pt; letter-spacing:.4px; text-transform: uppercase; color:#64748b; }
  .kv .v { margin-top: 3px; font-size: 11pt; font-weight: 800; color:#0f172a; }
  .kv .v.normal { font-weight: 600; }
  .note { margin-top: 10px; font-size: 9.8pt; color:#475569; }
  .footer { margin-top: 18px; display:flex; justify-content:space-between; gap: 16px; align-items:flex-end; }
  .signature { text-align:right; min-width: 60mm; }
  .signature .org { font-weight: 800; }
  .signature .line { margin-top: 26px; height: 1px; background: rgba(15, 23, 42, .20); }
  .signature .hint { margin-top: 6px; font-size: 9pt; color:#64748b; }
</style>

<div class="doc">
  <div class="topbar">
    <div>
      <span class="badge">DAVET</span>
      <div class="title">Etkinlik Daveti</div>
      <div class="subtitle muted">Katılımınızı rica ederiz</div>
    </div>
    <div class="date">Tarih: <b>{{date}}</b></div>
  </div>

  <div class="hr"></div>

  <div class="salute">Sayın {{firstName}} {{lastName}},</div>
  <div class="p">
    Sendikamız tarafından düzenlenecek etkinliğimize katılımınızı memnuniyetle bekleriz.
  </div>

  <div class="card">
    <div class="grid">
      <div class="kv">
        <div class="k">Etkinlik</div>
        <div class="v">{{eventName}}</div>
      </div>
      <div class="kv">
        <div class="k">Tarih / Saat</div>
        <div class="v normal">{{eventDate}}</div>
      </div>
      <div class="kv" style="grid-column: 1 / -1;">
        <div class="k">Yer</div>
        <div class="v normal">{{eventPlace}}</div>
      </div>
    </div>
  </div>

  <div class="p" style="white-space:pre-wrap;">{{eventDescription}}</div>

  <div class="note">
    Not: Katılım durumunuzu <b>{{invitationDate}}</b> tarihine kadar bildirmenizi rica ederiz.
  </div>

  <div class="footer">
    <div class="muted" style="font-size:10pt;">
      Saygılarımızla,
    </div>
    <div class="signature">
      <div class="org">Sendika Yönetimi</div>
      <div class="line"></div>
      <div class="hint">İmza / Kaşe</div>
    </div>
  </div>
</div>`,
      type: DocumentTemplateType.INVITATION_LETTER,
      isActive: true,
    },
    {
      name: 'Tebrik Mektubu',
      description: 'Tebrik mektubu (modern, kurumsal)',
      template: `
<style>
  .doc { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Helvetica Neue", sans-serif; color:#0f172a; }
  .doc { padding: 18mm 16mm; box-sizing: border-box; }
  body[data-header-paper="true"] .doc { padding: 0 !important; }
  .topbar { display:flex; align-items:flex-start; justify-content:space-between; gap: 14px; }
  .badge { display:inline-block; padding: 4px 10px; border-radius: 999px; font-size: 8.5pt; font-weight: 800; letter-spacing:.55px; background: rgba(34,197,94,.14); color:#166534; }
  .date { font-size: 10pt; color:#475569; }
  .title { margin-top: 10px; font-size: 16pt; font-weight: 900; letter-spacing:.4px; }
  .subtitle { margin-top: 2px; font-size: 10pt; color:#64748b; }
  .hr { height: 1px; background: rgba(15, 23, 42, .10); margin: 12px 0 14px; }
  .salute { font-size: 11.5pt; font-weight: 700; }
  .highlight {
    margin-top: 12px;
    border: 1px solid rgba(15, 23, 42, .10);
    background: rgba(241,245,249,.60);
    border-radius: 14px;
    padding: 12px 14px;
  }
  .highlight .k { font-size: 8.2pt; letter-spacing:.4px; text-transform: uppercase; color:#64748b; }
  .highlight .v { margin-top: 4px; font-size: 13pt; font-weight: 900; color:#0f172a; }
  .p { margin-top: 12px; font-size: 11pt; line-height: 1.6; color:#0f172a; }
  .muted { color:#475569; }
  .footer { margin-top: 22px; display:flex; justify-content:space-between; gap: 16px; align-items:flex-end; }
  .signature { text-align:right; min-width: 60mm; }
  .signature .org { font-weight: 800; }
  .signature .line { margin-top: 26px; height: 1px; background: rgba(15, 23, 42, .20); }
  .signature .hint { margin-top: 6px; font-size: 9pt; color:#64748b; }
</style>

<div class="doc">
  <div class="topbar">
    <div>
      <span class="badge">TEBRİK</span>
      <div class="title">Tebrik Mektubu</div>
      <div class="subtitle">Başarınızı tebrik ederiz</div>
    </div>
    <div class="date">Tarih: <b>{{date}}</b></div>
  </div>

  <div class="hr"></div>

  <div class="salute">Sayın {{firstName}} {{lastName}},</div>

  <div class="highlight">
    <div class="k">Tebrik Sebebi</div>
    <div class="v" style="white-space:pre-wrap;">{{reason}}</div>
  </div>

  <div class="p" style="white-space:pre-wrap;">{{description}}</div>

  <div class="p">
    Bu vesileyle sizi tebrik eder, başarılarınızın devamını dileriz.
  </div>

  <div class="footer">
    <div class="muted" style="font-size:10pt;">
      Saygılarımızla,
    </div>
    <div class="signature">
      <div class="org">Sendika Yönetimi</div>
      <div class="line"></div>
      <div class="hint">İmza / Kaşe</div>
    </div>
  </div>
</div>`,
      type: DocumentTemplateType.CONGRATULATION_LETTER,
      isActive: true,
    },
    {
      name: 'Uyarı Mektubu',
      description: 'Uyarı mektubu (minimal)',
      template: `
<div style="text-align:right;font-size:10.5pt;color:#444;">Tarih: <b>{{date}}</b></div>
<div style="margin-top:10px;font-size:11pt;font-weight:700;">Sayın {{firstName}} {{lastName}},</div>

<div style="margin-top:10px;font-size:11pt;color:#111;">
  Sendika tüzüğü ve yönetmeliklerine uygun davranmanız gerektiği konusunda bu yazı ile uyarılmaktasınız.
</div>

<div style="margin-top:14px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Uyarı Nedeni</b></div>
  <div style="white-space:pre-wrap;font-size:11pt;">{{warningReason}}</div>
</div>

<div style="margin-top:14px;font-size:11pt;color:#111;">
  Bu uyarının dikkate alınması ve gerekli düzenlemelerin yapılması beklenmektedir.
</div>

<div style="margin-top:22px;text-align:right;">
  <div style="font-weight:700;">Sendika Yönetim Kurulu</div>
  <div style="margin-top:34px;color:#666;">İmza / Kaşe</div>
</div>`,
      type: DocumentTemplateType.WARNING_LETTER,
      isActive: true,
    },
    {
      name: 'Bildirim Mektubu',
      description: 'Bildirim mektubu (minimal)',
      template: `
<div style="text-align:right;font-size:10.5pt;color:#444;">Tarih: <b>{{date}}</b></div>
<div style="margin-top:10px;font-size:11pt;font-weight:700;">Sayın {{firstName}} {{lastName}},</div>

<div style="margin-top:12px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Konu</b></div>
  <div style="font-size:12pt;font-weight:800;color:#111;">{{notificationSubject}}</div>
</div>

<div style="margin-top:10px;font-size:11pt;white-space:pre-wrap;color:#111;">{{notificationContent}}</div>

<div style="margin-top:22px;text-align:right;">
  <div style="font-weight:700;">Sendika Yönetimi</div>
  <div style="margin-top:34px;color:#666;">İmza / Kaşe</div>
</div>`,
      type: DocumentTemplateType.NOTIFICATION_LETTER,
      isActive: true,
    },
    {
      name: 'Üyelik Başvuru Formu',
      description: 'Üyelik başvuru formu (minimal, alanlı)',
      template: `
<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5pt;color:#444;">
  <div>Üyelik Başvuru Formu</div>
  <div>Tarih: <b>{{date}}</b></div>
</div>
<div style="border-top:1px solid #ddd;margin:10px 0 14px;"></div>

<div style="font-size:12pt;font-weight:800;margin:6px 0 8px;">Kişisel Bilgiler</div>
<table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
  <tr><td style="width:34%;padding:4px 0;color:#333;">Ad Soyad</td><td style="padding:4px 0;">: <b>{{firstName}} {{lastName}}</b></td></tr>
  <tr><td style="padding:4px 0;color:#333;">T.C. Kimlik No</td><td style="padding:4px 0;">: {{nationalId}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Anne / Baba Adı</td><td style="padding:4px 0;">: {{motherName}} / {{fatherName}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Doğum Tarihi / Yeri</td><td style="padding:4px 0;">: {{birthDate}} / {{birthPlace}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Cinsiyet</td><td style="padding:4px 0;">: {{gender}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Telefon</td><td style="padding:4px 0;">: {{phone}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">E-posta</td><td style="padding:4px 0;">: {{email}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Adres</td><td style="padding:4px 0;">: {{address}}</td></tr>
</table>

<div style="margin-top:14px;font-size:12pt;font-weight:800;margin-bottom:8px;">Kurum / Görev Bilgileri</div>
<table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
  <tr><td style="width:34%;padding:4px 0;color:#333;">İl / İlçe</td><td style="padding:4px 0;">: {{province}} / {{district}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Kurum</td><td style="padding:4px 0;">: {{institution}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Görev Birimi</td><td style="padding:4px 0;">: {{dutyUnit}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Kurum Adresi</td><td style="padding:4px 0;">: {{institutionAddress}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Şube</td><td style="padding:4px 0;">: {{branch}}</td></tr>
</table>

<div style="margin-top:14px;font-size:12pt;font-weight:800;margin-bottom:8px;">Eğitim Bilgileri</div>
<table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
  <tr><td style="width:34%;padding:4px 0;color:#333;">Eğitim Durumu</td><td style="padding:4px 0;">: {{educationStatus}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Okul</td><td style="padding:4px 0;">: {{schoolName}}</td></tr>
  <tr><td style="padding:4px 0;color:#333;">Bölüm</td><td style="padding:4px 0;">: {{department}}</td></tr>
</table>

<div style="margin-top:14px;font-size:10.5pt;color:#555;">
  Başvuru Tarihi: <b>{{applicationDate}}</b> &nbsp;•&nbsp; Durum: <b>{{applicationStatus}}</b>
</div>

<div style="margin-top:18px;font-size:10.5pt;color:#555;">
  Yukarıdaki bilgilerin doğruluğunu taahhüt ederim.
</div>

<div style="margin-top:18px;display:flex;justify-content:space-between;gap:12px;">
  <div style="flex:1;">
    <div style="font-size:10pt;color:#666;">Başvuran İmzası</div>
    <div style="border-bottom:1px solid #999;margin-top:26px;"></div>
  </div>
  <div style="width:45mm;text-align:right;">
    <div style="font-size:10pt;color:#666;">Tarih</div>
    <div style="margin-top:26px;font-weight:700;">{{date}}</div>
  </div>
</div>`,
      type: DocumentTemplateType.MEMBERSHIP_APPLICATION,
      isActive: true,
    },
    {
      name: 'Nakil Belgesi',
      description: 'Nakil belgesi (minimal)',
      template: `
<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5pt;color:#444;">
  <div>Nakil Belgesi</div>
  <div>Tarih: <b>{{date}}</b></div>
</div>
<div style="border-top:1px solid #ddd;margin:10px 0 14px;"></div>

<div style="font-size:11pt;">
  <div style="font-weight:700;">Sayın {{firstName}} {{lastName}},</div>
  <div style="margin-top:10px;">
    Üyemiz <b>{{firstName}} {{lastName}}</b> (Üye No: <b>{{memberNumber}}</b>) için nakil işlemi <b>{{date}}</b> tarihinde gerçekleştirilmiştir.
  </div>
</div>

<div style="margin-top:14px;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:10px;">
        <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Eski Bilgiler</b></div>
        <div>İl: <b>{{oldProvince}}</b></div>
        <div>İlçe: <b>{{oldDistrict}}</b></div>
        <div>Kurum: <b>{{oldInstitution}}</b></div>
        <div>Şube: <b>{{oldBranch}}</b></div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:10px;border-left:1px solid #eee;">
        <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Yeni Bilgiler</b></div>
        <div>İl: <b>{{province}}</b></div>
        <div>İlçe: <b>{{district}}</b></div>
        <div>Kurum: <b>{{institution}}</b></div>
        <div>Şube: <b>{{branch}}</b></div>
      </td>
    </tr>
  </table>
</div>

<div style="margin-top:12px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Nakil Nedeni</b></div>
  <div style="white-space:pre-wrap;font-size:11pt;">{{transferReason}}</div>
</div>

<div style="margin-top:18px;text-align:right;">
  <div style="font-weight:700;">Sendika Yönetimi</div>
  <div style="margin-top:34px;color:#666;">İmza / Kaşe</div>
</div>`,
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
      value: '/uploads/logos/default-logo.png',
      description: 'Site logo URL',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'DOCUMENT_HEADER_PAPER_PATH',
      value: '/uploads/header-paper/yonetim_paneli_antetli_kagit.pdf',
      description: 'Üye dökümanları için antetli kağıt dosyası yolu',
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
    {
      key: 'SYSTEM_CODE',
      value: 'sendika-core',
      description: 'Sistem kısa adı / kod adı (loglama ve versiyon takibi için)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'SYSTEM_VERSION',
      value: '1.0.0',
      description: 'Sistem versiyonu (read-only)',
      category: SystemSettingCategory.GENERAL,
      isEditable: false,
    },
    {
      key: 'ENVIRONMENT',
      value: 'Production',
      description: 'Ortam bilgisi (Production / Staging / Test)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'CONTACT_EMAIL',
      value: 'info@sendika.org',
      description: 'Kurumsal e-posta adresi (PDF, e-posta, bildirim çıktılarında kullanılır)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'CONTACT_PHONE',
      value: '',
      description: 'Kurumsal telefon numarası',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'CONTACT_ADDRESS',
      value: '',
      description: 'Kurumsal adres (opsiyonel)',
      category: SystemSettingCategory.GENERAL,
      isEditable: true,
    },
    {
      key: 'FOOTER_TEXT',
      value: '© 2025 Sendika Yönetim Sistemi – Tüm hakları saklıdır',
      description: 'Alt bilgi (Footer) metni (PDF, e-posta, rapor çıktılarında kullanılır)',
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
    // DASHBOARD AYARLARI
    {
      key: 'DASHBOARD_SHOW_QUICK_ACTIONS',
      value: 'true',
      description: 'Dashboard hizli aksiyon kartlarini göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_STAT_CARDS',
      value: 'true',
      description: 'Dashboard istatistik kartlarini göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_RECENT_MEMBERS',
      value: 'true',
      description: 'Dashboard son eklenen üyeler bölümünü göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_RECENT_PAYMENTS',
      value: 'true',
      description: 'Dashboard son kesintiler bölümünü göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_PAYMENT_STATS',
      value: 'true',
      description: 'Dashboard kesinti istatistikleri bölümünü göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_MEMBER_STATS',
      value: 'true',
      description: 'Dashboard üye istatistikleri bölümünü göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_APPLICATION_MANAGEMENT',
      value: 'true',
      description: 'Dashboard basvuru yönetimi bölümünü göster',
      category: SystemSettingCategory.DASHBOARD,
      isEditable: true,
    },
    {
      key: 'DASHBOARD_SHOW_USER_STATS',
      value: 'true',
      description: 'Dashboard kullanıcı istatistikleri bölümünü göster',
      category: SystemSettingCategory.DASHBOARD,
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
    {
      key: 'MEMBERSHIP_ALLOWED_SOURCES',
      value: '',
      description: 'İzin verilen başvuru kaynakları (virgülle ayrılmış: DIRECT, OTHER). Boş ise tüm kaynaklar izinlidir.',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_AUTO_GENERATE_REG_NUMBER',
      value: 'true',
      description: 'Kayıt numarasını otomatik oluştur',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REG_NUMBER_PREFIX',
      value: 'UYE',
      description: 'Kayıt numarası öneki',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REG_NUMBER_FORMAT',
      value: 'PREFIX_YEAR_SEQUENTIAL',
      description: 'Kayıt numarası formatı (SEQUENTIAL, YEAR_SEQUENTIAL, PREFIX_SEQUENTIAL, PREFIX_YEAR_SEQUENTIAL)',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REG_NUMBER_START',
      value: '1',
      description: 'Başlangıç numarası',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_BOARD_DECISION',
      value: 'false',
      description: 'Yönetim kurulu kararı zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_ALLOW_CANCELLATION',
      value: 'true',
      description: 'Üyelik iptaline izin ver',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_ALLOW_RE_REGISTRATION',
      value: 'true',
      description: 'Yeniden kayıt olmaya izin ver',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_DEFAULT_CANCELLATION_REASONS',
      value: 'İstifa, Vefat, İhraç, Diğer',
      description: 'Varsayılan iptal sebepleri (virgülle ayrılmış)',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_MOTHER_NAME',
      value: 'false',
      description: 'Anne adı zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_FATHER_NAME',
      value: 'false',
      description: 'Baba adı zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_BIRTHPLACE',
      value: 'false',
      description: 'Doğum yeri zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_GENDER',
      value: 'false',
      description: 'Cinsiyet zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_EDUCATION',
      value: 'false',
      description: 'Öğrenim durumu zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_PHONE',
      value: 'false',
      description: 'Telefon zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_EMAIL',
      value: 'false',
      description: 'E-posta zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_PROVINCE_DISTRICT',
      value: 'false',
      description: 'İkamet İl/İlçe zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_INSTITUTION_REG_NO',
      value: 'false',
      description: 'Kurum Sicil No zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    {
      key: 'MEMBERSHIP_REQUIRE_WORK_UNIT',
      value: 'false',
      description: 'Görev Birimi zorunlu mu?',
      category: SystemSettingCategory.MEMBERSHIP,
      isEditable: true,
    },
    // AİDAT AYARLARI
    {
      key: 'DUES_DEFAULT_AMOUNT',
      value: '100',
      description: 'Varsayılan Kesinti tutarı (TL)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    {
      key: 'DUES_DEFAULT_PERIOD',
      value: 'MONTHLY',
      description: 'Varsayılan Kesinti periyodu (MONTHLY, YEARLY)',
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
      description: 'Borç hatırlatma gün sayısı (Kesinti tarihinden önce)',
      category: SystemSettingCategory.DUES,
      isEditable: true,
    },
    {
      key: 'DUES_GRACE_PERIOD_DAYS',
      value: '15',
      description: 'Kesinti erteleme süresi (gün)',
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
      description: 'Kesinti hatırlatma bildirimleri aktif mi?',
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
    // LOGLAMA & DENETİM AYARLARI
    {
      key: 'AUDIT_LOG_ENABLED',
      value: 'true',
      description: 'Audit log aktif mi?',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    {
      key: 'AUDIT_LOG_RETENTION_DAYS',
      value: '365',
      description: 'Log saklama süresi (gün)',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    {
      key: 'AUDIT_LOG_MAX_RECORDS',
      value: '100000',
      description: 'Maksimum log kayıt sayısı (0 = sınırsız)',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    {
      key: 'AUDIT_LOG_USER_ACTIONS',
      value: 'true',
      description: 'Kullanıcı işlemlerini logla',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    {
      key: 'AUDIT_LOG_SYSTEM_CHANGES',
      value: 'true',
      description: 'Sistem değişikliklerini logla',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    {
      key: 'AUDIT_LOG_SECURITY_EVENTS',
      value: 'true',
      description: 'Güvenlik olaylarını logla',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    {
      key: 'AUDIT_LOG_DATA_ACCESS',
      value: 'true',
      description: 'Veri erişimini logla',
      category: SystemSettingCategory.AUDIT,
      isEditable: true,
    },
    // RAPOR AYARLARI
    {
      key: 'REPORTS_SHOW_REFRESH_BUTTON',
      value: 'true',
      description: 'Raporlar sayfasında yenile butonunu göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_FILTER_PANEL',
      value: 'true',
      description: 'Raporlar sayfasında filtre panelini göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_KPI_CARDS',
      value: 'true',
      description: 'KPI kartlarını göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_TREND_CARDS',
      value: 'true',
      description: 'Trend kartlarını göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_ALERT_CARDS',
      value: 'true',
      description: 'Uyari kartlarini göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_MEMBER_GROWTH_CHART',
      value: 'true',
      description: 'Üye artış/azalış grafiğini göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_MEMBER_STATUS_PIE',
      value: 'true',
      description: 'Üye durum dağılımı grafiğini göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_PROVINCE_DISTRIBUTION_CHART',
      value: 'true',
      description: 'İl bazlı üye dağılım grafiğini göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_DUES_CHART',
      value: 'true',
      description: 'Aylık kesinti grafiğini göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_DUES_SUMMARY_CARDS',
      value: 'true',
      description: 'Kesinti özet kartlarını göster',
      category: SystemSettingCategory.REPORTS,
      isEditable: true,
    },
    {
      key: 'REPORTS_SHOW_REGION_TABLE',
      value: 'true',
      description: 'İl bazlı detaylı rapor tablosunu göster',
      category: SystemSettingCategory.REPORTS,
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
      description: 'Kesinti gateway',
      category: SystemSettingCategory.INTEGRATION,
      isEditable: true,
    },
    {
      key: 'PAYMENT_GATEWAY_API_KEY',
      value: '',
      description: 'Kesinti gateway API anahtarı',
      category: SystemSettingCategory.INTEGRATION,
      isEditable: true,
    },
    {
      key: 'PAYMENT_GATEWAY_SECRET_KEY',
      value: '',
      description: 'Kesinti gateway gizli anahtarı',
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

  // 🔹 Örnek Bildirimler (3 üye için azaltılmış - sadece 5 bildirim)
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
        recipientCount: 3,
        successCount: 3,
        failedCount: 0,
      },
      {
        title: 'Kesinti Hatırlatması',
        message: 'Kesinti Kesintilerinizi zamanında yapmanızı rica ederiz.',
        category: NotificationCategory.FINANCIAL,
        typeCategory: NotificationTypeCategory.DUES_OVERDUE,
        channels: [NotificationChannel.EMAIL],
        targetType: NotificationTargetType.REGION,
        targetId: provincesForNotifications[0].id,
        status: NotificationStatus.SENT,
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
        sentBy: activeUsers[0].id,
        recipientCount: 3,
        successCount: 3,
        failedCount: 0,
      },
      // Admin kullanıcısına özel bildirimler
      {
        title: 'Yeni Üye Başvurusu Bekliyor',
        message: 'Sistemde onay bekleyen yeni üye başvuruları bulunmaktadır. Lütfen kontrol ediniz.',
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
        message: 'Tevkifat dosyaları için muhasebe onayı bekleyen işlemler bulunmaktadır.',
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
    
    // NotificationRecipient kayıtları oluştur
    console.log('📬 Bildirim alıcıları ekleniyor...');
    const allNotifications = await prisma.notification.findMany();
    let recipientCount = 0;
    
    for (const notification of allNotifications) {
      if (notification.targetType === NotificationTargetType.USER && notification.targetId) {
        // Kullanıcıya özel bildirim
        const targetUser = await prisma.user.findUnique({
          where: { id: notification.targetId },
        });
        if (targetUser) {
          for (const channel of notification.channels) {
            await prisma.notificationRecipient.create({
              data: {
                notificationId: notification.id,
                userId: targetUser.id,
                email: targetUser.email,
                channel: channel,
                status: notification.status,
                sentAt: notification.sentAt,
              },
            });
            recipientCount++;
          }
        }
      } else if (notification.targetType === NotificationTargetType.ALL_MEMBERS) {
        // Tüm üyelere bildirim
        const allMembers = await prisma.member.findMany({ take: 5 }); // İlk 5 üyeye gönder
        for (const member of allMembers) {
          for (const channel of notification.channels) {
            await prisma.notificationRecipient.create({
              data: {
                notificationId: notification.id,
                memberId: member.id,
                email: member.email,
                phone: member.phone,
                channel: channel,
                status: notification.status,
                sentAt: notification.sentAt,
              },
            });
            recipientCount++;
          }
        }
      }
    }
    console.log(`   - ${recipientCount} bildirim alıcısı eklendi`);
    
    // NotificationLog kayıtları oluştur
    console.log('📋 Bildirim logları ekleniyor...');
    const allRecipients = await prisma.notificationRecipient.findMany({ take: 10 });
    let logCount = 0;
    
    for (const recipient of allRecipients) {
      const actions = ['SENT', 'DELIVERED', 'READ'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const status = action === 'SENT' ? NotificationStatus.SENT : 
                     action === 'DELIVERED' ? NotificationStatus.SENT : 
                     NotificationStatus.SENT;
      
      await prisma.notificationLog.create({
        data: {
          notificationId: recipient.notificationId,
          recipientId: recipient.id,
          channel: recipient.channel,
          action: action,
          status: status,
          message: `Bildirim ${action} durumunda`,
          createdAt: recipient.sentAt || new Date(),
        },
      });
      logCount++;
    }
    console.log(`   - ${logCount} bildirim logu eklendi`);
  }

  // 🔹 Kullanıcı Bildirim Ayarları
  console.log('🔔 Kullanıcı bildirim ayarları ekleniyor...');
  const allUsersForSettings = await prisma.user.findMany({ take: 5 });
  let settingsCount = 0;
  
  for (const user of allUsersForSettings) {
    await prisma.userNotificationSettings.create({
      data: {
        userId: user.id,
        emailEnabled: true,
        smsEnabled: Math.random() > 0.5,
        whatsappEnabled: false,
        inAppEnabled: true,
        timeZone: 'Europe/Istanbul',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        systemNotificationsEnabled: true,
        financialNotificationsEnabled: true,
        announcementNotificationsEnabled: true,
        reminderNotificationsEnabled: true,
        typeCategorySettings: {
          MEMBER_APPLICATION_NEW: true,
          MEMBER_APPLICATION_APPROVED: true,
          DUES_PAYMENT_RECEIVED: true,
          DUES_OVERDUE: true,
        },
      },
    });
    settingsCount++;
  }
  console.log(`   - ${settingsCount} kullanıcı bildirim ayarı eklendi`);

  // 🔹 Tevkifat Merkezleri - Sadece 3 merkez oluştur
  console.log('🏛️  Tevkifat merkezleri ekleniyor...');
  const tevkifatCenterMap: Record<string, string> = {};
  
  const tevkifatCentersData = [
    {
      name: 'İstanbul Kadıköy Tevkifat Merkezi',
      provinceName: 'İstanbul',
      districtName: 'Kadıköy',
      isActive: true,
    },
    {
      name: 'Ankara Çankaya Tevkifat Merkezi',
      provinceName: 'Ankara',
      districtName: 'Çankaya',
      isActive: true,
    },
    {
      name: 'İzmir Konak Tevkifat Merkezi',
      provinceName: 'İzmir',
      districtName: 'Konak',
      isActive: true,
    },
  ];

  // Tevkifat merkezlerini oluştur (il/ilçe varsa)
  for (const centerData of tevkifatCentersData) {
    // Önce provinceMap'ten ara
    let provinceId = provinceMap[centerData.provinceName];
    
    // Eğer provinceMap'te yoksa, veritabanından case-insensitive arama yap
    if (!provinceId) {
      const allProvinces = await prisma.province.findMany();
      const matchedProvince = allProvinces.find(
        p => p.name.toLowerCase().trim() === centerData.provinceName.toLowerCase().trim()
      );
      if (matchedProvince) {
        provinceId = matchedProvince.id;
      }
    }
    
    // Önce districtMap'ten ara (farklı formatları dene)
    let districtId = districtMap[`${centerData.provinceName}_${centerData.districtName}`];
    
    // Eğer districtMap'te yoksa, veritabanından ara (case-insensitive ve Türkçe karakter esnekliği ile)
    if (!districtId && provinceId) {
      // Önce tam eşleşme dene
      let district = await prisma.district.findFirst({
        where: {
          provinceId: provinceId,
          name: centerData.districtName,
        },
      });
      
      // Eğer bulunamazsa, case-insensitive arama yap
      if (!district) {
        const allDistricts = await prisma.district.findMany({
          where: { provinceId: provinceId },
        });
        district = allDistricts.find(
          d => d.name.toLowerCase().trim() === centerData.districtName.toLowerCase().trim()
        ) || null;
      }
      
      if (district) {
        districtId = district.id;
      }
    }
    
    // Eğer hala districtId bulunamadıysa ama provinceId varsa, o ilin herhangi bir ilçesini kullan
    if (provinceId && !districtId) {
      const anyDistrict = await prisma.district.findFirst({
        where: { provinceId: provinceId },
      });
      if (anyDistrict) {
        districtId = anyDistrict.id;
        console.warn(`   ⚠️  ${centerData.districtName} ilçesi bulunamadı, ${anyDistrict.name} ilçesi kullanılıyor: ${centerData.name}`);
      }
    }
    
    if (provinceId && districtId) {
      const created = await prisma.tevkifatCenter.create({
        data: {
          name: centerData.name,
          provinceId: provinceId,
          districtId: districtId,
          isActive: centerData.isActive,
        },
      });
      tevkifatCenterMap[centerData.name] = created.id;
    } else {
      console.warn(`   ⚠️  Tevkifat merkezi eklenemedi: ${centerData.name} (il bulunamadı)`);
    }
  }

  console.log(`   - ${Object.keys(tevkifatCenterMap).length} tevkifat merkezi eklendi`);

  // 🔹 Tevkifat Ünvanları
  console.log('🏷️  Tevkifat ünvanları ekleniyor...');
  const tevkifatTitles = [
    { name: 'Hemşire' },
    { name: 'Ebe' },
    { name: 'Sağlık Memuru' },
    { name: 'Tıbbi Sekreter' },
    { name: 'Laborant' },
    { name: 'Radyoloji Teknisyeni' },
    { name: 'Anestezi Teknisyeni' },
    { name: 'Ameliyat Hemşiresi' },
    { name: 'Yoğun Bakım Hemşiresi' },
    { name: 'Acil Tıp Teknisyeni' },
    { name: 'Diyetisyen' },
    { name: 'Fizyoterapist' },
    { name: 'Paramedik' },
    { name: 'Odyolog' },
    { name: 'Perfüzyonist' },
    { name: 'Tıbbi Teknolog' },
  ];
  const tevkifatTitleMap: Record<string, string> = {};
  for (const title of tevkifatTitles) {
    const created = await prisma.tevkifatTitle.create({
      data: title,
    });
    tevkifatTitleMap[title.name] = created.id;
  }
  const tevkifatTitleIds = Object.values(tevkifatTitleMap);
  console.log(`   - ${tevkifatTitles.length} tevkifat ünvanı eklendi`);

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

  // 🔹 Üye Grubu
  console.log('👥 Üye grupları ekleniyor...');
  const memberGroups = [
    { name: 'Üye', description: 'Üye grubu', order: 1 },
  ];
  const createdMemberGroups: { id: string }[] = [];
  for (const group of memberGroups) {
    const createdGroup = await prisma.memberGroup.create({
      data: group,
    });
    createdMemberGroups.push({ id: createdGroup.id });
  }
  console.log(`   - ${memberGroups.length} üye grubu eklendi`);

  // Üye grubu oluşturmadan önce eklenen üyelerde memberGroupId boş kalabiliyor.
  // Varsayılan üye grubunu bu kayıtlar için geriye dönük olarak doldur.
  const defaultMemberGroupId = createdMemberGroups[0]?.id ?? null;
  if (defaultMemberGroupId) {
    const updatedMembers = await prisma.member.updateMany({
      where: { memberGroupId: null },
      data: { memberGroupId: defaultMemberGroupId },
    });
    console.log(`   - ${updatedMembers.count} üyenin grubu varsayılan olarak dolduruldu`);
  }

  // 🔹 Meslek/Unvan (Profession)
  console.log('💼 Meslek/Unvan ekleniyor...');
  const professions = [
    { name: 'Hemşire' },
    { name: 'Ebe' },
    { name: 'Sağlık Memuru' },
    { name: 'Tıbbi Sekreter' },
    { name: 'Tıbbi Teknisyen' },
    { name: 'Laborant' },
    { name: 'Radyoloji Teknisyeni' },
    { name: 'Anestezi Teknisyeni' },
    { name: 'Fizyoterapist' },
    { name: 'Diyetisyen' },
    { name: 'Sosyal Hizmet Uzmanı' },
    { name: 'Psikolog' },
    { name: 'Eczacı' },
    { name: 'Doktor' },
    { name: 'Başhemşire' },
    { name: 'Hemşirelik Hizmetleri Müdürü' },
    { name: 'Eğitim Hemşiresi' },
    { name: 'Klinik Eğitim Sorumlusu' },
    { name: 'Kalite Yönetim Sorumlusu' },
    { name: 'Hasta Hakları Sorumlusu' },
  ];
  const professionMap: Record<string, string> = {};
  for (const profession of professions) {
    const created = await prisma.profession.create({
      data: profession,
    });
    professionMap[profession.name] = created.id;
  }
  const professionIds = Object.values(professionMap);
  console.log(`   - ${professions.length} meslek/unvan eklendi`);

  // 🔹 Kurumlar (Institutions) - Zaten üyelerden önce oluşturuldu (8.6. bölümünde)

  // 🔹 300 Aktif Üye Oluştur (Tüm alanlar dolu)
  console.log('👥 300 aktif üye oluşturuluyor (tüm alanlar dolu)...');
  const allInstitutionsForNewMembers = await prisma.institution.findMany();
  const allBranchesForNewMembers = await prisma.branch.findMany();
  const allProvincesForNewMembers = await prisma.province.findMany();
  const tevkifatCenterIdsForNewMembers = Object.values(tevkifatCenterMap);
  const tevkifatTitleIdsForNewMembers = Object.values(tevkifatTitleMap);
  const membershipInfoOptionsForNewMembers = await prisma.membershipInfoOption.findMany();
  const memberGroupsForNewMembers = await prisma.memberGroup.findMany();
  const professionIdsForNewMembers = Object.values(professionMap);
  
  if (allInstitutionsForNewMembers.length === 0 || allBranchesForNewMembers.length === 0) {
    console.error('⚠️  Kurum veya şube bulunamadı! 300 aktif üye oluşturulamıyor.');
  } else {
    let newActiveMemberCount = 0;
    let skippedNewMemberCount = 0;
    
    // Mevcut kayıt numarasını al
    const lastMember = await prisma.member.findFirst({
      orderBy: { registrationNumber: 'desc' },
      select: { registrationNumber: true },
    });
    
    let currentRegistrationCounter = memberRegistrationCounter;
    if (lastMember?.registrationNumber) {
      const lastNumber = lastMember.registrationNumber.replace('UYE-', '');
      const lastNum = parseInt(lastNumber, 10);
      if (!isNaN(lastNum)) {
        currentRegistrationCounter = lastNum + 1;
      }
    }
    
    const dutyUnits = ['Acil Servis', 'Yoğun Bakım', 'Klinik', 'Poliklinik', 'Ameliyathane', 'Laboratuvar', 'Radyoloji', 'Eczane', 'Yönetim', 'Eğitim Birimi', 'Enfeksiyon Kontrolü', 'Hasta Bakım Hizmetleri'];
    const staffTitleCodes = ['657-001', '657-002', '4B-001', '4B-002', '663-001', '663-002', '4924-001', '4924-002'];
    const provinceNamesForAddress = Object.keys(provinceMap);
    
    for (let i = 0; i < 300; i++) {
      try {
        // İsim ve soyisim
        const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        
        // TC Kimlik No (benzersiz olmalı)
        let nationalId: string;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          nationalId = generateNationalId();
          const existing = await prisma.member.findUnique({
            where: { nationalId },
            select: { id: true },
          });
          if (!existing) {
            isUnique = true;
          }
          attempts++;
        }
        if (!isUnique) {
          nationalId = `${generateNationalId()}_${Date.now()}_${i}`;
        }
        
        // İl ve ilçe seç
        const provinceId = provinceIds[Math.floor(Math.random() * provinceIds.length)];
        const districtsInProvince = await prisma.district.findMany({
          where: { provinceId },
          select: { id: true },
        });
        const districtId = districtsInProvince.length > 0
          ? districtsInProvince[Math.floor(Math.random() * districtsInProvince.length)].id
          : undefined;
        
        // Kurum bilgileri
        const institutionId = allInstitutionsForNewMembers[Math.floor(Math.random() * allInstitutionsForNewMembers.length)].id;
        const branchId = allBranchesForNewMembers[Math.floor(Math.random() * allBranchesForNewMembers.length)].id;
        
        // Tevkifat bilgileri
        const tevkifatCenterId = tevkifatCenterIdsForNewMembers.length > 0
          ? tevkifatCenterIdsForNewMembers[i % tevkifatCenterIdsForNewMembers.length]
          : null;
        const tevkifatTitleId = tevkifatTitleIdsForNewMembers.length > 0
          ? tevkifatTitleIdsForNewMembers[i % tevkifatTitleIdsForNewMembers.length]
          : null;
        
        // Üyelik bilgileri
        const membershipInfoOptionId = membershipInfoOptionsForNewMembers.length > 0
          ? (() => {
              const random = Math.random();
              if (random < 0.8 && membershipInfoOptionsForNewMembers[0]) {
                return membershipInfoOptionsForNewMembers[0].id; // Normal üye
              } else if (random < 0.95 && membershipInfoOptionsForNewMembers[1]) {
                return membershipInfoOptionsForNewMembers[1].id; // Fahri üye
              } else if (membershipInfoOptionsForNewMembers[2]) {
                return membershipInfoOptionsForNewMembers[2].id; // Onursal üye
              }
              return membershipInfoOptionsForNewMembers[0]?.id || null;
            })()
          : null;
        
        const memberGroupId = memberGroupsForNewMembers.length > 0
          ? memberGroupsForNewMembers[0].id
          : defaultMemberGroupId;
        
        // Profesyon bilgisi
        const professionId = professionIdsForNewMembers.length > 0
          ? professionIdsForNewMembers[i % professionIdsForNewMembers.length]
          : null;
        
        // Kişisel bilgiler
        const gender = generateGender(firstName);
        const birthDate = generateBirthDate();
        const motherName = generateParentName();
        const fatherName = generateParentName();
        const birthplace = generateBirthplace();
        const educationStatus = generateEducationStatus();
        
        // Kurum detay bilgileri
        const institutionProvinceId = allProvincesForNewMembers.length > 0
          ? allProvincesForNewMembers[i % allProvincesForNewMembers.length].id
          : null;
        
        let institutionDistrictId: string | null = null;
        if (institutionProvinceId) {
          const instDistricts = await prisma.district.findMany({
            where: { provinceId: institutionProvinceId },
            select: { id: true },
          });
          if (instDistricts.length > 0) {
            institutionDistrictId = instDistricts[i % instDistricts.length].id;
          }
        }
        
        const dutyUnit = dutyUnits[i % dutyUnits.length];
        const institutionAddress = `${provinceNamesForAddress[i % provinceNamesForAddress.length]} Merkez, Sağlık Bakanlığı`;
        const institutionRegNo = `KUR-${String(currentRegistrationCounter + i).padStart(6, '0')}`;
        const staffTitleCode = staffTitleCodes[i % staffTitleCodes.length];
        
        // Tarih bilgileri
        const monthsAgo = 1 + Math.floor(Math.random() * 24); // 1-24 ay önce
        const memberCreatedAt = new Date(now);
        memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
        memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28));
        
        // Onay tarihi
        const daysAfterCreation = 3 + Math.floor(Math.random() * 14);
        const approvedAt = new Date(memberCreatedAt.getTime() + daysAfterCreation * 24 * 60 * 60 * 1000);
        if (approvedAt > now) {
          approvedAt.setTime(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        }
        
        // Yönetim kurulu karar tarihi
        const boardDecisionDate = generateBoardDecisionDate(memberCreatedAt);
        const boardDecisionBookNo = generateBoardDecisionBookNo();
        
        // Kullanıcı bilgileri
        const createdByUserId = users[Math.floor(Math.random() * users.length)];
        const approvedByUserId = users[Math.floor(Math.random() * users.length)];
        
        // Kayıt numarası (benzersiz olmalı)
        const registrationNumber = `UYE-${String(currentRegistrationCounter + i).padStart(5, '0')}`;
        
        // districtId zorunlu kontrolü
        if (!districtId) {
          console.warn(`⚠️  İlçe bulunamadı, üye atlanıyor: ${firstName} ${lastName}`);
          continue;
        }

        // Üye oluştur
        const newActiveMember = await prisma.member.create({
          data: {
            firstName,
            lastName,
            nationalId: nationalId!,
            phone: generatePhone(),
            email: generateEmail(firstName, lastName),
            status: MemberStatus.ACTIVE,
            source: MemberSource.DIRECT,
            provinceId,
            districtId,
            branchId,
            registrationNumber,
            institutionId,
            tevkifatCenterId,
            tevkifatTitleId,
            membershipInfoOptionId,
            memberGroupId,
            boardDecisionDate,
            boardDecisionBookNo,
            motherName,
            fatherName,
            birthDate,
            birthplace,
            gender,
            educationStatus,
            professionId,
            dutyUnit,
            institutionAddress,
            institutionProvinceId,
            institutionDistrictId,
            institutionRegNo,
            staffTitleCode,
            createdByUserId,
            approvedByUserId,
            approvedAt,
            createdAt: memberCreatedAt,
            updatedAt: approvedAt,
            isActive: true,
          },
        });
        
        memberIds.push(newActiveMember.id);
        newActiveMemberCount++;
      } catch (error) {
        console.error(`   ⚠️  ${i + 1}. aktif üye oluşturulurken hata:`, error);
        skippedNewMemberCount++;
      }
    }
    
    memberRegistrationCounter = currentRegistrationCounter + 300;
    console.log(`   - ${newActiveMemberCount} aktif üye eklendi (${skippedNewMemberCount} atlandı)`);
    console.log(`   - Toplam üye sayısı: ${memberIds.length}`);
  }

  // 🔹 Üyelere ek alanları ekle (institutionId, tevkifatCenterId, vs.)
  console.log('👤 Üyelere ek alanlar ekleniyor...');
  const allMembersForUpdate = await prisma.member.findMany();
  const genders: Gender[] = [Gender.MALE, Gender.FEMALE];
  const educationStatuses: EducationStatus[] = [EducationStatus.PRIMARY, EducationStatus.HIGH_SCHOOL, EducationStatus.COLLEGE];
  const allInstitutions = await prisma.institution.findMany();
  const tevkifatCenterIds = Object.values(tevkifatCenterMap);
  const provinceNames = Object.keys(provinceMap);
  const membershipInfoOptionsList = await prisma.membershipInfoOption.findMany();
  const membershipInfoIds = membershipInfoOptionsList.map(o => o.id);

  let memberUpdateCount = 0;
  for (let i = 0; i < allMembersForUpdate.length; i++) {
    const member = allMembersForUpdate[i];
    
    // Cinsiyet belirleme - isimden tahmin et
    const gender = generateGender(member.firstName);
    
    // Doğum tarihi oluştur
    const birthDate = generateBirthDate();
    
    // Yönetim kurulu karar tarihi (üyelik tarihinden önce)
    const boardDecisionDate = member.createdAt 
      ? generateBoardDecisionDate(member.createdAt)
      : generateBoardDecisionDate(new Date());
    
    const updateData: any = {
      gender,
      educationStatus: generateEducationStatus(),
      motherName: generateParentName(),
      fatherName: generateParentName(),
      birthDate,
      birthplace: generateBirthplace(),
      boardDecisionDate,
      boardDecisionBookNo: generateBoardDecisionBookNo(),
    };

    // institutionId atanmamışsa ekle
    if (!member.institutionId && allInstitutions.length > 0) {
      updateData.institutionId = allInstitutions[i % allInstitutions.length].id;
    }
    
    // tevkifatCenterId her zaman atanmalı (boş olmamalı)
    if (tevkifatCenterIds.length > 0) {
      updateData.tevkifatCenterId = tevkifatCenterIds[i % tevkifatCenterIds.length];
    }
    
    // tevkifatTitleId ekle (ünvan)
    if (tevkifatTitleIds.length > 0) {
      updateData.tevkifatTitleId = tevkifatTitleIds[i % tevkifatTitleIds.length];
    }
    
    // membershipInfoOptionId ekle (%80 normal üye, %15 fahri, %5 onursal)
    if (membershipInfoIds.length > 0) {
      const random = Math.random();
      if (random < 0.8 && membershipInfoIds[0]) {
        updateData.membershipInfoOptionId = membershipInfoIds[0]; // Normal üye
      } else if (random < 0.95 && membershipInfoIds[1]) {
        updateData.membershipInfoOptionId = membershipInfoIds[1]; // Fahri üye
      } else if (membershipInfoIds[2]) {
        updateData.membershipInfoOptionId = membershipInfoIds[2]; // Onursal üye
      }
    }
    
    // professionId ekle (meslek/unvan)
    if (professionIds.length > 0) {
      updateData.professionId = professionIds[i % professionIds.length];
    }
    
    // Kurum detay bilgileri ekle
    const institutionProvinceIds = Object.values(provinceMap);
    if (institutionProvinceIds.length > 0) {
      const instProvinceId = institutionProvinceIds[i % institutionProvinceIds.length];
      updateData.institutionProvinceId = instProvinceId;
      
      // Bu ile ait ilçeleri bul
      const instDistricts = await prisma.district.findMany({
        where: { provinceId: instProvinceId },
        select: { id: true },
      });
      if (instDistricts.length > 0) {
        updateData.institutionDistrictId = instDistricts[i % instDistricts.length].id;
      }
    }
    
    // Görev birimi, kurum adresi, sicil no, kadro kodu ekle
    const dutyUnits = ['Acil Servis', 'Yoğun Bakım', 'Klinik', 'Poliklinik', 'Ameliyathane', 'Laboratuvar', 'Radyoloji', 'Eczane', 'Yönetim', 'Eğitim Birimi'];
    const staffTitleCodes = ['657-001', '657-002', '4B-001', '4B-002', '663-001', '663-002', '4924-001', '4924-002'];
    
    updateData.dutyUnit = dutyUnits[i % dutyUnits.length];
    updateData.institutionAddress = `${provinceNames[i % provinceNames.length]} Merkez, Sağlık Bakanlığı`;
    updateData.institutionRegNo = `KUR-${String(i + 1).padStart(6, '0')}`;
    updateData.staffTitleCode = staffTitleCodes[i % staffTitleCodes.length];

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
  console.log(`   - ${memberUpdateCount} üyeye ek alanlar eklendi (cinsiyet, doğum tarihi, eğitim, anne/baba adı, tevkifat ünvanı, üyelik bilgisi, yönetim kurulu kararı, meslek/unvan, kurum detayları)`);

  // 🔹 Üye Geçmişi (MemberHistory)
  console.log('📜 Üye geçmişi kayıtları ekleniyor...');
  const membersForHistory = await prisma.member.findMany({ take: 20 });
  let historyCount = 0;
  
  for (const member of membersForHistory) {
    // Üye oluşturma geçmişi
    if (member.createdByUserId) {
      await prisma.memberHistory.create({
        data: {
          memberId: member.id,
          action: 'CREATE',
          changedBy: member.createdByUserId,
          createdAt: member.createdAt,
        },
      });
      historyCount++;
    }
    
    // Üye onaylama geçmişi
    if (member.approvedByUserId && member.approvedAt) {
      await prisma.memberHistory.create({
        data: {
          memberId: member.id,
          action: 'UPDATE',
          fieldName: 'status',
          oldValue: 'PENDING',
          newValue: 'APPROVED',
          changedBy: member.approvedByUserId,
          createdAt: member.approvedAt,
        },
      });
      historyCount++;
    }
    
    // Rastgele güncelleme geçmişi
    if (Math.random() > 0.5 && activeUsers.length > 0) {
      await prisma.memberHistory.create({
        data: {
          memberId: member.id,
          action: 'UPDATE',
          fieldName: 'phone',
          oldValue: member.phone || '',
          newValue: generatePhone(),
          changedBy: activeUsers[Math.floor(Math.random() * activeUsers.length)].id,
          createdAt: new Date(member.createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
      historyCount++;
    }
  }
  console.log(`   - ${historyCount} üye geçmişi kaydı eklendi`);

  // 🔹 Onay Kayıtları (Approval)
  console.log('✅ Onay kayıtları ekleniyor...');
  const institutionsForApproval = await prisma.institution.findMany({ 
    where: { isActive: false },
    take: 5,
  });
  let approvalCount = 0;
  
  for (const institution of institutionsForApproval) {
    if (activeUsers.length > 0) {
      const requester = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const approver = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      
      await prisma.approval.create({
        data: {
          entityType: ApprovalEntityType.INSTITUTION,
          entityId: institution.id,
          status: Math.random() > 0.3 ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
          requestedBy: requester.id,
          approvedBy: Math.random() > 0.3 ? approver.id : null,
          requestData: {
            name: institution.name,
            provinceId: institution.provinceId,
            districtId: institution.districtId,
          },
          approvalNote: Math.random() > 0.3 ? 'Kurum onaylandı' : null,
          approvedAt: Math.random() > 0.3 ? new Date() : null,
        },
      });
      approvalCount++;
    }
  }
  
  // Üye oluşturma onayları
  const pendingMembers = await prisma.member.findMany({
    where: { status: MemberStatus.PENDING },
    take: 3,
  });
  
  for (const member of pendingMembers) {
    if (activeUsers.length > 0 && member.createdByUserId) {
      await prisma.approval.create({
        data: {
          entityType: ApprovalEntityType.MEMBER_CREATE,
          entityId: member.id,
          status: ApprovalStatus.PENDING,
          requestedBy: member.createdByUserId,
          requestData: {
            firstName: member.firstName,
            lastName: member.lastName,
            nationalId: member.nationalId,
          },
        },
      });
      approvalCount++;
    }
  }
  console.log(`   - ${approvalCount} onay kaydı eklendi`);

  // 🔹 Panel Kullanıcı Başvuruları (PanelUserApplication)
  console.log('📝 Panel kullanıcı başvuruları ekleniyor...');
  const membersForApplication = await prisma.member.findMany({
    where: { 
      status: MemberStatus.ACTIVE,
      userId: null, // Henüz kullanıcıya terfi etmemiş
    },
    take: 5,
  });
  const rolesForApplication = await prisma.customRole.findMany({
    where: { 
      name: { in: ['IL_BASKANI', 'ILCE_TEMSILCISI', 'GENEL_SEKRETER'] },
    },
  });
  let applicationCount = 0;
  
  for (const member of membersForApplication) {
    if (rolesForApplication.length > 0 && activeUsers.length > 0) {
      const requestedRole = rolesForApplication[Math.floor(Math.random() * rolesForApplication.length)];
      const reviewer = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const status = Math.random() > 0.4 ? PanelUserApplicationStatus.APPROVED : (Math.random() > 0.5 ? PanelUserApplicationStatus.REJECTED : PanelUserApplicationStatus.PENDING);
      
      const application = await prisma.panelUserApplication.create({
        data: {
          memberId: member.id,
          requestedRoleId: requestedRole.id,
          status: status,
          requestNote: 'Panel kullanıcısı olmak istiyorum',
          reviewedBy: status !== PanelUserApplicationStatus.PENDING ? reviewer.id : null,
          reviewedAt: status !== PanelUserApplicationStatus.PENDING ? new Date() : null,
          reviewNote: status === PanelUserApplicationStatus.APPROVED ? 'Başvuru onaylandı' : status === PanelUserApplicationStatus.REJECTED ? 'Başvuru reddedildi' : null,
        },
      });
      
      // PanelUserApplicationScope ekle
      if (requestedRole.hasScopeRestriction) {
        const sampleProvince = await prisma.province.findFirst();
        if (sampleProvince) {
          await prisma.panelUserApplicationScope.create({
            data: {
              applicationId: application.id,
              provinceId: sampleProvince.id,
            },
          });
        }
      }

      if (status === PanelUserApplicationStatus.APPROVED) {
        const createdUser = await prisma.user.create({
          data: {
            email: buildPanelUserSeedEmail(member.firstName, member.lastName, member.id),
            passwordHash,
            firstName: member.firstName,
            lastName: member.lastName,
            customRoles: {
              connect: [{ id: requestedRole.id }],
            },
          },
        });

        if (requestedRole.hasScopeRestriction) {
          const applicationScopes = await prisma.panelUserApplicationScope.findMany({
            where: {
              applicationId: application.id,
              deletedAt: null,
            },
          });

          if (applicationScopes.length > 0) {
            await prisma.userScope.createMany({
              data: applicationScopes.map((scope) => ({
                userId: createdUser.id,
                provinceId: scope.provinceId,
                districtId: scope.districtId,
              })),
            });
          }
        }

        await prisma.member.update({
          where: { id: member.id },
          data: { userId: createdUser.id },
        });

        await prisma.panelUserApplication.update({
          where: { id: application.id },
          data: { createdUserId: createdUser.id },
        });
      }
      
      applicationCount++;
    }
  }
  console.log(`   - ${applicationCount} panel kullanıcı başvurusu eklendi`);

  // 🔹 Üye Kesintileri
  console.log('💳 Üye Kesintileri ekleniyor...');
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

    // Her aktif üye için son 3-12 ay arası rastgele Kesintiler oluştur (3 üye için toplam 3-9 Kesinti)
    activeMembers.forEach((member, index) => {
      // Üye başına 1-3 arası Kesinti oluştur
      const paymentCount = 1 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < paymentCount; i++) {
        // Geçmiş 12 ay içinde rastgele bir ay seç (daha çeşitli tarihler için)
        const monthsAgo = Math.floor(Math.random() * 12);
        let paymentYear = currentYear;
        let paymentMonth = currentMonth - monthsAgo;
        
        // Ay negatif olursa bir önceki yıla geç
        while (paymentMonth <= 0) {
          paymentMonth += 12;
          paymentYear -= 1;
        }

        // Kesinti türü sadece TEVKIFAT olabilir
        let paymentType: PaymentType;
        let tevkifatCenterId: string | null = null;
        let description: string | null = null;

        // Tevkifat Kesintisi (sadece tevkifatCenterId varsa)
        if (member.tevkifatCenterId) {
          paymentType = PaymentType.TEVKIFAT;
          tevkifatCenterId = member.tevkifatCenterId;
          description = `${paymentMonth}/${paymentYear} tevkifat Kesintisi`;
        } else {
          // Eğer üyenin tevkifatCenterId'si yoksa bu Kesintiyi atla
          continue;
        }

        // Tutar (100-250 TL arası rastgele)
        const amount = (100 + Math.random() * 150).toFixed(2);

        // Kesinti tarihi (dönem ayının rastgele bir günü, son 12 ay içinde rastgele)
        const daysInMonth = new Date(paymentYear, paymentMonth, 0).getDate();
        const paymentDate = new Date(paymentYear, paymentMonth - 1, 1 + Math.floor(Math.random() * daysInMonth));

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
          approvedAt: isApproved ? new Date(paymentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null, // Kesinti tarihinden sonraki 7 gün içinde onaylandı
          createdByUserId,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        });
      }
    });

    // Kesintileri gruplara ayırıp toplu ekleme yap (performans için)
    const batchSize = 100;
    for (let i = 0; i < payments.length; i += batchSize) {
      const batch = payments.slice(i, i + batchSize);
      await prisma.memberPayment.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    console.log(`   - ${payments.length} Kesinti kaydı eklendi (tümü tevkifat)`);
    console.log(`   - Onaylı: ${payments.filter(p => p.isApproved).length}`);
    console.log(`   - Onaysız: ${payments.filter(p => !p.isApproved).length}`);

    // 🔹 Ek 100 Kesinti daha ekle (aynı kurallarla)
    console.log('💳 Ek 100 Kesinti daha ekleniyor...');
    const additionalPayments: typeof payments = [];
    
    // Tevkifat merkezi olan üyeleri filtrele
    const membersWithTevkifat = activeMembers.filter(m => m.tevkifatCenterId);
    
    if (membersWithTevkifat.length === 0) {
      console.log('   ⚠️  Tevkifat merkezi olan üye bulunamadı, ek Kesinti eklenemedi');
    } else {
      for (let i = 0; i < 100; i++) {
        // Rastgele bir aktif üye seç (tevkifat merkezi olan)
        const randomMember = membersWithTevkifat[Math.floor(Math.random() * membersWithTevkifat.length)];
        
        // Geçmiş 12 ay içinde rastgele bir ay seç
        const monthsAgo = Math.floor(Math.random() * 12);
        let paymentYear = currentYear;
        let paymentMonth = currentMonth - monthsAgo;
        
        // Ay negatif olursa bir önceki yıla geç
        while (paymentMonth <= 0) {
          paymentMonth += 12;
          paymentYear -= 1;
        }
        
        // Tutar (100-250 TL arası rastgele)
        const amount = (100 + Math.random() * 150).toFixed(2);
        
        // Kesinti tarihi (dönem ayının rastgele bir günü)
        const daysInMonth = new Date(paymentYear, paymentMonth, 0).getDate();
        const paymentDate = new Date(paymentYear, paymentMonth - 1, 1 + Math.floor(Math.random() * daysInMonth));
        
        // %80 onaylı, %20 onaysız
        const isApproved = Math.random() < 0.8;
        
        additionalPayments.push({
          memberId: randomMember.id,
          registrationNumber: randomMember.registrationNumber,
          paymentDate,
          paymentPeriodMonth: paymentMonth,
          paymentPeriodYear: paymentYear,
          amount,
          paymentType: PaymentType.TEVKIFAT,
          tevkifatCenterId: randomMember.tevkifatCenterId,
          tevkifatFileId: null,
          description: `${paymentMonth}/${paymentYear} tevkifat Kesintisi`,
          documentUrl: isApproved ? `uploads/payments/payment-${randomMember.id}-${paymentYear}-${paymentMonth}-${i}.pdf` : null,
          isApproved,
          approvedByUserId: isApproved ? approvedByUserId : null,
          approvedAt: isApproved ? new Date(paymentDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          createdByUserId,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        });
      }
    }
    
    // Ek Kesintileri toplu ekle
    if (additionalPayments.length > 0) {
      for (let i = 0; i < additionalPayments.length; i += batchSize) {
        const batch = additionalPayments.slice(i, i + batchSize);
        await prisma.memberPayment.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
      console.log(`   - ${additionalPayments.length} ek Kesinti kaydı eklendi`);
      console.log(`   - Onaylı: ${additionalPayments.filter(p => p.isApproved).length}`);
      console.log(`   - Onaysız: ${additionalPayments.filter(p => !p.isApproved).length}`);
    }

    // 🔹 Onaylı Kesintiler için PDF dosyaları oluştur
    console.log('📄 Kesinti belgesi PDF dosyaları oluşturuluyor...');
    const sourcePaymentPdfPath = path.join(prismaDir, 'Odeme.pdf');
    const paymentsUploadsDir = isProduction 
      ? path.join(process.cwd(), 'uploads', 'payments')
      : path.join(__dirname, '..', 'uploads', 'payments');
    
    // Uploads/payments klasörünü oluştur (yoksa)
    if (!fs.existsSync(paymentsUploadsDir)) {
      fs.mkdirSync(paymentsUploadsDir, { recursive: true });
    }

    // Kaynak PDF dosyasının var olup olmadığını kontrol et
    if (!fs.existsSync(sourcePaymentPdfPath)) {
      console.warn(`   ⚠️  Kaynak Kesinti PDF dosyası bulunamadı: ${sourcePaymentPdfPath}`);
      console.warn(`   ⚠️  Kesinti belgesi PDF dosyaları oluşturulamadı`);
    } else {
      // Onaylı Kesintileri al (documentUrl'i olanlar)
      const approvedPayments = await prisma.memberPayment.findMany({
        where: {
          documentUrl: { not: null },
          isApproved: true,
        },
        select: {
          id: true,
          documentUrl: true,
          memberId: true,
        },
      });

      if (approvedPayments.length > 0) {
        let paymentDocumentCount = 0;

        for (const payment of approvedPayments) {
          try {
            if (!payment.documentUrl) continue;

            // documentUrl formatı: uploads/payments/payment-{memberId}-{year}-{month}.pdf
            // Dosya adını çıkar
            const fileName = payment.documentUrl.split('/').pop() || `payment-${payment.id}.pdf`;
            const targetFilePath = path.join(paymentsUploadsDir, fileName);

            // PDF dosyasını kopyala
            fs.copyFileSync(sourcePaymentPdfPath, targetFilePath);
            paymentDocumentCount++;
          } catch (error) {
            console.error(`   ⚠️  Kesinti ${payment.id} için PDF oluşturulurken hata:`, error);
          }
        }

        console.log(`   - ${paymentDocumentCount} Kesinti belgesi PDF dosyası oluşturuldu`);
      } else {
        console.log('   ⚠️  Onaylı Kesinti bulunamadı, PDF dosyaları oluşturulamadı');
      }
    }

    // 🔹 Tevkifat Dosyaları Oluştur (Son Tevkifat Ayı için)
    console.log('📁 Tevkifat dosyaları oluşturuluyor...');
    const tevkifatCenterIdsForFiles = Object.values(tevkifatCenterMap);
    const fileCurrentYear = new Date().getFullYear();
    const fileCurrentMonth = new Date().getMonth() + 1;
    
    if (tevkifatCenterIdsForFiles.length > 0 && activeUsers.length > 0) {
      const muhasebeUser = activeUsers.find(u => u.email.includes('muhasebe') || u.email.includes('accounting'));
      const uploadedByUserId = muhasebeUser?.id || activeUsers[0].id;
      const approvedByUserId = adminUser?.id || activeUsers[0].id;
      
      // Her tevkifat merkezi için son 1-2 ayın dosyalarını oluştur (3 merkez için toplam 3-6 dosya)
      for (const centerId of tevkifatCenterIdsForFiles) {
        // Son 1-2 ay için dosya oluştur (rastgele)
        const fileCount = 1 + Math.floor(Math.random() * 2);
        for (let monthOffset = 0; monthOffset < fileCount; monthOffset++) {
          let fileYear = fileCurrentYear;
          let fileMonth = fileCurrentMonth - monthOffset;
          
          // Ay negatif olursa bir önceki yıla geç
          if (fileMonth <= 0) {
            fileMonth += 12;
            fileYear -= 1;
          }
          
          // Bu merkeze ait tevkifat Kesintilerini veritabanından bul
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
            
            // Bu dosyaya ait Kesintileri güncelle
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
      if (tevkifatCenterIdsForFiles.length === 0) {
        console.log('   ⚠️  Tevkifat dosyası eklenemedi (tevkifat merkezi bulunamadı - il/ilçe eşleşmesi yapılamadı)');
      } else if (activeUsers.length === 0) {
        console.log('   ⚠️  Tevkifat dosyası eklenemedi (aktif kullanıcı bulunamadı)');
      } else {
        console.log('   ⚠️  Tevkifat dosyası eklenemedi (bilinmeyen hata)');
      }
    }
  } else {
    console.log('   ⚠️  Kesinti eklenemedi (aktif üye veya kullanıcı bulunamadı)');
  }

  // 🔹 Örnek Sistem Logları (3 üye için azaltılmış - sadece 10 log)
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
    for (let i = 0; i < 10; i++) {
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

  // 🔹 Antetli kağıt dosyasını kopyala
  console.log('📋 Antetli kağıt dosyası kopyalanıyor...');
  const sourceHeaderPaperPath = path.join(prismaDir, 'yonetim_paneli_antetli_kagit.pdf');
  const headerPaperDir = isProduction 
    ? path.join(process.cwd(), 'uploads', 'header-paper')
    : path.join(__dirname, '..', 'uploads', 'header-paper');
  
  // Header paper klasörünü oluştur (yoksa)
  if (!fs.existsSync(headerPaperDir)) {
    fs.mkdirSync(headerPaperDir, { recursive: true });
  }

  // Antetli kağıt dosyasını kopyala
  if (fs.existsSync(sourceHeaderPaperPath)) {
    const targetHeaderPaperPath = path.join(headerPaperDir, 'yonetim_paneli_antetli_kagit.pdf');
    fs.copyFileSync(sourceHeaderPaperPath, targetHeaderPaperPath);
    console.log(`   ✅ Antetli kağıt dosyası kopyalandı: ${targetHeaderPaperPath}`);
  } else {
    console.warn(`   ⚠️  Antetli kağıt kaynak dosyası bulunamadı: ${sourceHeaderPaperPath}`);
  }

  // 🔹 Her üye için üye kayıt PDF dosyası oluştur
  console.log('📄 Üye kayıt PDF dosyaları oluşturuluyor...');
  const sourcePdfPath = path.join(prismaDir, 'UyeKayidi.pdf');
  const uploadsDir = isProduction 
    ? path.join(process.cwd(), 'uploads', 'documents')
    : path.join(__dirname, '..', 'uploads', 'documents');
  
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

