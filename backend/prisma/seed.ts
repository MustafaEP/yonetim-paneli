import { PrismaClient, MemberStatus, MemberSource, DuesPeriod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Türkiye İlleri ve Plaka Kodları
const TURKISH_PROVINCES = [
  { name: 'Adana', code: '01' },
  { name: 'Adıyaman', code: '02' },
  { name: 'Afyonkarahisar', code: '03' },
  { name: 'Ağrı', code: '04' },
  { name: 'Amasya', code: '05' },
  { name: 'Ankara', code: '06' },
  { name: 'Antalya', code: '07' },
  { name: 'Artvin', code: '08' },
  { name: 'Aydın', code: '09' },
  { name: 'Balıkesir', code: '10' },
  { name: 'Bilecik', code: '11' },
  { name: 'Bingöl', code: '12' },
  { name: 'Bitlis', code: '13' },
  { name: 'Bolu', code: '14' },
  { name: 'Burdur', code: '15' },
  { name: 'Bursa', code: '16' },
  { name: 'Çanakkale', code: '17' },
  { name: 'Çankırı', code: '18' },
  { name: 'Çorum', code: '19' },
  { name: 'Denizli', code: '20' },
  { name: 'Diyarbakır', code: '21' },
  { name: 'Edirne', code: '22' },
  { name: 'Elazığ', code: '23' },
  { name: 'Erzincan', code: '24' },
  { name: 'Erzurum', code: '25' },
  { name: 'Eskişehir', code: '26' },
  { name: 'Gaziantep', code: '27' },
  { name: 'Giresun', code: '28' },
  { name: 'Gümüşhane', code: '29' },
  { name: 'Hakkari', code: '30' },
  { name: 'Hatay', code: '31' },
  { name: 'Isparta', code: '32' },
  { name: 'Mersin', code: '33' },
  { name: 'İstanbul', code: '34' },
  { name: 'İzmir', code: '35' },
  { name: 'Kars', code: '36' },
  { name: 'Kastamonu', code: '37' },
  { name: 'Kayseri', code: '38' },
  { name: 'Kırklareli', code: '39' },
  { name: 'Kırşehir', code: '40' },
  { name: 'Kocaeli', code: '41' },
  { name: 'Konya', code: '42' },
  { name: 'Kütahya', code: '43' },
  { name: 'Malatya', code: '44' },
  { name: 'Manisa', code: '45' },
  { name: 'Kahramanmaraş', code: '46' },
  { name: 'Mardin', code: '47' },
  { name: 'Muğla', code: '48' },
  { name: 'Muş', code: '49' },
  { name: 'Nevşehir', code: '50' },
  { name: 'Niğde', code: '51' },
  { name: 'Ordu', code: '52' },
  { name: 'Rize', code: '53' },
  { name: 'Sakarya', code: '54' },
  { name: 'Samsun', code: '55' },
  { name: 'Siirt', code: '56' },
  { name: 'Sinop', code: '57' },
  { name: 'Sivas', code: '58' },
  { name: 'Tekirdağ', code: '59' },
  { name: 'Tokat', code: '60' },
  { name: 'Trabzon', code: '61' },
  { name: 'Tunceli', code: '62' },
  { name: 'Şanlıurfa', code: '63' },
  { name: 'Uşak', code: '64' },
  { name: 'Van', code: '65' },
  { name: 'Yozgat', code: '66' },
  { name: 'Zonguldak', code: '67' },
  { name: 'Aksaray', code: '68' },
  { name: 'Bayburt', code: '69' },
  { name: 'Karaman', code: '70' },
  { name: 'Kırıkkale', code: '71' },
  { name: 'Batman', code: '72' },
  { name: 'Şırnak', code: '73' },
  { name: 'Bartın', code: '74' },
  { name: 'Ardahan', code: '75' },
  { name: 'Iğdır', code: '76' },
  { name: 'Yalova', code: '77' },
  { name: 'Karabük', code: '78' },
  { name: 'Kilis', code: '79' },
  { name: 'Osmaniye', code: '80' },
  { name: 'Düzce', code: '81' },
];

// İlçe isimleri (her il için örnek ilçeler)
const DISTRICT_NAMES: Record<string, string[]> = {
  'İstanbul': ['Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Üsküdar', 'Bakırköy', 'Fatih', 'Kartal'],
  'Ankara': ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan', 'Etimesgut', 'Altındağ', 'Pursaklar'],
  'İzmir': ['Konak', 'Bornova', 'Karşıyaka', 'Buca', 'Çiğli', 'Gaziemir', 'Bayraklı', 'Alsancak'],
  'Bursa': ['Nilüfer', 'Osmangazi', 'Yıldırım', 'Mudanya', 'Gemlik', 'İnegöl', 'Mustafakemalpaşa', 'Orhangazi'],
  'Antalya': ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya', 'Manavgat', 'Serik', 'Kaş', 'Kemer'],
  'Kocaeli': ['İzmit', 'Gebze', 'Darıca', 'Körfez', 'Gölcük', 'Karamürsel', 'Kandıra', 'Derince'],
  'Adana': ['Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'Kozan', 'Feke', 'Karaisalı'],
  'Gaziantep': ['Şahinbey', 'Şehitkamil', 'Oğuzeli', 'Nizip', 'İslahiye', 'Nurdağı', 'Karkamış', 'Araban'],
  'Konya': ['Meram', 'Karatay', 'Selçuklu', 'Akören', 'Akşehir', 'Beyşehir', 'Bozkır', 'Cihanbeyli'],
  'Mersin': ['Akdeniz', 'Mezitli', 'Toroslar', 'Yenişehir', 'Erdemli', 'Silifke', 'Tarsus', 'Mut'],
};

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

  // Temizleme (isteğe bağlı - dikkatli kullanın!)
  console.log('🗑️  Mevcut veriler temizleniyor...');
  await prisma.duesPayment.deleteMany();
  await prisma.member.deleteMany();
  await prisma.duesPlan.deleteMany();
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
  const provinceMap: Record<string, string> = {};
  for (const prov of TURKISH_PROVINCES) {
    const created = await prisma.province.create({
      data: {
        name: prov.name,
        code: prov.code,
      },
    });
    provinceMap[prov.name] = created.id;
  }

  // 2. İlçeleri ekle
  console.log('🏘️  İlçeler ekleniyor...');
  const districtMap: Record<string, string> = {};
  for (const [provinceName, districts] of Object.entries(DISTRICT_NAMES)) {
    const provinceId = provinceMap[provinceName];
    if (provinceId) {
      for (const districtName of districts) {
        const created = await prisma.district.create({
          data: {
            name: districtName,
            provinceId: provinceId,
          },
        });
        districtMap[`${provinceName}_${districtName}`] = created.id;
      }
    }
  }

  // İlçeleri olmayan iller için rastgele ilçeler ekle
  for (const prov of TURKISH_PROVINCES) {
    if (!DISTRICT_NAMES[prov.name] && provinceMap[prov.name]) {
      const created = await prisma.district.create({
        data: {
          name: `${prov.name} Merkez`,
          provinceId: provinceMap[prov.name],
        },
      });
      districtMap[`${prov.name}_${prov.name} Merkez`] = created.id;
    }
  }

  // 3. CustomRole'ler oluştur (Her Role enum değeri için)
  console.log('🎭 Özel roller oluşturuluyor...');
  const rolePermissionMap: Record<string, string[]> = {
    ADMIN: [], // ADMIN için özel kontrol yapılacak, burada tüm izinler verilmeyecek
    MODERATOR: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_UPDATE',
      'DUES_REPORT_VIEW', 'REPORT_GLOBAL_VIEW', 'CONTENT_MANAGE', 'CONTENT_PUBLISH',
    ],
    GENEL_BASKAN: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE', 'MEMBER_REJECT', 'MEMBER_UPDATE', 'DUES_PLAN_MANAGE',
      'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'REPORT_GLOBAL_VIEW', 'REPORT_REGION_VIEW',
      'CONTENT_MANAGE', 'CONTENT_PUBLISH', 'NOTIFY_ALL_MEMBERS', 'NOTIFY_REGION',
    ],
    GENEL_BASKAN_YRD: [
      'USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION',
      'MEMBER_APPROVE', 'MEMBER_REJECT', 'DUES_REPORT_VIEW', 'REPORT_GLOBAL_VIEW',
      'CONTENT_MANAGE', 'NOTIFY_REGION',
    ],
    GENEL_SEKRETER: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_UPDATE',
      'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'REPORT_REGION_VIEW', 'DOCUMENT_TEMPLATE_MANAGE',
      'DOCUMENT_GENERATE_PDF', 'NOTIFY_OWN_SCOPE',
    ],
    IL_BASKANI: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_APPROVE',
      'MEMBER_REJECT', 'MEMBER_UPDATE', 'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW',
      'REPORT_REGION_VIEW', 'NOTIFY_REGION', 'WORKPLACE_LIST', 'WORKPLACE_MANAGE',
    ],
    ILCE_TEMSILCISI: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_APPROVE',
      'MEMBER_REJECT', 'DUES_PAYMENT_ADD', 'DUES_REPORT_VIEW', 'NOTIFY_OWN_SCOPE',
    ],
    ISYERI_TEMSILCISI: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'MEMBER_APPROVE',
      'MEMBER_REJECT', 'WORKPLACE_MEMBERS_VIEW', 'NOTIFY_OWN_SCOPE',
    ],
    BAYI_YETKILISI: [
      'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_CREATE_APPLICATION', 'DEALER_LIST',
      'DEALER_PERFORMANCE_VIEW', 'NOTIFY_OWN_SCOPE',
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

  const ilBaskani = await prisma.user.create({
    data: {
      email: 'il.baskani@sendika.local',
      passwordHash,
      firstName: 'İl',
      lastName: 'Başkanı',
      customRoles: {
        connect: { id: customRoleMap['IL_BASKANI'] },
      },
    },
  });

  const ilceTemsilcisi = await prisma.user.create({
    data: {
      email: 'ilce.temsilcisi@sendika.local',
      passwordHash,
      firstName: 'İlçe',
      lastName: 'Temsilcisi',
      customRoles: {
        connect: { id: customRoleMap['ILCE_TEMSILCISI'] },
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

  // Rastgele kullanıcılar
  const users: string[] = [adminUser.id, genelBaskan.id, ilBaskani.id, ilceTemsilcisi.id, isyeriTemsilcisi.id];
  for (let i = 0; i < 10; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const user = await prisma.user.create({
      data: {
        email: generateEmail(firstName, lastName),
        passwordHash,
        firstName,
        lastName,
        customRoles: {
          connect: { id: customRoleMap['UYE'] },
        },
      },
    });
    users.push(user.id);
  }

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
  
  // İl başkanına İstanbul yetkisi
  const istanbulId = provinceMap['İstanbul'];
  if (istanbulId) {
    await prisma.userScope.create({
      data: {
        userId: ilBaskani.id,
        provinceId: istanbulId,
      },
    });
  }

  // İlçe temsilcisine İstanbul-Kadıköy yetkisi
  const kadikoyId = districtMap['İstanbul_Kadıköy'];
  if (kadikoyId && istanbulId) {
    await prisma.userScope.create({
      data: {
        userId: ilceTemsilcisi.id,
        provinceId: istanbulId,
        districtId: kadikoyId,
      },
    });
  }

  // İşyeri temsilcisine bir işyeri yetkisi
  if (workplaceMap.length > 0) {
    await prisma.userScope.create({
      data: {
        userId: isyeriTemsilcisi.id,
        workplaceId: workplaceMap[0],
      },
    });
  }

  // 8. Aidat Planları ekle
  console.log('💰 Aidat planları ekleniyor...');
  const duesPlan1 = await prisma.duesPlan.create({
    data: {
      name: 'Aylık Standart Plan',
      description: 'Aylık 100 TL aidat planı',
      amount: 100.00,
      period: DuesPeriod.MONTHLY,
      isActive: true,
    },
  });

  const duesPlan2 = await prisma.duesPlan.create({
    data: {
      name: 'Yıllık Standart Plan',
      description: 'Yıllık 1000 TL aidat planı',
      amount: 1000.00,
      period: DuesPeriod.YEARLY,
      isActive: true,
    },
  });

  const duesPlan3 = await prisma.duesPlan.create({
    data: {
      name: 'Aylık Premium Plan',
      description: 'Aylık 200 TL aidat planı',
      amount: 200.00,
      period: DuesPeriod.MONTHLY,
      isActive: true,
    },
  });

  const duesPlan4 = await prisma.duesPlan.create({
    data: {
      name: 'Aylık Gelişmiş Plan',
      description: 'Aylık 400 TL aidat planı',
      amount: 400.00,
      period: DuesPeriod.MONTHLY,
      isActive: true,
    },
  });

  const duesPlan5 = await prisma.duesPlan.create({
    data: {
      name: 'Aylık İleri Plan',
      description: 'Aylık 600 TL aidat planı',
      amount: 600.00,
      period: DuesPeriod.MONTHLY,
      isActive: true,
    },
  });

  // Plan listesi (üyelere rastgele atama için)
  const allPlans = [duesPlan1, duesPlan2, duesPlan3, duesPlan4, duesPlan5];

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
      duesPlanId: duesPlan3.id, // 200 TL aylık plan
      createdByUserId: users[0],
      approvedByUserId: users[0],
      approvedAt: burcuCreatedAt,
      createdAt: burcuCreatedAt, // Haziran 2025'te kayıt olmuş
      updatedAt: burcuCreatedAt,
    },
  });
  memberIds.push(burcuMember.id);
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
    
    let workplaceId: string | undefined;
    let dealerId: string | undefined;

    if (source === MemberSource.WORKPLACE && workplaceMap.length > 0) {
      workplaceId = workplaceMap[Math.floor(Math.random() * workplaceMap.length)];
    } else if (source === MemberSource.DEALER && dealerMap.length > 0) {
      dealerId = dealerMap[Math.floor(Math.random() * dealerMap.length)];
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

    // Tüm üyeler (PENDING, ACTIVE, REJECTED dahil) bir aidat planı almalı
    const randomPlan = allPlans[Math.floor(Math.random() * allPlans.length)];
    
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
        workplaceId,
        dealerId,
        duesPlanId: randomPlan.id, // Tüm üyeler aidat planı alıyor
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
    
    let workplaceId: string | undefined;
    let dealerId: string | undefined;

    if (source === MemberSource.WORKPLACE && workplaceMap.length > 0) {
      workplaceId = workplaceMap[Math.floor(Math.random() * workplaceMap.length)];
    } else if (source === MemberSource.DEALER && dealerMap.length > 0) {
      dealerId = dealerMap[Math.floor(Math.random() * dealerMap.length)];
    }

    // Son 1-3 ay içinde başvuru yapmış
    const monthsAgo = 1 + Math.floor(Math.random() * 3);
    const memberCreatedAt = new Date(now);
    memberCreatedAt.setMonth(memberCreatedAt.getMonth() - monthsAgo);
    memberCreatedAt.setDate(1 + Math.floor(Math.random() * 28)); // Ayın rastgele bir günü

    // PENDING üyeler de aidat planı almalı
    const randomPlan = allPlans[Math.floor(Math.random() * allPlans.length)];

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
        workplaceId,
        dealerId,
        duesPlanId: randomPlan.id, // PENDING üyeler de aidat planı alıyor
        createdByUserId: users[Math.floor(Math.random() * users.length)],
        createdAt: memberCreatedAt,
        updatedAt: memberCreatedAt,
      },
    });
    memberIds.push(member.id);
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
    
    let workplaceId: string | undefined;
    let dealerId: string | undefined;

    if (source === MemberSource.WORKPLACE && workplaceMap.length > 0) {
      workplaceId = workplaceMap[Math.floor(Math.random() * workplaceMap.length)];
    } else if (source === MemberSource.DEALER && dealerMap.length > 0) {
      dealerId = dealerMap[Math.floor(Math.random() * dealerMap.length)];
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

    // REJECTED üyeler de aidat planı almalı (başvuru sırasında seçilmiş)
    const randomPlan = allPlans[Math.floor(Math.random() * allPlans.length)];

    // Reddedilen üyeler için tüm alanlar dolu olmalı
    const phone = generatePhone();
    const email = generateEmail(firstName, lastName);
    const nationalId = generateNationalId();
    
    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId: nationalId, // Her zaman dolu
        phone: phone, // Her zaman dolu
        email: email, // Her zaman dolu
        status: MemberStatus.REJECTED,
        source,
        provinceId: provinceId, // İl her zaman olmalı
        districtId: districtId, // İlçe her zaman olmalı
        workplaceId: workplaceId || undefined,
        dealerId: dealerId || undefined,
        duesPlanId: randomPlan.id, // REJECTED üyeler de aidat planı alıyor
        createdByUserId: users[Math.floor(Math.random() * users.length)],
        approvedByUserId: users[Math.floor(Math.random() * users.length)], // Reddeden kullanıcı
        approvedAt: rejectedAt, // Reddedilme tarihi
        createdAt: memberCreatedAt,
        updatedAt: rejectedAt,
      },
    });
    memberIds.push(member.id);
  }
  console.log(`   - 5 reddedilen üye eklendi`);

  // 10. Aidat Ödemeleri ekle - Aylara dağıtılmış ödemeler
  console.log('💵 Aidat ödemeleri ekleniyor...');
  const activeMembers = await prisma.member.findMany({
    where: { status: MemberStatus.ACTIVE, duesPlanId: { not: null } },
  });

  // Şu anki ay ve yıl
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Burcu Doğan'a özel ödeme: Haziran 2025'te ödeme yapmış (geçmiş ay)
  if (burcuMember && burcuMember.duesPlanId) {
    const burcuPlan = await prisma.duesPlan.findUnique({
      where: { id: burcuMember.duesPlanId },
    });

    if (burcuPlan) {
      // Haziran 2025'te ödeme yapmış
      const junePaymentDate = new Date(2025, 5, 15); // 15 Haziran 2025
      await prisma.duesPayment.create({
        data: {
          memberId: burcuMember.id,
          planId: burcuMember.duesPlanId,
          amount: burcuPlan.amount,
          paidAt: junePaymentDate,
          periodYear: 2025,
          periodMonth: 6, // Haziran
          createdByUserId: users[0],
        },
      });
      console.log(`   - ${burcuMember.firstName} ${burcuMember.lastName}: Haziran 2025 ödemesi eklendi (Temmuz-Aralık arası 6 ay borçlu olmalı)`);
    }
  }

  // Diğer aktif üyeleri işle
  const otherActiveMembers = activeMembers.filter((m) => m.id !== burcuMember.id);
  
  // Üyeleri gruplara ayır
  const totalMembers = otherActiveMembers.length;
  const thisMonthPayers = Math.floor(totalMembers * 0.25); // %25 bu ay ödeyen
  const advancePayers = Math.floor(totalMembers * 0.15); // %15 fazla ödeyen (gelecek aylara)
  const normalPayers = Math.floor(totalMembers * 0.35); // %35 normal ödeyen (geçmiş aylara)
  const debtors = totalMembers - thisMonthPayers - advancePayers - normalPayers; // Kalanlar borçlu

  const shuffled = [...otherActiveMembers].sort(() => Math.random() - 0.5);
  const thisMonthPayerMembers = shuffled.slice(0, thisMonthPayers);
  const advancePayerMembers = shuffled.slice(thisMonthPayers, thisMonthPayers + advancePayers);
  const normalPayerMembers = shuffled.slice(thisMonthPayers + advancePayers, thisMonthPayers + advancePayers + normalPayers);
  const debtorMembers = shuffled.slice(thisMonthPayers + advancePayers + normalPayers);

  // 1. Bu ay ödeyen üyeler
  console.log(`   - Bu ay ödeyen üyeler (${thisMonthPayerMembers.length}) ekleniyor...`);
  for (const member of thisMonthPayerMembers) {
    if (member.duesPlanId) {
      const plan = await prisma.duesPlan.findUnique({
        where: { id: member.duesPlanId },
      });

      if (plan) {
        // Bu ayın 1-15'i arasında ödeme yapmış
        const paymentDay = 1 + Math.floor(Math.random() * 15);
        const paymentDate = new Date(currentYear, currentMonth - 1, paymentDay);
        
        await prisma.duesPayment.create({
          data: {
            memberId: member.id,
            planId: member.duesPlanId,
            amount: plan.amount,
            paidAt: paymentDate,
            periodYear: currentYear,
            periodMonth: currentMonth,
            createdByUserId: users[Math.floor(Math.random() * users.length)],
          },
        });

        // Geçmiş aylara da ödeme ekle (3-6 ay)
        if (member.createdAt) {
          const memberCreatedAt = new Date(member.createdAt);
          const startYear = memberCreatedAt.getFullYear();
          const startMonth = memberCreatedAt.getMonth() + 1;
          const monthsToPay = Math.min(3 + Math.floor(Math.random() * 4), currentMonth - startMonth);
          
          for (let i = 0; i < monthsToPay && (startMonth + i) < currentMonth; i++) {
            const pastYear = startYear + Math.floor((startMonth + i - 1) / 12);
            const pastMonth = ((startMonth + i - 1) % 12) + 1;
            const pastPaymentDate = new Date(pastYear, pastMonth - 1, 15);
            
            if (pastPaymentDate < paymentDate) {
              await prisma.duesPayment.create({
                data: {
                  memberId: member.id,
                  planId: member.duesPlanId,
                  amount: plan.amount,
                  paidAt: pastPaymentDate,
                  periodYear: pastYear,
                  periodMonth: pastMonth,
                  createdByUserId: users[Math.floor(Math.random() * users.length)],
                },
              });
            }
          }
        }
      }
    }
  }

  // 2. Fazla ödeyen üyeler (gelecek aylara ödeme yapmış)
  console.log(`   - Fazla ödeyen üyeler (${advancePayerMembers.length}) ekleniyor...`);
  for (const member of advancePayerMembers) {
    if (member.duesPlanId) {
      const plan = await prisma.duesPlan.findUnique({
        where: { id: member.duesPlanId },
      });

      if (plan) {
        // Bu ay ödeme yapmış
        const paymentDay = 1 + Math.floor(Math.random() * 15);
        const paymentDate = new Date(currentYear, currentMonth - 1, paymentDay);
        
        await prisma.duesPayment.create({
          data: {
            memberId: member.id,
            planId: member.duesPlanId,
            amount: plan.amount,
            paidAt: paymentDate,
            periodYear: currentYear,
            periodMonth: currentMonth,
            createdByUserId: users[Math.floor(Math.random() * users.length)],
          },
        });

        // Gelecek 2-4 ay için de ödeme yapmış (fazla ödeme)
        const futureMonths = 2 + Math.floor(Math.random() * 3); // 2-4 ay
        for (let i = 1; i <= futureMonths; i++) {
          let futureYear = currentYear;
          let futureMonth = currentMonth + i;
          
          if (futureMonth > 12) {
            futureYear += 1;
            futureMonth -= 12;
          }
          
          const futurePaymentDate = new Date(futureYear, futureMonth - 1, 15);
          
          await prisma.duesPayment.create({
            data: {
              memberId: member.id,
              planId: member.duesPlanId,
              amount: plan.amount,
              paidAt: paymentDate, // Aynı tarihte ödeme yapmış (toplu ödeme)
              periodYear: futureYear,
              periodMonth: futureMonth,
              createdByUserId: users[Math.floor(Math.random() * users.length)],
            },
          });
        }

        // Geçmiş aylara da ödeme ekle (2-4 ay)
        if (member.createdAt) {
          const memberCreatedAt = new Date(member.createdAt);
          const startYear = memberCreatedAt.getFullYear();
          const startMonth = memberCreatedAt.getMonth() + 1;
          const monthsToPay = Math.min(2 + Math.floor(Math.random() * 3), currentMonth - startMonth);
          
          for (let i = 0; i < monthsToPay && (startMonth + i) < currentMonth; i++) {
            const pastYear = startYear + Math.floor((startMonth + i - 1) / 12);
            const pastMonth = ((startMonth + i - 1) % 12) + 1;
            const pastPaymentDate = new Date(pastYear, pastMonth - 1, 15);
            
            if (pastPaymentDate < paymentDate) {
              await prisma.duesPayment.create({
                data: {
                  memberId: member.id,
                  planId: member.duesPlanId,
                  amount: plan.amount,
                  paidAt: pastPaymentDate,
                  periodYear: pastYear,
                  periodMonth: pastMonth,
                  createdByUserId: users[Math.floor(Math.random() * users.length)],
                },
              });
            }
          }
        }
      }
    }
  }

  // 3. Normal ödeyen üyeler (geçmiş aylara ödeme yapmış, bu ay ödememiş)
  console.log(`   - Normal ödeyen üyeler (${normalPayerMembers.length}) ekleniyor...`);
  for (const member of normalPayerMembers) {
    if (member.duesPlanId) {
      const plan = await prisma.duesPlan.findUnique({
        where: { id: member.duesPlanId },
      });

      if (plan && member.createdAt) {
        const memberCreatedAt = new Date(member.createdAt);
        const startYear = memberCreatedAt.getFullYear();
        const startMonth = memberCreatedAt.getMonth() + 1;
        
        // Son 3-6 ay için ödeme ekle (bu ay hariç)
        const monthsToPay = Math.min(3 + Math.floor(Math.random() * 4), currentMonth - startMonth - 1);
        
        for (let i = 0; i < monthsToPay && (startMonth + i) < currentMonth; i++) {
          const pastYear = startYear + Math.floor((startMonth + i - 1) / 12);
          const pastMonth = ((startMonth + i - 1) % 12) + 1;
          const pastPaymentDate = new Date(pastYear, pastMonth - 1, 10 + Math.floor(Math.random() * 20));
          
          if (pastPaymentDate < now) {
            await prisma.duesPayment.create({
              data: {
                memberId: member.id,
                planId: member.duesPlanId,
                amount: plan.amount,
                paidAt: pastPaymentDate,
                periodYear: pastYear,
                periodMonth: pastMonth,
                createdByUserId: users[Math.floor(Math.random() * users.length)],
              },
            });
          }
        }
      }
    }
  }

  // 4. Borçlu üyeler (eski ödemeler var ama güncel ödeme yok)
  console.log(`   - Borçlu üyeler (${debtorMembers.length}) ekleniyor...`);
  for (const member of debtorMembers) {
    if (member.duesPlanId) {
      const plan = await prisma.duesPlan.findUnique({
        where: { id: member.duesPlanId },
      });

      if (plan && member.createdAt) {
        const memberCreatedAt = new Date(member.createdAt);
        const startYear = memberCreatedAt.getFullYear();
        const startMonth = memberCreatedAt.getMonth() + 1;
        
        // Sadece ilk 2-4 ay için ödeme ekle, sonra ödeme yok (borçlu)
        const monthsToPay = Math.min(2 + Math.floor(Math.random() * 3), currentMonth - startMonth - 3);
        
        for (let i = 0; i < monthsToPay && (startMonth + i) < currentMonth - 3; i++) {
          const pastYear = startYear + Math.floor((startMonth + i - 1) / 12);
          const pastMonth = ((startMonth + i - 1) % 12) + 1;
          const pastPaymentDate = new Date(pastYear, pastMonth - 1, 15);
          
          if (pastPaymentDate < now) {
            await prisma.duesPayment.create({
              data: {
                memberId: member.id,
                planId: member.duesPlanId,
                amount: plan.amount,
                paidAt: pastPaymentDate,
                periodYear: pastYear,
                periodMonth: pastMonth,
                createdByUserId: users[Math.floor(Math.random() * users.length)],
              },
            });
          }
        }
      }
    }
  }

  console.log(`   ✅ Ödeme dağılımı:`);
  console.log(`      - Bu ay ödeyen: ${thisMonthPayerMembers.length} üye`);
  console.log(`      - Fazla ödeyen: ${advancePayerMembers.length} üye`);
  console.log(`      - Normal ödeyen: ${normalPayerMembers.length} üye`);
  console.log(`      - Borçlu: ${debtorMembers.length} üye`);

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

  let updatedCount = 0;
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
        updatedCount++;
      }
    }
  }
  if (updatedCount > 0) {
    console.log(`   - ${updatedCount} üyeye ilçe atandı`);
  }

  console.log('✅ Seed işlemi tamamlandı!');
  console.log(`   - ${TURKISH_PROVINCES.length} il eklendi`);
  console.log(`   - ${Object.keys(districtMap).length} ilçe eklendi`);
  console.log(`   - ${Object.keys(customRoleMap).length} özel rol eklendi`);
  console.log(`   - ${users.length} kullanıcı eklendi`);
  console.log(`   - ${workplaceMap.length} işyeri eklendi`);
  console.log(`   - ${dealerMap.length} bayi eklendi`);
  console.log(`   - ${memberIds.length} üye eklendi`);
  console.log(`   - 5 aidat planı eklendi`);
  
  const pendingCount = await prisma.member.count({ where: { status: MemberStatus.PENDING } });
  const rejectedCount = await prisma.member.count({ where: { status: MemberStatus.REJECTED } });
  const activeCount = await prisma.member.count({ where: { status: MemberStatus.ACTIVE } });
  
  console.log(`   - ${activeCount} aktif üye`);
  console.log(`   - ${pendingCount} bekleyen başvuru`);
  console.log(`   - ${rejectedCount} reddedilen üye`);
  
  const totalPayments = await prisma.duesPayment.count();
  console.log(`   - ${totalPayments} aidat ödemesi eklendi`);

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
      nationalId: { not: null },
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
      workplaceId: true,
      dealerId: true,
      source: true,
      cancelledAt: true,
      duesPlanId: true,
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
      const tempNationalId = cancelledMember.nationalId ? `${cancelledMember.nationalId}_temp_${Date.now()}` : null;
      
      await prisma.member.update({
        where: { id: cancelledMember.id },
        data: {
          nationalId: tempNationalId, // Geçici olarak değiştir
        },
      });

      // Yeni üye kaydı oluştur (PENDING durumunda)
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
          workplaceId: cancelledMember.workplaceId,
          dealerId: cancelledMember.dealerId,
          duesPlanId: cancelledMember.duesPlanId || allPlans[Math.floor(Math.random() * allPlans.length)].id,
          previousCancelledMemberId: cancelledMember.id, // Önceki iptal kaydına bağla
          createdByUserId: users[Math.floor(Math.random() * users.length)],
          createdAt: reRegisteredAt,
          updatedAt: reRegisteredAt,
        },
      });

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
}

main()
  .catch((e) => {
    console.error('❌ Seed işlemi başarısız:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

