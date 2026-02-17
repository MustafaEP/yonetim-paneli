/**
 * seed3.ts - Her tabloya 3 veri ekleyen minimal seed.
 * - İller ve ilçeler: sehirler.json / ilceler.json dosyalarından otomatik çekilir.
 * - Her üyenin üye kayıt dökümanı: UyeKayidi.pdf ile MemberDocument.
 * - Antetli kağıt: yonetim_paneli_antetli_kagit.pdf (SystemSetting + dosya kopyalama).
 * - Doküman şablonları: seed.ts'deki 3 önemli şablon (Üye Sertifikası, Üye Kartı, Genel Mektup).
 */

import {
  PrismaClient,
  MemberStatus,
  MemberSource,
  ContentType,
  ContentStatus,
  DocumentTemplateType,
  NotificationType,
  NotificationTargetType,
  NotificationStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationTypeCategory,
  SystemSettingCategory,
  Gender,
  EducationStatus,
  ApprovalStatus,
  ApprovalEntityType,
  PaymentType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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

// İlk 3 ili al
const ILK_3_IL = sehirlerData.slice(0, 3).map((s) => ({
  name: s.sehir_adi,
  code: s.sehir_id.padStart(2, '0'),
  sehirId: s.sehir_id,
}));

// Her il için ilk ilçeyi al (ilceler.json'dan)
const ilceMapBySehirId: Record<string, IlceData[]> = {};
for (const ilce of ilcelerData) {
  if (!ilceMapBySehirId[ilce.sehir_id]) ilceMapBySehirId[ilce.sehir_id] = [];
  ilceMapBySehirId[ilce.sehir_id].push(ilce);
}
const ILK_3_ILCE = ILK_3_IL.map((il) => {
  const ilceler = ilceMapBySehirId[il.sehirId] || [];
  return ilceler[0] ? { ilce_adi: ilceler[0].ilce_adi, sehirId: il.sehirId } : null;
}).filter(Boolean) as { ilce_adi: string; sehirId: string }[];

function generateNationalId(): string {
  const base = Math.floor(100000000 + Math.random() * 900000000);
  return base.toString().padStart(11, '0');
}

function generatePhone(): string {
  const prefixes = ['532', '533', '534', '535', '536'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${number}`;
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@sendika.local`;
}

function generateBirthDate(): Date {
  const now = new Date();
  const age = 25 + Math.floor(Math.random() * 35);
  const birthYear = now.getFullYear() - age;
  return new Date(birthYear, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));
}

const FIRST_NAMES = ['Ahmet', 'Ayşe', 'Mehmet'];
const LAST_NAMES = ['Yılmaz', 'Kaya', 'Demir'];
const BIRTHPLACES = ['İstanbul', 'Ankara', 'İzmir'];

function generateGender(firstName: string): Gender {
  return firstName === 'Ayşe' ? Gender.FEMALE : Gender.MALE;
}

async function main() {
  console.log('🌱 seed3: Her tabloya 3 veri ekleniyor...');

  // Temizleme (seed.ts ile aynı sıra)
  console.log('🗑️  Mevcut veriler temizleniyor...');
  await prisma.memberPayment.deleteMany();
  await prisma.userNotification.deleteMany();
  await prisma.notificationRecipient.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.userNotificationSettings.deleteMany();
  await prisma.tevkifatFile.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.memberHistory.deleteMany();
  await prisma.memberDocument.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.content.deleteMany();
  await prisma.systemLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.panelUserApplicationScope.deleteMany();
  await prisma.panelUserApplication.deleteMany();
  await prisma.member.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.tevkifatTitle.deleteMany();
  await prisma.tevkifatCenter.deleteMany();
  await prisma.membershipInfoOption.deleteMany();
  await prisma.memberGroup.deleteMany();
  await prisma.profession.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.userScope.deleteMany();
  await prisma.customRoleScope.deleteMany();
  await prisma.customRolePermission.deleteMany();
  await prisma.customRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.district.deleteMany();
  await prisma.province.deleteMany();

  // 1. İller (JSON'dan ilk 3)
  console.log('📍 İller ekleniyor (JSON)...');
  const provinceMap: Record<string, string> = {};
  const provinceMapBySehirId: Record<string, string> = {};
  for (const prov of ILK_3_IL) {
    const created = await prisma.province.create({
      data: { name: prov.name, code: prov.code },
    });
    provinceMap[prov.name] = created.id;
    provinceMapBySehirId[prov.sehirId] = created.id;
  }
  console.log(`   ✅ ${ILK_3_IL.length} il eklendi`);

  // 2. İlçeler (JSON'dan her il için 1 ilçe)
  console.log('🏘️  İlçeler ekleniyor (JSON)...');
  const districtMap: Record<string, string> = {};
  for (const item of ILK_3_ILCE) {
    const provinceId = provinceMapBySehirId[item.sehirId];
    if (provinceId) {
      const created = await prisma.district.create({
        data: { name: item.ilce_adi, provinceId },
      });
      districtMap[`${item.sehirId}_${item.ilce_adi}`] = created.id;
    }
  }
  const districtIds = Object.values(districtMap);
  const provinceIds = Object.values(provinceMap);
  console.log(`   ✅ ${districtIds.length} ilçe eklendi`);

  // 3. CustomRole (3 rol)
  console.log('🎭 Roller ekleniyor...');
  const rolePermissionMap: Record<string, string[]> = {
    ADMIN: ['USER_LIST', 'USER_VIEW', 'MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_UPDATE'],
    GENEL_BASKAN: ['MEMBER_LIST', 'MEMBER_VIEW', 'MEMBER_APPROVE', 'MEMBER_REJECT'],
    UYE: [],
  };
  const customRoleMap: Record<string, string> = {};
  for (const [roleName, permissions] of Object.entries(rolePermissionMap)) {
    const customRole = await prisma.customRole.create({
      data: {
        name: roleName,
        description: `${roleName} rolü`,
        isActive: true,
        permissions: { create: permissions.map((p) => ({ permission: p })) },
      },
    });
    customRoleMap[roleName] = customRole.id;
  }
  console.log('   ✅ 3 rol eklendi');

  // 4. Kullanıcılar (3)
  console.log('👥 Kullanıcılar ekleniyor...');
  const passwordHash = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sendika.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      customRoles: { connect: { id: customRoleMap['ADMIN'] } },
    },
  });
  const baskanUser = await prisma.user.create({
    data: {
      email: 'genel.baskan@sendika.local',
      passwordHash,
      firstName: 'Genel',
      lastName: 'Başkan',
      customRoles: { connect: { id: customRoleMap['GENEL_BASKAN'] } },
    },
  });
  const uyeUser = await prisma.user.create({
    data: {
      email: 'uye@sendika.local',
      passwordHash,
      firstName: 'Üye',
      lastName: 'Kullanıcı',
      customRoles: { connect: { id: customRoleMap['UYE'] } },
    },
  });
  const userIds = [adminUser.id, baskanUser.id, uyeUser.id];
  console.log('   ✅ 3 kullanıcı eklendi');

  // 5. UserScope (3)
  console.log('🔐 UserScope ekleniyor...');
  for (let i = 0; i < 3 && provinceIds[i]; i++) {
    await prisma.userScope.create({
      data: { userId: userIds[i], provinceId: provinceIds[i] },
    });
  }
  console.log('   ✅ 3 UserScope eklendi');

  // 6. Branch (3)
  console.log('🏢 Şubeler ekleniyor...');
  const branches = await Promise.all([
    prisma.branch.create({
      data: { name: 'Merkez Şube', isActive: true, presidentId: adminUser.id, provinceId: provinceIds[0], districtId: districtIds[0] },
    }),
    prisma.branch.create({
      data: { name: 'İkinci Şube', isActive: true, presidentId: baskanUser.id, provinceId: provinceIds[1], districtId: districtIds[1] },
    }),
    prisma.branch.create({
      data: { name: 'Üçüncü Şube', isActive: true, presidentId: uyeUser.id, provinceId: provinceIds[2], districtId: districtIds[2] },
    }),
  ]);
  console.log('   ✅ 3 şube eklendi');

  // 7. Institution (3)
  console.log('🏢 Kurumlar ekleniyor...');
  const institutions = await Promise.all([
    prisma.institution.create({
      data: { name: 'Kurum A', provinceId: provinceIds[0], districtId: districtIds[0], isActive: true, approvedAt: new Date(), approvedBy: adminUser.id, createdBy: adminUser.id },
    }),
    prisma.institution.create({
      data: { name: 'Kurum B', provinceId: provinceIds[1], districtId: districtIds[1], isActive: true, approvedAt: new Date(), approvedBy: adminUser.id, createdBy: adminUser.id },
    }),
    prisma.institution.create({
      data: { name: 'Kurum C', provinceId: provinceIds[2], districtId: districtIds[2], isActive: true, approvedAt: new Date(), approvedBy: adminUser.id, createdBy: adminUser.id },
    }),
  ]);
  console.log('   ✅ 3 kurum eklendi');

  // 8. TevkifatTitle (3)
  console.log('📋 Tevkifat ünvanları ekleniyor...');
  const tevkifatTitles = await Promise.all([
    prisma.tevkifatTitle.create({ data: { name: 'Müdür', isActive: true } }),
    prisma.tevkifatTitle.create({ data: { name: 'Başhekim', isActive: true } }),
    prisma.tevkifatTitle.create({ data: { name: 'Şef', isActive: true } }),
  ]);
  console.log('   ✅ 3 tevkifat ünvanı eklendi');

  // 9. TevkifatCenter (3)
  console.log('📋 Tevkifat merkezleri ekleniyor...');
  const tevkifatCenters = await Promise.all([
    prisma.tevkifatCenter.create({ data: { name: 'Tevkifat Merkez 1', isActive: true, provinceId: provinceIds[0], districtId: districtIds[0] } }),
    prisma.tevkifatCenter.create({ data: { name: 'Tevkifat Merkez 2', isActive: true, provinceId: provinceIds[1], districtId: districtIds[1] } }),
    prisma.tevkifatCenter.create({ data: { name: 'Tevkifat Merkez 3', isActive: true, provinceId: provinceIds[2], districtId: districtIds[2] } }),
  ]);
  console.log('   ✅ 3 tevkifat merkezi eklendi');

  // 10. MembershipInfoOption (3)
  console.log('📋 Üyelik bilgi seçenekleri ekleniyor...');
  await Promise.all([
    prisma.membershipInfoOption.create({ data: { label: 'Üye', value: 'UYE', isActive: true, order: 1 } }),
  ]);
  console.log('   ✅ 1 üyelik bilgi seçeneği eklendi');

  // 11. MemberGroup (3)
  console.log('📋 Üye grupları ekleniyor...');
  const memberGroups = await Promise.all([
    prisma.memberGroup.create({ data: { name: 'Üye', isActive: true, order: 1 } }),
  ]);
  console.log('   ✅ 1 üye grubu eklendi');

  // 12. Profession (3)
  console.log('📋 Meslekler ekleniyor...');
  const professions = await Promise.all([
    prisma.profession.create({ data: { name: 'Hemşire', isActive: true } }),
    prisma.profession.create({ data: { name: 'Tekniker', isActive: true } }),
    prisma.profession.create({ data: { name: 'Sağlık Personeli', isActive: true } }),
  ]);
  console.log('   ✅ 3 meslek eklendi');

  // 13. DocumentTemplate (3 önemli şablon - seed.ts'den)
  console.log('📄 Doküman şablonları ekleniyor (3 önemli şablon)...');
  const templateMEMBER_CERTIFICATE = `
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
</table>`;

  const templateMEMBER_CARD = `
<style>
  .card-doc { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; }
  .card-page { display:flex; align-items:center; justify-content:center; min-height: 297mm; padding: 18mm 16mm; box-sizing: border-box; }
  .member-card { width: 88mm; border-radius: 14px; overflow: hidden; background: #ffffff; box-shadow: 0 10px 30px rgba(2, 6, 23, .14); border: 1px solid rgba(15, 23, 42, .10); }
  .member-card__top { padding: 12px 14px 10px 14px; background: linear-gradient(135deg, #0b3a7a 0%, #1556b6 55%, #0ea5e9 120%); color: #fff; }
  .member-card__body { padding: 12px 14px 10px; }
  .name { font-size: 12.2pt; font-weight: 900; }
  .meta { font-size: 8.9pt; color: #334155; }
  .grid { margin-top: 10px; display:grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
  .kv { border: 1px solid rgba(15, 23, 42, .08); background: rgba(241,245,249,.65); border-radius: 10px; padding: 7px 9px; }
</style>
<div class="card-doc"><div class="card-page"><div class="member-card">
  <div class="member-card__top"><div style="font-weight:800;">SENDİKA ÜYE KARTI</div><div style="font-size:8.5pt;opacity:.92;">Resmî üyelik kimliği</div></div>
  <div class="member-card__body">
    <div class="name">{{firstName}} {{lastName}}</div>
    <div class="meta">Üye No: <b>{{memberNumber}}</b> | T.C.: <b>{{nationalId}}</b> | İl/İlçe: <b>{{province}}</b> / <b>{{district}}</b></div>
    <div class="grid">
      <div class="kv"><div style="font-size:7.7pt;color:#64748b;">Kurum</div><div class="name" style="font-size:9pt;">{{institution}}</div></div>
      <div class="kv"><div style="font-size:7.7pt;color:#64748b;">Şube</div><div class="name" style="font-size:9pt;">{{branch}}</div></div>
      <div class="kv"><div style="font-size:7.7pt;color:#64748b;">Üyelik Tarihi</div><div class="name" style="font-size:9pt;">{{joinDate}}</div></div>
      <div class="kv"><div style="font-size:7.7pt;color:#64748b;">Geçerlilik</div><div class="name" style="font-size:9pt;">{{validUntil}}</div></div>
    </div>
  </div>
  <div style="padding:9px 14px;border-top:1px solid rgba(15,23,42,.08);font-size:8.2pt;color:#475569;">Bu kart sendika üyeliğini belgeler. <span style="padding:3px 8px;border-radius:999px;background:rgba(14,165,233,.12);color:#075985;font-weight:700;">AKTİF</span></div>
</div></div></div>`;

  const templateLETTER = `
<div style="text-align:right;font-size:10.5pt;color:#444;">Tarih: <b>{{date}}</b></div>
<div style="margin-top:10px;font-size:11pt;"><div style="font-weight:700;">Sayın {{firstName}} {{lastName}},</div></div>
<div style="margin-top:10px;border:1px solid #ddd;border-radius:8px;padding:10px 12px;">
  <div style="font-size:10pt;color:#555;margin-bottom:6px;"><b>Konu:</b> {{subject}}</div>
  <div style="font-size:11pt;white-space:pre-wrap;">{{content}}</div>
</div>
<div style="margin-top:16px;font-size:11pt;">Bilgilerinize sunar, gereğini rica ederiz.</div>
<div style="margin-top:22px;text-align:right;">
  <div style="font-weight:700;">Sendika Yönetimi</div>
  <div style="margin-top:40px;">İmza / Kaşe</div>
</div>`;

  const docTemplates = [
    { name: 'Üye Sertifikası', description: 'Kurumsal üyelik sertifikası (A4, resmi format)', template: templateMEMBER_CERTIFICATE, type: DocumentTemplateType.MEMBER_CERTIFICATE, isActive: true },
    { name: 'Üye Kartı', description: 'Üye kartı (modern kart tasarımı)', template: templateMEMBER_CARD, type: DocumentTemplateType.MEMBER_CARD, isActive: true },
    { name: 'Genel Mektup', description: 'Resmî yazışma şablonu (konu + içerik)', template: templateLETTER, type: DocumentTemplateType.LETTER, isActive: true },
  ];
  const createdTemplates = await Promise.all(docTemplates.map((t) => prisma.documentTemplate.create({ data: t })));
  console.log('   ✅ 3 doküman şablonu eklendi');

  // 14. Member (3)
  console.log('👤 Üyeler ekleniyor...');
  const membershipOptions = await prisma.membershipInfoOption.findMany({ take: 3 });
  const members: { id: string; firstName: string; lastName: string; nationalId: string; registrationNumber: string | null; createdByUserId: string | null }[] = [];
  for (let i = 0; i < 3; i++) {
    const firstName = FIRST_NAMES[i];
    const lastName = LAST_NAMES[i];
    const nationalId = generateNationalId();
    const regNo = `UYE-${String(i + 1).padStart(5, '0')}`;
    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        nationalId,
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        status: MemberStatus.ACTIVE,
        source: MemberSource.DIRECT,
        provinceId: provinceIds[i],
        districtId: districtIds[i],
        branchId: branches[i].id,
        institutionId: institutions[i].id,
        registrationNumber: regNo,
        membershipInfoOptionId: membershipOptions[i]?.id ?? null,
        memberGroupId: memberGroups[i].id,
        motherName: 'Fatma',
        fatherName: 'Ali',
        birthDate: generateBirthDate(),
        birthplace: BIRTHPLACES[i],
        gender: generateGender(firstName),
        educationStatus: EducationStatus.COLLEGE,
        createdByUserId: adminUser.id,
        approvedByUserId: adminUser.id,
        approvedAt: new Date(),
        professionId: professions[i].id,
        tevkifatCenterId: tevkifatCenters[i].id,
        tevkifatTitleId: tevkifatTitles[i].id,
      },
    });
    members.push({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      nationalId: member.nationalId,
      registrationNumber: member.registrationNumber,
      createdByUserId: member.createdByUserId,
    });
  }
  console.log('   ✅ 3 üye eklendi');

  // 15. MemberDocument - Her üye için UyeKayidi.pdf (3)
  console.log('📄 Üye kayıt dökümanları (UyeKayidi.pdf) ekleniyor...');
  const sourcePdfPath = path.join(prismaDir, 'UyeKayidi.pdf');
  const uploadsDir = isProduction ? path.join(process.cwd(), 'uploads', 'documents') : path.join(__dirname, '..', 'uploads', 'documents');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  if (fs.existsSync(sourcePdfPath)) {
    for (const member of members) {
      const safeFirst = (member.firstName || '').replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '').trim();
      const safeLast = (member.lastName || '').replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '').trim();
      const fileName = `UyeKayidi_${member.nationalId}_${safeFirst}${safeLast}.pdf`;
      const targetFilePath = path.join(uploadsDir, fileName);
      const fileUrl = `/uploads/documents/${fileName}`;
      fs.copyFileSync(sourcePdfPath, targetFilePath);
      await prisma.memberDocument.create({
        data: {
          memberId: member.id,
          templateId: null,
          documentType: 'MEMBER_REGISTRATION',
          fileName,
          fileUrl,
          generatedBy: member.createdByUserId || adminUser.id,
        },
      });
    }
    console.log('   ✅ 3 üye kayıt dökümanı (UyeKayidi.pdf) eklendi');
  } else {
    console.warn(`   ⚠️  UyeKayidi.pdf bulunamadı: ${sourcePdfPath}`);
  }

  // 16. Content (3)
  console.log('📝 İçerik ekleniyor...');
  await Promise.all([
    prisma.content.create({ data: { title: 'Haber 1', content: 'İçerik metni 1', type: ContentType.NEWS, status: ContentStatus.PUBLISHED, authorId: adminUser.id, publishedAt: new Date() } }),
    prisma.content.create({ data: { title: 'Duyuru 1', content: 'Duyuru metni 1', type: ContentType.ANNOUNCEMENT, status: ContentStatus.PUBLISHED, authorId: baskanUser.id, publishedAt: new Date() } }),
    prisma.content.create({ data: { title: 'Etkinlik 1', content: 'Etkinlik metni 1', type: ContentType.EVENT, status: ContentStatus.DRAFT, authorId: uyeUser.id } }),
  ]);
  console.log('   ✅ 3 içerik eklendi');

  // 17. Notification (3)
  console.log('🔔 Bildirimler ekleniyor...');
  const notifs = await Promise.all([
    prisma.notification.create({
      data: {
        title: 'Bildirim 1',
        message: 'Mesaj 1',
        category: NotificationCategory.SYSTEM,
        typeCategory: NotificationTypeCategory.MEMBER_APPLICATION_NEW,
        type: NotificationType.IN_APP,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.ALL_MEMBERS,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        sentBy: adminUser.id,
        recipientCount: 3,
        successCount: 3,
        failedCount: 0,
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Bildirim 2',
        message: 'Mesaj 2',
        category: NotificationCategory.ANNOUNCEMENT,
        typeCategory: NotificationTypeCategory.ANNOUNCEMENT_GENERAL,
        type: NotificationType.IN_APP,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.ALL_MEMBERS,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        sentBy: baskanUser.id,
        recipientCount: 3,
        successCount: 3,
        failedCount: 0,
      },
    }),
    prisma.notification.create({
      data: {
        title: 'Bildirim 3',
        message: 'Mesaj 3',
        category: NotificationCategory.REMINDER,
        typeCategory: NotificationTypeCategory.REMINDER_DUES_PAYMENT,
        type: NotificationType.IN_APP,
        channels: [NotificationChannel.IN_APP],
        targetType: NotificationTargetType.ALL_MEMBERS,
        status: NotificationStatus.PENDING,
        sentBy: adminUser.id,
        recipientCount: 0,
        successCount: 0,
        failedCount: 0,
      },
    }),
  ]);
  console.log('   ✅ 3 bildirim eklendi');

  // 18. NotificationRecipient (3)
  const recipients = await prisma.member.findMany({ take: 3, select: { id: true } });
  for (let i = 0; i < 3 && notifs[i] && recipients[i]; i++) {
    await prisma.notificationRecipient.create({
      data: {
        notificationId: notifs[i].id,
        memberId: recipients[i].id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }
  console.log('   ✅ 3 NotificationRecipient eklendi');

  // 19. UserNotification (3)
  for (let i = 0; i < 3 && notifs[i]; i++) {
    await prisma.userNotification.create({
      data: { userId: userIds[i], notificationId: notifs[i].id, isRead: i === 0 },
    });
  }
  console.log('   ✅ 3 UserNotification eklendi');

  // 20. UserNotificationSettings (3)
  for (const uid of userIds) {
    await prisma.userNotificationSettings.create({
      data: {
        userId: uid,
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
      },
    });
  }
  console.log('   ✅ 3 UserNotificationSettings eklendi');

  // 21. SystemSetting (antetli kağıt dahil en az 3)
  console.log('⚙️  Sistem ayarları ekleniyor (antetli kağıt dahil)...');
  await Promise.all([
    prisma.systemSetting.create({
      data: {
        key: 'SITE_NAME',
        value: 'Sendika Yönetim Sistemi',
        description: 'Site adı',
        category: SystemSettingCategory.GENERAL,
        isEditable: true,
      },
    }),
    prisma.systemSetting.create({
      data: {
        key: 'DOCUMENT_HEADER_PAPER_PATH',
        value: '/uploads/header-paper/yonetim_paneli_antetli_kagit.pdf',
        description: 'Üye dökümanları için antetli kağıt dosyası yolu',
        category: SystemSettingCategory.GENERAL,
        isEditable: true,
      },
    }),
    prisma.systemSetting.create({
      data: {
        key: 'DEFAULT_LANGUAGE',
        value: 'tr',
        description: 'Varsayılan dil',
        category: SystemSettingCategory.GENERAL,
        isEditable: true,
      },
    }),
  ]);
  console.log('   ✅ 3 sistem ayarı eklendi (DOCUMENT_HEADER_PAPER_PATH = antetli kağıt)');

  // 22. Antetli kağıt dosyasını kopyala
  console.log('📋 Antetli kağıt dosyası kopyalanıyor...');
  const sourceHeaderPaperPath = path.join(prismaDir, 'yonetim_paneli_antetli_kagit.pdf');
  const headerPaperDir = isProduction ? path.join(process.cwd(), 'uploads', 'header-paper') : path.join(__dirname, '..', 'uploads', 'header-paper');
  if (!fs.existsSync(headerPaperDir)) fs.mkdirSync(headerPaperDir, { recursive: true });
  if (fs.existsSync(sourceHeaderPaperPath)) {
    fs.copyFileSync(sourceHeaderPaperPath, path.join(headerPaperDir, 'yonetim_paneli_antetli_kagit.pdf'));
    console.log('   ✅ yonetim_paneli_antetli_kagit.pdf kopyalandı');
  } else {
    console.warn(`   ⚠️  Antetli kağıt bulunamadı: ${sourceHeaderPaperPath}`);
  }

  // 23. SystemLog (3)
  console.log('📋 Sistem logları ekleniyor...');
  await Promise.all([
    prisma.systemLog.create({ data: { action: 'LOGIN', entityType: 'User', entityId: adminUser.id, userId: adminUser.id, ipAddress: '127.0.0.1' } }),
    prisma.systemLog.create({ data: { action: 'CREATE', entityType: 'Member', entityId: members[0].id, userId: adminUser.id, ipAddress: '127.0.0.1' } }),
    prisma.systemLog.create({ data: { action: 'UPDATE', entityType: 'Content', userId: baskanUser.id, ipAddress: '127.0.0.1' } }),
  ]);
  console.log('   ✅ 3 sistem logu eklendi');

  // 24. MemberHistory (3)
  for (let i = 0; i < 3; i++) {
    await prisma.memberHistory.create({
      data: {
        memberId: members[i].id,
        action: 'CREATE',
        fieldName: null,
        oldValue: null,
        newValue: JSON.stringify({ status: MemberStatus.ACTIVE }),
        changedBy: adminUser.id,
      },
    });
  }
  console.log('   ✅ 3 MemberHistory eklendi');

  // 25. Approval (3)
  await Promise.all([
    prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.INSTITUTION,
        entityId: institutions[0].id,
        status: ApprovalStatus.APPROVED,
        requestedBy: baskanUser.id,
        approvedBy: adminUser.id,
        requestData: {},
        approvalNote: 'Onaylandı',
        approvedAt: new Date(),
      },
    }),
    prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.MEMBER_CREATE,
        entityId: members[0].id,
        status: ApprovalStatus.APPROVED,
        requestedBy: baskanUser.id,
        approvedBy: adminUser.id,
        requestData: {},
        approvalNote: 'Onaylandı',
        approvedAt: new Date(),
      },
    }),
    prisma.approval.create({
      data: {
        entityType: ApprovalEntityType.MEMBER_UPDATE,
        entityId: members[1].id,
        status: ApprovalStatus.PENDING,
        requestedBy: baskanUser.id,
        requestData: {},
      },
    }),
  ]);
  console.log('   ✅ 3 Approval eklendi');

  // 26. TevkifatFile (3)
  const tevkifatFiles = await Promise.all([
    prisma.tevkifatFile.create({
      data: {
        tevkifatCenterId: tevkifatCenters[0].id,
        tevkifatTitleId: tevkifatTitles[0].id,
        totalAmount: 10000,
        memberCount: 5,
        month: 1,
        year: new Date().getFullYear(),
        fileName: 'tevkifat1.pdf',
        fileUrl: '/uploads/tevkifat/tevkifat1.pdf',
        status: ApprovalStatus.APPROVED,
        uploadedBy: adminUser.id,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    }),
    prisma.tevkifatFile.create({
      data: {
        tevkifatCenterId: tevkifatCenters[1].id,
        tevkifatTitleId: tevkifatTitles[1].id,
        totalAmount: 15000,
        memberCount: 8,
        month: 2,
        year: new Date().getFullYear(),
        fileName: 'tevkifat2.pdf',
        fileUrl: '/uploads/tevkifat/tevkifat2.pdf',
        status: ApprovalStatus.APPROVED,
        uploadedBy: baskanUser.id,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    }),
    prisma.tevkifatFile.create({
      data: {
        tevkifatCenterId: tevkifatCenters[2].id,
        tevkifatTitleId: tevkifatTitles[2].id,
        totalAmount: 12000,
        memberCount: 6,
        month: 3,
        year: new Date().getFullYear(),
        fileName: 'tevkifat3.pdf',
        fileUrl: '/uploads/tevkifat/tevkifat3.pdf',
        status: ApprovalStatus.PENDING,
        uploadedBy: uyeUser.id,
      },
    }),
  ]);
  console.log('   ✅ 3 TevkifatFile eklendi');

  // 27. MemberPayment (3)
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    await prisma.memberPayment.create({
      data: {
        memberId: members[i].id,
        registrationNumber: members[i].registrationNumber!,
        paymentPeriodMonth: now.getMonth() + 1,
        paymentPeriodYear: now.getFullYear(),
        amount: 100,
        paymentType: PaymentType.ELDEN,
        createdByUserId: adminUser.id,
        isApproved: true,
        approvedByUserId: adminUser.id,
        approvedAt: new Date(),
      },
    });
  }
  console.log('   ✅ 3 MemberPayment eklendi');

  // 28. MemberMembershipPeriod (3 - her üye için 1 dönem)
  for (let i = 0; i < 3; i++) {
    await prisma.memberMembershipPeriod.create({
      data: {
        memberId: members[i].id,
        registrationNumber: members[i].registrationNumber!,
        periodStart: new Date(now.getFullYear(), 0, 1),
        status: MemberStatus.ACTIVE,
        approvedAt: new Date(),
        approvedByUserId: adminUser.id,
      },
    });
  }
  console.log('   ✅ 3 MemberMembershipPeriod eklendi');

  // 29. NotificationLog (3)
  const recs = await prisma.notificationRecipient.findMany({ take: 3 });
  for (let i = 0; i < 3 && recs[i]; i++) {
    await prisma.notificationLog.create({
      data: {
        notificationId: notifs[0].id,
        recipientId: recs[i].id,
        channel: NotificationChannel.IN_APP,
        action: 'SENT',
        status: NotificationStatus.SENT,
        message: 'Bildirim gönderildi',
      },
    });
  }
  console.log('   ✅ 3 NotificationLog eklendi');

  // 30. CustomRoleScope (3) - rol/il kombinasyonları
  const rolesForScope = await prisma.customRole.findMany({ take: 3 });
  for (let i = 0; i < 3 && provinceIds[i] && rolesForScope[i]; i++) {
    await prisma.customRoleScope.create({
      data: { roleId: rolesForScope[i].id, provinceId: provinceIds[i] },
    });
  }
  console.log('   ✅ 3 CustomRoleScope eklendi');

  console.log('\n✅ seed3 tamamlandı. Tüm tablolarda veri mevcut.');
}

main()
  .catch((e) => {
    console.error('❌ seed3 hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
