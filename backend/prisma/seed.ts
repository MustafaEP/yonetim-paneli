import { PrismaClient, Role, MemberStatus, MemberSource, DuesPeriod } from '@prisma/client';
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
  console.log('🌱 Seed işlemi başlıyor...\n');

  // -------------------------
  // 1) USERS (Tüm roller için detaylı kullanıcılar)
  // -------------------------
  console.log('👥 Kullanıcılar oluşturuluyor...');
  
  const passwordAdmin = await bcrypt.hash('Admin123!', 10);
  const passwordModerator = await bcrypt.hash('Moderator123!', 10);
  const passwordGenelBaskan = await bcrypt.hash('GenelBaskan123!', 10);
  const passwordGenelBaskanYrd = await bcrypt.hash('GenelBaskanYrd123!', 10);
  const passwordGenelSekreter = await bcrypt.hash('GenelSekreter123!', 10);
  const passwordIlBaskani = await bcrypt.hash('IlBaskani123!', 10);
  const passwordIlceTemsilcisi = await bcrypt.hash('Ilce123!', 10);
  const passwordIsyeriTemsilcisi = await bcrypt.hash('Isyeri123!', 10);
  const passwordBayiYetkilisi = await bcrypt.hash('Bayi123!', 10);
  const passwordUye = await bcrypt.hash('Uye123!', 10);

  // Admin kullanıcılar
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sendika.local' },
    update: {},
    create: {
      email: 'admin@sendika.local',
      passwordHash: passwordAdmin,
      firstName: 'Sistem',
      lastName: 'Admin',
      roles: [Role.ADMIN],
      isActive: true,
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@sendika.local' },
    update: {},
    create: {
      email: 'moderator@sendika.local',
      passwordHash: passwordModerator,
      firstName: 'Moderatör',
      lastName: 'Kullanıcı',
      roles: [Role.MODERATOR],
      isActive: true,
    },
  });

  // Genel Başkan ve Yardımcıları
  const genelBaskan = await prisma.user.upsert({
    where: { email: 'genel.baskan@sendika.local' },
    update: {},
    create: {
      email: 'genel.baskan@sendika.local',
      passwordHash: passwordGenelBaskan,
      firstName: 'Mehmet',
      lastName: 'Genel Başkan',
      roles: [Role.GENEL_BASKAN],
      isActive: true,
    },
  });

  const genelBaskanYrd = await prisma.user.upsert({
    where: { email: 'genel.baskan.yrd@sendika.local' },
    update: {},
    create: {
      email: 'genel.baskan.yrd@sendika.local',
      passwordHash: passwordGenelBaskanYrd,
      firstName: 'Ali',
      lastName: 'Genel Başkan Yardımcısı',
      roles: [Role.GENEL_BASKAN_YRD],
      isActive: true,
    },
  });

  const genelSekreter = await prisma.user.upsert({
    where: { email: 'genel.sekreter@sendika.local' },
    update: {},
    create: {
      email: 'genel.sekreter@sendika.local',
      passwordHash: passwordGenelSekreter,
      firstName: 'Ayşe',
      lastName: 'Genel Sekreter',
      roles: [Role.GENEL_SEKRETER],
      isActive: true,
    },
  });

  // İl Başkanları (birkaç il için)
  const ilBaskaniBursa = await prisma.user.upsert({
    where: { email: 'il.baskani.bursa@sendika.local' },
    update: {},
    create: {
      email: 'il.baskani.bursa@sendika.local',
      passwordHash: passwordIlBaskani,
      firstName: 'Bursa',
      lastName: 'İl Başkanı',
      roles: [Role.IL_BASKANI],
      isActive: true,
    },
  });

  const ilBaskaniIstanbul = await prisma.user.upsert({
    where: { email: 'il.baskani.istanbul@sendika.local' },
    update: {},
    create: {
      email: 'il.baskani.istanbul@sendika.local',
      passwordHash: passwordIlBaskani,
      firstName: 'İstanbul',
      lastName: 'İl Başkanı',
      roles: [Role.IL_BASKANI],
      isActive: true,
    },
  });

  const ilBaskaniAnkara = await prisma.user.upsert({
    where: { email: 'il.baskani.ankara@sendika.local' },
    update: {},
    create: {
      email: 'il.baskani.ankara@sendika.local',
      passwordHash: passwordIlBaskani,
      firstName: 'Ankara',
      lastName: 'İl Başkanı',
      roles: [Role.IL_BASKANI],
      isActive: true,
    },
  });

  // İlçe Temsilcileri
  const ilceTemsilcisi = await prisma.user.upsert({
    where: { email: 'ilce.temsilcisi@sendika.local' },
    update: {},
    create: {
      email: 'ilce.temsilcisi@sendika.local',
      passwordHash: passwordIlceTemsilcisi,
      firstName: 'Nilüfer',
      lastName: 'İlçe Temsilcisi',
      roles: [Role.ILCE_TEMSILCISI],
      isActive: true,
    },
  });

  // İşyeri Temsilcileri
  const isyeriTemsilcisi = await prisma.user.upsert({
    where: { email: 'isyeri.temsilcisi@sendika.local' },
    update: {},
    create: {
      email: 'isyeri.temsilcisi@sendika.local',
      passwordHash: passwordIsyeriTemsilcisi,
      firstName: 'Fabrika',
      lastName: 'Temsilcisi',
      roles: [Role.ISYERI_TEMSILCISI],
      isActive: true,
    },
  });

  // Bayi Yetkilileri
  const bayiYetkilisi = await prisma.user.upsert({
    where: { email: 'bayi.yetkilisi@sendika.local' },
    update: {},
    create: {
      email: 'bayi.yetkilisi@sendika.local',
      passwordHash: passwordBayiYetkilisi,
      firstName: 'Bursa',
      lastName: 'Bayi Yetkilisi',
      roles: [Role.BAYI_YETKILISI],
      isActive: true,
    },
  });

  // Üye kullanıcılar (birkaç tane)
  const uyeUser1 = await prisma.user.upsert({
    where: { email: 'uye1@sendika.local' },
    update: {},
    create: {
      email: 'uye1@sendika.local',
      passwordHash: passwordUye,
      firstName: 'Ahmet',
      lastName: 'Üye',
      roles: [Role.UYE],
      isActive: true,
    },
  });

  const uyeUser2 = await prisma.user.upsert({
    where: { email: 'uye2@sendika.local' },
    update: {},
    create: {
      email: 'uye2@sendika.local',
      passwordHash: passwordUye,
      firstName: 'Mehmet',
      lastName: 'Üye',
      roles: [Role.UYE],
      isActive: true,
    },
  });

  console.log('✅ Kullanıcılar oluşturuldu');

  // -------------------------
  // 2) REGIONS: Province, District, Workplace, Dealer
  // -------------------------
  console.log('\n📍 Bölgeler oluşturuluyor...');

  // Tüm illeri oluştur
  const provinces: Record<string, any> = {};
  for (const province of TURKISH_PROVINCES) {
    const created = await prisma.province.upsert({
      where: { code: province.code },
      update: {},
      create: {
        name: province.name,
        code: province.code, // Tüm iller için code dolduruluyor
      },
    });
    provinces[province.name] = created;
  }

  // İlçeleri oluştur (her il için birkaç ilçe)
  const districts: Record<string, any> = {};
  for (const [provinceName, districtNames] of Object.entries(DISTRICT_NAMES)) {
    const province = provinces[provinceName];
    if (province) {
      for (const districtName of districtNames) {
        let created = await prisma.district.findFirst({
          where: {
            name: districtName,
            provinceId: province.id,
          },
        });
        
        if (!created) {
          created = await prisma.district.create({
            data: {
              name: districtName,
              provinceId: province.id,
            },
          });
        }
        
        districts[`${provinceName}-${districtName}`] = created;
      }
    }
  }

  // Ek ilçeler (Bursa için)
  const bursa = provinces['Bursa'];
  let nulufer = await prisma.district.findFirst({
    where: {
      name: 'Nilüfer',
      provinceId: bursa.id,
    },
  });
  
  if (!nulufer) {
    nulufer = await prisma.district.create({
      data: {
        name: 'Nilüfer',
        provinceId: bursa.id,
      },
    });
  }
  districts['Bursa-Nilüfer'] = nulufer;

  let osmangazi = await prisma.district.findFirst({
    where: {
      name: 'Osmangazi',
      provinceId: bursa.id,
    },
  });
  
  if (!osmangazi) {
    osmangazi = await prisma.district.create({
      data: {
        name: 'Osmangazi',
        provinceId: bursa.id,
      },
    });
  }
  districts['Bursa-Osmangazi'] = osmangazi;

  const istanbul = provinces['İstanbul'];
  let kadikoy = districts['İstanbul-Kadıköy'];
  
  if (!kadikoy) {
    kadikoy = await prisma.district.findFirst({
      where: {
        name: 'Kadıköy',
        provinceId: istanbul.id,
      },
    });
    
    if (!kadikoy) {
      kadikoy = await prisma.district.create({
        data: {
          name: 'Kadıköy',
          provinceId: istanbul.id,
        },
      });
    }
    districts['İstanbul-Kadıköy'] = kadikoy;
  }

  // İşyerleri oluştur (tüm alanlar dolduruluyor)
  const workplaces: any[] = [];
  
  const fabrikaWorkplace = await prisma.workplace.upsert({
    where: { id: 'workplace-fabrika-001' },
    update: {},
    create: {
      id: 'workplace-fabrika-001',
      name: 'XYZ Fabrikası A.Ş.',
      address: 'Bursa Organize Sanayi Bölgesi, 1. Cadde No:123, Nilüfer/Bursa',
      provinceId: bursa.id,
      districtId: nulufer.id,
    },
  });
  workplaces.push(fabrikaWorkplace);

  const ofisWorkplace = await prisma.workplace.upsert({
    where: { id: 'workplace-ofis-001' },
    update: {},
    create: {
      id: 'workplace-ofis-001',
      name: 'Ofis Merkezi İşletmesi',
      address: 'Osmangazi Merkez Mahallesi, Atatürk Caddesi No:45, Osmangazi/Bursa',
      provinceId: bursa.id,
      districtId: osmangazi.id,
    },
  });
  workplaces.push(ofisWorkplace);

  // Daha fazla işyeri ekle
  const istanbulWorkplace = await prisma.workplace.upsert({
    where: { id: 'workplace-istanbul-001' },
    update: {},
    create: {
      id: 'workplace-istanbul-001',
      name: 'İstanbul Merkez Ofisi',
      address: 'Kadıköy, Bağdat Caddesi No:100, İstanbul',
      provinceId: istanbul.id,
      districtId: kadikoy.id,
    },
  });
  workplaces.push(istanbulWorkplace);

  const ankara = provinces['Ankara'];
  let ankaraCankaya = districts['Ankara-Çankaya'];
  
  if (!ankaraCankaya) {
    ankaraCankaya = await prisma.district.findFirst({
      where: {
        name: 'Çankaya',
        provinceId: ankara.id,
      },
    });
    
    if (!ankaraCankaya) {
      ankaraCankaya = await prisma.district.create({
        data: {
          name: 'Çankaya',
          provinceId: ankara.id,
        },
      });
    }
    districts['Ankara-Çankaya'] = ankaraCankaya;
  }
  
  const ankaraWorkplace = await prisma.workplace.upsert({
    where: { id: 'workplace-ankara-001' },
    update: {},
    create: {
      id: 'workplace-ankara-001',
      name: 'Ankara Şube',
      address: 'Çankaya, Kızılay Mahallesi, Atatürk Bulvarı No:50, Ankara',
      provinceId: ankara.id,
      districtId: ankaraCankaya.id,
    },
  });
  workplaces.push(ankaraWorkplace);

  // Bayiler oluştur (tüm alanlar dolduruluyor)
  const dealers: any[] = [];
  
  const bursaDealer = await prisma.dealer.upsert({
    where: { id: 'dealer-bursa-001' },
    update: {},
    create: {
      id: 'dealer-bursa-001',
      name: 'Bursa Merkez Bayi',
      code: 'BY-BURSA-001',
      address: 'Osmangazi Merkez, Fomara Caddesi No:12, Osmangazi/Bursa',
      provinceId: bursa.id,
      districtId: osmangazi.id,
    },
  });
  dealers.push(bursaDealer);

  const istanbulDealer = await prisma.dealer.upsert({
    where: { id: 'dealer-istanbul-001' },
    update: {},
    create: {
      id: 'dealer-istanbul-001',
      name: 'İstanbul Anadolu Yakası Bayi',
      code: 'BY-IST-001',
      address: 'Kadıköy, Moda Caddesi No:25, İstanbul',
      provinceId: istanbul.id,
      districtId: kadikoy.id,
    },
  });
  dealers.push(istanbulDealer);

  const ankaraDealer = await prisma.dealer.upsert({
    where: { id: 'dealer-ankara-001' },
    update: {},
    create: {
      id: 'dealer-ankara-001',
      name: 'Ankara Merkez Bayi',
      code: 'BY-ANKARA-001',
      address: 'Çankaya, Kızılay, İnönü Bulvarı No:30, Ankara',
      provinceId: ankara.id,
      districtId: ankaraCankaya.id,
    },
  });
  dealers.push(ankaraDealer);

  console.log(`✅ ${Object.keys(provinces).length} il oluşturuldu`);
  console.log(`✅ ${Object.keys(districts).length} ilçe oluşturuldu`);
  console.log(`✅ ${workplaces.length} işyeri oluşturuldu`);
  console.log(`✅ ${dealers.length} bayi oluşturuldu`);

  // -------------------------
  // 3) USER SCOPES (Bölgesel yetkiler - tüm alanlar dolduruluyor)
  // -------------------------
  console.log('\n🔐 Kullanıcı yetki alanları oluşturuluyor...');

  await prisma.userScope.createMany({
    data: [
      {
        userId: ilBaskaniBursa.id,
        provinceId: bursa.id,
        districtId: null,
        workplaceId: null,
        dealerId: null,
      },
      {
        userId: ilBaskaniIstanbul.id,
        provinceId: istanbul.id,
        districtId: null,
        workplaceId: null,
        dealerId: null,
      },
      {
        userId: ilBaskaniAnkara.id,
        provinceId: ankara.id,
        districtId: null,
        workplaceId: null,
        dealerId: null,
      },
      {
        userId: ilceTemsilcisi.id,
        provinceId: bursa.id,
        districtId: nulufer.id,
        workplaceId: null,
        dealerId: null,
      },
      {
        userId: isyeriTemsilcisi.id,
        provinceId: bursa.id,
        districtId: nulufer.id,
        workplaceId: fabrikaWorkplace.id,
        dealerId: null,
      },
      {
        userId: bayiYetkilisi.id,
        provinceId: bursa.id,
        districtId: osmangazi.id,
        workplaceId: null,
        dealerId: bursaDealer.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Kullanıcı yetki alanları oluşturuldu');

  // -------------------------
  // 4) DUES PLANS (Aidat Planları - description dolduruluyor)
  // -------------------------
  console.log('\n💰 Aidat planları oluşturuluyor...');

  const monthlyPlan = await prisma.duesPlan.upsert({
    where: { id: 'plan-monthly-001' },
    update: {},
    create: {
      id: 'plan-monthly-001',
      name: 'Standart Aylık Aidat',
      description: 'Tüm aktif üyeler için standart aylık aidat planı. Her ay düzenli olarak ödenmesi gereken aidat tutarıdır.',
      amount: 150,
      period: DuesPeriod.MONTHLY,
      isActive: true,
      deletedAt: null,
    },
  });

  const yearlyPlan = await prisma.duesPlan.upsert({
    where: { id: 'plan-yearly-001' },
    update: {},
    create: {
      id: 'plan-yearly-001',
      name: 'Yıllık Aidat',
      description: 'Yıllık ödeme tercih eden üyeler için avantajlı aidat planı. Yıllık ödemede %10 indirim uygulanmaktadır.',
      amount: 1500,
      period: DuesPeriod.YEARLY,
      isActive: true,
      deletedAt: null,
    },
  });

  const premiumMonthlyPlan = await prisma.duesPlan.upsert({
    where: { id: 'plan-premium-monthly-001' },
    update: {},
    create: {
      id: 'plan-premium-monthly-001',
      name: 'Premium Aylık Aidat',
      description: 'Premium üyelik için aylık aidat planı. Ek hizmetler ve avantajlar içerir.',
      amount: 250,
      period: DuesPeriod.MONTHLY,
      isActive: true,
      deletedAt: null,
    },
  });

  const studentPlan = await prisma.duesPlan.upsert({
    where: { id: 'plan-student-001' },
    update: {},
    create: {
      id: 'plan-student-001',
      name: 'Öğrenci Aylık Aidat',
      description: 'Öğrenci üyeler için özel indirimli aylık aidat planı.',
      amount: 75,
      period: DuesPeriod.MONTHLY,
      isActive: true,
      deletedAt: null,
    },
  });

  console.log('✅ Aidat planları oluşturuldu');

  // -------------------------
  // 5) MEMBERS (Üyeler - TÜM NULL ALANLAR DOLDURULUYOR)
  // -------------------------
  console.log('\n👥 Üyeler oluşturuluyor...');

  const now = new Date();
  const members: any[] = [];

  // Aktif üyeler (tüm alanlar dolu)
  const member1 = await prisma.member.create({
    data: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Ahmet', 'Yılmaz'),
      status: MemberStatus.ACTIVE,
      source: MemberSource.DIRECT,
      provinceId: bursa.id,
      districtId: nulufer.id,
      workplaceId: fabrikaWorkplace.id,
      dealerId: null,
      duesPlanId: monthlyPlan.id,
      createdByUserId: ilceTemsilcisi.id,
      approvedByUserId: ilBaskaniBursa.id,
      approvedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 gün önce
      isActive: true,
      deletedAt: null,
    },
  });
  members.push(member1);

  const member2 = await prisma.member.create({
    data: {
      firstName: 'Mehmet',
      lastName: 'Kaya',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Mehmet', 'Kaya'),
      status: MemberStatus.ACTIVE,
      source: MemberSource.WORKPLACE,
      provinceId: bursa.id,
      districtId: osmangazi.id,
      workplaceId: ofisWorkplace.id,
      dealerId: null,
      duesPlanId: monthlyPlan.id,
      createdByUserId: isyeriTemsilcisi.id,
      approvedByUserId: ilBaskaniBursa.id,
      approvedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 gün önce
      isActive: true,
      deletedAt: null,
    },
  });
  members.push(member2);

  const member3 = await prisma.member.create({
    data: {
      firstName: 'Ayşe',
      lastName: 'Demir',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Ayşe', 'Demir'),
      status: MemberStatus.ACTIVE,
      source: MemberSource.DEALER,
      provinceId: bursa.id,
      districtId: osmangazi.id,
      workplaceId: null,
      dealerId: bursaDealer.id,
      duesPlanId: yearlyPlan.id,
      createdByUserId: bayiYetkilisi.id,
      approvedByUserId: ilBaskaniBursa.id,
      approvedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 gün önce
      isActive: true,
      deletedAt: null,
    },
  });
  members.push(member3);

  // Pending (bekleyen) üyeler
  const member4 = await prisma.member.create({
    data: {
      firstName: 'Fatma',
      lastName: 'Şahin',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Fatma', 'Şahin'),
      status: MemberStatus.PENDING,
      source: MemberSource.DIRECT,
      provinceId: istanbul.id,
      districtId: kadikoy.id,
      workplaceId: istanbulWorkplace.id,
      dealerId: null,
      duesPlanId: monthlyPlan.id,
      createdByUserId: ilBaskaniIstanbul.id,
      approvedByUserId: null,
      approvedAt: null,
      isActive: true,
      deletedAt: null,
    },
  });
  members.push(member4);

  // Daha fazla aktif üye oluştur
  for (let i = 0; i < 20; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const status = i % 4 === 0 ? MemberStatus.PENDING : MemberStatus.ACTIVE;
    const source = [MemberSource.DIRECT, MemberSource.WORKPLACE, MemberSource.DEALER][Math.floor(Math.random() * 3)];
    
    const randomProvince = [bursa, istanbul, ankara][Math.floor(Math.random() * 3)];
    const randomWorkplace = workplaces[Math.floor(Math.random() * workplaces.length)];
    const randomDealer = dealers[Math.floor(Math.random() * dealers.length)];
    const randomPlan = [monthlyPlan, yearlyPlan, premiumMonthlyPlan][Math.floor(Math.random() * 3)];
    
    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId: generateNationalId(),
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        status,
        source,
        provinceId: randomProvince.id,
        districtId: randomProvince.id === bursa.id ? (Math.random() > 0.5 ? nulufer.id : osmangazi.id) : null,
        workplaceId: source === MemberSource.WORKPLACE ? randomWorkplace.id : null,
        dealerId: source === MemberSource.DEALER ? randomDealer.id : null,
        duesPlanId: randomPlan.id,
        createdByUserId: [ilBaskaniBursa.id, ilBaskaniIstanbul.id, ilBaskaniAnkara.id][Math.floor(Math.random() * 3)],
        approvedByUserId: status === MemberStatus.ACTIVE ? [ilBaskaniBursa.id, ilBaskaniIstanbul.id, ilBaskaniAnkara.id][Math.floor(Math.random() * 3)] : null,
        approvedAt: status === MemberStatus.ACTIVE ? new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000) : null,
        isActive: true,
        deletedAt: null,
      },
    });
    members.push(member);
  }

  // Pasif ve diğer durumlardaki üyeler
  const memberPasif = await prisma.member.create({
    data: {
      firstName: 'Hasan',
      lastName: 'Kurt',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Hasan', 'Kurt'),
      status: MemberStatus.PASIF,
      source: MemberSource.DIRECT,
      provinceId: bursa.id,
      districtId: nulufer.id,
      workplaceId: fabrikaWorkplace.id,
      dealerId: null,
      duesPlanId: monthlyPlan.id,
      createdByUserId: ilceTemsilcisi.id,
      approvedByUserId: ilBaskaniBursa.id,
      approvedAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 6 ay önce
      isActive: true,
      deletedAt: null,
    },
  });
  members.push(memberPasif);

  const memberIstifa = await prisma.member.create({
    data: {
      firstName: 'Zeynep',
      lastName: 'Aydın',
      nationalId: generateNationalId(),
      phone: generatePhone(),
      email: generateEmail('Zeynep', 'Aydın'),
      status: MemberStatus.ISTIFA,
      source: MemberSource.WORKPLACE,
      provinceId: istanbul.id,
      districtId: kadikoy.id,
      workplaceId: istanbulWorkplace.id,
      dealerId: null,
      duesPlanId: monthlyPlan.id,
      createdByUserId: ilBaskaniIstanbul.id,
      approvedByUserId: ilBaskaniIstanbul.id,
      approvedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 3 ay önce
      isActive: false,
      deletedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 1 ay önce soft delete
    },
  });
  members.push(memberIstifa);

  console.log(`✅ ${members.length} üye oluşturuldu`);

  // -------------------------
  // 6) DUES PAYMENTS (Aidat Ödemeleri - TÜM NULL ALANLAR DOLDURULUYOR)
  // -------------------------
  console.log('\n💳 Aidat ödemeleri oluşturuluyor...');

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12 arası

  const payments: any[] = [];

  // Aktif üyeler için ödemeler
  const activeMembers = members.filter(m => m.status === MemberStatus.ACTIVE);

  for (const member of activeMembers.slice(0, 15)) {
    const memberPlan = member.duesPlanId ? await prisma.duesPlan.findUnique({ where: { id: member.duesPlanId } }) : monthlyPlan;
    const planAmount = memberPlan ? Number(memberPlan.amount) : 150;

    // Son 6 ay için ödemeler oluştur
    for (let i = 0; i < 6; i++) {
      const paymentMonth = currentMonth - i;
      let paymentYear = currentYear;
      let actualMonth = paymentMonth;
      
      if (paymentMonth <= 0) {
        actualMonth = 12 + paymentMonth;
        paymentYear = currentYear - 1;
      }

      // %70 ihtimalle ödeme yapılmış
      if (Math.random() > 0.3) {
        const payment = await prisma.duesPayment.create({
          data: {
            memberId: member.id,
            planId: memberPlan?.id || monthlyPlan.id,
            amount: planAmount,
            periodYear: paymentYear,
            periodMonth: actualMonth,
            note: `${actualMonth}. ay aidat ödemesi - ${paymentYear} yılı`,
            createdByUserId: [moderator.id, admin.id, ilBaskaniBursa.id][Math.floor(Math.random() * 3)],
            paidAt: new Date(paymentYear, actualMonth - 1, Math.floor(Math.random() * 28) + 1), // Ayın rastgele bir günü
            isActive: true,
            deletedAt: null,
          },
        });
        payments.push(payment);
      }
    }
  }

  // Yıllık plan ödemeleri
  const yearlyMembers = members.filter(m => {
    if (!m.duesPlanId) return false;
    const plan = [monthlyPlan, yearlyPlan, premiumMonthlyPlan, studentPlan].find(p => p.id === m.duesPlanId);
    return plan?.period === DuesPeriod.YEARLY;
  });

  for (const member of yearlyMembers) {
    const memberPlan = await prisma.duesPlan.findUnique({ where: { id: member.duesPlanId! } });
    if (memberPlan) {
      const payment = await prisma.duesPayment.create({
        data: {
          memberId: member.id,
          planId: memberPlan.id,
          amount: Number(memberPlan.amount),
          periodYear: currentYear,
          periodMonth: null, // Yıllık plan için ay yok
          note: `${currentYear} yılı yıllık aidat ödemesi`,
          createdByUserId: moderator.id,
          paidAt: new Date(currentYear, 0, Math.floor(Math.random() * 28) + 1), // Yılın başında
          isActive: true,
          deletedAt: null,
        },
      });
      payments.push(payment);
    }
  }

  // Özel ödeme örnekleri (tüm alanlar dolu)
  const specialPayment1 = await prisma.duesPayment.create({
    data: {
      memberId: member1.id,
      planId: monthlyPlan.id,
      amount: 150,
      periodYear: currentYear,
      periodMonth: currentMonth,
      note: 'Bu ay aidatı - nakit ödeme',
      createdByUserId: moderator.id,
      paidAt: new Date(currentYear, currentMonth - 1, 5),
      isActive: true,
      deletedAt: null,
    },
  });
  payments.push(specialPayment1);

  const specialPayment2 = await prisma.duesPayment.create({
    data: {
      memberId: member2.id,
      planId: monthlyPlan.id,
      amount: 150,
      periodYear: currentYear,
      periodMonth: currentMonth - 1,
      note: 'Geçen ay aidatı - banka transferi',
      createdByUserId: admin.id,
      paidAt: new Date(currentYear, currentMonth - 2, 10),
      isActive: true,
      deletedAt: null,
    },
  });
  payments.push(specialPayment2);

  console.log(`✅ ${payments.length} aidat ödemesi oluşturuldu`);

  // Özet
  console.log('\n📊 Seed Özeti:');
  console.log(`   - ${Object.keys(provinces).length} il`);
  console.log(`   - ${Object.keys(districts).length} ilçe`);
  console.log(`   - ${workplaces.length} işyeri`);
  console.log(`   - ${dealers.length} bayi`);
  console.log(`   - ${members.length} üye`);
  console.log(`   - ${payments.length} aidat ödemesi`);
  console.log(`   - 4 aidat planı`);
  console.log(`   - 12+ kullanıcı`);

  console.log('\n✅ Seed tamamlandı!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
